from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

db = SQLAlchemy()


# ─────────────────────────────────────────────────────────────────────────────
# USERS  (RF-01)
# ─────────────────────────────────────────────────────────────────────────────
class User(UserMixin, db.Model):
    __tablename__ = "users"

    id           = db.Column(db.Integer, primary_key=True)
    email        = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash= db.Column(db.String(256), nullable=False)
    name         = db.Column(db.String(100), nullable=False)
    phone        = db.Column(db.String(20))
    role         = db.Column(db.String(20), nullable=False, default="patient")  # patient | doctor | admin
    active       = db.Column(db.Boolean, default=True)
    created_at   = db.Column(db.DateTime, default=datetime.utcnow)

    # relationships
    doctor_profile      = db.relationship("DoctorProfile", backref="user", uselist=False, cascade="all, delete-orphan")
    patient_appointments= db.relationship("Appointment", foreign_keys="Appointment.patient_id", backref="patient", lazy="dynamic")
    doctor_appointments = db.relationship("Appointment", foreign_keys="Appointment.doctor_id",  backref="doctor",  lazy="dynamic")

    def set_password(self, password: str) -> None:
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    @property
    def is_doctor(self):
        return self.role == "doctor"

    @property
    def is_patient(self):
        return self.role == "patient"

    @property
    def is_admin(self):
        return self.role == "admin"

    def __repr__(self):
        return f"<User {self.email} [{self.role}]>"


# ─────────────────────────────────────────────────────────────────────────────
# DOCTOR PROFILE
# ─────────────────────────────────────────────────────────────────────────────
class DoctorProfile(db.Model):
    __tablename__ = "doctor_profiles"

    id               = db.Column(db.Integer, primary_key=True)
    user_id          = db.Column(db.Integer, db.ForeignKey("users.id"), unique=True, nullable=False)
    specialty        = db.Column(db.String(100), default="Medicina General")
    bio              = db.Column(db.Text)
    consultation_fee = db.Column(db.Float, default=0.0)

    schedules = db.relationship("Schedule", backref="doctor_profile", lazy="dynamic", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<DoctorProfile user_id={self.user_id} specialty={self.specialty}>"


# ─────────────────────────────────────────────────────────────────────────────
# SCHEDULE  (doctor weekly availability)
# ─────────────────────────────────────────────────────────────────────────────
class Schedule(db.Model):
    __tablename__ = "schedules"

    id            = db.Column(db.Integer, primary_key=True)
    doctor_id     = db.Column(db.Integer, db.ForeignKey("doctor_profiles.id"), nullable=False)
    day_of_week   = db.Column(db.Integer, nullable=False)   # 0=Lun … 6=Dom
    start_time    = db.Column(db.Time, nullable=False)
    end_time      = db.Column(db.Time, nullable=False)
    slot_duration = db.Column(db.Integer, default=30)        # minutos

    DAY_NAMES = {0: "Lunes", 1: "Martes", 2: "Miércoles",
                 3: "Jueves", 4: "Viernes", 5: "Sábado", 6: "Domingo"}

    @property
    def day_name(self):
        return self.DAY_NAMES.get(self.day_of_week, "")

    def __repr__(self):
        return f"<Schedule doctor={self.doctor_id} day={self.day_name}>"


# ─────────────────────────────────────────────────────────────────────────────
# APPOINTMENT  (RF-02, RF-03, RF-04)
# ─────────────────────────────────────────────────────────────────────────────
class Appointment(db.Model):
    __tablename__ = "appointments"

    STATUS_PENDING   = "pending"
    STATUS_CONFIRMED = "confirmed"
    STATUS_CANCELLED = "cancelled"
    STATUS_COMPLETED = "completed"

    STATUS_META = {
        "pending":   {"label": "Pendiente",  "color": "warning",   "icon": "clock"},
        "confirmed": {"label": "Confirmada", "color": "success",   "icon": "check-circle"},
        "cancelled": {"label": "Cancelada",  "color": "danger",    "icon": "x-circle"},
        "completed": {"label": "Completada", "color": "secondary", "icon": "check-all"},
    }

    id            = db.Column(db.Integer, primary_key=True)
    patient_id    = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    doctor_id     = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    date          = db.Column(db.Date,    nullable=False)
    time          = db.Column(db.Time,    nullable=False)
    duration      = db.Column(db.Integer, default=30)   # minutos
    status        = db.Column(db.String(20), default=STATUS_PENDING)
    reason        = db.Column(db.String(200))
    notes         = db.Column(db.Text)
    reminder_sent = db.Column(db.Boolean, default=False)
    created_at    = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at    = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    @property
    def status_meta(self):
        return self.STATUS_META.get(self.status, {"label": "?", "color": "light", "icon": "question"})

    @property
    def datetime_obj(self):
        return datetime.combine(self.date, self.time)

    @property
    def can_cancel(self):
        """RF-03: solo se puede cancelar con ≥24 h de antelación"""
        from datetime import timedelta
        return self.datetime_obj > datetime.utcnow() + timedelta(hours=24) \
               and self.status not in (self.STATUS_CANCELLED, self.STATUS_COMPLETED)

    def __repr__(self):
        return f"<Appointment {self.date} {self.time} patient={self.patient_id} status={self.status}>"
