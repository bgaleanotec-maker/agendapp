"""
AgendApp — Sistema de gestión de citas médicas
Backend: Python / Flask  |  DB: SQLite (dev) / PostgreSQL (prod)
Motor IA: integrado para pre-screening y sugerencias inteligentes
Deploy: Render
"""
import os
import json
import re
from datetime import datetime, date, time, timedelta
from functools import wraps

from flask import (Flask, render_template, redirect, url_for, request,
                   flash, jsonify, abort, session)
from flask_login import (LoginManager, login_user, logout_user,
                         login_required, current_user)
from flask_mail import Mail, Message

from config import config
from models import db, User, DoctorProfile, Schedule, Appointment
from notifications import (send_whatsapp, whatsapp_appointment_confirmed,
                           whatsapp_appointment_cancelled, whatsapp_reminder,
                           whatsapp_new_appointment_to_doctor)

# ─────────────────────────────────────────────────────────────────────────────
# App factory
# ─────────────────────────────────────────────────────────────────────────────
def create_app(config_name: str = "default") -> Flask:
    app = Flask(__name__)
    app.config.from_object(config[config_name])

    db.init_app(app)
    mail_ext.init_app(app)
    login_manager.init_app(app)

    with app.app_context():
        db.create_all()

    return app


mail_ext    = Mail()
login_manager = LoginManager()
login_manager.login_view    = "login"
login_manager.login_message = "Inicia sesión para continuar."
login_manager.login_message_category = "info"


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


# ─────────────────────────────────────────────────────────────────────────────
# Decoradores de rol
# ─────────────────────────────────────────────────────────────────────────────
def role_required(*roles):
    def decorator(f):
        @wraps(f)
        @login_required
        def decorated(*args, **kwargs):
            if current_user.role not in roles:
                abort(403)
            return f(*args, **kwargs)
        return decorated
    return decorator


patient_required = role_required("patient")
doctor_required  = role_required("doctor")
admin_required   = role_required("admin")


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────
def get_available_slots(doctor_user: User, query_date: date) -> list[str]:
    """Retorna lista de strings HH:MM disponibles para doctor en fecha dada."""
    profile = doctor_user.doctor_profile
    if not profile:
        return []
    day_of_week = query_date.weekday()        # 0=Mon
    sched = profile.schedules.filter_by(day_of_week=day_of_week).first()
    if not sched:
        return []

    # Generar slots
    slots = []
    current_t = datetime.combine(query_date, sched.start_time)
    end_dt    = datetime.combine(query_date, sched.end_time)
    while current_t + timedelta(minutes=sched.slot_duration) <= end_dt:
        slots.append(current_t.time())
        current_t += timedelta(minutes=sched.slot_duration)

    # Filtrar ocupados
    booked = {a.time for a in Appointment.query.filter_by(
        doctor_id=doctor_user.id, date=query_date
    ).filter(Appointment.status.in_(["pending", "confirmed"])).all()}

    return [t.strftime("%H:%M") for t in slots if t not in booked]


def send_email(to: str, subject: str, body_html: str) -> bool:
    """Envía correo; devuelve False si no hay config SMTP."""
    try:
        msg = Message(subject, recipients=[to], html=body_html)
        mail_ext.send(msg)
        return True
    except Exception as e:
        print(f"[EMAIL ERROR] {e}")
        return False


def appointment_email_html(appt: Appointment, action: str = "confirmed") -> str:
    labels = {"confirmed": "confirmada", "cancelled": "cancelada", "reminder": "recordatorio"}
    verb = labels.get(action, action)
    return f"""
    <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;border:1px solid #dee2e6;border-radius:8px;overflow:hidden">
      <div style="background:#0d6efd;padding:20px;color:#fff">
        <h2 style="margin:0">AgendApp</h2>
        <p style="margin:4px 0 0">Sistema de citas médicas</p>
      </div>
      <div style="padding:24px">
        <p>Hola <strong>{appt.patient.name}</strong>,</p>
        <p>Tu cita ha sido <strong>{verb}</strong>.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px;color:#666">Doctor</td>
              <td style="padding:8px"><strong>Dr. {appt.doctor.name}</strong></td></tr>
          <tr style="background:#f8f9fa">
              <td style="padding:8px;color:#666">Fecha</td>
              <td style="padding:8px"><strong>{appt.date.strftime('%d/%m/%Y')}</strong></td></tr>
          <tr><td style="padding:8px;color:#666">Hora</td>
              <td style="padding:8px"><strong>{appt.time.strftime('%H:%M')}</strong></td></tr>
          <tr style="background:#f8f9fa">
              <td style="padding:8px;color:#666">Motivo</td>
              <td style="padding:8px">{appt.reason or '—'}</td></tr>
        </table>
        <p style="color:#666;font-size:13px">Si necesitas cancelar, hazlo con al menos 24 horas de anticipación.</p>
      </div>
      <div style="background:#f8f9fa;padding:12px;text-align:center;font-size:12px;color:#999">
        AgendApp v1.0 · Sistema de citas médicas
      </div>
    </div>"""


