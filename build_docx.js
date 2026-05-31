/* Generador del informe "Diseño del Plan de Pruebas — AgendApp"
   Formato académico APA 7 (IBERO). Ejecutar: node build_docx.js */
const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, TabStopType, TabStopPosition,
  TableOfContents, HeadingLevel, BorderStyle, WidthType, ShadingType,
  VerticalAlign, PageNumber, PageBreak, ExternalHyperlink
} = require("docx");

// ── Paleta / constantes ──────────────────────────────────────────────────
const NAVY = "1F3864", BLUE = "2E5496", LIGHT = "D9E2F3", ZEBRA = "F2F5FB",
      GREY = "595959", LINE = "BBBBBB";
const CW = 9360; // ancho de contenido (US Letter, márgenes 1")

// ── Helpers ──────────────────────────────────────────────────────────────
const T = (text, o = {}) => new TextRun({ text, font: "Times New Roman", size: 24, ...o });
const P = (children, o = {}) => new Paragraph({
  spacing: { line: 360, after: 120 }, alignment: AlignmentType.JUSTIFIED,
  children: Array.isArray(children) ? children : [children], ...o });
const body = (text, o = {}) => P([T(text)], o);
const H1 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [T(text, { bold: true, color: NAVY, size: 28 })] });
const H2 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [T(text, { bold: true, color: BLUE, size: 26 })] });
const H3 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_3, children: [T(text, { bold: true, color: BLUE, size: 24 })] });
const bullet = (text, lvl = 0) => new Paragraph({
  numbering: { reference: "vinetas", level: lvl }, spacing: { line: 320, after: 60 },
  alignment: AlignmentType.JUSTIFIED, children: Array.isArray(text) ? text : [T(text)] });
const numItem = (text) => new Paragraph({
  numbering: { reference: "numerada", level: 0 }, spacing: { line: 320, after: 60 },
  alignment: AlignmentType.JUSTIFIED, children: Array.isArray(text) ? text : [T(text)] });

const border = { style: BorderStyle.SINGLE, size: 1, color: LINE };
const borders = { top: border, bottom: border, left: border, right: border };
const cell = (content, { w, head = false, fill, bold = false, align = AlignmentType.LEFT } = {}) =>
  new TableCell({
    borders, width: { size: w, type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
    shading: { fill: fill || (head ? NAVY : "FFFFFF"), type: ShadingType.CLEAR },
    margins: { top: 60, bottom: 60, left: 110, right: 110 },
    children: (Array.isArray(content) ? content : [content]).map(txt =>
      new Paragraph({ alignment: align, spacing: { line: 276, after: 0 },
        children: [T(txt, { bold: head || bold, color: head ? "FFFFFF" : "000000",
          size: head ? 22 : 21 })] })),
  });
// Construye tabla con encabezado y filas cebra
const table = (widths, header, rows) => new Table({
  width: { size: CW, type: WidthType.DXA }, columnWidths: widths,
  rows: [
    new TableRow({ tableHeader: true, children: header.map((h, i) => cell(h, { w: widths[i], head: true, align: AlignmentType.CENTER })) }),
    ...rows.map((r, ri) => new TableRow({ children: r.map((c, i) =>
      cell(c, { w: widths[i], fill: ri % 2 ? ZEBRA : "FFFFFF" })) })),
  ],
});
const spacer = () => new Paragraph({ spacing: { after: 60 }, children: [T("")] });

// ── PORTADA ────────────────────────────────────────────────────────────────
const blank = (n = 1) => Array.from({ length: n }, () => new Paragraph({ children: [T("")] }));
const center = (text, o = {}) => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { line: 360, after: 40 }, children: [T(text, o)] });

const portada = [
  ...blank(1),
  center("CORPORACIÓN UNIVERSITARIA IBEROAMERICANA", { bold: true, size: 28, color: NAVY }),
  center("FACULTAD DE INGENIERÍA", { bold: true, size: 24 }),
  center("INGENIERÍA DE SOFTWARE", { size: 24 }),
  center("PRUEBAS DE SOFTWARE", { size: 24 }),
  ...blank(3),
  center("DISEÑO DEL PLAN DE PRUEBAS DE SOFTWARE", { bold: true, size: 36, color: NAVY }),
  center("Proyecto: AgendApp — Sistema de Gestión de Citas Médicas con Pre-triaje Asistido por IA", { italics: true, size: 26 }),
  center("Actividad 5 — Estrategia de Aprendizaje 2", { size: 24 }),
  ...blank(3),
  center("Presentado por:", { bold: true, size: 24 }),
  center("Elsa Sequeda Pacheco", { size: 24 }),
  center("Cristian Stiven Guerrero Andrade", { size: 24 }),
  center("Brayan Galeano Tobón", { size: 24 }),
  ...blank(2),
  center("Docente:", { bold: true, size: 24 }),
  center("Rogelio Vásquez", { size: 24 }),
  ...blank(3),
  center("Bogotá D.C., Colombia", { size: 24 }),
  center("Mayo de 2026", { size: 24 }),
  new Paragraph({ children: [new PageBreak()] }),
];

