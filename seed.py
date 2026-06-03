"""
seed.py — Datos de prueba para AgendApp
Ejecutar: python seed.py   (respeta FLASK_ENV: development | production)

En producción (Render) usa el DATABASE_URL de PostgreSQL inyectado por el
entorno. La función populate() es idempotente: solo carga datos si la base
está vacía, por lo que puede invocarse con seguridad al arrancar la app.
"""
import os
from app import app as _global_app, db
from models import User, DoctorProfile, Schedule, Appointment
from werkzeug.security import generate_password_hash
from datetime import date, time, timedelta


def populate():
    """Inserta los datos demo en la BD del contexto de aplicación activo."""
    if True:
        # ── ADMIN ──────────────────────────────────────────────────────────────
        admin = User(
            name="Admin AgendApp",
            email="admin@agendapp.co",
            phone="+573000000000",
            role="admin",
            active=True,
        )
        admin.set_password("Admin2024!")
        db.session.add(admin)

        # ── DOCENTE / EVALUADOR (cuenta demo para validación) ───────────────────
        # Cuenta con rol administrador para que el docente pueda revisar la
        # operación completa del sistema y validar las pruebas realizadas.
        docente = User(
            name="Docente Evaluador (Demo)",
            email="docente@agendapp.co",
            phone="+573000000001",
            role="admin",
            active=True,
        )
        docente.set_password("Demo2026!")
        db.session.add(docente)

        # ── MÉDICOS ────────────────────────────────────────────────────────────
        doctors_data = [
            # (name, email, phone, specialty, bio, fee, days_of_week, start, end)
            # --- Medicina General (5) ---
            ("Dra. Laura García Ruiz",       "dr.garcia@agendapp.co",    "+573111111111",
             "Medicina General",
             "Médica general con 10 años de experiencia en atención primaria y preventiva.",
             40000, [0, 2, 4], "08:00", "17:00"),   # L Mi V

            ("Dr. Andrés Mora Castillo",     "dr.mora@agendapp.co",      "+573111111112",
             "Medicina General",
             "Especialista en medicina familiar y atención integral del adulto.",
             40000, [1, 3], "07:00", "15:00"),        # Ma Ju

            ("Dra. Valentina Ríos Salcedo",  "dr.rios@agendapp.co",      "+573111111113",
             "Medicina General",
             "Énfasis en salud preventiva, vacunación y control de enfermedades crónicas.",
             40000, [0, 1, 2, 3, 4], "14:00", "20:00"),  # L-V tarde

            ("Dr. Felipe Herrera Ospina",    "dr.herrera@agendapp.co",   "+573111111114",
             "Medicina General",
             "Médico general con experiencia en urgencias y atención domiciliaria.",
             40000, [0, 2, 4], "07:00", "13:00"),     # L Mi V mañana

            ("Dra. Camila Torres Muñoz",     "dr.torres@agendapp.co",    "+573111111115",
             "Medicina General",
             "Experta en medicina del trabajo y certificados de aptitud laboral.",
             40000, [1, 3, 5], "09:00", "17:00"),     # Ma Ju Sa

            # --- Odontología (2) ---
            ("Dr. Sebastián Vargas Londoño", "dr.vargas@agendapp.co",    "+573222222221",
             "Odontologia",
             "Odontólogo general con énfasis en estética dental y ortodoncia.",
             60000, [0, 1, 2, 3, 4], "08:00", "16:00"),  # L-V

            ("Dra. Natalia Cárdenas Pérez",  "dr.cardenas@agendapp.co",  "+573222222222",
             "Odontologia",
             "Odontóloga general y especialista en odontopediatría y endodoncia.",
             60000, [1, 3, 5], "09:00", "18:00"),     # Ma Ju Sa

            # --- Psicología (5) ---
            ("Dra. Sofía Ramírez Gómez",     "dr.ramirez@agendapp.co",   "+573333333331",
             "Psicologia",
             "Psicóloga clínica con enfoque cognitivo-conductual. Adultos y adolescentes.",
             55000, [0, 2, 4], "09:00", "18:00"),     # L Mi V

            ("Dr. Mateo Gutiérrez Soto",     "dr.gutierrez@agendapp.co", "+573333333332",
             "Psicologia",
             "Especialista en manejo de ansiedad, depresión y terapia de pareja.",
             55000, [1, 3], "10:00", "19:00"),         # Ma Ju

            ("Dra. Isabella Moreno Arias",   "dr.moreno@agendapp.co",    "+573333333333",
             "Psicologia",
             "Psicóloga infantil y familiar. Atención de duelo y trauma.",
             55000, [0, 1, 2, 3, 4], "08:00", "14:00"),  # L-V mañana

            ("Dr. Nicolás Parra Bermúdez",   "dr.parra@agendapp.co",     "+573333333334",
             "Psicologia",
             "Neuropsicología, evaluación cognitiva y rehabilitación.",
             65000, [2, 4], "14:00", "20:00"),         # Mi V tarde

            ("Dra. Valeria Mendoza Cruz",    "dr.mendoza@agendapp.co",   "+573333333335",
             "Psicologia",
             "Psicóloga organizacional y coaching para manejo del estrés laboral.",
             55000, [1, 3, 5], "08:00", "16:00"),      # Ma Ju Sa

            # --- Gastroenterología (1) ---
            ("Dr. Ricardo Ospina Flórez",    "dr.ospina@agendapp.co",    "+573444444441",
             "Gastroenterologia",
             "Gastroenterólogo con 15 años de experiencia. Endoscopia y colonoscopia.",
             90000, [0, 2, 4], "07:30", "15:30"),      # L Mi V
        ]

        doctor_users = []
        for (name, email, phone, specialty, bio, fee, days, start, end) in doctors_data:
            u = User(name=name, email=email, phone=phone, role="doctor", active=True)
            u.set_password("Doctor2024!")
            db.session.add(u)
            db.session.flush()

            profile = DoctorProfile(
                user_id=u.id,
                specialty=specialty,
                bio=bio,
                consultation_fee=fee,
            )
            db.session.add(profile)
            db.session.flush()

            h_start = int(start.split(":")[0])
            m_start = int(start.split(":")[1])
            h_end   = int(end.split(":")[0])
            m_end   = int(end.split(":")[1])

            for day in days:
                sched = Schedule(
                    doctor_id=profile.id,
                    day_of_week=day,
                    start_time=time(h_start, m_start),
                    end_time=time(h_end, m_end),
                    slot_duration=30,
                )
                db.session.add(sched)

            doctor_users.append(u)

        # ── PACIENTES ──────────────────────────────────────────────────────────
        patients_data = [
            ("María Rodríguez López",    "maria@test.co",     "+573500000001"),
            ("Carlos Jiménez Vargas",    "carlos@test.co",    "+573500000002"),
            ("Ana Fernández Ruiz",       "ana@test.co",       "+573500000003"),
            ("Luis Martínez Gómez",      "luis@test.co",      "+573500000004"),
            ("Paula Suárez Díaz",        "paula@test.co",     "+573500000005"),
        ]
        patient_users = []
        for (name, email, phone) in patients_data:
            p = User(name=name, email=email, phone=phone, role="patient", active=True)
            p.set_password("Paciente2024!")
            db.session.add(p)
            patient_users.append(p)

        db.session.flush()

        # ── CITAS DE MUESTRA ───────────────────────────────────────────────────
        today = date.today()
        tomorrow = today + timedelta(days=1)
        next_week = today + timedelta(days=7)

        # Usando los primeros 4 médicos (índices 0-3) y primeros 3 pacientes
        sample_appointments = [
            # (patient_idx, doctor_idx, date, time_str, status, reason)
            (0, 0, today,      "09:00", "confirmed", "Control general anual"),
            (1, 0, today,      "09:30", "pending",   "Fiebre y tos desde hace 3 días"),
            (2, 1, tomorrow,   "07:30", "confirmed", "Chequeo rutinario"),
            (3, 5, tomorrow,   "08:00", "confirmed", "Dolor de muela persistente"),
            (4, 7, next_week,  "09:00", "pending",   "Manejo de ansiedad y estrés"),
            (0, 12, next_week, "07:30", "confirmed", "Consulta por gastritis crónica"),
            (1, 6, today,      "10:00", "confirmed", "Limpieza dental y revisión"),
            (2, 8, tomorrow,   "10:30", "pending",   "Terapia psicológica — primera sesión"),
        ]

        for (pi, di, appt_date, time_str, status, reason) in sample_appointments:
            h, m = map(int, time_str.split(":"))
            appt = Appointment(
                patient_id=patient_users[pi].id,
                doctor_id=doctor_users[di].id,
                date=appt_date,
                time=time(h, m),
                duration=30,
                status=status,
                reason=reason,
            )
            db.session.add(appt)

        db.session.commit()

        # ── RESUMEN ────────────────────────────────────────────────────────────
        from collections import Counter
        specs = Counter()
        for dp in DoctorProfile.query.all():
            specs[dp.specialty] += 1

        print("\n[OK] Seed completado:")
        print(f"   Usuarios totales : {User.query.count()}")
        print(f"   Admin            : {User.query.filter_by(role='admin').count()}")
        print(f"   Médicos          : {User.query.filter_by(role='doctor').count()}")
        for sp, cnt in sorted(specs.items()):
            print(f"     - {sp}: {cnt}")
        print(f"   Pacientes        : {User.query.filter_by(role='patient').count()}")
        print(f"   Citas            : {Appointment.query.count()}")
        print()


def seed_database(reset: bool = True):
    """Crea las tablas y carga datos demo usando el `app` global (FLASK_ENV)."""
    with _global_app.app_context():
        if reset:
            db.drop_all()
        db.create_all()
        populate()


def ensure_seed():
    """Idempotente: crea tablas y siembra solo si la BD está vacía.

    Pensada para ejecutarse al arrancar en producción (Render) sin borrar
    datos existentes en redeploys.
    """
    with _global_app.app_context():
        db.create_all()
        if User.query.first() is None:
            populate()


if __name__ == "__main__":
    # En producción no borramos datos previos; en desarrollo sí (BD limpia).
    is_prod = os.environ.get("FLASK_ENV", "development") == "production"
    seed_database(reset=not is_prod)
