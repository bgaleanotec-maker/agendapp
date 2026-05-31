# AgendApp — Sistema de gestión de citas médicas

Plataforma web de agendamiento de citas médicas con pre-triaje asistido por IA
(motor de reglas), notificaciones por WhatsApp y panel administrativo.
Proyecto académico — **Plan de Pruebas de Software**, Corporación Universitaria
Iberoamericana, Ingeniería de Software.

## Stack

| Capa | Tecnología |
|---|---|
| Backend | Python 3.11 · Flask 3.0 |
| ORM | SQLAlchemy 2.0 / Flask-SQLAlchemy 3.1 |
| Auth | Flask-Login 0.6 |
| BD | SQLite (dev/test) · PostgreSQL (prod) |
| Frontend | Bootstrap 5.3 · FullCalendar · Chart.js |
| Notificaciones | Twilio WhatsApp · Flask-Mail |
| Servidor prod | Gunicorn |
| Pruebas | pytest 8.2 · pytest-flask |
| Despliegue | Render (Blueprint `render.yaml`) |

## Instalación local

```bash
python -m venv venv
venv\Scripts\activate           # Windows
# source venv/bin/activate       # Linux/Mac
pip install -r requirements.txt
python seed.py                   # crea BD SQLite + datos demo
python app.py                    # http://127.0.0.1:5000
```

## Pruebas

```bash
pytest tests/ -v                 # 31 pruebas
pytest tests/ --cov=. --cov-report=html
```

## Despliegue en Render

El repositorio incluye `render.yaml` (Infrastructure as Code). Al conectar el
repo como **Blueprint** en Render, se aprovisiona el servicio web + la base de
datos PostgreSQL. Al primer arranque la app crea las tablas y carga los datos
demo automáticamente (idempotente). Configurar manualmente en el dashboard las
variables marcadas `sync: false` (Twilio y correo) si se desean notificaciones.

## Usuarios demo

| Rol | Email | Contraseña |
|---|---|---|
| Admin | admin@agendapp.co | Admin2024! |
| Médicos (13) | dr.garcia@agendapp.co … | Doctor2024! |
| Pacientes (5) | maria@test.co … | Paciente2024! |

## Equipo

Elsa Sequeda Pacheco · Cristian Stiven Guerrero Andrade · Brayan Galeano Tobón
Docente: Rogelio Vásquez