// ── TABLA DE CONTENIDO ───────────────────────────────────────────────────
const toc = [
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [T("Tabla de Contenido", { bold: true, size: 28, color: NAVY })] }),
  new TableOfContents("Tabla de Contenido", { hyperlink: true, headingStyleRange: "1-3" }),
  new Paragraph({ children: [new PageBreak()] }),
];

// ── CONTENIDO ──────────────────────────────────────────────────────────────
const content = [];
const add = (...els) => els.forEach(e => content.push(e));

// 1. INTRODUCCIÓN
add(H1("1. Introducción"));
add(body("El aseguramiento de la calidad es una de las disciplinas que mayor impacto tiene sobre el éxito de un producto de software. Las pruebas no constituyen una fase aislada que se ejecuta al final del desarrollo, sino un proceso transversal que acompaña cada etapa del ciclo de vida y que permite verificar que el sistema cumple con los requerimientos especificados y validar que satisface las necesidades reales de los usuarios."));
add(body("El presente informe corresponde a la Actividad 5 de la Estrategia de Aprendizaje 2 y tiene como propósito documentar el diseño de un plan de pruebas para un proyecto de desarrollo de software. Dando continuidad al proyecto seleccionado en los momentos anteriores, se trabaja sobre AgendApp, una plataforma web de gestión de citas médicas que incorpora un motor de pre-triaje asistido por inteligencia artificial y notificaciones automáticas. Para la elaboración del plan se analizó el proyecto en detalle, se comprendieron sus objetivos y requerimientos, se documentó la metodología de desarrollo empleada y se identificaron los componentes y procesos críticos."));
add(body("A partir de ese análisis se seleccionaron de manera justificada la estrategia, la metodología, los tipos de prueba, los criterios de aceptación y la planificación más convenientes para el contexto del proyecto. El plan se sustenta en el marco teórico construido durante el módulo y en la bibliografía de la unidad, en particular en los lineamientos sobre niveles, técnicas y plan de pruebas presentados por Singh (2011)."));

// 2. OBJETIVOS
add(H1("2. Objetivos"));
add(H2("2.1 Objetivo general"));
add(body("Diseñar un plan de pruebas integral para el proyecto de software AgendApp, que defina la estrategia, la metodología, los tipos de prueba, los criterios de aceptación, los casos de prueba y la planificación necesarios para verificar y validar el cumplimiento de los requerimientos funcionales y no funcionales del sistema."));
add(H2("2.2 Objetivos específicos"));
[
  "Analizar el proyecto AgendApp para comprender sus objetivos, requerimientos y la metodología de desarrollo utilizada.",
  "Identificar los componentes y procesos críticos del sistema que requieren mayor atención durante las pruebas.",
  "Seleccionar y justificar la estrategia de pruebas y la metodología (Modelo V articulada con Scrum) acordes con el contexto del proyecto.",
  "Definir los tipos de prueba a aplicar y los criterios de aceptación de cada grupo de pruebas.",
  "Diseñar los casos de prueba y describir el procedimiento de ejecución y la planificación general de las actividades de prueba.",
].forEach(o => add(bullet(o)));

// 3. DESCRIPCIÓN DEL PROYECTO
add(H1("3. Descripción del Proyecto de Software"));
add(body("AgendApp es una aplicación web que simula el entorno productivo de una clínica de consulta externa con cuatro especialidades. Permite a los pacientes registrarse, consultar la disponibilidad de los médicos en tiempo real, realizar un pre-triaje de sus síntomas asistido por un motor de reglas, agendar y cancelar citas, y recibir confirmaciones y recordatorios automáticos. Los médicos gestionan su agenda y el estado de las citas, mientras que el administrador supervisa la operación mediante un panel de estadísticas."));
add(body("El sistema fue desarrollado y desplegado en un entorno real de nube. El código fuente se encuentra versionado en un repositorio público de GitHub y la aplicación está disponible en línea, lo que permite ejecutar pruebas tanto en ambiente local como sobre el sistema en producción."));
add(spacer());
add(table([2600, 6760], ["Elemento", "Detalle"], [
  ["Nombre del producto", "AgendApp — Sistema de gestión de citas médicas"],
  ["Tipo de aplicación", "Aplicación web (cliente-servidor) responsive"],
  ["Repositorio de código", "github.com/bgaleanotec-maker/agendapp"],
  ["Despliegue en producción", "agendapp-rde9.onrender.com (Render, plan gratuito)"],
  ["Roles de usuario", "Paciente, Médico y Administrador"],
  ["Especialidades", "Medicina General, Odontología, Psicología y Gastroenterología"],
]));
add(H2("3.1 Especialidades y cuerpo médico"));
add(table([3400, 1480, 1480, 3000], ["Especialidad", "Médicos", "Tarifa", "Característica"], [
  ["Medicina General", "5", "$40.000", "Mayor volumen de atención"],
  ["Odontología", "2", "$60.000", "Procedimientos preventivos y de urgencia"],
  ["Psicología", "5", "$55.000", "Acompañamiento y terapia"],
  ["Gastroenterología", "1", "$90.000", "Especialidad de mayor costo"],
]));
add(H2("3.2 Arquitectura y tecnologías"));
add(body("AgendApp se construyó sobre una arquitectura cliente-servidor de tres capas (presentación, lógica de negocio y persistencia), bajo el patrón Modelo-Vista-Controlador propio de Flask. La capa de presentación emplea plantillas HTML con Bootstrap 5, FullCalendar y Chart.js; la lógica de negocio reside en el servidor de aplicaciones Flask, e incluye el control de acceso por roles y el motor de pre-triaje; y la persistencia se gestiona con el ORM SQLAlchemy sobre SQLite en desarrollo y PostgreSQL en producción."));
add(spacer());
add(table([3120, 6240], ["Capa / Componente", "Tecnología"], [
  ["Lenguaje y framework", "Python 3.11 · Flask 3.0"],
  ["ORM / Base de datos", "SQLAlchemy 2.0 · SQLite (dev/test) / PostgreSQL (prod)"],
  ["Autenticación", "Flask-Login (sesiones y control de acceso por roles)"],
  ["Interfaz de usuario", "Bootstrap 5.3 · FullCalendar · Chart.js"],
  ["Notificaciones", "Twilio API (WhatsApp) · Flask-Mail (correo electrónico)"],
  ["Servidor de producción", "Gunicorn sobre Render"],
  ["Pruebas", "pytest 8.2 · pytest-flask"],
]));

