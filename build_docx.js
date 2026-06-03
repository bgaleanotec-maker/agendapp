/* Informe: Diseño del Plan de Pruebas — AgendApp (Actividad 5)
   Redacción en voz de los integrantes, fundamentada en SWEBOK y literatura de testing.
   APA 7 (IBERO). Ejecutar:  NODE_PATH=$(npm root -g) node build_docx.js  */
const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun,
  Header, Footer, AlignmentType, LevelFormat, TableOfContents, HeadingLevel,
  BorderStyle, WidthType, ShadingType, VerticalAlign, PageNumber, PageBreak,
} = require("docx");

const NAVY = "1F3864", BLUE = "2E5496", LIGHT = "DCE6F4", ZEBRA = "F4F7FC",
      GREY = "5A5A5A", LINE = "B8C2D0";
const CW = 9360;

const T = (text, o = {}) => new TextRun({ text, font: "Times New Roman", size: 24, ...o });
const P = (children, o = {}) => new Paragraph({ spacing: { line: 360, after: 140 }, alignment: AlignmentType.JUSTIFIED, children: Array.isArray(children) ? children : [children], ...o });
const body = (text, o = {}) => P([T(text)], o);
// prosa con citas: pasar array de runs
const prosa = (runs, o = {}) => P(runs, o);
const H1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [T(t, { bold: true, color: NAVY, size: 30 })] });
const H2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [T(t, { bold: true, color: BLUE, size: 26 })] });
const H3 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_3, children: [T(t, { bold: true, color: BLUE, size: 24 })] });
const bullet = (runs, lvl = 0) => new Paragraph({ numbering: { reference: "vinetas", level: lvl }, spacing: { line: 320, after: 70 }, alignment: AlignmentType.JUSTIFIED, children: Array.isArray(runs) ? runs : [T(runs)] });
const numItem = (runs) => new Paragraph({ numbering: { reference: "numerada", level: 0 }, spacing: { line: 320, after: 70 }, alignment: AlignmentType.JUSTIFIED, children: Array.isArray(runs) ? runs : [T(runs)] });
const cita = (texto, autor) => [T(texto), T(` (${autor})`, {})];

const border = { style: BorderStyle.SINGLE, size: 1, color: LINE };
const borders = { top: border, bottom: border, left: border, right: border };
const cell = (content, { w, head = false, fill, bold = false, align = AlignmentType.LEFT } = {}) =>
  new TableCell({ borders, width: { size: w, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER,
    shading: { fill: fill || (head ? NAVY : "FFFFFF"), type: ShadingType.CLEAR },
    margins: { top: 60, bottom: 60, left: 110, right: 110 },
    children: (Array.isArray(content) ? content : [content]).map(txt =>
      new Paragraph({ alignment: align, spacing: { line: 264, after: 0 },
        children: [typeof txt === "string" ? T(txt, { bold: head || bold, color: head ? "FFFFFF" : "000000", size: head ? 21 : 21 }) : txt] })) });
const table = (widths, header, rows) => new Table({ width: { size: CW, type: WidthType.DXA }, columnWidths: widths,
  rows: [ new TableRow({ tableHeader: true, children: header.map((h, i) => cell(h, { w: widths[i], head: true, align: AlignmentType.CENTER })) }),
    ...rows.map((r, ri) => new TableRow({ children: r.map((c, i) => cell(c, { w: widths[i], fill: ri % 2 ? ZEBRA : "FFFFFF" })) })) ] });
const spacer = (a = 60) => new Paragraph({ spacing: { after: a }, children: [T("")] });

// Ficha tipo taller (clave/valor)
const ficha = (titulo, filas) => {
  const W1 = 2300, W2 = CW - W1;
  const rows = [ new TableRow({ tableHeader: true, children: [ new TableCell({ borders, width: { size: CW, type: WidthType.DXA }, columnSpan: 2, shading: { fill: NAVY, type: ShadingType.CLEAR }, margins: { top: 70, bottom: 70, left: 110, right: 110 }, children: [new Paragraph({ children: [T(titulo, { bold: true, color: "FFFFFF", size: 22 })] })] }) ] }) ];
  filas.forEach(([k, v], i) => rows.push(new TableRow({ children: [
    cell(k, { w: W1, fill: LIGHT, bold: true }), cell(v, { w: W2, fill: i % 2 ? ZEBRA : "FFFFFF" }) ] })));
  return new Table({ width: { size: CW, type: WidthType.DXA }, columnWidths: [W1, W2], rows });
};

// Imagen + pie
const img = (file, caption) => {
  const ratios = { "01_landing.png": 0.641, "02_evidencias.png": 1.629, "03_login.png": 0.641, "04_paciente_dashboard.png": 0.641, "05_pretriaje.png": 0.884, "06_medico_dashboard.png": 0.641, "07_admin_dashboard.png": 0.684 };
  const r = ratios[file] || 0.66;
  const w = Math.min(560, Math.round(600 / r)), h = Math.round(w * r);
  return [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 40 }, children: [
      new ImageRun({ type: "png", data: fs.readFileSync("screenshots/" + file), transformation: { width: w, height: h },
        altText: { title: caption, description: caption, name: file } }) ] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 180 }, children: [T(caption, { italics: true, size: 20, color: GREY })] }),
  ];
};
const code = (text, last = false) => new Paragraph({ shading: { fill: "1E1E1E", type: ShadingType.CLEAR }, spacing: { line: 240, after: last ? 140 : 0 }, children: [new TextRun({ text, font: "Consolas", size: 17, color: "D4D4D4" })] });
const okLine = (text) => new Paragraph({ shading: { fill: "1E1E1E", type: ShadingType.CLEAR }, spacing: { line: 240, after: 0 }, children: [ new TextRun({ text, font: "Consolas", size: 16, color: "D4D4D4" }), new TextRun({ text: "  PASSED", font: "Consolas", size: 16, color: "4EC9B0", bold: true }) ] });

const center = (text, o = {}) => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { line: 360, after: 40 }, children: [T(text, o)] });
const blank = (n = 1) => Array.from({ length: n }, () => new Paragraph({ children: [T("")] }));

