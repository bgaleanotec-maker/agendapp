"""Captura pantallazos de AgendApp con Playwright para la presentacion."""
import os
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:5055"
OUT = os.path.join(os.path.dirname(__file__), "screenshots")
os.makedirs(OUT, exist_ok=True)

def shot(page, name, full=False):
    path = os.path.join(OUT, name)
    page.screenshot(path=path, full_page=full)
    print("OK", name)

def login(page, email, pwd):
    page.goto(f"{BASE}/logout")
    page.goto(f"{BASE}/login")
    page.fill('input[name="email"]', email)
    page.fill('input[name="password"]', pwd)
    page.click('button[type="submit"]')
    page.wait_for_load_state("networkidle")

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1280, "height": 820})

    # 1. Landing
    pg.goto(BASE); pg.wait_for_load_state("networkidle")
    shot(pg, "01_landing.png")

    # 2. Evidencias (pagina completa)
    pg.goto(f"{BASE}/evidencias"); pg.wait_for_load_state("networkidle")
    shot(pg, "02_evidencias.png", full=True)

    # 3. Login
    pg.goto(f"{BASE}/login"); pg.wait_for_load_state("networkidle")
    shot(pg, "03_login.png")

    # 4. Paciente - dashboard
    login(pg, "maria@test.co", "Paciente2024!")
    shot(pg, "04_paciente_dashboard.png")

    # 5. Pre-triaje IA
    pg.goto(f"{BASE}/patient/book"); pg.wait_for_load_state("networkidle")
    try:
        pg.fill("#symptomInput", "Tengo dolor pecho fuerte y dificultad respirar desde hace una hora")
        pg.click("#btnPrescreen")
        pg.wait_for_timeout(2500)
    except Exception as e:
        print("pretriaje warn:", e)
    shot(pg, "05_pretriaje.png", full=True)

    # 6. Medico - dashboard
    login(pg, "dr.garcia@agendapp.co", "Doctor2024!")
    shot(pg, "06_medico_dashboard.png")

    # 7. Admin/Docente - dashboard con graficas
    login(pg, "docente@agendapp.co", "Demo2026!")
    pg.wait_for_timeout(2000)  # dar tiempo a Chart.js
    shot(pg, "07_admin_dashboard.png", full=True)

    b.close()
print("LISTO")
