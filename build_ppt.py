# -*- coding: utf-8 -*-
"""Genera presentacion.html: deck tipo PPT (16:9) con transiciones y pantallazos."""
import base64, os

HERE = os.path.dirname(os.path.abspath(__file__))
SHOTS = os.path.join(HERE, "screenshots")

def b64(name):
    with open(os.path.join(SHOTS, name), "rb") as f:
        return "data:image/png;base64," + base64.b64encode(f.read()).decode()

IMG = {n: b64(n) for n in os.listdir(SHOTS) if n.endswith(".png")}

# (badge, clase, html_interno)
def slide(inner, cls="", badge=None):
    b = f'<div class="badge">{badge}</div>' if badge else ""
    return f'<section class="slide {cls}">{b}{inner}</section>'

slides = []

# 1. Portada
slides.append(slide(f"""
  <div class="center">
    <div class="kicker">CORPORACIÓN UNIVERSITARIA IBEROAMERICANA · INGENIERÍA DE SOFTWARE</div>
    <h1>Diseño del Plan de Pruebas</h1>
    <h2 class="sub">AgendApp — Sistema web de agendamiento de citas médicas</h2>
    <div class="team">
      <span>Elsa Sequeda Pacheco</span><span>Cristian Stiven Guerrero Andrade</span><span>Brayan Galeano Tobón</span>
    </div>
    <div class="docente">Docente: Rogelio Vásquez · Pruebas de Software · Junio 2026</div>
  </div>
""", cls="dark title"))

# 2. ELSA - Proyecto
slides.append(slide(f"""
  <h2>El proyecto: AgendApp</h2>
  <div class="cols">
    <div class="col">
      <p class="lead">Plataforma web para que consultorios y médicos independientes gestionen sus citas.</p>
      <ul class="check">
        <li>El paciente agenda, cancela y recibe recordatorios.</li>
        <li>Pre-triaje de síntomas asistido por un motor de reglas.</li>
        <li>El médico administra su agenda; el administrador supervisa.</li>
      </ul>
      <div class="stack">Flask · SQLAlchemy · PostgreSQL · desplegado en Render</div>
    </div>
    <div class="col"><img class="shot" src="{IMG['01_landing.png']}"/></div>
  </div>
""", badge="Elsa"))

# 3. ELSA - Objetivos y aspectos criticos
slides.append(slide(f"""
  <h2>Objetivos y procesos críticos</h2>
  <div class="cols">
    <div class="col">
      <h3>¿Qué buscamos validar?</h3>
      <p>Que el sistema cumpla los requerimientos y responda a las necesidades reales del consultorio.</p>
      <h3>Lo que más nos preocupa probar</h3>
      <div class="risk r1">Autenticación y control de acceso · <b>Crítica</b></div>
      <div class="risk r1">Agendamiento y disponibilidad · <b>Crítica</b></div>
      <div class="risk r2">Regla de cancelación (24 h) · <b>Alta</b></div>
      <div class="risk r2">Motor de pre-triaje · <b>Alta</b></div>
    </div>
    <div class="col">
      <div class="quote">“Probar no es la última etapa: es un proceso que acompaña todo el desarrollo.”</div>
      <p class="src">Enfoque basado en riesgos — SWEBOK (Bourque &amp; Fairley, 2014)</p>
    </div>
  </div>
""", badge="Elsa"))

# 4. CRISTIAN - Estrategia
slides.append(slide(f"""
  <h2>Estrategia de pruebas</h2>
  <div class="three">
    <div class="card"><div class="num">V</div><h3>Modelo V</h3><p>Empareja cada fase de diseño con su prueba. Verificación (construir bien) y validación (construir lo correcto).</p></div>
    <div class="card"><div class="num">◎</div><h3>Basada en riesgos</h3><p>Más casos y técnicas de caja negra y blanca en los componentes críticos.</p></div>
    <div class="card"><div class="num">↻</div><h3>Automatizada</h3><p>pytest permite repetir toda la suite: red de seguridad para la regresión.</p></div>
  </div>
  <div class="note">Independencia de la prueba: separamos quién implementa de quién prueba, y dejamos al docente como validador externo (Bourque &amp; Fairley, 2014).</div>
""", badge="Cristian"))

