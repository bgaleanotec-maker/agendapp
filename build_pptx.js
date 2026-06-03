/* Presentación editable PowerPoint — Plan de Pruebas AgendApp
   Ejecutar: NODE_PATH=$(npm root -g) node build_pptx.js */
const pptxgen = require("pptxgenjs");
const p = new pptxgen();
p.layout = "LAYOUT_WIDE";           // 13.33 x 7.5"
p.author = "Equipo AgendApp";
p.title = "Plan de Pruebas — AgendApp";

const NAVY = "16243F", BLUE = "2E5496", TEAL = "1C7293", MINT = "19C3A3",
      INK = "1F2A3A", PANEL = "F1F5FC", MUTED = "6B7890", LINE = "D5DEEC",
      RED = "D9534F", AMBER = "E0A800", WHITE = "FFFFFF";
const SHOTS = "screenshots/";
const RATIO = { "01_landing.png": .641, "02_evidencias.png": 1.629, "03_login.png": .641,
  "04_paciente_dashboard.png": .641, "05_pretriaje.png": .884, "06_medico_dashboard.png": .641,
  "07_admin_dashboard.png": .684 };
const sh = () => ({ type: "outer", color: "16243F", blur: 9, offset: 3, angle: 135, opacity: 0.22 });

function title(s, txt) {
  s.addText(txt, { x: 0.6, y: 0.42, w: 9.9, h: 0.95, fontSize: 27, bold: true, color: NAVY, fontFace: "Georgia", valign: "middle" });
}
function badge(s, name) {
  s.addShape(p.shapes.ROUNDED_RECTANGLE, { x: 10.75, y: 0.45, w: 2.0, h: 0.5, rectRadius: 0.25, fill: { color: MINT } });
  s.addText(name, { x: 10.75, y: 0.45, w: 2.0, h: 0.5, fontSize: 13, bold: true, color: "06281F", align: "center", valign: "middle" });
}
function footer(s, n) {
  s.addText(`AgendApp · Plan de Pruebas`, { x: 0.6, y: 7.05, w: 7, h: 0.3, fontSize: 9, color: MUTED });
  s.addText(`${n} / 10`, { x: 11.8, y: 7.05, w: 1, h: 0.3, fontSize: 9, color: MUTED, align: "right" });
}
function placeImage(s, file, rx, ry, rw, rh) {
  const r = RATIO[file]; let w = rw, h = rw * r;
  if (h > rh) { h = rh; w = rh / r; }
  s.addImage({ path: SHOTS + file, x: rx + (rw - w) / 2, y: ry + (rh - h) / 2, w, h, rounding: false, shadow: sh(), altText: file });
}

// ── 1. PORTADA ──────────────────────────────────────────────────────────
let s = p.addSlide(); s.background = { color: NAVY };
s.addText("CORPORACIÓN UNIVERSITARIA IBEROAMERICANA · INGENIERÍA DE SOFTWARE",
  { x: 1, y: 1.5, w: 11.3, h: 0.4, fontSize: 13, color: "BCD3FF", align: "center", charSpacing: 2 });
s.addText("Diseño del Plan de Pruebas", { x: 1, y: 2.1, w: 11.3, h: 1.1, fontSize: 46, bold: true, color: WHITE, align: "center", fontFace: "Georgia" });
s.addText("AgendApp — Sistema web de agendamiento de citas médicas", { x: 1, y: 3.3, w: 11.3, h: 0.6, fontSize: 22, color: "DCE8FF", align: "center", italic: true });
s.addText([
  { text: "Elsa Sequeda Pacheco     ", options: {} },
  { text: "Cristian Stiven Guerrero Andrade     ", options: {} },
  { text: "Brayan Galeano Tobón", options: {} },
], { x: 1, y: 4.5, w: 11.3, h: 0.5, fontSize: 16, color: WHITE, align: "center" });
s.addText("Docente: Rogelio Vásquez  ·  Pruebas de Software y Aplicabilidad  ·  Junio 2026",
  { x: 1, y: 5.5, w: 11.3, h: 0.4, fontSize: 14, color: "CFE0FF", align: "center" });