# ─────────────────────────────────────────────────────────────────────────────
# Motor IA — pre-screening + sugerencias inteligentes
# ─────────────────────────────────────────────────────────────────────────────
SYMPTOM_RULES = {
    "urgente": {
        "keywords": [
            # General / médico
            "dolor pecho","dificultad respirar","fiebre alta","convulsion",
            "perdida conciencia","sangrado intenso","accidente","emergencia",
            # Odontologia urgente
            "absceso dental","infeccion dental","dolor muela fuerte","sangrado boca",
            # Psicologia urgente
            "ideacion suicida","crisis nerviosa","ataque panico severo",
            # Gastro urgente
            "sangrado rectal","vomito sangre","dolor abdominal agudo",
        ],
        "response": ("Advertencia: Los sintomas que describes pueden ser urgentes. "
                     "Te recomendamos ir a urgencias o llamar al 123 inmediatamente. "
                     "Puedes agendar una consulta de seguimiento aqui."),
        "priority": "alta",
        "color": "danger"
    },
    "pronto": {
        "keywords": [
            # General
            "fiebre","vomito","diarrea","dolor fuerte","infeccion","herida",
            "caida","golpe","tos persistente","dificultad respirar leve",
            # Odontologia pronto
            "dolor muela","muela","caries","encia","sensibilidad dental","bruxismo",
            "dolor diente","sangrado encias","inflamacion encia",
            # Psicologia pronto
            "ansiedad","depresion","insomnio","estres","tristeza","fobia",
            "ataque panico","angustia","nerviosismo excesivo",
            # Gastro pronto
            "gastritis","reflujo","dolor abdominal","acidez","nauseas","colitis",
            "diarrea cronica","estrenimiento","distension abdominal",
        ],
        "response": "Este sintoma sugiere una consulta en los proximos 1-2 dias.",
        "priority": "media",
        "color": "warning"
    },
    "rutina": {
        "keywords": [
            # General
            "chequeo","control","revision","preventivo","vacuna",
            "examen","certificado","receta","seguimiento",
            # Odontologia rutina
            "limpieza dental","blanqueamiento","ortodoncia","revision dental",
            "extraccion","protesis","implante dental",
            # Psicologia rutina
            "terapia","psicologia","acompanamiento","manejo emocional",
            "orientacion psicologica","consulta psicologica",
            # Gastro rutina
            "endoscopia","colonoscopia","revision gastrica","control gastro",
            "dieta intestinal","seguimiento digestivo",
        ],
        "response": "Perfecto para una cita de rutina. Puedes agendar con tranquilidad.",
        "priority": "baja",
        "color": "success"
    },
}

def ai_prescreen(text: str) -> dict:
    """
    Motor IA simplificado: analiza síntomas y retorna recomendación.
    En producción se puede conectar a la API de Claude/OpenAI.
    """
    text_lower = text.lower()
    for level, data in SYMPTOM_RULES.items():
        for kw in data["keywords"]:
            if kw in text_lower:
                return {
                    "level": level,
                    "response": data["response"],
                    "priority": data["priority"],
                    "color": data["color"],
                    "specialty_hint": suggest_specialty(text_lower),
                }
    return {
        "level": "rutina",
        "response": "No identifiqué síntomas urgentes. Puedes agendar una cita normal.",
        "priority": "baja",
        "color": "info",
        "specialty_hint": suggest_specialty(text_lower),
    }


def suggest_specialty(text: str) -> str:
    """Sugiere especialidad segun descripcion del motivo."""
    mapping = {
        # Especialidades del consultorio
        "muela|diente|encia|dental|ortodoncia|caries|bruxismo|boca|odonto": "Odontologia",
        "ansiedad|depresion|estres|insomnio|fobia|panico|trauma|psico|terapia|emocional": "Psicologia",
        "gastritis|reflujo|colitis|intestino|gastro|abdomen|acidez|colon|endoscopia|digestiv": "Gastroenterologia",
        # Otras especialidades
        "corazon|presion|cardiaco|cardiaca|cardio": "Cardiologia",
        "piel|derma|acne|mancha|sarpullido": "Dermatologia",
        "hueso|fractura|columna|articulacion|rodilla": "Traumatologia",
        "nino|infante|pediatra|bebe": "Pediatria",
        "ojo|vision|vista|oftalmo": "Oftalmologia",
        "oido|audicion|otorrino": "Otorrinolaringologia",
        "mujer|gineco|embarazo|menstrual": "Ginecologia",
    }
    for pattern, specialty in mapping.items():
        if re.search(pattern, text):
            return specialty
    return "Medicina General"