# 5. CRISTIAN - Metodologia + tecnicas
slides.append(slide(f"""
  <h2>Metodología y técnicas</h2>
  <div class="cols">
    <div class="col">
      <h3>Modelo V articulado con Scrum</h3>
      <table class="vtable">
        <tr><th>Desarrollo</th><th>Prueba</th></tr>
        <tr><td>Requerimientos</td><td>Aceptación</td></tr>
        <tr><td>Arquitectura</td><td>Sistema</td></tr>
        <tr><td>Diseño detallado</td><td>Integración</td></tr>
        <tr><td>Codificación</td><td>Unitaria</td></tr>
      </table>
    </div>
    <div class="col">
      <h3>Técnicas de diseño de casos</h3>
      <p class="tag">Caja negra</p>
      <ul class="check sm"><li>Partición de equivalencia</li><li>Valores límite (regla de 24 h)</li><li>Tabla de decisión (pre-triaje)</li><li>Transición de estados (cita)</li></ul>
      <p class="tag">Caja blanca</p>
      <ul class="check sm"><li>Cobertura de decisión / ramas en los decoradores de acceso</li></ul>
    </div>
  </div>
""", badge="Cristian"))

# 6. BRAYAN - Tipos y criterios
slides.append(slide(f"""
  <h2>Tipos de prueba y criterios de aceptación</h2>
  <div class="cols">
    <div class="col">
      <h3>Niveles aplicados</h3>
      <ul class="check sm">
        <li><b>Unitarias</b> — motor de pre-triaje aislado</li>
        <li><b>Integración</b> — rutas + ORM + base de datos</li>
        <li><b>Sistema</b> — suite completa y rendimiento</li>
        <li><b>Aceptación</b> — escenarios de usuario en producción</li>
        <li><b>Regresión</b> — toda la suite tras cada cambio</li>
      </ul>
    </div>
    <div class="col">
      <h3>Criterio global</h3>
      <div class="crit">100% de los casos críticos y altos en verde</div>
      <div class="crit">0 defectos críticos abiertos</div>
      <div class="crit">Meta de cobertura 80% en funciones críticas</div>
      <p class="src">El objetivo (confianza) no es la métrica (% de cobertura).</p>
    </div>
  </div>
""", badge="Brayan"))

# 7. BRAYAN - Casos + pretriaje
slides.append(slide(f"""
  <h2>Diseño de casos · ejemplo del motor de IA</h2>
  <div class="cols">
    <div class="col narrow">
      <p>Diseñamos <b>31 casos</b> con técnicas explícitas. Ejemplo de <b>tabla de decisión</b>: cada nivel del pre-triaje tiene su caso.</p>
      <ul class="check sm">
        <li>Síntoma urgente → prioridad alta (rojo)</li>
        <li>Consulta de rutina → prioridad baja</li>
        <li>Texto vacío → nivel normal</li>
      </ul>
      <p class="src">CA-10 · test_prescreen_urgente · PASSED</p>
    </div>
    <div class="col"><img class="shot" src="{IMG['05_pretriaje.png']}"/></div>
  </div>
""", badge="Brayan"))

# 8. BRAYAN - Evidencia pytest + evidencias page
slides.append(slide(f"""
  <h2>Evidencia: pruebas que se ejecutan de verdad</h2>
  <div class="cols">
    <div class="col">
      <div class="big">31<span>/31</span></div>
      <div class="biglabel">pruebas superadas con <code>pytest</code></div>
      <ul class="check sm">
        <li>15 de autenticación · 16 de citas, API y motor IA</li>
        <li>Página pública de evidencias dentro de la app</li>
        <li>Repositorio: github.com/bgaleanotec-maker/agendapp</li>
      </ul>
    </div>
    <div class="col"><img class="shot tall" src="{IMG['02_evidencias.png']}"/></div>
  </div>
""", badge="Brayan"))

# 9. Demo docente
slides.append(slide(f"""
  <h2>Modo demo para validación del docente</h2>
  <div class="cols">
    <div class="col">
      <p class="lead">El docente puede validar las pruebas sin instalar nada.</p>
      <div class="cred"><span>Docente (admin)</span><code>docente@agendapp.co · Demo2026!</code></div>
      <div class="cred"><span>Médico</span><code>dr.garcia@agendapp.co · Doctor2024!</code></div>
      <div class="cred"><span>Paciente</span><code>maria@test.co · Paciente2024!</code></div>
      <div class="stack">agendapp-rde9.onrender.com/evidencias</div>
    </div>
    <div class="col"><img class="shot" src="{IMG['07_admin_dashboard.png']}"/></div>
  </div>
""", badge="Brayan / Todos"))