// ── 2. ELSA · El proyecto ─────────────────────────────────────────────────
s = p.addSlide(); title(s, "El proyecto: AgendApp"); badge(s, "Elsa");
s.addText("Plataforma web para que consultorios y médicos independientes gestionen sus citas.",
  { x: 0.6, y: 1.6, w: 6.3, h: 0.9, fontSize: 18, color: INK, valign: "top" });
s.addText([
  { text: "El paciente agenda, cancela y recibe recordatorios.", options: { bullet: true, breakLine: true } },
  { text: "Pre-triaje de síntomas con un motor de reglas.", options: { bullet: true, breakLine: true } },
  { text: "El médico administra su agenda; el administrador supervisa.", options: { bullet: true } },
], { x: 0.6, y: 2.6, w: 6.3, h: 2.2, fontSize: 16, color: INK, paraSpaceAfter: 8 });
s.addShape(p.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 5.5, w: 6.0, h: 0.7, rectRadius: 0.1, fill: { color: PANEL } });
s.addText("Flask · SQLAlchemy · PostgreSQL · desplegado en Render", { x: 0.6, y: 5.5, w: 6.0, h: 0.7, fontSize: 15, bold: true, color: NAVY, align: "center", valign: "middle" });
placeImage(s, "01_landing.png", 7.2, 1.6, 5.5, 4.9); footer(s, 2);

// ── 3. ELSA · Objetivos y riesgos ─────────────────────────────────────────
s = p.addSlide(); title(s, "Objetivos y procesos críticos"); badge(s, "Elsa");
s.addText("¿Qué buscamos validar?", { x: 0.6, y: 1.55, w: 6.3, h: 0.4, fontSize: 18, bold: true, color: BLUE });
s.addText("Que el sistema cumpla los requerimientos y responda a las necesidades reales del consultorio.",
  { x: 0.6, y: 1.95, w: 6.3, h: 0.7, fontSize: 15, color: INK, valign: "top" });
s.addText("Lo que más nos preocupa probar", { x: 0.6, y: 2.8, w: 6.3, h: 0.4, fontSize: 18, bold: true, color: BLUE });
const risks = [["Autenticación y control de acceso", "Crítica", RED], ["Agendamiento y disponibilidad", "Crítica", RED],
  ["Regla de cancelación (24 h)", "Alta", AMBER], ["Motor de pre-triaje", "Alta", AMBER]];
risks.forEach((r, i) => {
  const y = 3.3 + i * 0.62;
  s.addShape(p.shapes.RECTANGLE, { x: 0.6, y, w: 0.08, h: 0.5, fill: { color: r[2] } });
  s.addShape(p.shapes.RECTANGLE, { x: 0.68, y, w: 6.22, h: 0.5, fill: { color: PANEL } });
  s.addText([{ text: r[0] + "  ·  ", options: {} }, { text: r[1], options: { bold: true, color: r[2] } }],
    { x: 0.85, y, w: 5.9, h: 0.5, fontSize: 14, color: INK, valign: "middle" });
});
s.addShape(p.shapes.RECTANGLE, { x: 7.4, y: 2.3, w: 0.1, h: 2.4, fill: { color: TEAL } });
s.addText("“Probar no es la última etapa: es un proceso que acompaña todo el desarrollo.”",
  { x: 7.7, y: 2.3, w: 5.0, h: 2.0, fontSize: 22, italic: true, color: NAVY, fontFace: "Georgia", valign: "top" });
s.addText("Enfoque basado en riesgos — SWEBOK (Bourque & Fairley, 2014).", { x: 7.7, y: 4.5, w: 5.0, h: 0.5, fontSize: 13, color: MUTED });
footer(s, 3);