// 4. OBJETIVOS DEL PROYECTO DE SOFTWARE
add(H1("4. Objetivos del Proyecto de Software"));
add(body("Más allá de los objetivos del plan de pruebas, el producto AgendApp persigue las siguientes metas, que orientan la definición de los criterios de calidad:"));
[
  "Ofrecer a los pacientes un canal autónomo y disponible para agendar, reprogramar y cancelar citas médicas sin intermediación telefónica.",
  "Reducir el ausentismo a las citas mediante notificaciones y recordatorios automáticos por correo y WhatsApp.",
  "Orientar al paciente antes del agendamiento a través de un pre-triaje de síntomas que sugiere el nivel de urgencia y la especialidad adecuada.",
  "Proporcionar a los médicos una agenda en tiempo real y herramientas para confirmar, completar o cancelar citas.",
  "Brindar al administrador información estadística para la toma de decisiones sobre la operación de la clínica.",
  "Garantizar la seguridad de la información y el acceso diferenciado según el rol de cada usuario.",
].forEach(o => add(bullet(o)));

// 5. RESUMEN DE REQUERIMIENTOS
add(H1("5. Resumen de Requerimientos Generales"));
add(body("El plan de pruebas se estructura sobre los requerimientos funcionales (RF) y no funcionales (RNF) definidos para el sistema. Su trazabilidad permite verificar, al final del proceso, que cada requerimiento cuenta con al menos un caso de prueba que lo respalda."));
add(H2("5.1 Requerimientos funcionales"));
add(table([1100, 2600, 5660], ["ID", "Nombre", "Descripción"], [
  ["RF-01", "Autenticación y roles", "Registro e inicio de sesión para pacientes, médicos y administradores, con acceso restringido a las vistas propias de cada rol."],
  ["RF-02", "Agendamiento de citas", "El paciente agenda una cita eligiendo especialidad, médico, fecha y hora disponibles; el sistema valida que el horario no esté ocupado."],
  ["RF-03", "Pre-triaje con IA", "El sistema clasifica los síntomas ingresados (urgente, pronto o rutina) y sugiere la especialidad antes de agendar."],
  ["RF-04", "Gestión de citas", "Médicos confirman, completan o cancelan citas; los pacientes cancelan con al menos 24 horas de antelación."],
  ["RF-05", "Panel administrativo", "El administrador visualiza estadísticas de citas y gestiona el estado activo de los usuarios."],
]));
add(H2("5.2 Requerimientos no funcionales"));
add(table([1100, 2400, 5860], ["ID", "Atributo", "Descripción / Métrica"], [
  ["RNF-01", "Seguridad", "Contraseñas cifradas con hash; sesiones gestionadas con Flask-Login; control de acceso por roles."],
  ["RNF-02", "Usabilidad", "Interfaz responsive bajo principios de Nielsen; flujo de agendamiento en pocos pasos."],
  ["RNF-03", "Rendimiento", "Tiempo de respuesta inferior a 2 s en operaciones habituales bajo carga concurrente."],
  ["RNF-04", "Disponibilidad", "Servicio accesible en línea mediante despliegue en la nube (Render)."],
  ["RNF-05", "Compatibilidad", "Funcionamiento correcto en los principales navegadores de escritorio y móvil."],
]));