// ── PORTADA ──────────────────────────────────────────────────────────────
const portada = [
  ...blank(2),
  center("Diseño del Plan de Pruebas de Software", { bold: true, size: 38, color: NAVY }),
  center("AgendApp — Sistema web de agendamiento de citas médicas", { italics: true, size: 26 }),
  center("Actividad 5 · Estrategia de Aprendizaje 2", { size: 24 }),
  ...blank(4),
  center("Presentado por:", { bold: true, size: 24 }),
  center("Elsa Sequeda Pacheco", { size: 24 }),
  center("Cristian Stiven Guerrero Andrade", { size: 24 }),
  center("Brayan Galeano Tobón", { size: 24 }),
  ...blank(3),
  center("Facultad de Ingeniería · Corporación Universitaria Iberoamericana", { size: 24 }),
  center("Ingeniería de Software · Pruebas de Software y Aplicabilidad", { size: 24 }),
  ...blank(2),
  center("Docente: Rogelio Vásquez", { size: 24 }),
  ...blank(2),
  center("Bogotá D.C., junio de 2026", { size: 24 }),
  new Paragraph({ children: [new PageBreak()] }),
];

const toc = [
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [T("Tabla de Contenido", { bold: true, size: 28, color: NAVY })] }),
  new TableOfContents("Tabla de Contenido", { hyperlink: true, headingStyleRange: "1-3" }),
  new Paragraph({ children: [new PageBreak()] }),
];

const content = [];
const add = (...e) => e.forEach(x => content.push(x));

// 1. INTRODUCCIÓN
add(H1("1. Introducción"));
add(prosa([T("Con esta actividad damos un paso más en el trabajo que venimos desarrollando a lo largo del módulo. En la Actividad 4 preparamos el proyecto: definimos AgendApp, levantamos sus requerimientos y esbozamos una primera estrategia de pruebas. Ahora nos corresponde aterrizar ese marco en un plan de pruebas concreto, es decir, decidir "), T("cómo", { italics: true }), T(" vamos a verificar y validar el sistema, con qué técnicas y bajo qué criterios.")]));
add(prosa([T("Partimos de una idea que la literatura repite con insistencia: probar no es una etapa que se añade al final, sino un proceso que acompaña todo el desarrollo. La "), T("Guía SWEBOK", { italics: true }), T(" describe la prueba de software como la ejecución dinámica del programa con un conjunto finito de casos cuidadosamente seleccionados, con el doble propósito de detectar defectos y de generar confianza en el producto (Bourque & Fairley, 2014). Esa definición nos sirvió de brújula para no confundir el plan con una simple lista de pruebas: lo que buscamos es justificar cada decisión.")]));
add(prosa([T("A lo largo del informe describimos el proyecto, recordamos sus objetivos y requerimientos, señalamos los puntos que consideramos críticos y, sobre esa base, explicamos la estrategia, la metodología, los tipos de prueba, los criterios de aceptación, el diseño de los casos y la forma en que planificamos su ejecución. Conviene aclarar que AgendApp no se quedó en el papel: el sistema está implementado y desplegado en línea, y las pruebas que mencionamos están automatizadas y se ejecutan de verdad, de modo que el docente puede comprobarlas por su cuenta.")]));

// 2. OBJETIVOS
add(H1("2. Objetivos"));
add(H2("2.1 Objetivo general"));
add(body("Diseñar el plan de pruebas de AgendApp, definiendo de manera justificada la estrategia, la metodología, los tipos de prueba, los criterios de aceptación, los casos de prueba y su planificación, con el fin de verificar el cumplimiento de los requerimientos funcionales y no funcionales y validar que el sistema responde a las necesidades de un consultorio médico."));
add(H2("2.2 Objetivos específicos"));
add(bullet("Analizar el proyecto y recuperar sus objetivos, requerimientos y metodología de desarrollo como insumo del plan."));
add(bullet("Identificar, mediante un enfoque basado en riesgos, los componentes y procesos críticos que concentrarán el esfuerzo de prueba."));
add(bullet([T("Seleccionar y justificar la estrategia y la metodología de pruebas (Modelo V articulado con Scrum), apoyándonos en SWEBOK y en la literatura de referencia.")]));
add(bullet("Definir los tipos de prueba, los criterios de aceptación por grupo y las técnicas de diseño de casos que aplicaremos."));
add(bullet("Documentar el procedimiento de ejecución y la planificación general, dejando evidencia verificable de los resultados."));

// 3. DESCRIPCIÓN DEL PROYECTO
add(H1("3. Descripción del Proyecto de Software"));
add(prosa([T("AgendApp es una aplicación web pensada para consultorios pequeños y médicos independientes que quieren ordenar la gestión de sus citas. El paciente puede registrarse, consultar la disponibilidad en tiempo real, hacer un pre-triaje de sus síntomas, agendar y, si lo necesita, cancelar o reprogramar con la debida antelación; el médico administra su agenda y el estado de cada cita; y el administrador supervisa la operación. Como anticipamos en la Actividad 4, el desarrollo se apoya en Python del lado del servidor y en una interfaz web responsive.")]));
add(prosa([T("Respecto de aquel primer documento, el sistema evolucionó en la implementación. El backend se construyó con Flask y el acceso a datos con el ORM SQLAlchemy; en lugar de MySQL terminamos usando SQLite para el entorno de desarrollo y pruebas y PostgreSQL en producción, una decisión que simplificó el despliegue en la nube sin cambiar el modelo de datos. La aplicación está publicada en Render y su código se versiona en un repositorio público, lo que nos permitió probar tanto en local como sobre el sistema real en funcionamiento.")]));
add(spacer());
add(table([2500, 6860], ["Elemento", "Detalle"], [
  ["Producto", "AgendApp — Sistema de gestión de citas médicas"],
  ["Tipo", "Aplicación web cliente-servidor, responsive"],
  ["Repositorio", "github.com/bgaleanotec-maker/agendapp"],
  ["Despliegue", "agendapp-rde9.onrender.com (Render · Gunicorn · PostgreSQL)"],
  ["Roles", "Paciente · Médico · Administrador (+ cuenta demo para el docente)"],
  ["Componente distintivo", "Motor de pre-triaje de síntomas por reglas"],
]));
add(H2("3.1 Arquitectura y tecnologías"));
add(prosa([T("La aplicación sigue una organización en tres capas —presentación, lógica de negocio y persistencia— bajo el patrón Modelo-Vista-Controlador propio de Flask. Esta separación no es un detalle estético: nos facilitó probar la lógica de forma aislada de la interfaz, algo que aprovechamos en las pruebas unitarias del motor de pre-triaje.")]));
add(spacer());
add(table([3120, 6240], ["Capa / Componente", "Tecnología"], [
  ["Lenguaje y framework", "Python 3.11 · Flask 3.0"],
  ["Persistencia", "SQLAlchemy 2.0 · SQLite (dev/test) / PostgreSQL (prod)"],
  ["Autenticación y roles", "Flask-Login (sesiones y control de acceso)"],
  ["Interfaz", "Bootstrap 5.3 · FullCalendar · Chart.js"],
  ["Notificaciones", "Twilio (WhatsApp) · Flask-Mail (correo)"],
  ["Pruebas", "pytest 8.2 · pytest-flask"],
  ["Despliegue", "Render (Blueprint render.yaml) · Gunicorn"],
]));