// ── 4. CRISTIAN · Estrategia ──────────────────────────────────────────────
s = p.addSlide(); title(s, "Estrategia de pruebas"); badge(s, "Cristian");
const cards = [["V", "Modelo V", "Empareja cada fase de diseño con su prueba: verificación (construir bien) y validación (construir lo correcto)."],
  ["◎", "Basada en riesgos", "Más casos y técnicas de caja negra y blanca en los componentes críticos."],
  ["↻", "Automatizada", "pytest permite repetir toda la suite: red de seguridad para la regresión."]];
cards.forEach((c, i) => {
  const x = 0.6 + i * 4.15;
  s.addShape(p.shapes.ROUNDED_RECTANGLE, { x, y: 1.7, w: 3.85, h: 3.3, rectRadius: 0.12, fill: { color: WHITE }, line: { color: LINE, width: 1 }, shadow: sh() });
  s.addShape(p.shapes.OVAL, { x: x + 0.35, y: 2.05, w: 0.85, h: 0.85, fill: { color: TEAL } });
  s.addText(c[0], { x: x + 0.35, y: 2.05, w: 0.85, h: 0.85, fontSize: 24, bold: true, color: WHITE, align: "center", valign: "middle" });
  s.addText(c[1], { x: x + 0.3, y: 3.05, w: 3.25, h: 0.5, fontSize: 19, bold: true, color: NAVY });
  s.addText(c[2], { x: x + 0.3, y: 3.6, w: 3.25, h: 1.3, fontSize: 14, color: INK, valign: "top" });
});
s.addShape(p.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 5.4, w: 12.1, h: 1.0, rectRadius: 0.1, fill: { color: PANEL } });
s.addText("Independencia de la prueba: separamos quién implementa de quién prueba, y dejamos al docente como validador externo (Bourque & Fairley, 2014).",
  { x: 0.9, y: 5.4, w: 11.5, h: 1.0, fontSize: 15, color: NAVY, valign: "middle" });
footer(s, 4);

// ── 5. CRISTIAN · Metodología y técnicas ──────────────────────────────────
s = p.addSlide(); title(s, "Metodología y técnicas"); badge(s, "Cristian");
s.addText("Modelo V articulado con Scrum", { x: 0.6, y: 1.55, w: 6.0, h: 0.4, fontSize: 18, bold: true, color: BLUE });
s.addTable([
  [{ text: "Desarrollo", options: { fill: { color: NAVY }, color: WHITE, bold: true, align: "center" } },
   { text: "Nivel de prueba", options: { fill: { color: NAVY }, color: WHITE, bold: true, align: "center" } }],
  ["Requerimientos", "Aceptación"], ["Arquitectura", "Sistema"],
  ["Diseño detallado", "Integración"], ["Codificación", "Unitaria"],
], { x: 0.6, y: 2.05, w: 6.0, colW: [3.0, 3.0], rowH: 0.55, fontSize: 14, color: INK, border: { pt: 0.5, color: LINE }, valign: "middle", align: "center" });
s.addText("Técnicas de diseño de casos", { x: 7.0, y: 1.55, w: 5.7, h: 0.4, fontSize: 18, bold: true, color: BLUE });
s.addShape(p.shapes.ROUNDED_RECTANGLE, { x: 7.0, y: 2.05, w: 1.6, h: 0.4, rectRadius: 0.2, fill: { color: BLUE } });
s.addText("Caja negra", { x: 7.0, y: 2.05, w: 1.6, h: 0.4, fontSize: 12, bold: true, color: WHITE, align: "center", valign: "middle" });
s.addText([
  { text: "Partición de equivalencia", options: { bullet: true, breakLine: true } },
  { text: "Valores límite (regla de 24 h)", options: { bullet: true, breakLine: true } },
  { text: "Tabla de decisión (pre-triaje)", options: { bullet: true, breakLine: true } },
  { text: "Transición de estados (cita)", options: { bullet: true } },
], { x: 7.0, y: 2.55, w: 5.7, h: 1.7, fontSize: 14, color: INK, paraSpaceAfter: 6 });
s.addShape(p.shapes.ROUNDED_RECTANGLE, { x: 7.0, y: 4.4, w: 1.6, h: 0.4, rectRadius: 0.2, fill: { color: TEAL } });
s.addText("Caja blanca", { x: 7.0, y: 4.4, w: 1.6, h: 0.4, fontSize: 12, bold: true, color: WHITE, align: "center", valign: "middle" });
s.addText([{ text: "Cobertura de decisión / ramas en los decoradores de control de acceso.", options: { bullet: true } }],
  { x: 7.0, y: 4.9, w: 5.7, h: 1.0, fontSize: 14, color: INK });