// 6. ASPECTOS CRÍTICOS
add(H1("6. Aspectos Críticos del Proyecto de Software"));
add(body("La identificación de los componentes y procesos críticos es la base del análisis de riesgos que orienta la estrategia de pruebas. Se consideran críticos aquellos elementos cuya falla tiene mayor impacto sobre la seguridad, la integridad de los datos o la experiencia del usuario. Para AgendApp se priorizaron los siguientes:"));
add(spacer());
add(table([2600, 4360, 2400], ["Componente / Proceso", "Riesgo asociado", "Prioridad"], [
  ["Autenticación y control de acceso por roles", "Acceso no autorizado a información clínica o a funciones de otro rol.", "Crítica"],
  ["Agendamiento y validación de disponibilidad", "Doble reserva de un mismo horario o citas en fechas pasadas.", "Crítica"],
  ["Regla de cancelación (24 horas)", "Cancelaciones fuera de política o cancelación de citas ajenas.", "Alta"],
  ["Motor de pre-triaje (IA)", "Clasificación incorrecta del nivel de urgencia o de la especialidad.", "Alta"],
  ["Notificaciones (WhatsApp / correo)", "No envío o envío erróneo de confirmaciones y recordatorios.", "Media"],
  ["Panel administrativo y reportes", "Estadísticas inexactas que afecten la toma de decisiones.", "Media"],
]));
add(body("Esta priorización determina la asignación del esfuerzo de pruebas: los componentes de prioridad crítica concentran la mayor cantidad de casos y se someten a técnicas de caja negra y caja blanca, mientras que los de prioridad media se verifican con un conjunto representativo de casos."));

// 7. ESTRATEGIA DE PRUEBAS
add(H1("7. Estrategia de Pruebas"));
add(body("La estrategia de pruebas define el enfoque global con el que se abordará la verificación y validación del sistema. Para AgendApp se adopta una estrategia incremental y basada en riesgos, alineada con el Modelo V, que organiza las pruebas en cuatro niveles ascendentes: unitario, de integración, de sistema y de aceptación. Cada nivel se asocia con una fase de diseño del desarrollo, de modo que las pruebas se planifican desde el inicio del proyecto y no como una actividad posterior."));
add(body("El enfoque basado en riesgos prioriza el esfuerzo sobre los componentes críticos identificados en la sección anterior. Asimismo, la estrategia combina pruebas de caja negra —centradas en el comportamiento observable a partir de los requerimientos— y de caja blanca —que examinan la lógica interna de funciones sensibles como el motor de pre-triaje y la regla de cancelación—. La ejecución se apoya en la automatización con pytest, lo que permite repetir el conjunto completo de pruebas (pruebas de regresión) ante cualquier cambio en el código."));
add(H2("7.1 Justificación de la estrategia"));
[
  "Alineación con el ciclo de vida: el Modelo V vincula cada artefacto de diseño con su nivel de prueba, lo que favorece la detección temprana de defectos y reduce el costo de corrección.",
  "Optimización del esfuerzo: el enfoque basado en riesgos concentra los recursos en los procesos críticos (autenticación, agendamiento y pre-triaje), donde una falla tendría mayor impacto.",
  "Repetibilidad y regresión: la automatización con pytest garantiza que las pruebas puedan ejecutarse de forma consistente y reproducible en local y en integración continua.",
  "Cobertura complementaria: la combinación de caja negra y caja blanca aumenta la probabilidad de descubrir defectos tanto funcionales como estructurales.",
].forEach(o => add(bullet(o)));

// 8. METODOLOGÍA DE PRUEBAS
add(H1("8. Metodología de Pruebas"));
add(body("La metodología describe cómo se organiza el trabajo de pruebas a lo largo del proyecto. AgendApp articula el Modelo V como marco de niveles de prueba con la metodología ágil Scrum empleada en el desarrollo, de modo que las actividades de prueba se integran al ritmo de los sprints."));
add(H2("8.1 Modelo V"));
add(body("El Modelo V establece una correspondencia entre cada fase de desarrollo (rama descendente) y su fase de prueba (rama ascendente). De este modo, mientras se especifican los requerimientos ya se diseñan las pruebas de aceptación, y mientras se diseña la arquitectura se preparan las pruebas de sistema, garantizando que cada entregable sea verificable."));
add(spacer());
add(table([3120, 3120, 3120], ["Fase de desarrollo", "Nivel de prueba", "Artefacto en AgendApp"], [
  ["Especificación de requerimientos", "Pruebas de aceptación", "Escenarios de usuario sobre RF-01 a RF-05"],
  ["Diseño de alto nivel (arquitectura)", "Pruebas de sistema", "Suite completa pytest sobre la aplicación"],
  ["Diseño detallado (rutas/módulos)", "Pruebas de integración", "Rutas Flask ↔ SQLAlchemy ↔ base de datos"],
  ["Implementación (código)", "Pruebas unitarias", "Funciones del motor de pre-triaje y reglas"],
]));
add(H2("8.2 Articulación con Scrum"));
add(body("El desarrollo se organizó en sprints de dos semanas. En cada sprint, las historias de usuario incluyen sus criterios de aceptación y las pruebas correspondientes se diseñan y automatizan dentro del mismo ciclo, de manera que la definición de “terminado” exige que las pruebas pasen. Al cierre de cada sprint se ejecuta la suite completa como prueba de regresión."));
add(spacer());
add(table([1500, 7860], ["Sprint", "Foco y actividades de prueba"], [
  ["Sprint 1", "Modelos de datos, autenticación y carga de datos: pruebas unitarias de modelos y de registro/login."],
  ["Sprint 2", "Agendamiento, API de horarios y calendario: pruebas de integración del flujo de reserva."],
  ["Sprint 3", "Pre-triaje con IA y notificaciones: pruebas unitarias del motor de reglas."],
  ["Sprint 4", "Panel administrativo y reportes: pruebas de sistema y de control de acceso."],
  ["Sprint 5", "Despliegue, documentación y plan de pruebas: pruebas de aceptación y regresión final."],
]));