// 4. OBJETIVOS DEL PROYECTO DE SOFTWARE
add(H1("4. Objetivos del Proyecto de Software"));
add(body("Para no perder de vista qué debe lograr el producto —y por tanto qué tenemos que validar—, retomamos los objetivos planteados en la Actividad 4 y los presentamos junto al resultado que esperamos de cada uno."));
add(spacer());
add(table([3500, 3500, 2360], ["Objetivo específico", "Descripción", "Resultado esperado"], [
  ["Autogestión de citas", "Que el paciente agende, cancele o reprograme desde cualquier dispositivo.", "Menos llamadas y gestiones manuales."],
  ["Optimizar la agenda médica", "Dar al médico herramientas para administrar su disponibilidad y evitar choques de horario.", "Mejor planificación y menos errores."],
  ["Notificaciones automáticas", "Enviar recordatorios antes de cada cita.", "Disminución del ausentismo."],
  ["Centralizar la información", "Guardar de forma segura los datos y el historial de citas.", "Trazabilidad y acceso ordenado."],
  ["Seguridad de datos sensibles", "Cifrado de contraseñas, validación y control de sesiones.", "Menor riesgo y buenas prácticas."],
  ["Módulo administrativo", "Gestionar usuarios, horarios y reportes.", "Mayor control operativo."],
]));

// 5. REQUERIMIENTOS
add(H1("5. Resumen de Requerimientos Generales"));
add(prosa([T("En la Actividad 4 documentamos cada requerimiento con una ficha detallada (versión, autores, precondición, secuencia normal, excepciones e importancia). Aquí los resumimos para sostener la trazabilidad del plan —cada requerimiento debe quedar cubierto por al menos un caso de prueba— y reproducimos dos fichas como muestra del nivel de detalle con que se especificaron.")]));
add(H2("5.1 Requerimientos funcionales"));
add(table([1100, 2500, 5760], ["ID", "Nombre", "Descripción"], [
  ["RF-01", "Registro y autenticación", "Pacientes y médicos se registran e inician sesión; el acceso depende del rol."],
  ["RF-02", "Agendamiento de citas", "El paciente agenda viendo la disponibilidad del médico en tiempo real."],
  ["RF-03", "Cancelación / reprogramación", "El paciente modifica su cita con una antelación mínima (24 h)."],
  ["RF-04", "Recordatorios por correo", "El sistema envía recordatorios antes de la cita."],
  ["RF-05", "Reportes para médicos", "El médico/administrador genera estadísticas de su actividad."],
]));
add(spacer());
add(ficha("RF-01 · Registro y autenticación de usuarios (Versión 1.0 · Autores: Elsa y Cristian)", [
  ["Descripción", "El sistema permite que pacientes y médicos se registren mediante un formulario y luego inicien sesión con sus credenciales."],
  ["Precondición", "Para registrarse, el usuario no debe existir; para autenticarse, debe haberse registrado antes."],
  ["Secuencia normal", "1) Accede a registro/inicio de sesión. 2) Completa los campos. 3) El sistema valida. 4) Se registra o ingresa. 5) Es redirigido a su panel según el rol."],
  ["Excepciones", "Correo ya registrado → mensaje de error. Credenciales incorrectas → no permite el acceso."],
  ["Importancia / Urgencia", "Alta / Alta. Las contraseñas se cifran y los datos se validan en frontend y backend."],
]));
add(spacer());
add(ficha("RF-02 · Agendamiento de citas (Versión 1.0 · Autores: Elsa y Cristian)", [
  ["Descripción", "El paciente agenda una cita visualizando la disponibilidad del médico en tiempo real."],
  ["Precondición", "El paciente debe estar autenticado."],
  ["Secuencia normal", "1) Abre el calendario de disponibilidad. 2) Elige fecha y hora. 3) Confirma. 4) El sistema guarda y notifica. 5) Se actualiza el calendario."],
  ["Excepciones", "Espacio ya reservado → mensaje de conflicto. Problemas de red/BD → error temporal."],
  ["Importancia / Urgencia", "Alta / Alta. La interfaz debe ser intuitiva para evitar errores al elegir horarios."],
]));
add(H2("5.2 Requerimientos no funcionales"));
add(table([1100, 2500, 5760], ["ID", "Atributo", "Descripción / Métrica"], [
  ["RNF-01", "Entorno de explotación", "Funciona en navegadores modernos; equipos modestos (Dual Core, 2 GB RAM)."],
  ["RNF-02", "Seguridad y privacidad", "Datos cifrados, transmisión por HTTPS y control de acceso por roles."],
  ["RNF-03", "Rendimiento", "Respuesta menor a 2 s bajo carga normal (hasta 50 usuarios simultáneos)."],
  ["RNF-04", "Disponibilidad", "Servicio disponible ≥ 99 % en horario laboral; alojamiento en la nube."],
  ["RNF-05", "Compatibilidad", "Diseño responsive funcional en PC, tablet y móvil."],
]));

