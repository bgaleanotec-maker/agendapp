"""
Fixtures pytest para AgendApp
Modelo V: conftest provee entorno de prueba aislado con DB en memoria.
"""
import pytest
from datetime import date, time, timedelta
from app import app as flask_app
from models import db as _db, User, DoctorProfile, Schedule, Appointment


@pytest.fixture(scope="session")
def app():
    flask_app.config.update({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
        "WTF_CSRF_ENABLED": False,
        "SECRET_KEY": "test-secret",
        "MAIL_SUPPRESS_SEND": True,
    })
    with flask_app.app_context():
        _db.create_all()
        _seed_data()
        yield flask_app
        _db.drop_all()


@pytest.fixture(scope="session")
def client(app):
    return app.test_client()


@pytest.fixture(scope="function")
def db(app):
    """DB limpia por función."""
    with app.app_context():
        yield _db
        _db.session.rollback()


# ─── Seed data ──────────────────────────────────────────────────────────────
def _seed_data():
    """Crea usuarios y datos de prueba iniciales."""
    # Admin
    admin = User(name="Admin Sistema", email="admin@agendapp.co", role="admin")
    admin.set_password("Admin2026!")

    # Doctor 1
    doc1 = User(name="Carlos García", email="dr.garcia@agendapp.co", role="doctor")
    doc1.set_password("Doctor2026!")
    prof1 = DoctorProfile(user=doc1, specialty="Medicina General", consultation_fee=80000)
    sched1 = Schedule(doctor_profile=prof1, day_of_week=0,  # Lunes
                      start_time=time(8,0), end_time=time(17,0), slot_duration=30)
    sched2 = Schedule(doctor_profile=prof1, day_of_week=2,  # Miércoles
                      start_time=time(8,0), end_time=time(17,0), slot_duration=30)
    sched3 = Schedule(doctor_profile=prof1, day_of_week=4,  # Viernes
                      start_time=time(8,0), end_time=time(12,0), slot_duration=30)

    # Doctor 2
    doc2 = User(name="Ana Pérez", email="dr.perez@agendapp.co", role="doctor")
    doc2.set_password("Doctor2026!")
    prof2 = DoctorProfile(user=doc2, specialty="Cardiología", consultation_fee=150000)
    sched4 = Schedule(doctor_profile=prof2, day_of_week=1,  # Martes
                      start_time=time(9,0), end_time=time(18,0), slot_duration=30)
    sched5 = Schedule(doctor_profile=prof2, day_of_week=3,  # Jueves
                      start_time=time(9,0), end_time=time(18,0), slot_duration=30)

    # Doctor 3 — Odontología
    doc3 = User(name="Sebastián Vargas", email="dr.vargas@agendapp.co", role="doctor")
    doc3.set_password("Doctor2026!")
    prof3 = DoctorProfile(user=doc3, specialty="Odontologia", consultation_fee=60000)
    sched6 = Schedule(doctor_profile=prof3, day_of_week=0,
                      start_time=time(8,0), end_time=time(16,0), slot_duration=30)
    sched7 = Schedule(doctor_profile=prof3, day_of_week=2,
                      start_time=time(8,0), end_time=time(16,0), slot_duration=30)

    # Doctor 4 — Psicología
    doc4 = User(name="Sofía Ramírez", email="dr.ramirez@agendapp.co", role="doctor")
    doc4.set_password("Doctor2026!")
    prof4 = DoctorProfile(user=doc4, specialty="Psicologia", consultation_fee=55000)
    sched8 = Schedule(doctor_profile=prof4, day_of_week=1,
                      start_time=time(9,0), end_time=time(18,0), slot_duration=30)
    sched9 = Schedule(doctor_profile=prof4, day_of_week=3,
                      start_time=time(9,0), end_time=time(18,0), slot_duration=30)

    # Doctor 5 — Gastroenterología
    doc5 = User(name="Ricardo Ospina", email="dr.ospina@agendapp.co", role="doctor")
    doc5.set_password("Doctor2026!")
    prof5 = DoctorProfile(user=doc5, specialty="Gastroenterologia", consultation_fee=90000)
    sched10 = Schedule(doctor_profile=prof5, day_of_week=0,
                       start_time=time(7,30), end_time=time(15,30), slot_duration=30)
    sched11 = Schedule(doctor_profile=prof5, day_of_week=4,
                       start_time=time(7,30), end_time=time(15,30), slot_duration=30)

    # Patients
    p1 = User(name="Juan Pérez",    email="paciente1@test.co",  role="patient"); p1.set_password("Test2026!")
    p2 = User(name="María García",  email="paciente2@test.co",  role="patient"); p2.set_password("Test2026!")
    p3 = User(name="Carlos López",  email="paciente3@test.co",  role="patient"); p3.set_password("Test2026!")

    _db.session.add_all([
                         admin, doc1, doc2, doc3, doc4, doc5,
                         p1, p2, p3,
                         prof1, prof2, prof3, prof4, prof5,
                         sched1, sched2, sched3, sched4, sched5,
                         sched6, sched7, sched8, sched9, sched10, sched11])
    _db.session.commit()

    # Appointments
    tomorrow = date.today() + timedelta(days=1)
    appt1 = Appointment(patient_id=p1.id, doctor_id=doc1.id,
                        date=tomorrow, time=time(9, 0), status="confirmed",
                        reason="Control general")
    appt2 = Appointment(patient_id=p2.id, doctor_id=doc1.id,
                        date=tomorrow, time=time(9, 30), status="pending",
                        reason="Dolor de cabeza")
    appt3 = Appointment(patient_id=p1.id, doctor_id=doc2.id,
                        date=date.today() - timedelta(days=5), time=time(10, 0),
                        status="completed", reason="Chequeo cardíaco")
    appt4 = Appointment(patient_id=p3.id, doctor_id=doc1.id,
                        date=date.today() - timedelta(days=2), time=time(11, 0),
                        status="cancelled", reason="Revisión")
    _db.session.add_all([appt1, appt2, appt3, appt4])
    _db.session.commit()


# ─── Auth helpers ────────────────────────────────────────────────────────────
def login(client, email: str, password: str):
    # Always start from a clean session so tests are order-independent
    client.get("/logout", follow_redirects=True)
    return client.post("/login",
                       data={"email": email, "password": password},
                       follow_redirects=True)

def logout(client):
    return client.get("/logout", follow_redirects=True)