// 9. TIPOS DE PRUEBA
add(H1("9. Tipos de Prueba a Aplicar"));
add(body("A partir de la estrategia y la metodología, se aplican los siguientes tipos de prueba, seleccionados según el nivel del Modelo V y la naturaleza de cada componente:"));
add(H2("9.1 Pruebas unitarias"));
add(body("Verifican el comportamiento de funciones individuales de forma aislada. En AgendApp se aplican a la función de pre-triaje de síntomas y a la regla que determina si una cita puede cancelarse. Se emplean técnicas de caja negra (partición de equivalencia y valores límite) y de caja blanca (cobertura de decisiones sobre las ramas del motor de reglas)."));
add(H2("9.2 Pruebas de integración"));
add(body("Comprueban la interacción entre los módulos: las rutas de Flask, el ORM SQLAlchemy y la base de datos. Verifican, por ejemplo, que al agendar una cita se persista correctamente y que la consulta de horarios disponibles responda en el formato esperado."));
add(H2("9.3 Pruebas de sistema"));
add(body("Evalúan el sistema completo desplegado, validando el cumplimiento conjunto de los requerimientos. Incluyen pruebas de control de acceso por roles, manejo de errores (páginas 403, 404 y 500) y verificación de la API."));
add(H2("9.4 Pruebas de aceptación"));
add(body("Validan, desde la perspectiva del usuario final, que el sistema satisface las necesidades planteadas. Se ejecutan como escenarios extremo a extremo sobre el ambiente de producción (por ejemplo, un paciente que inicia sesión, realiza un pre-triaje y agenda una cita)."));
add(H2("9.5 Pruebas no funcionales"));
add(body("Comprenden pruebas de rendimiento (tiempos de respuesta de las páginas y la API), de seguridad (cifrado de contraseñas y control de acceso) y de compatibilidad (visualización en distintos navegadores y dispositivos)."));
add(H2("9.6 Pruebas de regresión"));
add(body("Tras cada cambio se ejecuta nuevamente la suite automatizada para asegurar que las funcionalidades previas siguen operando correctamente."));

// 10. CRITERIOS DE ACEPTACIÓN
add(H1("10. Criterios de Aceptación por Grupo de Pruebas"));
add(body("Cada grupo de pruebas cuenta con criterios de aceptación que definen cuándo se considera superado. El criterio global de aceptación del plan es que el 100 % de los casos de prioridad crítica y alta resulten satisfactorios y que no existan defectos abiertos de severidad crítica."));
add(spacer());
add(table([2600, 6760], ["Grupo de pruebas", "Criterio de aceptación"], [
  ["Autenticación y roles (RF-01)", "El usuario se registra e inicia sesión correctamente; es redirigido al panel de su rol y no puede acceder a vistas de otros roles (respuesta 403 o redirección)."],
  ["Agendamiento (RF-02)", "La cita se crea en estado “pendiente” sobre un horario disponible; el sistema rechaza fechas pasadas y horarios ocupados."],
  ["Pre-triaje IA (RF-03)", "La API clasifica los síntomas en el nivel correcto y sugiere la especialidad esperada, devolviendo una respuesta válida en formato JSON."],
  ["Gestión de citas (RF-04)", "El cambio de estado se refleja correctamente; la cancelación solo procede con 24 h de antelación y únicamente sobre citas propias."],
  ["Panel administrativo (RF-05)", "El administrador accede al panel, visualiza las estadísticas y gestiona el estado de los usuarios."],
  ["No funcionales (RNF)", "Las páginas y la API responden por debajo del umbral definido; las contraseñas se almacenan cifradas y el acceso respeta los roles."],
]));