def ai_suggest_slots(doctor_user: User, urgency: str) -> str:
    """Sugiere rango de días según urgencia."""
    hints = {
        "alta":  "Te recomendamos el horario más próximo disponible (hoy o mañana).",
        "media": "Busca disponibilidad en los próximos 2 días.",
        "baja":  "Puedes elegir el horario que más te convenga.",
    }
    return hints.get(urgency, "Elige el horario que prefieras.")


# ─────────────────────────────────────────────────────────────────────────────
# Blueprints inline (para MVP: todo en un archivo)
# ─────────────────────────────────────────────────────────────────────────────
app = Flask(__name__)
app.config.from_object(config[os.environ.get("FLASK_ENV", "development")])

db.init_app(app)
mail_ext.init_app(app)
login_manager.init_app(app)


# ═════════════════════════════════════════════════════════════════════════════
# AUTH ROUTES  (RF-01)
# ═════════════════════════════════════════════════════════════════════════════
@app.route("/")
def index():
    if current_user.is_authenticated:
        return redirect(url_for("dashboard"))
    doctors = User.query.filter_by(role="doctor", active=True).all()
    return render_template("index.html", doctors=doctors)


@app.route("/evidencias")
def evidencias():
    """Página pública de evidencias de pruebas (modo evaluación para el docente)."""
    grupos = [
        {"nombre": "Módulo de autenticación y control de acceso (RF-01)", "casos": [
            {"id": "PA-01", "desc": "Registro válido con rol paciente", "esperado": "Cuenta creada y mensaje de éxito"},
            {"id": "PA-02", "desc": "Registro válido con rol médico", "esperado": "Cuenta creada y mensaje de éxito"},
            {"id": "PA-03", "desc": "Registro con correo ya existente", "esperado": "Se rechaza por correo duplicado"},
            {"id": "PA-04", "desc": "Contraseñas que no coinciden", "esperado": "Mensaje de error de validación"},
            {"id": "PA-05", "desc": "Contraseña demasiado corta", "esperado": "Mensaje de error de longitud"},
            {"id": "PA-06", "desc": "Formulario con campos vacíos", "esperado": "El registro no se completa"},
            {"id": "PA-07", "desc": "Login válido de paciente", "esperado": "Redirige al panel del paciente"},
            {"id": "PA-08", "desc": "Login válido de médico", "esperado": "Redirige al panel del médico"},
            {"id": "PA-09", "desc": "Contraseña incorrecta", "esperado": "Mensaje 'Credenciales incorrectas'"},
            {"id": "PA-10", "desc": "Correo no registrado", "esperado": "Mensaje 'Credenciales incorrectas'"},
            {"id": "PA-11", "desc": "Cierre de sesión autenticado", "esperado": "Sesión destruida y redirección"},
            {"id": "PA-12", "desc": "Acceso a ruta protegida sin sesión", "esperado": "Redirige al inicio de sesión"},
            {"id": "PA-13", "desc": "Paciente intenta panel de médico", "esperado": "Acceso denegado (403/redirección)"},
            {"id": "PA-14", "desc": "Médico intenta panel de paciente", "esperado": "Acceso denegado (403/redirección)"},
            {"id": "PA-15", "desc": "Administrador accede a su panel", "esperado": "Acceso permitido (200)"},
        ]},
        {"nombre": "Módulo de citas, API y motor de IA (RF-02 a RF-05)", "casos": [
            {"id": "CA-01", "desc": "Ver página de agendamiento autenticado", "esperado": "Formulario visible (200)"},
            {"id": "CA-02", "desc": "Consultar horarios de médico válido", "esperado": "Lista de horarios en JSON"},
            {"id": "CA-03", "desc": "Consultar horarios con fecha inválida", "esperado": "Lista vacía sin error"},
            {"id": "CA-04", "desc": "Consultar horarios de médico inexistente", "esperado": "Respuesta vacía o 404"},
            {"id": "CA-05", "desc": "Consultar calendario en formato JSON", "esperado": "Lista de eventos del calendario"},
            {"id": "CA-06", "desc": "Agendar cita en fecha pasada", "esperado": "Se rechaza; la cita no se crea"},
            {"id": "CA-07", "desc": "Cancelar cita con más de 24 h", "esperado": "Cita cancelada correctamente"},
            {"id": "CA-08", "desc": "Cancelar cita de otro paciente", "esperado": "Acceso denegado (403)"},
            {"id": "CA-09", "desc": "Médico confirma una cita", "esperado": "Estado cambia a 'confirmada'"},
            {"id": "CA-10", "desc": "Pre-triaje con síntoma urgente", "esperado": "Nivel 'urgente' y alerta roja"},
            {"id": "CA-11", "desc": "Pre-triaje con consulta de rutina", "esperado": "Nivel 'rutina'"},
            {"id": "CA-12", "desc": "Pre-triaje con texto vacío", "esperado": "Nivel 'normal'"},
            {"id": "CA-13", "desc": "Listar médicos activos", "esperado": "Lista de médicos en JSON"},
            {"id": "CA-14", "desc": "Carga de la página de inicio", "esperado": "Responde correctamente (200)"},
            {"id": "CA-15", "desc": "Carga de la página de login", "esperado": "Responde correctamente (200)"},
            {"id": "CA-16", "desc": "Solicitud a ruta inexistente", "esperado": "Error 404 controlado"},
        ]},
    ]
    total = sum(len(g["casos"]) for g in grupos)
    return render_template("evidencias.html", grupos=grupos, total=total)