# 10. Cierre
slides.append(slide(f"""
  <div class="center">
    <h1 class="closing">De la intuición a la justificación</h1>
    <p class="lead light">Un plan de pruebas fundamentado en SWEBOK y la literatura, integrado al desarrollo desde el primer sprint — y verificable en un sistema real.</p>
    <div class="team"><span>Elsa Sequeda</span><span>Cristian Guerrero</span><span>Brayan Galeano</span></div>
    <div class="docente">¡Gracias!</div>
  </div>
""", cls="dark"))

TOTAL = len(slides)
html = f"""<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Plan de Pruebas — AgendApp</title>
<style>
:root{{--navy:#16243f;--blue:#2e5496;--teal:#1c7293;--mint:#19c3a3;--ink:#1f2a3a;--muted:#6b7890;--bg:#f4f7fc;}}
*{{box-sizing:border-box;margin:0;padding:0;}}
html,body{{height:100%;background:#0b1220;font-family:'Segoe UI',Calibri,Arial,sans-serif;color:var(--ink);}}
#deck{{position:absolute;width:1280px;height:720px;left:50%;top:50%;transform:translate(-50%,-50%);transform-origin:center center;}}
.slide{{position:absolute;inset:0;width:1280px;height:720px;background:var(--bg);padding:64px 72px;opacity:0;transform:translateX(40px) scale(.98);transition:opacity .5s ease,transform .5s ease;pointer-events:none;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.5);border-radius:6px;}}
.slide.active{{opacity:1;transform:none;pointer-events:auto;}}
.slide.dark{{background:linear-gradient(135deg,#16243f 0%,#1c7293 130%);color:#fff;}}
h1{{font-family:Georgia,'Times New Roman',serif;font-size:60px;line-height:1.05;color:#fff;letter-spacing:-.5px;}}
.slide:not(.dark) h2{{font-family:Georgia,serif;font-size:40px;color:var(--navy);margin-bottom:26px;}}
h3{{font-size:23px;color:var(--blue);margin:14px 0 8px;}}
.dark h3{{color:#cfe3ff;}}
p,li{{font-size:21px;line-height:1.5;color:var(--ink);}}
.lead{{font-size:24px;margin-bottom:14px;}}
.light{{color:#eaf2ff;}}
.kicker{{letter-spacing:3px;font-size:15px;color:#bcd3ff;margin-bottom:22px;}}
.sub{{font-size:26px;color:#dce8ff;font-weight:400;margin-top:14px;}}
.center{{height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;}}
.team{{display:flex;gap:18px;margin-top:40px;flex-wrap:wrap;justify-content:center;}}
.team span{{background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.25);padding:9px 16px;border-radius:999px;font-size:18px;color:#fff;}}
.docente{{margin-top:30px;color:#cfe0ff;font-size:18px;}}
.badge{{position:absolute;top:26px;right:30px;background:var(--mint);color:#06281f;font-weight:700;font-size:15px;padding:7px 16px;border-radius:999px;letter-spacing:.5px;}}
.cols{{display:flex;gap:40px;height:calc(100% - 90px);}}
.col{{flex:1;display:flex;flex-direction:column;justify-content:center;}}
.col.narrow{{flex:.85;}}
.shot{{width:100%;border-radius:10px;border:1px solid #d2dcea;box-shadow:0 12px 30px rgba(20,40,80,.22);max-height:520px;object-fit:cover;object-position:top;}}
.shot.tall{{max-height:540px;}}
ul.check{{list-style:none;margin:8px 0;}}
ul.check li{{position:relative;padding-left:30px;margin:9px 0;}}
ul.check li::before{{content:'✓';position:absolute;left:0;color:var(--mint);font-weight:700;}}
ul.sm li{{font-size:19px;margin:7px 0;}}
.stack{{margin-top:18px;background:#e7eefb;color:var(--navy);font-weight:600;padding:11px 16px;border-radius:8px;font-size:18px;display:inline-block;}}
.risk{{padding:11px 16px;border-radius:8px;margin:9px 0;font-size:19px;}}
.risk.r1{{background:#fde8e8;border-left:5px solid #d9534f;}}
.risk.r2{{background:#fff4e0;border-left:5px solid #e0a800;}}
.quote{{font-family:Georgia,serif;font-style:italic;font-size:27px;color:var(--navy);line-height:1.4;border-left:5px solid var(--teal);padding-left:22px;}}
.src{{color:var(--muted);font-size:16px;margin-top:12px;}}
.three{{display:flex;gap:26px;margin-top:8px;}}
.card{{flex:1;background:#fff;border:1px solid #dde6f2;border-radius:14px;padding:24px 22px;box-shadow:0 8px 22px rgba(20,40,80,.08);}}
.card .num{{width:54px;height:54px;border-radius:50%;background:var(--teal);color:#fff;font-size:26px;font-weight:700;display:flex;align-items:center;justify-content:center;margin-bottom:14px;}}
.note{{margin-top:30px;background:#eef4ff;border-radius:10px;padding:16px 20px;font-size:19px;color:var(--navy);}}
table.vtable{{width:100%;border-collapse:collapse;margin-top:6px;}}
table.vtable th{{background:var(--navy);color:#fff;padding:9px;font-size:18px;}}
table.vtable td{{border:1px solid #d4deec;padding:9px 12px;font-size:19px;background:#fff;}}
.tag{{display:inline-block;background:var(--blue);color:#fff;padding:5px 14px;border-radius:6px;font-size:16px;margin:14px 0 4px;}}
.crit{{background:#e6f7f1;border-left:5px solid var(--mint);padding:12px 16px;border-radius:8px;margin:10px 0;font-size:20px;font-weight:600;color:#0d4b3c;}}
.big{{font-size:120px;font-weight:800;color:var(--teal);line-height:1;font-family:Georgia,serif;}}
.big span{{font-size:54px;color:var(--muted);}}
.biglabel{{font-size:22px;margin:6px 0 14px;}}
.cred{{display:flex;justify-content:space-between;align-items:center;gap:14px;background:#fff;border:1px solid #dde6f2;border-radius:10px;padding:12px 16px;margin:10px 0;}}
.cred span{{font-weight:700;color:var(--navy);font-size:18px;}}
code{{font-family:Consolas,monospace;background:#0e1b33;color:#9fe7d4;padding:4px 10px;border-radius:6px;font-size:16px;}}
.closing{{font-size:54px;}}
.progress{{position:fixed;bottom:18px;left:50%;transform:translateX(-50%);color:#7e90b0;font-size:14px;z-index:10;}}
.hint{{position:fixed;bottom:18px;right:24px;color:#5f7095;font-size:13px;z-index:10;}}
</style></head>
<body>
<div id="deck">
{''.join(slides)}
</div>
<div class="progress"><span id="cur">1</span> / {TOTAL}</div>
<div class="hint">← →  ·  espacio  ·  F pantalla completa</div>
<script>
let i=0;const s=[...document.querySelectorAll('.slide')];
function show(n){{i=Math.max(0,Math.min(s.length-1,n));s.forEach((el,k)=>el.classList.toggle('active',k===i));document.getElementById('cur').textContent=i+1;}}
document.addEventListener('keydown',e=>{{
  if(['ArrowRight',' ','PageDown'].includes(e.key)){{e.preventDefault();show(i+1);}}
  else if(['ArrowLeft','PageUp'].includes(e.key)){{show(i-1);}}
  else if(e.key==='Home'){{show(0);}} else if(e.key==='End'){{show(s.length-1);}}
  else if(e.key.toLowerCase()==='f'){{if(!document.fullscreenElement)document.documentElement.requestFullscreen();else document.exitFullscreen();}}
}});
document.addEventListener('click',e=>{{if(e.clientX>window.innerWidth*0.5)show(i+1);else show(i-1);}});
function fit(){{const d=document.getElementById('deck');const sc=Math.min(window.innerWidth/1280,window.innerHeight/720);d.style.transform='translate(-50%,-50%) scale('+sc+')';}}
window.addEventListener('resize',fit);fit();show(0);
</script>
</body></html>"""

out = os.path.join(HERE, "presentacion.html")
with open(out, "w", encoding="utf-8") as f:
    f.write(html)
print("OK", out, len(html), "chars,", TOTAL, "slides")
