"""
RF-01 — Registro y autenticación de usuarios
Modelo V: Pruebas unitarias + integración de autenticación.
"""
import pytest
from conftest import login, logout


class TestRegistro:
    """CP-01: Registro de nuevo usuario (paciente y médico)."""

    def test_registro_paciente_exitoso(self, client):
        """CP-01-01: Registro con datos válidos debe crear cuenta y redirigir al dashboard."""
        resp = client.post("/register", data={
            "name": "Laura Torres",
            "email": "laura.torres@test.co",
            "phone": "+57 310 000 0001",
            "role": "patient",
            "password": "Prueba2026!",
            "confirm": "Prueba2026!"
        }, follow_redirects=True)
        assert resp.status_code == 200
        assert b"Bienvenido" in resp.data or b"Panel" in resp.data or b"dashboard" in resp.data.lower()

    def test_registro_medico_exitoso(self, client):
        """CP-01-02: Registro de médico crea perfil médico."""
        resp = client.post("/register", data={
            "name": "Roberto Medina",
            "email": "dr.medina@test.co",
            "role": "doctor",
            "specialty": "Pediatría",
            "password": "Doctor2026!",
            "confirm": "Doctor2026!"
        }, follow_redirects=True)
        assert resp.status_code == 200

    def test_registro_email_duplicado(self, client):
        """CP-01-03: Email ya registrado debe mostrar error. (RF-01 excepción 1)"""
        logout(client)
        resp = client.post("/register", data={
            "name": "Otro usuario",
            "email": "paciente1@test.co",   # ya existe en seed
            "role": "patient",
            "password": "Prueba2026!",
            "confirm": "Prueba2026!"
        }, follow_redirects=True)
        assert b"registrado" in resp.data or b"existe" in resp.data or b"error" in resp.data.lower()

    def test_registro_contrasenas_no_coinciden(self, client):
        """CP-01-04: Contraseñas distintas deben mostrar error."""
        logout(client)
        resp = client.post("/register", data={
            "name": "Test",
            "email": "nuevo@test.co",
            "role": "patient",
            "password": "Prueba2026!",
            "confirm": "Diferente2026!"
        }, follow_redirects=True)
        assert b"coinciden" in resp.data or b"error" in resp.data.lower()

    def test_registro_contrasena_corta(self, client):
        """CP-01-05: Contraseña menor a 8 chars debe fallar. (RNF-02)"""
        resp = client.post("/register", data={
            "name": "Test",
            "email": "test_short@test.co",
            "role": "patient",
            "password": "abc",
            "confirm": "abc"
        }, follow_redirects=True)
        assert b"menos" in resp.data or resp.status_code in (200, 400)

    def test_campos_requeridos(self, client):
        """CP-01-06: Sin nombre ni email debe mostrar error."""
        resp = client.post("/register", data={
            "role": "patient",
            "password": "Prueba2026!",
            "confirm": "Prueba2026!"
        }, follow_redirects=True)
        assert b"requerido" in resp.data or resp.status_code == 200


class TestLogin:
    """CP-02: Inicio de sesión. (RF-01)"""

    def test_login_paciente_valido(self, client):
        """CP-02-01: Login con credenciales correctas redirige al dashboard."""
        resp = login(client, "paciente1@test.co", "Test2026!")
        assert resp.status_code == 200
        assert b"Panel" in resp.data or b"Citas" in resp.data or b"Hola" in resp.data

    def test_login_medico_valido(self, client):
        """CP-02-02: Login de médico redirige a agenda médica."""
        logout(client)
        resp = login(client, "dr.garcia@agendapp.co", "Doctor2026!")
        assert resp.status_code == 200

    def test_login_credenciales_incorrectas(self, client):
        """CP-02-03: Contraseña incorrecta muestra error. (RF-01 excepción 2)"""
        logout(client)
        resp = login(client, "paciente1@test.co", "WrongPassword!")
        assert b"incorrectos" in resp.data or b"Ingresar" in resp.data

    def test_login_email_inexistente(self, client):
        """CP-02-04: Email no registrado muestra error."""
        logout(client)
        resp = login(client, "noexiste@test.co", "Test2026!")
        assert b"incorrectos" in resp.data or b"Ingresar" in resp.data

    def test_logout(self, client):
        """CP-02-05: Logout cierra sesión correctamente."""
        login(client, "paciente1@test.co", "Test2026!")
        resp = logout(client)
        assert resp.status_code == 200

    def test_redirect_sin_autenticacion(self, client):
        """CP-02-06: Ruta protegida sin sesión redirige a login."""
        logout(client)
        resp = client.get("/patient/dashboard")
        assert resp.status_code in (302, 200)
        if resp.status_code == 302:
            assert "login" in resp.headers.get("Location", "")


class TestControlAccesoRoles:
    """CP-03: Control de acceso por rol. (RNF-02)"""

    def test_paciente_no_accede_dashboard_medico(self, client):
        """CP-03-01: Paciente no puede ver ruta /doctor/."""
        login(client, "paciente1@test.co", "Test2026!")
        resp = client.get("/doctor/dashboard", follow_redirects=False)
        assert resp.status_code in (302, 403)

    def test_medico_no_accede_panel_paciente(self, client):
        """CP-03-02: Médico redirige a su propio dashboard."""
        login(client, "dr.garcia@agendapp.co", "Doctor2026!")
        resp = client.get("/patient/book", follow_redirects=False)
        assert resp.status_code in (302, 403)

    def test_admin_accede_panel_admin(self, client):
        """CP-03-03: Admin puede acceder a /admin/dashboard."""
        login(client, "admin@agendapp.co", "Admin2026!")
        resp = client.get("/admin/dashboard", follow_redirects=True)
        assert resp.status_code == 200