@app.route("/dashboard")
@login_required
def dashboard():
    if current_user.is_doctor:
        return redirect(url_for("doctor_dashboard"))
    if current_user.is_admin:
        return redirect(url_for("admin_dashboard"))
    return redirect(url_for("patient_dashboard"))


@app.route("/login", methods=["GET", "POST"])
def login():
    if current_user.is_authenticated:
        return redirect(url_for("dashboard"))
    if request.method == "POST":
        email    = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")
        remember = bool(request.form.get("remember"))
        user = User.query.filter_by(email=email).first()
        if user and user.check_password(password) and user.active:
            login_user(user, remember=remember)
            next_page = request.args.get("next")
            return redirect(next_page or url_for("dashboard"))
        flash("Correo o contraseña incorrectos.", "danger")
    return render_template("auth/login.html")


@app.route("/register", methods=["GET", "POST"])
def register():
    if current_user.is_authenticated:
        return redirect(url_for("dashboard"))
    if request.method == "POST":
        name     = request.form.get("name",     "").strip()
        email    = request.form.get("email",    "").strip().lower()
        phone    = request.form.get("phone",    "").strip()
        password = request.form.get("password", "")
        confirm  = request.form.get("confirm",  "")
        role     = request.form.get("role",     "patient")

        if not all([name, email, password]):
            flash("Todos los campos son requeridos.", "danger")
        elif password != confirm:
            flash("Las contraseñas no coinciden.", "danger")
        elif len(password) < 8:
            flash("La contraseña debe tener al menos 8 caracteres.", "danger")
        elif User.query.filter_by(email=email).first():
            flash("Este correo ya está registrado.", "danger")
        else:
            user = User(name=name, email=email, phone=phone, role=role)
            user.set_password(password)
            db.session.add(user)
            if role == "doctor":
                specialty = request.form.get("specialty", "Medicina General")
                profile = DoctorProfile(user=user, specialty=specialty)
                db.session.add(profile)
            db.session.commit()
            login_user(user)
            flash(f"¡Bienvenido, {name}! Cuenta creada exitosamente.", "success")
            return redirect(url_for("dashboard"))
    return render_template("auth/register.html")


@app.route("/logout")
@login_required
def logout():
    logout_user()
    flash("Sesión cerrada.", "info")
    return redirect(url_for("index"))


# ═════════════════════════════════════════════════════════════════════════════
# PATIENT ROUTES  (RF-02, RF-03)
# ═════════════════════════════════════════════════════════════════════════════
@app.route("/patient/dashboard")
@login_required
def patient_dashboard():
    if not current_user.is_patient:
        return redirect(url_for("dashboard"))
    upcoming = (Appointment.query
                .filter_by(patient_id=current_user.id)
                .filter(Appointment.status.in_(["pending", "confirmed"]))
                .filter(Appointment.date >= date.today())
                .order_by(Appointment.date, Appointment.time)
                .limit(5).all())
    past = (Appointment.query
            .filter_by(patient_id=current_user.id)
            .filter(Appointment.date < date.today())
            .order_by(Appointment.date.desc())
            .limit(5).all())
    doctors = User.query.filter_by(role="doctor", active=True).all()
    return render_template("patient/dashboard.html",
                           upcoming=upcoming, past=past, doctors=doctors)


@app.route("/patient/appointments")
@login_required
def patient_appointments():
    if not current_user.is_patient:
        return redirect(url_for("dashboard"))
    status_filter = request.args.get("status", "all")
    q = Appointment.query.filter_by(patient_id=current_user.id)
    if status_filter != "all":
        q = q.filter_by(status=status_filter)
    appointments = q.order_by(Appointment.date.desc(), Appointment.time.desc()).all()
    return render_template("patient/appointments.html",
                           appointments=appointments, status_filter=status_filter)