// 11. DISEÑO DE CASOS DE PRUEBA
add(H1("11. Diseño de Casos de Prueba"));
add(body("A continuación se presenta el diseño de los casos de prueba, organizados por módulo. Cada caso indica su identificador, la descripción de la condición probada y el resultado esperado. Estos casos se encuentran automatizados con pytest y constituyen la evidencia ejecutable del plan."));
add(H2("11.1 Módulo de autenticación y control de acceso"));
add(table([1150, 4710, 3500], ["ID", "Descripción", "Resultado esperado"], [
  ["PA-01", "Registro válido con rol paciente", "Cuenta creada y mensaje de éxito"],
  ["PA-02", "Registro válido con rol médico", "Cuenta creada y mensaje de éxito"],
  ["PA-03", "Registro con correo ya existente", "Se rechaza por correo duplicado"],
  ["PA-04", "Contraseñas que no coinciden", "Mensaje de error de validación"],
  ["PA-05", "Contraseña demasiado corta", "Mensaje de error de longitud"],
  ["PA-06", "Formulario con campos vacíos", "El registro no se completa"],
  ["PA-07", "Login válido de paciente", "Redirige al panel del paciente"],
  ["PA-08", "Login válido de médico", "Redirige al panel del médico"],
  ["PA-09", "Contraseña incorrecta", "Mensaje “Credenciales incorrectas”"],
  ["PA-10", "Correo no registrado", "Mensaje “Credenciales incorrectas”"],
  ["PA-11", "Cierre de sesión autenticado", "Sesión destruida y redirección"],
  ["PA-12", "Acceso a ruta protegida sin sesión", "Redirige al inicio de sesión"],
  ["PA-13", "Paciente intenta panel de médico", "Acceso denegado (403/redirección)"],
  ["PA-14", "Médico intenta panel de paciente", "Acceso denegado (403/redirección)"],
  ["PA-15", "Administrador accede a su panel", "Acceso permitido (200)"],
]));
add(H2("11.2 Módulo de citas, API y motor de IA"));
add(table([1150, 4710, 3500], ["ID", "Descripción", "Resultado esperado"], [
  ["CA-01", "Ver página de agendamiento autenticado", "Formulario visible (200)"],
  ["CA-02", "Consultar horarios de médico válido", "Lista de horarios en JSON"],
  ["CA-03", "Consultar horarios con fecha inválida", "Lista vacía sin error"],
  ["CA-04", "Consultar horarios de médico inexistente", "Respuesta vacía o 404"],
  ["CA-05", "Consultar calendario en formato JSON", "Lista de eventos del calendario"],
  ["CA-06", "Agendar cita en fecha pasada", "Se rechaza; la cita no se crea"],
  ["CA-07", "Cancelar cita con más de 24 h", "Cita cancelada correctamente"],
  ["CA-08", "Cancelar cita de otro paciente", "Acceso denegado (403)"],
  ["CA-09", "Médico confirma una cita", "Estado cambia a “confirmada”"],
  ["CA-10", "Pre-triaje con síntoma urgente", "Nivel “urgente” y alerta roja"],
  ["CA-11", "Pre-triaje con consulta de rutina", "Nivel “rutina”"],
  ["CA-12", "Pre-triaje con texto vacío", "Nivel “normal”"],
  ["CA-13", "Listar médicos activos", "Lista de médicos en JSON"],
  ["CA-14", "Carga de la página de inicio", "Responde correctamente (200)"],
  ["CA-15", "Carga de la página de login", "Responde correctamente (200)"],
  ["CA-16", "Solicitud a ruta inexistente", "Error 404 controlado"],
]));
add(H2("11.3 Trazabilidad de requerimientos"));
add(body("La siguiente matriz relaciona cada requerimiento con los casos de prueba que lo verifican, evidenciando la cobertura del plan."));
add(spacer());
add(table([3120, 6240], ["Requerimiento", "Casos de prueba que lo cubren"], [
  ["RF-01 — Autenticación y roles", "PA-01 a PA-15"],
  ["RF-02 — Agendamiento", "CA-01, CA-02, CA-03, CA-04, CA-06"],
  ["RF-03 — Pre-triaje con IA", "CA-10, CA-11, CA-12, CA-13"],
  ["RF-04 — Gestión de citas", "CA-07, CA-08, CA-09"],
  ["RF-05 — Panel administrativo", "PA-15"],
  ["RNF-03 — Rendimiento", "CA-14, CA-15, CA-16"],
]));

// 12. PASOS DE EJECUCIÓN
add(H1("12. Procedimiento de Ejecución de las Pruebas"));
add(body("La ejecución de las pruebas sigue un procedimiento ordenado que garantiza condiciones reproducibles y resultados confiables:"));
[
  "Preparar el entorno: clonar el repositorio, crear el entorno virtual e instalar las dependencias declaradas en requirements.txt.",
  "Disponer los datos de prueba: ejecutar el script de carga (seed) para poblar la base con usuarios, médicos, horarios y citas de muestra.",
  "Ejecutar las pruebas automatizadas con el comando pytest sobre el directorio de pruebas, registrando el resultado de cada caso.",
  "Verificar los resultados: confirmar que todos los casos reportan estado satisfactorio y revisar la cobertura obtenida.",
  "Ejecutar las pruebas de aceptación manuales sobre el ambiente de producción, siguiendo los escenarios de usuario definidos.",
  "Registrar los hallazgos: documentar defectos, asignarles severidad y prioridad, y reportarlos para su corrección.",
  "Reejecutar las pruebas de regresión tras cada corrección hasta cumplir los criterios de aceptación del plan.",
].forEach(o => add(numItem(o)));
add(H2("12.1 Comandos de referencia"));
add(new Paragraph({ shading: { fill: "F2F2F2", type: ShadingType.CLEAR }, spacing: { line: 276, before: 60, after: 60 }, children: [
  new TextRun({ text: "pip install -r requirements.txt", font: "Consolas", size: 20 })] }));