// 6. ASPECTOS CRÍTICOS
add(H1("6. Aspectos Críticos del Proyecto de Software"));
add(prosa([T("Antes de diseñar las pruebas nos preguntamos dónde dolería más una falla. Este análisis de riesgos es el que justifica que no probemos todo con la misma intensidad: la SWEBOK recuerda que los objetivos de la prueba guían la selección de técnicas y la cobertura (Bourque & Fairley, 2014), de modo que conviene concentrar el esfuerzo donde el impacto es mayor. Para AgendApp identificamos lo siguiente:")]));
add(spacer());
add(table([2700, 4300, 2360], ["Componente / Proceso", "Riesgo si falla", "Prioridad"], [
  ["Autenticación y control de acceso", "Que alguien acceda a información clínica o a funciones de otro rol.", "Crítica"],
  ["Agendamiento y disponibilidad", "Doble reserva de un horario o citas en fechas pasadas.", "Crítica"],
  ["Regla de cancelación (24 h)", "Cancelaciones fuera de política o sobre citas ajenas.", "Alta"],
  ["Motor de pre-triaje", "Clasificar mal una urgencia o sugerir la especialidad equivocada.", "Alta"],
  ["Notificaciones", "Que no llegue la confirmación o el recordatorio.", "Media"],
  ["Reportes y panel admin", "Estadísticas inexactas que lleven a malas decisiones.", "Media"],
]));
add(prosa([T("A esto se suman los riesgos de proyecto que ya habíamos anotado: errores en la integración por la dependencia entre módulos, fallos de seguridad en el manejo de datos sensibles, baja cobertura de pruebas y cambios tardíos de requerimientos. Todos ellos influyeron en cómo organizamos la estrategia.")]));

// 7. ESTRATEGIA
add(H1("7. Estrategia de Pruebas"));
add(prosa([T("Nuestra estrategia se puede resumir en tres decisiones. La primera es adoptar el "), T("Modelo V", { bold: true }), T(" como marco de verificación y validación, porque empareja cada fase de diseño con su fase de prueba y obliga a pensar las pruebas desde el inicio, no al final. La distinción entre ambas ideas nos resultó clave: verificar es comprobar que construimos el producto correctamente —que cumple la especificación—, mientras que validar es comprobar que construimos el producto correcto —que satisface al usuario— (Bourque & Fairley, 2014).")]));
add(prosa([T("La segunda decisión es trabajar "), T("con base en riesgos", { bold: true }), T(": los componentes que marcamos como críticos en la sección anterior reciben más casos y se examinan con técnicas tanto de caja negra como de caja blanca. La tercera es "), T("automatizar", { bold: true }), T(" con pytest, de manera que la suite pueda repetirse ante cualquier cambio; esto es lo que sostiene las pruebas de regresión y nos da una red de seguridad cada vez que tocamos el código.")]));
add(prosa([T("Un punto que cuidamos especialmente es la "), T("independencia de la prueba", { italics: true }), T(". La literatura aconseja separar a quien construye de quien prueba para reducir sesgos (Bourque & Fairley, 2014). En un equipo de tres lo resolvimos de dos maneras: distribuyendo las tareas de implementación y de verificación entre distintos integrantes, y dejando una perspectiva externa —la del docente— que puede validar los resultados a través de la página de evidencias y de una cuenta de evaluación habilitada para ese fin.")]));
add(H2("7.1 Por qué esta estrategia y no otra"));
add(bullet([T("Detección temprana: al emparejar diseño y prueba, el Modelo V hace que los defectos salgan a la luz cuando corregirlos cuesta menos (Pressman & Maxim, 2021).")]));
add(bullet("Esfuerzo proporcional al riesgo: concentramos los casos en autenticación, agendamiento y pre-triaje, que son los procesos cuya falla más afecta al usuario."));
add(bullet([T("Repetibilidad: pytest con fixtures y una base en memoria nos da un entorno controlado y reproducible, condición que Singh (2011) considera indispensable para que una prueba sea confiable.")]));
add(bullet("Cobertura complementaria: la caja negra mira el comportamiento esperado y la caja blanca la lógica interna; juntas encuentran defectos que por separado se escaparían."));

// 8. METODOLOGÍA
add(H1("8. Metodología de Pruebas"));
add(prosa([T("La metodología describe cómo organizamos el trabajo. Mantuvimos el Modelo V como estructura de niveles y lo articulamos con Scrum, que fue la metodología de desarrollo. En la práctica esto significó que, sprint a sprint, cada historia de usuario llegó con sus criterios de aceptación y con las pruebas que la respaldan, de modo que la definición de “terminado” incluyó que esas pruebas pasaran.")]));
add(H2("8.1 Correspondencia del Modelo V"));
add(table([3120, 3120, 3120], ["Fase de desarrollo", "Nivel de prueba", "En AgendApp"], [
  ["Requerimientos", "Aceptación", "Escenarios de usuario sobre RF-01 a RF-05"],
  ["Arquitectura", "Sistema", "Suite completa pytest sobre la aplicación"],
  ["Diseño detallado", "Integración", "Rutas Flask ↔ SQLAlchemy ↔ base de datos"],
  ["Codificación", "Unitaria", "Funciones del motor de pre-triaje y reglas"],
]));
add(prosa([T("Sobre la integración seguimos el consejo de hacerla "), T("incremental", { italics: true }), T(" y no de golpe: primero estabilizamos la autenticación y luego el agendamiento, integrando un módulo a la vez. La SWEBOK presenta esta integración progresiva como la opción preferible para software no trivial (Bourque & Fairley, 2014), y a nosotros nos ayudó a localizar más rápido el origen de cada fallo.")]));
add(H2("8.2 Articulación con Scrum"));
add(table([1500, 7860], ["Sprint", "Foco y actividad de prueba"], [
  ["Sprint 1", "Modelos y autenticación: pruebas unitarias de modelos y de registro/login."],
  ["Sprint 2", "Agendamiento, API de horarios y calendario: pruebas de integración del flujo de reserva."],
  ["Sprint 3", "Pre-triaje y notificaciones: pruebas unitarias del motor de reglas."],
  ["Sprint 4", "Panel administrativo y control de acceso: pruebas de sistema."],
  ["Sprint 5", "Despliegue, evidencias y plan de pruebas: pruebas de aceptación y regresión."],
]));