footer(s, 5);

// ── 6. BRAYAN · Tipos y criterios ─────────────────────────────────────────
s = p.addSlide(); title(s, "Tipos de prueba y criterios de aceptación"); badge(s, "Brayan");
s.addText("Niveles aplicados", { x: 0.6, y: 1.55, w: 6.2, h: 0.4, fontSize: 18, bold: true, color: BLUE });
s.addText([
  { text: "Unitarias — motor de pre-triaje aislado", options: { bullet: true, breakLine: true } },
  { text: "Integración — rutas + ORM + base de datos", options: { bullet: true, breakLine: true } },
  { text: "Sistema — suite completa y rendimiento", options: { bullet: true, breakLine: true } },
  { text: "Aceptación — escenarios de usuario en producción", options: { bullet: true, breakLine: true } },
  { text: "Regresión — toda la suite tras cada cambio", options: { bullet: true } },
], { x: 0.6, y: 2.05, w: 6.2, h: 3.0, fontSize: 15, color: INK, paraSpaceAfter: 8 });
s.addText("Criterio global de aceptación", { x: 7.1, y: 1.55, w: 5.6, h: 0.4, fontSize: 18, bold: true, color: BLUE });
["100% de los casos críticos y altos en verde", "0 defectos críticos abiertos", "Meta de cobertura 80% en funciones críticas"].forEach((t, i) => {
  const y = 2.05 + i * 0.85;
  s.addShape(p.shapes.RECTANGLE, { x: 7.1, y, w: 0.09, h: 0.65, fill: { color: MINT } });
  s.addShape(p.shapes.RECTANGLE, { x: 7.19, y, w: 5.5, h: 0.65, fill: { color: "E6F7F1" } });
  s.addText(t, { x: 7.35, y, w: 5.2, h: 0.65, fontSize: 15, bold: true, color: "0D4B3C", valign: "middle" });
});
s.addText("El objetivo (la confianza) no es lo mismo que la métrica (% de cobertura).",
  { x: 7.1, y: 4.7, w: 5.6, h: 0.5, fontSize: 13, italic: true, color: MUTED });
footer(s, 6);

// ── 7. BRAYAN · Casos + pre-triaje ────────────────────────────────────────
s = p.addSlide(); title(s, "Diseño de casos · ejemplo del motor de IA"); badge(s, "Brayan");
s.addText([
  { text: "Diseñamos ", options: {} }, { text: "31 casos", options: { bold: true } },
  { text: " con técnicas explícitas. Ejemplo de ", options: {} }, { text: "tabla de decisión", options: { bold: true } },
  { text: ": cada nivel del pre-triaje tiene su caso.", options: {} },
], { x: 0.6, y: 1.7, w: 6.0, h: 1.2, fontSize: 17, color: INK, valign: "top" });
s.addText([
  { text: "Síntoma urgente → prioridad alta (rojo)", options: { bullet: true, breakLine: true } },
  { text: "Consulta de rutina → prioridad baja", options: { bullet: true, breakLine: true } },
  { text: "Texto vacío → nivel normal", options: { bullet: true } },
], { x: 0.6, y: 3.0, w: 6.0, h: 1.6, fontSize: 15, color: INK, paraSpaceAfter: 8 });
s.addText("CA-10 · test_prescreen_urgente · PASSED", { x: 0.6, y: 4.8, w: 6.0, h: 0.4, fontSize: 13, color: MUTED, fontFace: "Consolas" });
placeImage(s, "05_pretriaje.png", 6.9, 1.55, 5.8, 5.1); footer(s, 7);