@app.route("/patient/book", methods=["GET", "POST"])
@login_required
def patient_book():
    if not current_user.is_patient:
        return redirect(url_for("dashboard"))

    doctors  = User.query.filter_by(role="doctor", active=True).all()
    ai_result = None
    prescreen_text = ""

    if request.method == "POST":
        action = request.form.get("action", "book")

        # ── AI pre-screening ────────────────────────────────────────────────
        if action == "prescreen":
            prescreen_text = request.form.get("symptoms", "")
            if prescreen_text.strip():
                ai_result = ai_prescreen(prescreen_text)
                ai_result["slot_hint"] = ai_suggest_slots(None, ai_result["priority"])
            return render_template("patient/book.html", doctors=doctors,
                                   ai_result=ai_result, prescreen_text=prescreen_text)

        # ── Reservar cita ───────────────────────────────────────────────────
        doctor_id = request.form.get("doctor_id")
        appt_date = request.form.get("date")
        appt_time = request.form.get("time")
        reason    = request.form.get("reason", "")

        if not all([doctor_id, appt_date, appt_time]):
            flash("Completa todos los campos requeridos.", "danger")
            return render_template("patient/book.html", doctors=doctors)

        doctor = User.query.filter_by(id=doctor_id, role="doctor").first_or_404()
        try:
            d = datetime.strptime(appt_date, "%Y-%m-%d").date()
            t = datetime.strptime(appt_time, "%H:%M").time()
        except ValueError:
            flash("Fecha u hora inválida.", "danger")
            return render_template("patient/book.html", doctors=doctors)

        if d < date.today():
            flash("No puedes agendar en fechas pasadas.", "danger")
            return render_template("patient/book.html", doctors=doctors)

        # Verificar que el slot esté disponible
        available = get_available_slots(doctor, d)
        if appt_time not in available:
            flash("Ese horario ya no está disponible. Elige otro.", "warning")
            return render_template("patient/book.html", doctors=doctors)

        appt = Appointment(patient_id=current_user.id, doctor_id=doctor.id,
                           date=d, time=t, reason=reason)
        db.session.add(appt)
        db.session.commit()

        # RF-04: Email + WhatsApp de confirmación
        send_email(current_user.email,
                   "Cita agendada — AgendApp",
                   appointment_email_html(appt, "confirmed"))
        # WhatsApp al paciente
        if current_user.phone:
            msg_patient = whatsapp_appointment_confirmed(
                current_user.name, doctor.name,
                d.strftime('%d/%m/%Y'), t.strftime('%H:%M'),
                doctor.doctor_profile.specialty if doctor.doctor_profile else 'Medicina General')
            send_whatsapp(current_user.phone, msg_patient)
        # WhatsApp al médico
        if doctor.phone:
            msg_doc = whatsapp_new_appointment_to_doctor(
                doctor.name, current_user.name,
                d.strftime('%d/%m/%Y'), t.strftime('%H:%M'), reason)
            send_whatsapp(doctor.phone, msg_doc)

        flash(f"¡Cita agendada con Dr. {doctor.name} el {d.strftime('%d/%m/%Y')} a las {t.strftime('%H:%M')}!", "success")
        return redirect(url_for("patient_appointments"))

    return render_template("patient/book.html", doctors=doctors,
                           ai_result=ai_result, prescreen_text=prescreen_text)


@app.route("/patient/cancel/<int:appt_id>", methods=["POST"])
@login_required
def patient_cancel(appt_id: int):
    appt = Appointment.query.filter_by(id=appt_id, patient_id=current_user.id).first_or_404()
    if not appt.can_cancel:
        flash("No puedes cancelar esta cita (menos de 24 h o ya completada).", "warning")
        return redirect(url_for("patient_appointments"))
    appt.status = Appointment.STATUS_CANCELLED
    db.session.commit()
    send_email(current_user.email,
               "Cita cancelada — AgendApp",
               appointment_email_html(appt, "cancelled"))
    if current_user.phone:
        send_whatsapp(current_user.phone,
                      whatsapp_appointment_cancelled(
                          current_user.name, appt.doctor.name,
                          appt.date.strftime('%d/%m/%Y'), appt.time.strftime('%H:%M'),
                          'paciente'))
    flash("Cita cancelada exitosamente.", "info")
    return redirect(url_for("patient_appointments"))