// 9. TIPOS DE PRUEBA
add(H1("9. Tipos de Prueba a Aplicar"));
add(prosa([T("Los niveles que adoptamos son los clásicos del Modelo V, descritos en la SWEBOK (Bourque & Fairley, 2014), a los que añadimos pruebas de regresión y no funcionales. Para cada uno indicamos cómo se concreta en AgendApp con clases reales de la suite de pytest.")]));
add(H2("9.1 Pruebas unitarias"));
add(prosa([T("Verifican piezas de código en aislamiento, con acceso al fuente. En nuestro caso, la clase "), T("TestMotorIA", { font: "Consolas", size: 21 }), T(" prueba la función de pre-triaje sin depender de la base de datos: comprueba que un síntoma urgente se clasifique como tal, que una consulta de rutina se marque como rutina y que un texto vacío se maneje sin error.")]));
add(H2("9.2 Pruebas de integración"));
add(prosa([T("Comprueban la interacción entre componentes. "), T("TestAgendamientoCitas", { font: "Consolas", size: 21 }), T(" y "), T("TestCancelacionReprogramacion", { font: "Consolas", size: 21 }), T(" recorren el camino ruta de Flask → ORM → base de datos; por ejemplo, crean una cita, invocan la cancelación y verifican que el estado quedó actualizado en la base.")]));
add(H2("9.3 Pruebas de sistema"));
add(prosa([T("Evalúan el sistema completo y los requisitos no funcionales en un entorno controlado. La suite corre sobre una base en memoria y la clase "), T("TestRendimiento", { font: "Consolas", size: 21 }), T(" atiende el RNF-03 midiendo que las páginas respondan dentro del umbral, además de verificar el manejo de errores (404).")]));
add(H2("9.4 Pruebas de aceptación"));
add(prosa([T("Validan, desde la óptica del usuario, que el sistema sirve. Las planteamos como escenarios de extremo a extremo sobre el sistema desplegado —un paciente que inicia sesión, hace su pre-triaje y agenda— y las apoyamos con las cuentas de demostración para que también el docente pueda recorrerlas.")]));
add(H2("9.5 Pruebas no funcionales y de regresión"));
add(body("Cubren rendimiento, seguridad (cifrado de contraseñas y control de acceso) y compatibilidad en distintos navegadores. La regresión consiste, sencillamente, en volver a correr toda la suite tras cada cambio para asegurarnos de no haber roto algo que antes funcionaba."));

// 10. CRITERIOS DE ACEPTACIÓN
add(H1("10. Criterios de Aceptación por Grupo de Pruebas"));
add(prosa([T("Aquí hacemos una distinción que nos pareció importante y que la SWEBOK subraya: el "), T("objetivo", { italics: true }), T(" de una prueba (ganar confianza en un requerimiento) no es lo mismo que la "), T("medida", { italics: true }), T(" que usamos para acercarnos a él (un porcentaje de cobertura). Por eso nuestros criterios mezclan ambos planos. El criterio global de aceptación del plan es que todos los casos de prioridad crítica y alta pasen y que no queden defectos críticos abiertos.")]));
add(spacer());
add(table([2700, 6660], ["Grupo de pruebas", "Criterio de aceptación (entrada → salida)"], [
  ["Autenticación y roles (RF-01)", "Entrada: formularios y rutas implementados. Salida: el usuario se registra, inicia sesión, es redirigido a su panel y no accede a vistas de otros roles."],
  ["Agendamiento (RF-02)", "Salida: la cita se crea sobre un horario libre; se rechazan fechas pasadas y horarios ocupados."],
  ["Cancelación (RF-03)", "Salida: la cancelación procede solo con ≥ 24 h y únicamente sobre citas propias."],
  ["Pre-triaje (motor IA)", "Salida: el nivel de urgencia y la especialidad sugerida coinciden con lo esperado; respuesta en JSON válida."],
  ["Panel y reportes (RF-05)", "Salida: el administrador accede, ve las estadísticas y gestiona usuarios."],
  ["No funcionales (RNF)", "Salida: tiempos por debajo del umbral, contraseñas cifradas y acceso respetando los roles."],
]));