// ── 8. BRAYAN · Evidencia ─────────────────────────────────────────────────
s = p.addSlide(); title(s, "Evidencia: pruebas que se ejecutan de verdad"); badge(s, "Brayan");
s.addText([{ text: "31", options: { fontSize: 80, bold: true, color: TEAL } }, { text: " / 31", options: { fontSize: 36, color: MUTED } }],
  { x: 0.6, y: 1.7, w: 6.0, h: 1.4, fontFace: "Georgia", valign: "middle" });
s.addText("pruebas superadas con pytest", { x: 0.6, y: 3.1, w: 6.0, h: 0.4, fontSize: 18, color: INK });
s.addText([
  { text: "15 de autenticación · 16 de citas, API y motor IA", options: { bullet: true, breakLine: true } },
  { text: "Página pública de evidencias dentro de la app", options: { bullet: true, breakLine: true } },
  { text: "github.com/bgaleanotec-maker/agendapp", options: { bullet: true } },
], { x: 0.6, y: 3.7, w: 6.0, h: 2.0, fontSize: 15, color: INK, paraSpaceAfter: 8 });
placeImage(s, "02_evidencias.png", 7.0, 1.55, 5.7, 5.1); footer(s, 8);

// ── 9. BRAYAN/Todos · Demo docente ────────────────────────────────────────
s = p.addSlide(); title(s, "Modo demo para validación del docente"); badge(s, "Brayan / Todos");
s.addText("El docente puede validar las pruebas sin instalar nada.", { x: 0.6, y: 1.6, w: 6.2, h: 0.5, fontSize: 17, color: INK });
const creds = [["Docente (admin)", "docente@agendapp.co · Demo2026!"], ["Médico", "dr.garcia@agendapp.co · Doctor2024!"], ["Paciente", "maria@test.co · Paciente2024!"]];
creds.forEach((c, i) => {
  const y = 2.3 + i * 0.85;
  s.addShape(p.shapes.ROUNDED_RECTANGLE, { x: 0.6, y, w: 6.2, h: 0.7, rectRadius: 0.08, fill: { color: WHITE }, line: { color: LINE, width: 1 } });
  s.addText(c[0], { x: 0.8, y, w: 2.0, h: 0.7, fontSize: 14, bold: true, color: NAVY, valign: "middle" });
  s.addText(c[1], { x: 2.7, y, w: 4.0, h: 0.7, fontSize: 13, color: TEAL, fontFace: "Consolas", valign: "middle" });
});
s.addShape(p.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 5.05, w: 6.2, h: 0.6, rectRadius: 0.08, fill: { color: PANEL } });
s.addText("agendapp-rde9.onrender.com/evidencias", { x: 0.6, y: 5.05, w: 6.2, h: 0.6, fontSize: 14, bold: true, color: NAVY, align: "center", valign: "middle" });
placeImage(s, "07_admin_dashboard.png", 7.0, 1.6, 5.7, 5.0); footer(s, 9);

// ── 10. CIERRE ────────────────────────────────────────────────────────────
s = p.addSlide(); s.background = { color: NAVY };
s.addText("De la intuición a la justificación", { x: 1, y: 2.2, w: 11.3, h: 1.0, fontSize: 40, bold: true, color: WHITE, align: "center", fontFace: "Georgia" });
s.addText("Un plan de pruebas fundamentado en SWEBOK y la literatura, integrado al desarrollo desde el primer sprint — y verificable en un sistema real.",
  { x: 1.6, y: 3.4, w: 10.1, h: 1.0, fontSize: 18, color: "EAF2FF", align: "center" });
s.addText("Elsa Sequeda  ·  Cristian Guerrero  ·  Brayan Galeano", { x: 1, y: 4.7, w: 11.3, h: 0.5, fontSize: 16, color: "CFE0FF", align: "center" });
s.addText("¡Gracias!", { x: 1, y: 5.4, w: 11.3, h: 0.6, fontSize: 24, bold: true, color: MINT, align: "center" });

p.writeFile({ fileName: "presentacion_agendapp.pptx" }).then(f => console.log("OK pptx:", f));