@app.route("/patient/reschedule/<int:appt_id>", methods=["GET", "POST"])
@login_required
def patient_reschedule(appt_id: int):
    appt = Appointment.query.filter_by(id=appt_id, patient_id=current_user.id).first_or_404()
    if not appt.can_cancel:
        flash("No puedes reprogramar esta cita.", "warning")
        return redirect(url_for("patient_appointments"))

    if request.method == "POST":
        new_date_str = request.form.get("date")
        new_time_str = request.form.get("time")
        try:
            new_d = datetime.strptime(new_date_str, "%Y-%m-%d").date()
            new_t = datetime.strptime(new_time_str, "%H:%M").time()
        except (ValueError, TypeError):
            flash("Fecha u hora inválida.", "danger")
            return redirect(request.url)

        available = get_available_slots(appt.doctor, new_d)
        if new_time_str not in available:
            flash("Ese horario ya no está disponible.", "warning")
            return redirect(request.url)

        appt.date   = new_d
        appt.time   = new_t
        appt.status = Appointment.STATUS_PENDING
        db.session.commit()
        flash("Cita reprogramada exitosamente.", "success")
        return redirect(url_for("patient_appointments"))

    doctor  = appt.doctor
    doctors = [doctor]
    return render_template("patient/book.html", doctors=doctors,
                           reschedule_appt=appt, ai_result=None, prescreen_text="")


# ═════════════════════════════════════════════════════════════════════════════
# DOCTOR ROUTES  (RF-02, RF-05)
# ═════════════════════════════════════════════════════════════════════════════
@app.route("/doctor/dashboard")
@login_required
def doctor_dashboard():
    if not current_user.is_doctor:
        return redirect(url_for("dashboard"))
    today_appts = (Appointment.query
                   .filter_by(doctor_id=current_user.id)
                   .filter_by(date=date.today())
                   .filter(Appointment.status.in_(["pending", "confirmed"]))
                   .order_by(Appointment.time).all())
    upcoming = (Appointment.query
                .filter_by(doctor_id=current_user.id)
                .filter(Appointment.status.in_(["pending", "confirmed"]))
                .filter(Appointment.date > date.today())
                .order_by(Appointment.date, Appointment.time)
                .limit(10).all())
    stats = {
        "total":     Appointment.query.filter_by(doctor_id=current_user.id).count(),
        "today":     len(today_appts),
        "pending":   Appointment.query.filter_by(doctor_id=current_user.id, status="pending").count(),
        "this_month": Appointment.query.filter_by(doctor_id=current_user.id)
                       .filter(Appointment.date >= date.today().replace(day=1)).count(),
    }
    return render_template("doctor/dashboard.html",
                           today_appts=today_appts, upcoming=upcoming, stats=stats)


@app.route("/doctor/schedule", methods=["GET", "POST"])
@login_required
def doctor_schedule():
    if not current_user.is_doctor:
        return redirect(url_for("dashboard"))
    profile = current_user.doctor_profile
    if not profile:
        profile = DoctorProfile(user=current_user)
        db.session.add(profile)
        db.session.commit()

    if request.method == "POST":
        # Eliminar horarios existentes
        Schedule.query.filter_by(doctor_id=profile.id).delete()
        days = request.form.getlist("day")
        starts = request.form.getlist("start_time")
        ends   = request.form.getlist("end_time")
        slots  = request.form.getlist("slot_duration")

        for i, day in enumerate(days):
            try:
                s = Schedule(
                    doctor_id    = profile.id,
                    day_of_week  = int(day),
                    start_time   = datetime.strptime(starts[i], "%H:%M").time(),
                    end_time     = datetime.strptime(ends[i],   "%H:%M").time(),
                    slot_duration= int(slots[i]) if i < len(slots) else 30,
                )
                db.session.add(s)
            except (ValueError, IndexError):
                continue
        # Actualizar perfil
        profile.specialty        = request.form.get("specialty", profile.specialty)
        profile.bio              = request.form.get("bio",       profile.bio)
        profile.consultation_fee = float(request.form.get("fee", profile.consultation_fee or 0))
        db.session.commit()
        flash("Horario guardado correctamente.", "success")
        return redirect(url_for("doctor_schedule"))

    schedules = profile.schedules.order_by(Schedule.day_of_week).all()
    return render_template("doctor/schedule.html", profile=profile, schedules=schedules)


@app.route("/doctor/confirm/<int:appt_id>", methods=["POST"])
@login_required
def doctor_confirm(appt_id: int):
    appt = Appointment.query.filter_by(id=appt_id, doctor_id=current_user.id).first_or_404()
    appt.status = Appointment.STATUS_CONFIRMED
    db.session.commit()
    send_email(appt.patient.email,
               "Cita confirmada — AgendApp",
               appointment_email_html(appt, "confirmed"))
    if appt.patient.phone:
        send_whatsapp(appt.patient.phone,
                      whatsapp_appointment_confirmed(
                          appt.patient.name, current_user.name,
                          appt.date.strftime('%d/%m/%Y'), appt.time.strftime('%H:%M'),
                          current_user.doctor_profile.specialty if current_user.doctor_profile else 'Medicina General'))
    flash("Cita confirmada y paciente notificado.", "success")
    return redirect(url_for("doctor_dashboard"))