// 11. CASOS DE PRUEBA
add(H1("11. Diseño de Casos de Prueba"));
add(prosa([T("Para diseñar los casos no inventamos entradas al azar: aplicamos técnicas reconocidas de diseño de pruebas. La SWEBOK las agrupa en técnicas basadas en la especificación (caja negra), en el código (caja blanca) y en la experiencia (Bourque & Fairley, 2014); Singh (2011) las desarrolla con ejemplos. Explicamos cuáles usamos y dónde.")]));
add(H2("11.1 Técnicas de caja negra (basadas en la especificación)"));
add(bullet([T("Partición de equivalencia. ", { bold: true }), T("Agrupamos las entradas en clases que el sistema debería tratar igual. En el login distinguimos las clases “credenciales válidas”, “contraseña incorrecta” y “correo inexistente”, cada una con su caso.")]));
add(bullet([T("Análisis de valores límite. ", { bold: true }), T("Probamos las fronteras, que es donde más fallan los programas. El caso de contraseña corta ataca el límite de longitud mínima, y el de cancelación prueba la frontera exacta de las 24 horas.")]));
add(bullet([T("Tabla de decisión. ", { bold: true }), T("El motor de pre-triaje es, en esencia, una tabla que cruza palabras clave de síntomas con niveles (urgente, pronto, rutina); diseñamos un caso por cada salida posible.")]));
add(bullet([T("Transición de estados. ", { bold: true }), T("Una cita recorre los estados pendiente → confirmada → cancelada/completada. Diseñamos casos que ejercitan esas transiciones, como la confirmación por parte del médico.")]));
add(H2("11.2 Técnicas de caja blanca (basadas en el código)"));
add(prosa([T("Aquí miramos la estructura interna. Nos interesó sobre todo la "), T("cobertura de decisión (ramas)", { bold: true }), T(" en los decoradores de autorización ("), T("@login_required", { font: "Consolas", size: 21 }), T(", "), T("@patient_required", { font: "Consolas", size: 21 }), T(", "), T("@doctor_required", { font: "Consolas", size: 21 }), T("): cada uno tiene una rama verdadera y una falsa, y diseñamos casos que recorren ambas —por ejemplo, un acceso sin sesión y un paciente intentando entrar al panel del médico—.")]));
add(H2("11.3 Catálogo de casos · Autenticación y control de acceso"));
add(table([1100, 4700, 3560], ["ID", "Descripción", "Resultado esperado"], [
  ["PA-01", "Registro válido con rol paciente", "Cuenta creada y mensaje de éxito"],
  ["PA-02", "Registro válido con rol médico", "Cuenta creada y mensaje de éxito"],
  ["PA-03", "Registro con correo ya existente", "Se rechaza por correo duplicado"],
  ["PA-04", "Contraseñas que no coinciden", "Mensaje de error de validación"],
  ["PA-05", "Contraseña demasiado corta (valor límite)", "Mensaje de error de longitud"],
  ["PA-06", "Formulario con campos vacíos", "El registro no se completa"],
  ["PA-07", "Login válido de paciente", "Redirige al panel del paciente"],
  ["PA-08", "Login válido de médico", "Redirige al panel del médico"],
  ["PA-09", "Contraseña incorrecta (partición)", "Mensaje 'Credenciales incorrectas'"],
  ["PA-10", "Correo no registrado (partición)", "Mensaje 'Credenciales incorrectas'"],
  ["PA-11", "Cierre de sesión", "Sesión destruida y redirección"],
  ["PA-12", "Ruta protegida sin sesión (rama)", "Redirige al inicio de sesión"],
  ["PA-13", "Paciente intenta panel de médico (rama)", "Acceso denegado (403/redirección)"],
  ["PA-14", "Médico intenta panel de paciente (rama)", "Acceso denegado (403/redirección)"],
  ["PA-15", "Administrador accede a su panel", "Acceso permitido (200)"],
]));
add(H2("11.4 Catálogo de casos · Citas, API y motor de IA"));
add(table([1100, 4700, 3560], ["ID", "Descripción", "Resultado esperado"], [
  ["CA-01", "Ver página de agendamiento", "Formulario visible (200)"],
  ["CA-02", "Horarios de médico válido", "Lista de horarios en JSON"],
  ["CA-03", "Horarios con fecha inválida", "Lista vacía sin error"],
  ["CA-04", "Horarios de médico inexistente", "Respuesta vacía o 404"],
  ["CA-05", "Calendario en formato JSON", "Lista de eventos"],
  ["CA-06", "Agendar en fecha pasada (valor límite)", "Se rechaza; no se crea"],
  ["CA-07", "Cancelar con más de 24 h (valor límite)", "Cita cancelada"],
  ["CA-08", "Cancelar cita de otro paciente", "Acceso denegado (403)"],
  ["CA-09", "Médico confirma cita (transición)", "Estado pasa a 'confirmada'"],
  ["CA-10", "Pre-triaje urgente (tabla de decisión)", "Nivel 'urgente', alerta roja"],
  ["CA-11", "Pre-triaje de rutina (tabla de decisión)", "Nivel 'rutina'"],
  ["CA-12", "Pre-triaje con texto vacío", "Nivel 'normal'"],
  ["CA-13", "Listar médicos activos", "Lista en JSON"],
  ["CA-14", "Carga de la página de inicio", "Responde (200)"],
  ["CA-15", "Carga de la página de login", "Responde (200)"],
  ["CA-16", "Ruta inexistente", "Error 404 controlado"],
]));
add(H2("11.5 Ficha de caso de prueba (muestra)"));
add(ficha("CP-07 · Cancelación de cita con la regla de 24 horas (técnica: análisis de valores límite)", [
  ["Requisito asociado", "RF-03 · Cancelación / reprogramación"],
  ["Precondición", "Paciente autenticado con una cita activa a más de 24 horas."],
  ["Pasos", "1) Ingresar como paciente. 2) Abrir 'Mis citas'. 3) Solicitar la cancelación de una cita lejana. 4) Confirmar."],
  ["Datos de entrada", "Cita con fecha/hora a > 24 h del momento actual (lado válido de la frontera)."],
  ["Resultado esperado", "La cancelación se realiza y el estado de la cita cambia a 'cancelada'."],
  ["Prueba automatizada", "test_cancelar_cita_24h_antes · Resultado: PASSED"],
]));
add(spacer());
add(ficha("CP-13 · Control de acceso por rol (técnica: cobertura de decisión / rama)", [
  ["Requisito asociado", "RF-01 · Autenticación y roles · RNF-02 Seguridad"],
  ["Precondición", "Existe un paciente autenticado."],
  ["Pasos", "1) Ingresar como paciente. 2) Solicitar directamente la URL del panel del médico."],
  ["Datos de entrada", "Sesión con rol 'paciente' (rama falsa del decorador @doctor_required)."],
  ["Resultado esperado", "El sistema niega el acceso (403) o redirige; no muestra el panel."],
  ["Prueba automatizada", "test_paciente_no_accede_dashboard_medico · Resultado: PASSED"],
]));
add(H2("11.6 Trazabilidad requerimiento → casos"));
add(table([3120, 6240], ["Requerimiento", "Casos que lo cubren"], [
  ["RF-01 — Autenticación y roles", "PA-01 a PA-15"],
  ["RF-02 — Agendamiento", "CA-01 a CA-06"],
  ["RF-03 — Cancelación", "CA-07, CA-08"],
  ["RF-04 / RF-05 — Gestión y reportes", "CA-09, PA-15"],
  ["Motor de pre-triaje (IA)", "CA-10, CA-11, CA-12, CA-13"],
  ["RNF-03 — Rendimiento", "CA-14, CA-15, CA-16"],
]));