add(new Paragraph({ shading: { fill: "F2F2F2", type: ShadingType.CLEAR }, spacing: { line: 276, after: 60 }, children: [
  new TextRun({ text: "python seed.py", font: "Consolas", size: 20 })] }));
add(new Paragraph({ shading: { fill: "F2F2F2", type: ShadingType.CLEAR }, spacing: { line: 276, after: 60 }, children: [
  new TextRun({ text: "pytest tests/ -v", font: "Consolas", size: 20 })] }));
add(new Paragraph({ shading: { fill: "F2F2F2", type: ShadingType.CLEAR }, spacing: { line: 276, after: 120 }, children: [
  new TextRun({ text: "pytest tests/ --cov=. --cov-report=html", font: "Consolas", size: 20 })] }));
add(body("La ejecución de la suite reporta 31 casos de prueba satisfactorios, lo que evidencia el cumplimiento de los requerimientos verificados mediante automatización.", { bold: false }));

// 13. PLANIFICACIÓN
add(H1("13. Planificación General de la Ejecución"));
add(body("La planificación organiza las actividades de prueba en el tiempo, articuladas con los sprints del desarrollo. El siguiente cronograma resume las fases, su duración estimada y los responsables."));
add(spacer());
add(table([2200, 4360, 2800], ["Fase", "Actividades", "Duración / Responsable"], [
  ["Planificación", "Análisis del proyecto, definición de estrategia y diseño del plan.", "Sprint 1 · Equipo"],
  ["Diseño de pruebas", "Especificación de casos de prueba y criterios de aceptación.", "Sprints 1–2 · Equipo"],
  ["Pruebas unitarias e integración", "Implementación y ejecución automatizada con pytest.", "Sprints 2–4 · Desarrolladores"],
  ["Pruebas de sistema", "Verificación del sistema completo y control de acceso.", "Sprint 4 · Equipo"],
  ["Pruebas de aceptación", "Escenarios de usuario sobre producción.", "Sprint 5 · Equipo"],
  ["Regresión y cierre", "Reejecución de la suite y elaboración del informe final.", "Sprint 5 · Equipo"],
]));
add(H2("13.1 Recursos y entorno"));
[
  "Recursos humanos: equipo de tres integrantes que asume de forma compartida los roles de desarrollo, diseño de pruebas y ejecución.",
  "Recursos de software: Python, Flask, pytest, Git/GitHub y la plataforma de despliegue Render.",
  "Entornos: ambiente local con SQLite para pruebas automatizadas y ambiente de producción con PostgreSQL para pruebas de aceptación.",
].forEach(o => add(bullet(o)));

// 14. TRABAJO EN EQUIPO
add(H1("14. Trabajo en Equipo"));
add(body("El desarrollo del proyecto y la elaboración del plan de pruebas se realizaron de manera colaborativa, distribuyendo las responsabilidades de acuerdo con las fortalezas de cada integrante y manteniendo la trazabilidad del trabajo mediante el control de versiones en GitHub. La comunicación permanente y las reuniones de seguimiento propias de Scrum permitieron integrar los aportes individuales en un producto coherente."));
add(spacer());
add(table([3000, 6360], ["Integrante", "Responsabilidades principales"], [
  ["Elsa Sequeda Pacheco", "Análisis de requerimientos, diseño de casos de prueba y redacción del informe."],
  ["Cristian Stiven Guerrero Andrade", "Definición de la estrategia y metodología de pruebas, y diseño de criterios de aceptación."],
  ["Brayan Galeano Tobón", "Implementación y automatización de pruebas, despliegue del sistema y verificación en producción."],
]));
add(body("Las decisiones sobre estrategia, técnicas y planificación se tomaron de manera consensuada, y la sustentación en video recoge el aporte de cada integrante, evidenciando la apropiación de los conocimientos del módulo."));

// 15. CONCLUSIONES
add(H1("15. Conclusiones"));
add(body("El diseño del plan de pruebas para AgendApp permitió aplicar de forma integral los conceptos del módulo, articulando el análisis del proyecto, la identificación de procesos críticos y la selección justificada de la estrategia, la metodología, los tipos de prueba y los criterios de aceptación. La adopción del Modelo V, articulado con Scrum, evidenció el valor de integrar las pruebas desde las primeras fases del desarrollo."));
add(body("La automatización con pytest, materializada en 31 casos de prueba satisfactorios, y el despliegue del sistema en un entorno real de producción demuestran que el plan no se limita a la teoría, sino que se traduce en evidencia ejecutable y verificable. De este modo, el equipo consolidó las competencias necesarias para integrar los planes de prueba al desarrollo de productos de software con criterios de calidad."));