@app.route("/doctor/complete/<int:appt_id>", methods=["POST"])
@login_required
def doctor_complete(appt_id: int):
    appt = Appointment.query.filter_by(id=appt_id, doctor_id=current_user.id).first_or_404()
    appt.status = Appointment.STATUS_COMPLETED
    notes = request.form.get("notes", "")
    if notes:
        appt.notes = notes
    db.session.commit()
    flash("Cita marcada como completada.", "success")
    return redirect(url_for("doctor_dashboard"))


@app.route("/doctor/cancel/<int:appt_id>", methods=["POST"])
@login_required
def doctor_cancel(appt_id: int):
    appt = Appointment.query.filter_by(id=appt_id, doctor_id=current_user.id).first_or_404()
    appt.status = Appointment.STATUS_CANCELLED
    db.session.commit()
    send_email(appt.patient.email,
               "Cita cancelada por el médico — AgendApp",
               appointment_email_html(appt, "cancelled"))
    if appt.patient.phone:
        send_whatsapp(appt.patient.phone,
                      whatsapp_appointment_cancelled(
                          appt.patient.name, current_user.name,
                          appt.date.strftime('%d/%m/%Y'), appt.time.strftime('%H:%M'),
                          'medico'))
    flash("Cita cancelada y paciente notificado.", "info")
    return redirect(url_for("doctor_dashboard"))


@app.route("/doctor/reports")
@login_required
def doctor_reports():
    if not current_user.is_doctor:
        return redirect(url_for("dashboard"))
    # RF-05: Estadísticas
    all_appts = Appointment.query.filter_by(doctor_id=current_user.id).all()
    by_status = {}
    for a in all_appts:
        by_status[a.status] = by_status.get(a.status, 0) + 1

    # Citas por mes (últimos 6 meses)
    monthly = {}
    for a in all_appts:
        key = a.date.strftime("%Y-%m")
        monthly[key] = monthly.get(key, 0) + 1
    monthly_sorted = dict(sorted(monthly.items())[-6:])

    # Top pacientes
    from collections import Counter
    patient_counts = Counter(a.patient_id for a in all_appts)
    top_patients = []
    for pid, cnt in patient_counts.most_common(5):
        u = User.query.get(pid)
        if u:
            top_patients.append({"name": u.name, "count": cnt})

    return render_template("doctor/reports.html",
                           all_appts=all_appts,
                           by_status=by_status,
                           monthly=monthly_sorted,
                           top_patients=top_patients)


# ═════════════════════════════════════════════════════════════════════════════
# API ROUTES (JSON — para FullCalendar y AJAX)
# ═════════════════════════════════════════════════════════════════════════════
@app.route("/api/slots")
@login_required
def api_slots():
    """Retorna slots disponibles para doctor en fecha. GET ?doctor_id=&date=YYYY-MM-DD"""
    doctor_id  = request.args.get("doctor_id", type=int)
    date_str   = request.args.get("date", "")
    if not doctor_id or not date_str:
        return jsonify({"error": "doctor_id y date son requeridos"}), 400
    doctor = User.query.filter_by(id=doctor_id, role="doctor").first()
    if not doctor:
        return jsonify({"error": "Doctor no encontrado"}), 404
    try:
        d = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error": "Formato de fecha inválido (YYYY-MM-DD)"}), 400
    slots = get_available_slots(doctor, d)
    return jsonify({"slots": slots, "doctor": doctor.name, "date": date_str})


@app.route("/api/calendar/appointments")
@login_required
def api_calendar_appointments():
    """Retorna citas en formato FullCalendar."""
    start_str = request.args.get("start", "")
    end_str   = request.args.get("end",   "")

    q = Appointment.query
    if current_user.is_patient:
        q = q.filter_by(patient_id=current_user.id)
    elif current_user.is_doctor:
        q = q.filter_by(doctor_id=current_user.id)

    try:
        if start_str:
            start_d = datetime.fromisoformat(start_str[:10]).date()
            q = q.filter(Appointment.date >= start_d)
        if end_str:
            end_d = datetime.fromisoformat(end_str[:10]).date()
            q = q.filter(Appointment.date <= end_d)
    except ValueError:
        pass

    COLOR_MAP = {
        "pending":   "#ffc107",
        "confirmed": "#198754",
        "cancelled": "#dc3545",
        "completed": "#6c757d",
    }

    events = []
    for a in q.all():
        start_dt = datetime.combine(a.date, a.time)
        end_dt   = start_dt + timedelta(minutes=a.duration)
        if current_user.is_patient:
            title = f"Dr. {a.doctor.name}"
        else:
            title = a.patient.name
        events.append({
            "id":          a.id,
            "title":       title,
            "start":       start_dt.isoformat(),
            "end":         end_dt.isoformat(),
            "color":       COLOR_MAP.get(a.status, "#0d6efd"),
            "extendedProps": {
                "status":  a.status,
                "reason":  a.reason or "",
                "patient": a.patient.name,
                "doctor":  a.doctor.name,
            }
        })
    return jsonify(events)