// 12. PASOS DE EJECUCIÓN
add(H1("12. Procedimiento de Ejecución de las Pruebas"));
add(body("La ejecución sigue un orden que cualquiera del equipo —o el docente— puede repetir:"));
add(numItem("Preparar el entorno: clonar el repositorio, crear el entorno virtual e instalar las dependencias."));
add(numItem("Cargar los datos de prueba con el script de seed (usuarios, médicos, horarios y citas de muestra)."));
add(numItem("Ejecutar la suite automatizada con pytest y registrar el resultado de cada caso."));
add(numItem("Revisar la cobertura y confirmar que los casos críticos pasaron."));
add(numItem("Recorrer los escenarios de aceptación sobre el sistema desplegado con las cuentas de demostración."));
add(numItem("Registrar cualquier defecto con su severidad y volver a correr la regresión tras corregirlo."));
add(H2("12.1 Comandos de referencia"));
add(code("pip install -r requirements.txt"));
add(code("python seed.py"));
add(code("pytest tests/ -v"));
add(code("pytest tests/ --cov=. --cov-report=html", true));
add(H2("12.2 Validación por parte del docente"));
add(prosa([T("Para facilitar la evaluación incorporamos al propio sistema una página pública de evidencias ("), T("/evidencias", { font: "Consolas", size: 21 }), T(") que lista los 31 casos diseñados con su estado, y habilitamos una cuenta de evaluación con rol administrador. Así, el docente puede validar las pruebas sin necesidad de instalar nada, ya sea revisando la página de evidencias o ingresando a recorrer la aplicación.")]));
add(spacer());
add(table([3000, 6360], ["Cuenta de demostración", "Credenciales"], [
  ["Docente / evaluador (admin)", "docente@agendapp.co · Demo2026!"],
  ["Médico", "dr.garcia@agendapp.co · Doctor2024!"],
  ["Paciente", "maria@test.co · Paciente2024!"],
]));

// 13. PLANIFICACIÓN
add(H1("13. Planificación General de la Ejecución"));
add(body("Organizamos las actividades de prueba a lo largo de los sprints, con los responsables y entregables de cada fase."));
add(spacer());
add(table([2200, 4400, 2760], ["Fase", "Actividades", "Momento / Responsable"], [
  ["Planificación", "Análisis del proyecto, estrategia y diseño del plan.", "Sprint 1 · Equipo"],
  ["Diseño de pruebas", "Especificación de casos y criterios de aceptación.", "Sprints 1–2 · Equipo"],
  ["Unitarias e integración", "Implementación y ejecución con pytest.", "Sprints 2–4 · Desarrollo"],
  ["Sistema", "Verificación del sistema y control de acceso.", "Sprint 4 · Equipo"],
  ["Aceptación", "Escenarios de usuario sobre producción.", "Sprint 5 · Equipo"],
  ["Regresión y cierre", "Reejecución de la suite e informe final.", "Sprint 5 · Equipo"],
]));
add(H2("13.1 Métricas de seguimiento"));
add(prosa([T("Para medir la efectividad mantuvimos las métricas previstas en la Actividad 4, que la literatura respalda como indicadores de calidad de la prueba (Singh, 2011; Pressman & Maxim, 2021):")]));
add(bullet("Cobertura de código (%): porción del código ejercitada por las pruebas; meta inicial del 80 % en funciones críticas."));
add(bullet("Tasa de éxito: casos que pasan sobre el total ejecutado; hoy 31 de 31 (100 %)."));
add(bullet("Densidad de defectos (defectos/KLOC) y número de regresiones por versión, para controlar la estabilidad entre entregas."));
add(H2("13.2 Recursos y entornos"));
add(bullet("Equipo de tres integrantes que se reparte desarrollo, diseño de pruebas y ejecución."));
add(bullet("Herramientas: Python, Flask, pytest, Git/GitHub y Render."));
add(bullet("Entornos: local con SQLite para la suite automatizada y producción con PostgreSQL para la aceptación."));

// 14. TRABAJO EN EQUIPO
add(H1("14. Trabajo en Equipo"));
add(prosa([T("Trabajamos de forma colaborativa y dejamos rastro de los aportes en el repositorio. Respetamos la autoría que ya veníamos manejando en la especificación de requerimientos y repartimos el resto de las tareas según las fortalezas de cada quien.")]));
add(spacer());
add(table([3000, 6360], ["Integrante", "Responsabilidades"], [
  ["Elsa Sequeda Pacheco", "Análisis y especificación de requerimientos, diseño de casos de prueba y redacción del informe."],
  ["Cristian Stiven Guerrero Andrade", "Estrategia y metodología de pruebas, criterios de aceptación y fundamentación teórica."],
  ["Brayan Galeano Tobón", "Implementación y automatización de las pruebas, despliegue del sistema y página de evidencias."],
]));
add(body("Las decisiones de fondo —estrategia, técnicas y planificación— se tomaron en conjunto, y la sustentación en video recoge la voz de cada integrante."));

// 15. CONCLUSIONES
add(H1("15. Conclusiones"));
add(prosa([T("Diseñar este plan nos obligó a pasar de la intuición a la justificación. Apoyarnos en la SWEBOK y en autores como Singh, Pressman y Sommerville nos dio el vocabulario y los criterios para explicar por qué elegimos el Modelo V, por qué combinamos caja negra y caja blanca y por qué ciertos componentes merecen más atención que otros.")]));
add(prosa([T("Quizá lo que más valoramos es que el plan no se quedó en teoría: las 31 pruebas se ejecutan y pasan, el sistema está desplegado y funcionando, y dejamos un mecanismo para que el propio docente verifique los resultados. Con esto cerramos el ciclo que abrimos en la Actividad 4 y consolidamos la idea de que probar es parte del desarrollo, no un apéndice.")]));

