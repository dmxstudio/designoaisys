const STORAGE_KEY = "designo-aisys-project";

const phases = [
  {
    id: "vision",
    label: "Producto",
    kicker: "Base estrategica",
    title: "Define que estas construyendo y por que importa.",
    description:
      "Captura el contexto de negocio, usuarios, alcance inicial y criterios de exito antes de pedir codigo.",
  },
  {
    id: "data",
    label: "Datos",
    kicker: "Modelo operativo",
    title: "Mapea entidades, estados y reglas del sistema.",
    description:
      "Convierte requerimientos abiertos en estructuras que un equipo o agente pueda implementar sin adivinar.",
  },
  {
    id: "system",
    label: "Sistema",
    kicker: "Lenguaje visual",
    title: "Establece una direccion visual reutilizable.",
    description:
      "Documenta colores, tipografia, componentes base, patrones de pantalla y decisiones de interfaz.",
  },
  {
    id: "sections",
    label: "Secciones",
    kicker: "Flujos por area",
    title: "Disena las areas clave del producto.",
    description:
      "Divide el producto por modulos, describe pantallas, acciones, estados vacios y casos limite.",
  },
  {
    id: "handoff",
    label: "Exportar",
    kicker: "Entrega accionable",
    title: "Genera un brief claro para construir.",
    description:
      "Reune el estado del proyecto en un paquete que sirve como fuente de verdad para implementacion.",
  },
];

const defaults = {
  activePhase: "vision",
  projectName: "Nuevo producto",
  audience: "Equipos que crean software con asistencia de IA",
  outcome: "Una especificacion accionable para construir una primera version",
  constraints: "Mantener una experiencia simple, clara y facil de iterar",
  entities: [
    { name: "Usuario", fields: "nombre, correo, rol, estado", rules: "Puede pertenecer a una o varias areas" },
    { name: "Proyecto", fields: "nombre, objetivo, fase, prioridad", rules: "Debe tener un responsable y fecha de revision" },
    { name: "Entrega", fields: "tipo, contenido, version, estado", rules: "Solo se marca lista cuando tiene criterios de aceptacion" },
  ],
  visual: {
    primary: "#0F766E",
    accent: "#EAB308",
    surface: "#F8FAFC",
    text: "#172033",
    typography: "Inter",
    tone: "Profesional, directo y orientado a trabajo real",
  },
  sections: [
    {
      name: "Panel principal",
      goal: "Mostrar progreso, proximas decisiones y riesgos abiertos",
      screens: "Resumen, detalle de fase, actividad reciente",
      states: "Sin proyecto, datos incompletos, listo para exportar",
    },
    {
      name: "Plan de producto",
      goal: "Ordenar vision, usuarios, objetivos y alcance",
      screens: "Brief, roadmap, criterios de exito",
      states: "Borrador, pendiente de decision, aprobado",
    },
    {
      name: "Entrega",
      goal: "Preparar un paquete legible para implementacion",
      screens: "Vista previa, exportacion JSON, exportacion Markdown",
      states: "Faltan datos, exportado, version archivada",
    },
  ],
};

let state = loadState();