@app.route("/api/ai/prescreen", methods=["POST"])
@login_required
def api_ai_prescreen():
    """API endpoint para pre-screening IA (AJAX)."""
    data = request.get_json(silent=True) or {}
    text = data.get("text", "").strip()
    if not text:
        return jsonify({"error": "Texto vacío"}), 400
    result = ai_prescreen(text)
    result["slot_hint"] = ai_suggest_slots(None, result["priority"])
    return jsonify(result)


@app.route("/api/doctors")
@login_required
def api_doctors():
    """Lista de doctores con especialidades."""
    doctors = User.query.filter_by(role="doctor", active=True).all()
    return jsonify([{
        "id":        d.id,
        "name":      d.name,
        "specialty": d.doctor_profile.specialty if d.doctor_profile else "Medicina General",
    } for d in doctors])


# ═════════════════════════════════════════════════════════════════════════════
# ADMIN ROUTES
# ═════════════════════════════════════════════════════════════════════════════
@app.route("/admin/dashboard")
@login_required
def admin_dashboard():
    if not current_user.is_admin:
        return redirect(url_for("dashboard"))
    users = User.query.order_by(User.created_at.desc()).all()
    appts = Appointment.query.order_by(Appointment.created_at.desc()).limit(20).all()
    stats = {
        "total_users":   User.query.count(),
        "patients":      User.query.filter_by(role="patient").count(),
        "doctors":       User.query.filter_by(role="doctor").count(),
        "appointments":  Appointment.query.count(),
        "today":         Appointment.query.filter_by(date=date.today()).count(),
    }
    return render_template("admin/dashboard.html", users=users, appts=appts, stats=stats)


# ═════════════════════════════════════════════════════════════════════════════
# RECORDATORIOS  (RF-04) — endpoint para cron job en Render
# ═════════════════════════════════════════════════════════════════════════════
@app.route("/internal/send-reminders", methods=["POST"])
def send_reminders():
    """
    Llamado por cron job de Render.
    Envía recordatorio a citas de las próximas REMINDER_HOURS_BEFORE horas.
    """
    secret = request.headers.get("X-Cron-Secret", "")
    if secret != app.config.get("SECRET_KEY", ""):
        abort(403)

    hours  = app.config["REMINDER_HOURS_BEFORE"]
    cutoff = datetime.utcnow() + timedelta(hours=hours)
    appts  = (Appointment.query
              .filter_by(reminder_sent=False)
              .filter(Appointment.status.in_(["pending", "confirmed"]))
              .all())

    sent = 0
    for a in appts:
        if datetime.combine(a.date, a.time) <= cutoff:
            ok = send_email(a.patient.email,
                            f"Recordatorio de cita — {a.date.strftime('%d/%m/%Y')}",
                            appointment_email_html(a, "reminder"))
            if ok:
                a.reminder_sent = True
                sent += 1

    db.session.commit()
    return jsonify({"sent": sent, "checked": len(appts)})


# ═════════════════════════════════════════════════════════════════════════════
# Error handlers
# ═════════════════════════════════════════════════════════════════════════════
@app.errorhandler(403)
def forbidden(e):
    return render_template("errors/403.html"), 403

@app.errorhandler(404)
def not_found(e):
    return render_template("errors/404.html"), 404

@app.errorhandler(500)
def server_error(e):
    return render_template("errors/500.html"), 500


# ─────────────────────────────────────────────────────────────────────────────
# Bootstrap de base de datos (producción / Render)
# Crea las tablas y carga datos demo si la BD está vacía. Es idempotente:
# en redeploys no borra datos. Se activa solo bajo gunicorn en producción.
# ─────────────────────────────────────────────────────────────────────────────
def _ensure_docente():
    """Garantiza la cuenta demo del docente (idempotente, aunque la BD no esté vacía)."""
    if User.query.filter_by(email="docente@agendapp.co").first() is None:
        d = User(name="Docente Evaluador (Demo)", email="docente@agendapp.co",
                 phone="+573000000001", role="admin", active=True)
        d.set_password("Demo2026!")
        db.session.add(d)
        db.session.commit()


def _bootstrap_db():
    try:
        with app.app_context():
            db.create_all()
            if User.query.first() is None:
                from seed import populate
                populate()
            _ensure_docente()
    except Exception as exc:  # no tumbar el worker si otro ya sembró
        app.logger.warning(f"Bootstrap de BD omitido: {exc}")


if os.environ.get("FLASK_ENV") == "production" \
        and os.environ.get("AUTO_SEED", "true").lower() == "true":
    _bootstrap_db()


# ─────────────────────────────────────────────────────────────────────────────
# Entrypoint
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        if User.query.first() is None:
            from seed import populate
            populate()
    app.run(debug=True, host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