// 16. REFERENCIAS
add(H1("16. Referencias"));
const ref = (children) => new Paragraph({ spacing: { line: 360, after: 140 }, indent: { left: 720, hanging: 720 }, alignment: AlignmentType.JUSTIFIED, children });
add(ref([T("Bourque, P., & Fairley, R. E. (Eds.). (2014). "), T("Guide to the software engineering body of knowledge (SWEBOK): Version 3.0", { italics: true }), T(". IEEE Computer Society Press.")]));
add(ref([T("International Software Testing Qualifications Board. (2018). "), T("Programa de estudio. Nivel básico (Foundation Level)", { italics: true }), T(". ISTQB.")]));
add(ref([T("Myers, G. J., Sandler, C., & Badgett, T. (2011). "), T("The art of software testing", { italics: true }), T(" (3rd ed.). John Wiley & Sons.")]));
add(ref([T("Pressman, R. S., & Maxim, B. R. (2021). "), T("Ingeniería de software", { italics: true }), T(". McGraw-Hill Interamericana. https://www-ebooks7-24-com.ibero.basesdedatosezproxy.com/?il=31214")]));
add(ref([T("Singh, Y. (2011). "), T("Software testing", { italics: true }), T(". Cambridge University Press. https://search-ebscohost-com.ibero.basesdedatosezproxy.com/login.aspx?direct=true&db=nlebk&AN=465756")]));
add(ref([T("Sommerville, I. (2011). "), T("Ingeniería de software", { italics: true }), T(" (9.ª ed.). Pearson Educación. https://www-ebooks7-24-com.ibero.basesdedatosezproxy.com/?il=3313")]));

// ── ANEXOS ──────────────────────────────────────────────────────────────
add(new Paragraph({ children: [new PageBreak()] }));
add(H1("Anexos"));
add(H2("Anexo A. Pantallazos del sistema en funcionamiento"));
add(body("Las siguientes capturas corresponden a la aplicación desplegada y se usaron también en la sustentación."));
add(...img("01_landing.png", "Figura 1. Página de inicio de AgendApp con el cuerpo médico."));
add(...img("05_pretriaje.png", "Figura 2. Motor de pre-triaje clasificando un síntoma como urgente (prioridad alta)."));
add(...img("06_medico_dashboard.png", "Figura 3. Panel del médico con su agenda del día y calendario."));
add(...img("07_admin_dashboard.png", "Figura 4. Panel de administración visto desde la cuenta del docente."));
add(...img("02_evidencias.png", "Figura 5. Página de evidencias de pruebas para validación del docente."));
add(H2("Anexo B. Resultado de la ejecución de las pruebas"));
add(body("Salida de la suite con 'pytest tests/ -v'. Los 31 casos diseñados se ejecutaron de forma satisfactoria."));
add(code("$ pytest tests/ -v"));
add(code("==================== test session starts ===================="));
[
  "test_auth.py::TestRegistro::test_registro_paciente_exitoso",
  "test_auth.py::TestRegistro::test_registro_medico_exitoso",
  "test_auth.py::TestRegistro::test_registro_email_duplicado",
  "test_auth.py::TestRegistro::test_registro_contrasenas_no_coinciden",
  "test_auth.py::TestRegistro::test_registro_contrasena_corta",
  "test_auth.py::TestRegistro::test_campos_requeridos",
  "test_auth.py::TestLogin::test_login_paciente_valido",
  "test_auth.py::TestLogin::test_login_medico_valido",
  "test_auth.py::TestLogin::test_login_credenciales_incorrectas",
  "test_auth.py::TestLogin::test_login_email_inexistente",
  "test_auth.py::TestLogin::test_logout",
  "test_auth.py::TestLogin::test_redirect_sin_autenticacion",
  "test_auth.py::TestControlAccesoRoles::test_paciente_no_accede_dashboard_medico",
  "test_auth.py::TestControlAccesoRoles::test_medico_no_accede_panel_paciente",
  "test_auth.py::TestControlAccesoRoles::test_admin_accede_panel_admin",
  "test_appointments.py::TestAgendamientoCitas::test_ver_pagina_agendar",
  "test_appointments.py::TestAgendamientoCitas::test_api_slots_doctor_valido",
  "test_appointments.py::TestAgendamientoCitas::test_api_slots_fecha_invalida",
  "test_appointments.py::TestAgendamientoCitas::test_api_slots_doctor_inexistente",
  "test_appointments.py::TestAgendamientoCitas::test_calendario_api_json",
  "test_appointments.py::TestAgendamientoCitas::test_agendar_cita_fecha_pasada",
  "test_appointments.py::TestCancelacionReprogramacion::test_cancelar_cita_24h_antes",
  "test_appointments.py::TestCancelacionReprogramacion::test_cancelar_cita_otro_paciente",
  "test_appointments.py::TestCancelacionReprogramacion::test_medico_confirma_cita",
  "test_appointments.py::TestMotorIA::test_prescreen_urgente",
  "test_appointments.py::TestMotorIA::test_prescreen_rutina",
  "test_appointments.py::TestMotorIA::test_prescreen_texto_vacio",
  "test_appointments.py::TestMotorIA::test_api_doctores",
  "test_appointments.py::TestRendimiento::test_carga_landing",
  "test_appointments.py::TestRendimiento::test_carga_login",
  "test_appointments.py::TestRendimiento::test_404",
].forEach(t => add(okLine(t)));
add(code("===================== 31 passed in 6.93s ====================", true));

const doc = new Document({
  creator: "Equipo AgendApp", title: "Plan de Pruebas — AgendApp",
  styles: { default: { document: { run: { font: "Times New Roman", size: 24 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 30, bold: true, color: NAVY, font: "Times New Roman" }, paragraph: { spacing: { before: 300, after: 160 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 26, bold: true, color: BLUE, font: "Times New Roman" }, paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 24, bold: true, color: BLUE, font: "Times New Roman" }, paragraph: { spacing: { before: 160, after: 100 }, outlineLevel: 2 } },
    ] },
  numbering: { config: [
    { reference: "vinetas", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    { reference: "numerada", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
  ] },
  sections: [
    { properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } }, children: portada },
    { properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: NAVY, space: 4 } }, children: [T("Plan de Pruebas · AgendApp", { size: 18, color: GREY, italics: true })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], font: "Times New Roman", size: 18, color: GREY })] })] }) },
      children: [...toc, ...content] },
  ],
});

Packer.toBuffer(doc).then(buf => { fs.writeFileSync("plan_pruebas_agendapp.docx", buf); console.log("OK docx", buf.length, "bytes"); });