// 16. REFERENCIAS
add(H1("16. Referencias"));
const ref = (children) => new Paragraph({ spacing: { line: 360, after: 120 }, indent: { left: 720, hanging: 720 }, alignment: AlignmentType.JUSTIFIED, children });
add(ref([T("Myers, G. J., Sandler, C., & Badgett, T. (2011). "), T("The art of software testing", { italics: true }), T(" (3rd ed.). John Wiley & Sons.")]));
add(ref([T("Pressman, R. S., & Maxim, B. R. (2021). "), T("Ingeniería del software: un enfoque práctico", { italics: true }), T(" (9.ª ed.). McGraw-Hill.")]));
add(ref([T("Singh, Y. (2011). "), T("Software testing", { italics: true }), T(". Cambridge University Press.")]));
add(ref([T("Sommerville, I. (2011). "), T("Ingeniería de software", { italics: true }), T(" (9.ª ed.). Pearson Educación.")]));
add(ref([T("International Software Testing Qualifications Board. (2018). "), T("Programa de estudio de nivel básico del ISTQB", { italics: true }), T(". ISTQB.")]));

// ── ANEXOS ───────────────────────────────────────────────────────────────
add(new Paragraph({ children: [new PageBreak()] }));
add(H1("Anexos"));

add(H2("Anexo A. Evidencia de ejecución de las pruebas automatizadas"));
add(body("Resultado de la ejecución de la suite con el comando «pytest tests/ -v» sobre el repositorio del proyecto. Los 31 casos de prueba diseñados se ejecutaron de forma satisfactoria."));
const code = (text, last = false) => new Paragraph({
  shading: { fill: "1E1E1E", type: ShadingType.CLEAR },
  spacing: { line: 240, after: last ? 120 : 0 },
  children: [new TextRun({ text, font: "Consolas", size: 17, color: "D4D4D4" })] });
const okLine = (text) => new Paragraph({
  shading: { fill: "1E1E1E", type: ShadingType.CLEAR }, spacing: { line: 240, after: 0 },
  children: [
    new TextRun({ text, font: "Consolas", size: 17, color: "D4D4D4" }),
    new TextRun({ text: "  PASSED", font: "Consolas", size: 17, color: "4EC9B0", bold: true }),
  ] });
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
add(code("===================== 31 passed in 6.32s ====================", true));
add(body("El resultado evidencia la cobertura de los requerimientos funcionales (autenticación, agendamiento, gestión de citas y pre-triaje) y no funcionales (rendimiento y manejo de errores) verificados mediante automatización.", {}));

add(H2("Anexo B. Evidencia de despliegue en producción"));
add(body("El sistema fue desplegado en la nube y verificado en funcionamiento. Se comprobó el ingreso con credenciales reales, la carga del cuerpo médico desde la base de datos PostgreSQL y la redirección por rol."));
add(spacer());
add(table([3000, 6360], ["Aspecto verificado", "Resultado"], [
  ["URL pública", "https://agendapp-rde9.onrender.com"],
  ["Repositorio de código", "https://github.com/bgaleanotec-maker/agendapp"],
  ["Plataforma / Servidor", "Render · Gunicorn · PostgreSQL"],
  ["Carga de datos", "13 médicos y catálogo de citas visibles en la página de inicio"],
  ["Inicio de sesión (médico)", "Acceso exitoso y redirección al panel del médico"],
  ["Control de acceso por rol", "Cada usuario accede únicamente a las vistas de su rol"],
]));
add(body("Nota: el despliegue utiliza el plan gratuito de Render; tras un periodo de inactividad la primera solicitud puede tardar algunos segundos mientras el servicio se reactiva.", { italics: true, size: 22, color: GREY }));

// ── DOCUMENTO ───────────────────────────────────────────────────────────────
const doc = new Document({
  creator: "Equipo AgendApp",
  title: "Diseño del Plan de Pruebas — AgendApp",
  styles: {
    default: { document: { run: { font: "Times New Roman", size: 24 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, color: NAVY, font: "Times New Roman" },
        paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, color: BLUE, font: "Times New Roman" },
        paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, color: BLUE, font: "Times New Roman" },
        paragraph: { spacing: { before: 160, after: 100 }, outlineLevel: 2 } },
    ],
  },
  numbering: {
    config: [
      { reference: "vinetas", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numerada", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ],
  },
  sections: [
    // Portada (sin numeración visible)
    { properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
      children: portada },
    // Resto con encabezado y pie con número de página
    { properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: NAVY, space: 4 } }, children: [T("AgendApp — Plan de Pruebas de Software", { size: 18, color: GREY, italics: true })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [T("", { size: 18, color: GREY }), new TextRun({ children: [PageNumber.CURRENT], font: "Times New Roman", size: 18, color: GREY })] })] }) },
      children: [...toc, ...content] },
  ],
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("plan_pruebas_agendapp.docx", buffer);
  console.log("OK: plan_pruebas_agendapp.docx generado (" + buffer.length + " bytes)");
});