function loadState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? { ...defaults, ...JSON.parse(stored) } : structuredClone(defaults);
  } catch {
    return structuredClone(defaults);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function setState(patch) {
  state = { ...state, ...patch };
  saveState();
  render();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function activePhase() {
  return phases.find((phase) => phase.id === state.activePhase) ?? phases[0];
}

function completionScore() {
  const checks = [
    state.projectName,
    state.audience,
    state.outcome,
    state.constraints,
    state.entities.length,
    state.visual.primary,
    state.visual.typography,
    state.sections.length,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function field(id, label, value, placeholder, rows = 1) {
  const safeValue = escapeHtml(value);
  const safePlaceholder = escapeHtml(placeholder);
  if (rows > 1) {
    return `
      <label class="field">
        <span>${label}</span>
        <textarea id="${id}" rows="${rows}" placeholder="${safePlaceholder}">${safeValue}</textarea>
      </label>
    `;
  }

  return `
    <label class="field">
      <span>${label}</span>
      <input id="${id}" value="${safeValue}" placeholder="${safePlaceholder}" />
    </label>
  `;
}

function render() {
  const phase = activePhase();
  document.querySelector("#app").innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <a class="brand" href="#" data-action="phase" data-phase="vision" aria-label="Designo Aisys">
          <span class="brand-mark">DA</span>
          <span>
            <strong>Designo Aisys</strong>
            <small>Product design workspace</small>
          </span>
        </a>

        <nav class="phase-list" aria-label="Fases del proyecto">
          ${phases
            .map(
              (item, index) => `
                <button class="phase-link ${item.id === state.activePhase ? "is-active" : ""}" data-action="phase" data-phase="${item.id}">
                  <span class="phase-index">${index + 1}</span>
                  <span>
                    <strong>${item.label}</strong>
                    <small>${item.kicker}</small>
                  </span>
                </button>
              `,
            )
            .join("")}
        </nav>

        <div class="status-panel">
          <div>
            <span class="muted">Preparacion</span>
            <strong>${completionScore()}%</strong>
          </div>
          <div class="progress-track"><span style="width: ${completionScore()}%"></span></div>
          <p>Completa las secciones para generar un brief consistente.</p>
        </div>
      </aside>

      <main class="workspace">
        <header class="topbar">
          <div>
            <span class="eyebrow">${phase.kicker}</span>
            <h1>${phase.title}</h1>
            <p>${phase.description}</p>
          </div>
          <div class="topbar-actions">
            <button class="icon-button" data-action="reset" title="Restablecer proyecto" aria-label="Restablecer proyecto">↺</button>
            <button class="primary-button" data-action="download-json">Exportar JSON</button>
          </div>
        </header>

        ${renderPhaseContent()}
      </main>
    </div>
  `;

  bindEvents();
}

function renderPhaseContent() {
  if (state.activePhase === "vision") return renderVision();
  if (state.activePhase === "data") return renderData();
  if (state.activePhase === "system") return renderSystem();
  if (state.activePhase === "sections") return renderSections();
  return renderHandoff();
}

function renderVision() {
  return `
    <section class="content-grid">
      <div class="panel wide">
        <div class="panel-header">
          <span class="panel-icon">01</span>
          <div>
            <h2>Brief del producto</h2>
            <p>Define el norte del proyecto antes de pasar al diseno funcional.</p>
          </div>
        </div>
        <div class="form-grid">
          ${field("projectName", "Nombre", state.projectName, "Nombre del producto")}
          ${field("audience", "Audiencia", state.audience, "Usuarios o compradores principales")}
          ${field("outcome", "Resultado esperado", state.outcome, "Que debe lograr la primera version", 3)}
          ${field("constraints", "Restricciones", state.constraints, "Tecnicas, visuales, negocio o tiempos", 3)}
        </div>
      </div>

      <div class="panel">
        <h2>Checklist</h2>
        <ul class="checklist">
          <li><span></span> Problema definido</li>
          <li><span></span> Usuario principal identificado</li>
          <li><span></span> Alcance inicial limitado</li>
          <li><span></span> Criterios de exito escritos</li>
        </ul>
      </div>
    </section>
  `;
}

function renderData() {
  return `
    <section class="stack">
      <div class="panel">
        <div class="panel-header">
          <span class="panel-icon">02</span>
          <div>
            <h2>Entidades del producto</h2>
            <p>Lista los objetos que el sistema debe crear, leer, cambiar o relacionar.</p>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Entidad</th>
                <th>Campos</th>
                <th>Reglas</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${state.entities.map((entity, index) => renderEntityRow(entity, index)).join("")}
            </tbody>
          </table>
        </div>
        <button class="secondary-button" data-action="add-entity">Agregar entidad</button>
      </div>
    </section>
  `;
}

function renderEntityRow(entity, index) {
  return `
    <tr>
      <td><input data-entity="${index}" data-key="name" value="${escapeHtml(entity.name)}" /></td>
      <td><input data-entity="${index}" data-key="fields" value="${escapeHtml(entity.fields)}" /></td>
      <td><input data-entity="${index}" data-key="rules" value="${escapeHtml(entity.rules)}" /></td>
      <td><button class="small-button" data-action="remove-entity" data-index="${index}">Quitar</button></td>
    </tr>
  `;
}

function renderSystem() {
  return `
    <section class="content-grid">
      <div class="panel wide">
        <div class="panel-header">
          <span class="panel-icon">03</span>
          <div>
            <h2>Sistema visual</h2>
            <p>Documenta decisiones que deberian repetirse en toda la interfaz.</p>
          </div>
        </div>
        <div class="form-grid compact">
          ${field("typography", "Tipografia", state.visual.typography, "Familia tipografica")}
          ${field("tone", "Tono de interfaz", state.visual.tone, "Como debe sentirse el producto", 3)}
          <label class="field color-field">
            <span>Color primario</span>
            <input id="primary" type="color" value="${escapeHtml(state.visual.primary)}" />
          </label>
          <label class="field color-field">
            <span>Color acento</span>
            <input id="accent" type="color" value="${escapeHtml(state.visual.accent)}" />
          </label>
          <label class="field color-field">
            <span>Superficie</span>
            <input id="surface" type="color" value="${escapeHtml(state.visual.surface)}" />
          </label>
          <label class="field color-field">
            <span>Texto</span>
            <input id="text" type="color" value="${escapeHtml(state.visual.text)}" />
          </label>
        </div>
      </div>

      <div class="preview-card" style="--preview-primary: ${state.visual.primary}; --preview-accent: ${state.visual.accent}; --preview-surface: ${state.visual.surface}; --preview-text: ${state.visual.text};">
        <span>Vista previa</span>
        <h2>${escapeHtml(state.projectName)}</h2>
        <p>${escapeHtml(state.outcome)}</p>
        <div class="preview-actions">
          <button>Accion principal</button>
          <button>Secundaria</button>
        </div>
      </div>
    </section>
  `;
}

function renderSections() {
  return `
    <section class="stack">
      <div class="section-board">
        ${state.sections.map((section, index) => renderSectionCard(section, index)).join("")}
        <button class="add-card" data-action="add-section">Agregar seccion</button>
      </div>
    </section>
  `;
}

function renderSectionCard(section, index) {
  return `
    <article class="section-card">
      <div class="card-toolbar">
        <span>Modulo ${index + 1}</span>
        <button class="small-button" data-action="remove-section" data-index="${index}">Quitar</button>
      </div>
      ${field(`section-name-${index}`, "Nombre", section.name, "Nombre de la seccion")}
      ${field(`section-goal-${index}`, "Objetivo", section.goal, "Que debe resolver", 3)}
      ${field(`section-screens-${index}`, "Pantallas", section.screens, "Pantallas principales", 3)}
      ${field(`section-states-${index}`, "Estados", section.states, "Vacio, carga, error, exito", 3)}
    </article>
  `;
}

function renderHandoff() {
  const markdown = buildMarkdown();
  return `
    <section class="content-grid">
      <div class="panel wide">
        <div class="panel-header">
          <span class="panel-icon">05</span>
          <div>
            <h2>Brief de implementacion</h2>
            <p>Usa este documento como punto de partida para construir la aplicacion.</p>
          </div>
        </div>
        <pre class="handoff-preview">${escapeHtml(markdown)}</pre>
        <div class="button-row">
          <button class="primary-button" data-action="download-md">Descargar Markdown</button>
          <button class="secondary-button" data-action="download-json">Descargar JSON</button>
        </div>
      </div>
      <div class="panel">
        <h2>Paquete</h2>
        <ul class="metric-list">
          <li><strong>${state.entities.length}</strong><span>entidades</span></li>
          <li><strong>${state.sections.length}</strong><span>secciones</span></li>
          <li><strong>${completionScore()}%</strong><span>preparacion</span></li>
        </ul>
      </div>
    </section>
  `;
}

function bindEvents() {
  document.querySelectorAll("[data-action='phase']").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      setState({ activePhase: button.dataset.phase });
    });
  });

  bindInput("projectName", (value) => setState({ projectName: value }));
  bindInput("audience", (value) => setState({ audience: value }));
  bindInput("outcome", (value) => setState({ outcome: value }));
  bindInput("constraints", (value) => setState({ constraints: value }));

  ["typography", "tone", "primary", "accent", "surface", "text"].forEach((key) => {
    bindInput(key, (value) => setState({ visual: { ...state.visual, [key]: value } }));
  });

  document.querySelectorAll("[data-entity]").forEach((input) => {
    input.addEventListener("input", () => {
      const entities = [...state.entities];
      entities[Number(input.dataset.entity)] = {
        ...entities[Number(input.dataset.entity)],
        [input.dataset.key]: input.value,
      };
      state = { ...state, entities };
      saveState();
    });
  });

  state.sections.forEach((_, index) => {
    bindInput(`section-name-${index}`, (value) => updateSection(index, { name: value }), false);
    bindInput(`section-goal-${index}`, (value) => updateSection(index, { goal: value }), false);
    bindInput(`section-screens-${index}`, (value) => updateSection(index, { screens: value }), false);
    bindInput(`section-states-${index}`, (value) => updateSection(index, { states: value }), false);
  });

  document.querySelectorAll("[data-action='add-entity']").forEach((button) => {
    button.addEventListener("click", () => {
      setState({
        entities: [...state.entities, { name: "Nueva entidad", fields: "campo, estado", rules: "Regla principal" }],
      });
    });
  });

  document.querySelectorAll("[data-action='remove-entity']").forEach((button) => {
    button.addEventListener("click", () => {
      setState({ entities: state.entities.filter((_, index) => index !== Number(button.dataset.index)) });
    });
  });

  document.querySelectorAll("[data-action='add-section']").forEach((button) => {
    button.addEventListener("click", () => {
      setState({
        sections: [
          ...state.sections,
          { name: "Nueva seccion", goal: "Objetivo", screens: "Pantallas", states: "Estados clave" },
        ],
      });
    });
  });

  document.querySelectorAll("[data-action='remove-section']").forEach((button) => {
    button.addEventListener("click", () => {
      setState({ sections: state.sections.filter((_, index) => index !== Number(button.dataset.index)) });
    });
  });

  document.querySelectorAll("[data-action='download-json']").forEach((button) => {
    button.addEventListener("click", downloadJson);
  });

  document.querySelectorAll("[data-action='download-md']").forEach((button) => {
    button.addEventListener("click", downloadMarkdown);
  });

  document.querySelectorAll("[data-action='reset']").forEach((button) => {
    button.addEventListener("click", () => {
      state = structuredClone(defaults);
      saveState();
      render();
    });
  });
}

function bindInput(id, callback, rerender = true) {
  const input = document.getElementById(id);
  if (!input) return;
  input.addEventListener("input", () => {
    callback(input.value);
    if (!rerender) saveState();
  });
}

function updateSection(index, patch) {
  const sections = [...state.sections];
  sections[index] = { ...sections[index], ...patch };
  state = { ...state, sections };
  saveState();
}

function buildMarkdown() {
  return `# ${state.projectName}

## Vision
- Audiencia: ${state.audience}
- Resultado esperado: ${state.outcome}
- Restricciones: ${state.constraints}

## Modelo de datos
${state.entities.map((entity) => `- ${entity.name}: ${entity.fields}. Reglas: ${entity.rules}`).join("\n")}

## Sistema visual
- Tipografia: ${state.visual.typography}
- Tono: ${state.visual.tone}
- Color primario: ${state.visual.primary}
- Color acento: ${state.visual.accent}

## Secciones
${state.sections
  .map(
    (section) => `### ${section.name}
- Objetivo: ${section.goal}
- Pantallas: ${section.screens}
- Estados: ${section.states}`,
  )
  .join("\n\n")}
`;
}

function downloadJson() {
  downloadFile("designo-aisys-project.json", JSON.stringify(state, null, 2), "application/json");
}

function downloadMarkdown() {
  downloadFile("designo-aisys-brief.md", buildMarkdown(), "text/markdown");
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

render();
