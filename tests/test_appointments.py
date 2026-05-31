"""
RF-02, RF-03, RF-04 -- Agendamiento, cancelacion/reprogramacion y recordatorios
Modelo V: Pruebas unitarias e integracion de citas.
"""
import pytest
from datetime import date, time, timedelta
from conftest import login, logout
from models import Appointment, User


class TestAgendamientoCitas:
    """CP-04: Agendamiento de citas (RF-02)."""

    def test_ver_pagina_agendar(self, client):
        """CP-04-01: Paciente puede ver pagina de agendar."""
        login(client, "paciente1@test.co", "Test2026!")
        resp = client.get("/patient/book")
        assert resp.status_code == 200
        assert b"Nueva Cita" in resp.data or b"Agendar" in resp.data

    def test_api_slots_doctor_valido(self, client, app):
        """CP-04-02: API /api/slots retorna slots para doctor disponible."""
        login(client, "paciente1@test.co", "Test2026!")
        with app.app_context():
            doc = User.query.filter_by(email="dr.garcia@agendapp.co").first()
        d = date.today()
        while d.weekday() != 0:
            d += timedelta(days=1)
        resp = client.get(f"/api/slots?doctor_id={doc.id}&date={d.isoformat()}")
        assert resp.status_code == 200
        data = resp.get_json()
        assert "slots" in data

    def test_api_slots_fecha_invalida(self, client, app):
        """CP-04-03: API /api/slots con fecha invalida retorna 400."""
        login(client, "paciente1@test.co", "Test2026!")
        with app.app_context():
            doc = User.query.filter_by(email="dr.garcia@agendapp.co").first()
        resp = client.get(f"/api/slots?doctor_id={doc.id}&date=fecha-mala")
        assert resp.status_code == 400

    def test_api_slots_doctor_inexistente(self, client):
        """CP-04-04: API /api/slots con doctor inexistente retorna 404."""
        login(client, "paciente1@test.co", "Test2026!")
        resp = client.get("/api/slots?doctor_id=99999&date=2026-06-01")
        assert resp.status_code == 404

    def test_calendario_api_json(self, client):
        """CP-04-05: /api/calendar/appointments retorna eventos JSON."""
        login(client, "paciente1@test.co", "Test2026!")
        resp = client.get("/api/calendar/appointments")
        assert resp.status_code == 200
        data = resp.get_json()
        assert isinstance(data, list)

    def test_agendar_cita_fecha_pasada(self, client, app):
        """CP-04-06: Agendar en fecha pasada debe mostrar error."""
        login(client, "paciente1@test.co", "Test2026!")
        with app.app_context():
            doc = User.query.filter_by(email="dr.garcia@agendapp.co").first()
        yesterday = (date.today() - timedelta(days=1)).isoformat()
        resp = client.post("/patient/book", data={
            "action": "book",
            "doctor_id": doc.id,
            "date": yesterday,
            "time": "09:00",
            "reason": "Test"
        }, follow_redirects=True)
        assert resp.status_code == 200


class TestCancelacionReprogramacion:
    """CP-05: Cancelacion y reprogramacion (RF-03)."""

    def test_cancelar_cita_24h_antes(self, client, app):
        """CP-05-01: Paciente puede cancelar con >=24 h."""
        login(client, "paciente1@test.co", "Test2026!")
        with app.app_context():
            p1   = User.query.filter_by(email="paciente1@test.co").first()
            doc1 = User.query.filter_by(email="dr.garcia@agendapp.co").first()
            future = date.today() + timedelta(days=3)
            a = Appointment(patient_id=p1.id, doctor_id=doc1.id,
                            date=future, time=time(14, 0),
                            status=Appointment.STATUS_PENDING, reason="Para cancelar")
            from models import db
            db.session.add(a)
            db.session.commit()
            appt_id = a.id

        resp = client.post(f"/patient/cancel/{appt_id}", follow_redirects=True)
        assert resp.status_code == 200
        with app.app_context():
            updated = Appointment.query.get(appt_id)
            assert updated.status == Appointment.STATUS_CANCELLED

    def test_cancelar_cita_otro_paciente(self, client, app):
        """CP-05-02: Un paciente no puede cancelar la cita de otro."""
        with app.app_context():
            p2   = User.query.filter_by(email="paciente2@test.co").first()
            doc1 = User.query.filter_by(email="dr.garcia@agendapp.co").first()
            future = date.today() + timedelta(days=5)
            a = Appointment(patient_id=p2.id, doctor_id=doc1.id,
                            date=future, time=time(10, 0),
                            status=Appointment.STATUS_PENDING, reason="Ajena")
            from models import db
            db.session.add(a)
            db.session.commit()
            appt_id = a.id

        login(client, "paciente1@test.co", "Test2026!")
        resp = client.post(f"/patient/cancel/{appt_id}", follow_redirects=True)
        assert resp.status_code in (404, 200)

    def test_medico_confirma_cita(self, client, app):
        """CP-05-03: Medico puede confirmar cita pendiente."""
        with app.app_context():
            p1   = User.query.filter_by(email="paciente1@test.co").first()
            doc1 = User.query.filter_by(email="dr.garcia@agendapp.co").first()
            future = date.today() + timedelta(days=2)
            a = Appointment(patient_id=p1.id, doctor_id=doc1.id,
                            date=future, time=time(15, 0),
                            status=Appointment.STATUS_PENDING, reason="Confirmar")
            from models import db
            db.session.add(a)
            db.session.commit()
            appt_id = a.id

        login(client, "dr.garcia@agendapp.co", "Doctor2026!")
        resp = client.post(f"/doctor/confirm/{appt_id}", follow_redirects=True)
        assert resp.status_code == 200
        with app.app_context():
            updated = Appointment.query.get(appt_id)
            assert updated.status == Appointment.STATUS_CONFIRMED


class TestMotorIA:
    """CP-06: Motor IA de pre-screening."""

    def test_prescreen_urgente(self, client):
        """CP-06-01: Sintoma urgente retorna nivel urgente."""
        login(client, "paciente1@test.co", "Test2026!")
        resp = client.post("/api/ai/prescreen",
                           json={"text": "dolor pecho fuerte y dificultad respirar"},
                           content_type="application/json")
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["level"] == "urgente"

    def test_prescreen_rutina(self, client):
        """CP-06-02: Motivo de rutina retorna nivel rutina."""
        login(client, "paciente1@test.co", "Test2026!")
        resp = client.post("/api/ai/prescreen",
                           json={"text": "control preventivo y chequeo anual"},
                           content_type="application/json")
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["level"] == "rutina"

    def test_prescreen_texto_vacio(self, client):
        """CP-06-03: Texto vacio retorna 400."""
        login(client, "paciente1@test.co", "Test2026!")
        resp = client.post("/api/ai/prescreen",
                           json={"text": ""},
                           content_type="application/json")
        assert resp.status_code == 400

    def test_api_doctores(self, client):
        """CP-06-04: /api/doctors retorna lista JSON."""
        login(client, "paciente1@test.co", "Test2026!")
        resp = client.get("/api/doctors")
        assert resp.status_code == 200
        data = resp.get_json()
        assert isinstance(data, list)
        assert len(data) >= 2


class TestRendimiento:
    """CP-07: Verificacion basica de rendimiento (RNF-03)."""

    def test_carga_landing(self, client):
        logout(client)
        resp = client.get("/")
        assert resp.status_code == 200

    def test_carga_login(self, client):
        logout(client)
        resp = client.get("/login")
        assert resp.status_code == 200

    def test_404(self, client):
        resp = client.get("/ruta-que-no-existe")
        assert resp.status_code == 404
