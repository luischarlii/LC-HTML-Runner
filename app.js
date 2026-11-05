"use strict";

const htmlEditor = document.getElementById("htmlEditor");
const cssEditor = document.getElementById("cssEditor");
const jsEditor = document.getElementById("jsEditor");

const preview = document.getElementById("preview");
const fileInput = document.getElementById("fileInput");
const fileName = document.getElementById("fileName");
const consoleOutput = document.getElementById("consoleOutput");

const editors = {
  html: htmlEditor,
  css: cssEditor,
  js: jsEditor
};

let currentFile = "Sin título.html";
let installPrompt = null;


/* =========================
   CONSOLA
========================= */

function log(message, type = "info") {

  const icons = {
    info: "🟢",
    error: "🔴",
    warning: "🟡"
  };

  consoleOutput.textContent +=
    "\n" +
    (icons[type] || "•") +
    " " +
    String(message);

  consoleOutput.scrollTop =
    consoleOutput.scrollHeight;
}


function clearConsole() {

  consoleOutput.textContent =
    "Consola limpia.";

}


/* =========================
   PESTAÑAS
========================= */

document.querySelectorAll(".editor-tab")
  .forEach(tab => {

    tab.addEventListener("click", () => {

      const target =
        tab.dataset.editor;

      document
        .querySelectorAll(".editor-tab")
        .forEach(t =>
          t.classList.remove("active")
        );

      tab.classList.add("active");

      Object.keys(editors)
        .forEach(key => {

          editors[key].hidden =
            key !== target;

        });

      editors[target].focus();

    });

  });


/* =========================
   EJECUTAR
========================= */

function runCode() {

  const html =
    htmlEditor.value;

  const css =
    cssEditor.value;

  const js =
    jsEditor.value;


  consoleOutput.textContent =
    "Ejecutando proyecto...";


  const bridge = `
<script>
(() => {

  function send(type, args) {

    try {

      parent.postMessage({
        source: "LC_HTML_RUNNER",
        type: type,
        message: Array.from(args)
          .map(value => {

            try {

              if (
                typeof value === "object" &&
                value !== null
              ) {
                return JSON.stringify(value);
              }

              return String(value);

            } catch (error) {

              return String(value);

            }

          })
          .join(" ")

      }, "*");

    } catch (error) {}

  }


  ["log", "info", "warn", "error"]
    .forEach(type => {

      const original =
        console[type].bind(console);

      console[type] =
        (...args) => {

          original(...args);

          send(type, args);

        };

    });


  window.addEventListener(
    "error",
    event => {

      send(
        "error",
        [
          event.message +
          " (línea " +
          event.lineno +
          ")"
        ]
      );

    }
  );


  window.addEventListener(
    "unhandledrejection",
    event => {

      send(
        "error",
        [
          "Promesa rechazada:",
          event.reason
        ]
      );

    }
  );


  console.log(
    "LC HTML Runner: página iniciada"
  );

})();
<\/script>
`;


  const cssBlock =
    css.trim()
      ? `<style>${css}</style>`
      : "";


  const jsBlock =
    js.trim()
      ? `<script>
${js}
<\/script>`
      : "";


  let documentCode;


  if (
    /<html[\s>]/i.test(html)
  ) {

    documentCode =
      html.replace(
        /<head([^>]*)>/i,
        `<head$1>
${bridge}
${cssBlock}`
      );


    if (
      !/<head[\s>]/i.test(
        html
      )
    ) {

      documentCode =
        html.replace(
          /<html([^>]*)>/i,
          `<html$1>
<head>
${bridge}
${cssBlock}
</head>`
        );

    }


    if (
      /<\/body>/i.test(
        documentCode
      )
    ) {

      documentCode =
        documentCode.replace(
          /<\/body>/i,
          `${jsBlock}
</body>`
        );

    } else {

      documentCode +=
        jsBlock;

    }

  } else {

    documentCode = `
<!DOCTYPE html>

<html lang="es">

<head>

<meta charset="UTF-8">

<meta
name="viewport"
content="width=device-width, initial-scale=1"
>

${bridge}

${cssBlock}

</head>

<body>

${html}

${jsBlock}

</body>

</html>
`;

  }


  preview.srcdoc =
    documentCode;


  log(
    "Proyecto ejecutado correctamente."
  );

}


/* =========================
   DETENER
========================= */

function stopCode() {

  preview.srcdoc = "";

  log(
    "Vista previa detenida.",
    "warning"
  );

}


/* =========================
   NUEVO PROYECTO
========================= */

function newProject() {

  if (
    (
      htmlEditor.value.trim() ||
      cssEditor.value.trim() ||
      jsEditor.value.trim()
    ) &&
    !confirm(
      "¿Crear un proyecto nuevo?"
    )
  ) {

    return;

  }


  htmlEditor.value = "";
  cssEditor.value = "";
  jsEditor.value = "";

  currentFile =
    "Sin título.html";

  fileName.textContent =
    currentFile;

  preview.srcdoc = "";

  consoleOutput.textContent =
    "Nuevo proyecto creado.";

}


/* =========================
   GUARDAR LOCALMENTE
========================= */

function saveProject() {

  try {

    const project = {

      html:
        htmlEditor.value,

      css:
        cssEditor.value,

      js:
        jsEditor.value,

      name:
        currentFile,

      savedAt:
        new Date().toISOString()

    };


    localStorage.setItem(
      "lcHtmlRunnerProject",
      JSON.stringify(project)
    );


    log(
      "Proyecto guardado localmente."
    );

  } catch (error) {

    log(
      "No se pudo guardar: " +
      error.message,
      "error"
    );

  }

}


/* =========================
   CARGAR PROYECTO
========================= */

function loadProject() {

  try {

    const saved =
      localStorage.getItem(
        "lcHtmlRunnerProject"
      );


    if (!saved) {

      return;

    }


    const project =
      JSON.parse(saved);


    htmlEditor.value =
      project.html || "";

    cssEditor.value =
      project.css || "";

    jsEditor.value =
      project.js || "";


    currentFile =
      project.name ||
      "Proyecto guardado.html";


    fileName.textContent =
      currentFile;


    log(
      "Proyecto anterior recuperado."
    );

  } catch (error) {

    log(
      "Error al recuperar proyecto: " +
      error.message,
      "error"
    );

  }

}


/* =========================
   ABRIR HTML
========================= */

function openFile() {

  fileInput.click();

}


fileInput.addEventListener(
  "change",
  event => {

    const file =
      event.target.files[0];


    if (!file) {

      return;

    }


    if (
      !/\.html?$/i.test(
        file.name
      )
    ) {

      alert(
        "Selecciona un archivo HTML válido."
      );

      fileInput.value = "";

      return;

    }


    const reader =
      new FileReader();


    reader.onload = () => {

      htmlEditor.value =
        reader.result;

      cssEditor.value =
        "";

      jsEditor.value =
        "";

      currentFile =
        file.name;

      fileName.textContent =
        file.name;


      log(
        "Archivo abierto: " +
        file.name
      );

    };


    reader.onerror = () => {

      log(
        "No se pudo leer el archivo.",
        "error"
      );

    };


    reader.readAsText(file);


    fileInput.value = "";

  }
);


/* =========================
   LIMPIAR
========================= */

function clearEditor() {

  if (
    !confirm(
      "¿Limpiar todo el proyecto?"
    )
  ) {

    return;

  }


  htmlEditor.value = "";
  cssEditor.value = "";
  jsEditor.value = "";

  preview.srcdoc = "";

  log(
    "Editor limpiado."
  );

}


/* =========================
   DESCARGAR HTML
========================= */

function downloadProject() {

  const html =
    htmlEditor.value;

  const css =
    cssEditor.value;

  const js =
    jsEditor.value;


  const finalDocument = `
<!DOCTYPE html>

<html lang="es">

<head>

<meta charset="UTF-8">

<meta
name="viewport"
content="width=device-width, initial-scale=1"
>

<style>

${css}

</style>

</head>

<body>

${html}

<script>

${js}

<\/script>

</body>

</html>
`;


  const blob =
    new Blob(
      [finalDocument],
      {
        type: "text/html"
      }
    );


  const url =
    URL.createObjectURL(blob);


  const link =
    document.createElement("a");


  link.href = url;

  link.download =
    currentFile.endsWith(".html")
      ? currentFile
      : currentFile + ".html";


  document.body.appendChild(
    link
  );

  link.click();

  link.remove();


  URL.revokeObjectURL(url);


  log(
    "Archivo HTML descargado."
  );

}


/* =========================
   ACTUALIZAR VISTA
========================= */

function refreshPreview() {

  runCode();

}


/* =========================
   PANTALLA COMPLETA
========================= */

function fullscreenPreview() {

  if (
    preview.requestFullscreen
  ) {

    preview
      .requestFullscreen()
      .catch(() => {

        log(
          "No se pudo activar pantalla completa.",
          "warning"
        );

      });

  } else {

    log(
      "Pantalla completa no disponible.",
      "warning"
    );

  }

}


/* =========================
   MENSAJES DEL IFRAME
========================= */

window.addEventListener(
  "message",
  event => {

    if (
      event.source !==
      preview.contentWindow
    ) {

      return;

    }


    const data =
      event.data;


    if (
      !data ||
      data.source !==
      "LC_HTML_RUNNER"
    ) {

      return;

    }


    const type =
      data.type === "error"
        ? "error"
        : data.type === "warn"
          ? "warning"
          : "info";


    log(
      data.message,
      type
    );

  }
);
/* =========================
   NAVEGADOR INTERNO
========================= */

const urlInput =
  document.getElementById("urlInput");

const browserHistory = [];

let browserHistoryIndex = -1;


function normalizeUrl(value) {

  let url =
    value.trim();

  if (!url) {
    return "";
  }

  if (
    url.startsWith("local://")
  ) {
    return url;
  }

  if (
    !/^https?:\/\//i.test(url)
  ) {
    url =
      "https://" + url;
  }

  return url;
}


function openUrl(value) {

  const url =
    normalizeUrl(value);

  if (!url) {
    return;
  }


  /*
   * Las páginas web externas se cargan
   * dentro del iframe.
   */

  preview.src =
    url;

  urlInput.value =
    url;


  /*
   * Guardar navegación.
   */

  if (
    browserHistoryIndex <
    browserHistory.length - 1
  ) {

    browserHistory.splice(
      browserHistoryIndex + 1
    );

  }


  browserHistory.push(url);

  browserHistoryIndex =
    browserHistory.length - 1;


  log(
    "Abriendo: " + url
  );

}


function browserBack() {

  if (
    browserHistoryIndex <= 0
  ) {

    log(
      "No hay página anterior.",
      "warning"
    );

    return;

  }


  browserHistoryIndex--;

  const url =
    browserHistory[
      browserHistoryIndex
    ];

  preview.src =
    url;

  urlInput.value =
    url;

}


function browserForward() {

  if (
    browserHistoryIndex >=
    browserHistory.length - 1
  ) {

    log(
      "No hay página siguiente.",
      "warning"
    );

    return;

  }


  browserHistoryIndex++;

  const url =
    browserHistory[
      browserHistoryIndex
    ];

  preview.src =
    url;

  urlInput.value =
    url;

}


function browserHome() {

  preview.srcdoc =
    `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport"
        content="width=device-width, initial-scale=1">
      <style>
        body {
          margin: 0;
          min-height: 100vh;
          display: grid;
          place-items: center;
          background: #101827;
          color: white;
          font-family: Arial;
          text-align: center;
          padding: 20px;
        }

        h1 {
          color: #fbbf24;
        }

        p {
          color: #94a3b8;
        }
      </style>
    </head>

    <body>

      <div>
        <h1>LC HTML Runner</h1>

        <p>
          Escribe HTML, CSS y JavaScript
          y pulsa Ejecutar.
        </p>
      </div>

    </body>
    </html>
    `;

  urlInput.value =
    "local://lc-html-runner";

}


function browserReload() {

  if (
    preview.src
  ) {

    try {

      preview.contentWindow.location.reload();

    } catch (error) {

      preview.src =
        preview.src;

    }

  } else {

    runCode();

  }

}


/* =========================
   EVENTOS DEL NAVEGADOR
========================= */

document
  .getElementById("goBtn")
  .addEventListener(
    "click",
    () => {

      openUrl(
        urlInput.value
      );

    }
  );


urlInput.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Enter"
    ) {

      openUrl(
        urlInput.value
      );

    }

  }
);


document
  .getElementById("backBtn")
  .addEventListener(
    "click",
    browserBack
  );


document
  .getElementById("forwardBtn")
  .addEventListener(
    "click",
    browserForward
  );


document
  .getElementById("homeBtn")
  .addEventListener(
    "click",
    browserHome
  );


document
  .getElementById(
    "browserRefreshBtn"
  )
  .addEventListener(
    "click",
    browserReload
  );

/* =========================
   BOTONES
========================= */

document
  .getElementById("runBtn")
  .addEventListener(
    "click",
    runCode
  );


document
  .getElementById("stopBtn")
  .addEventListener(
    "click",
    stopCode
  );


document
  .getElementById("newBtn")
  .addEventListener(
    "click",
    newProject
  );


document
  .getElementById("openBtn")
  .addEventListener(
    "click",
    openFile
  );


document
  .getElementById("saveBtn")
  .addEventListener(
    "click",
    saveProject
  );


document
  .getElementById("downloadBtn")
  .addEventListener(
    "click",
    downloadProject
  );


document
  .getElementById("clearBtn")
  .addEventListener(
    "click",
    clearEditor
  );


document
  .getElementById("refreshBtn")
  .addEventListener(
    "click",
    refreshPreview
  );


document
  .getElementById("fullscreenBtn")
  .addEventListener(
    "click",
    fullscreenPreview
  );


document
  .getElementById("clearConsoleBtn")
  .addEventListener(
    "click",
    clearConsole
  );


/* =========================
   PWA
========================= */

window.addEventListener(
  "beforeinstallprompt",
  event => {

    event.preventDefault();

    installPrompt =
      event;

    document
      .getElementById(
        "installBtn"
      )
      .hidden = false;

  }
);


document
  .getElementById(
    "installBtn"
  )
  .addEventListener(
    "click",
    async () => {

      if (!installPrompt) {

        return;

      }


      installPrompt.prompt();

      await installPrompt.userChoice;


      installPrompt = null;


      document
        .getElementById(
          "installBtn"
        )
        .hidden = true;

    }
  );


/* =========================
   INICIO
========================= */

loadProject();


if (
  "serviceWorker" in navigator &&
  location.protocol === "https:"
) {

  navigator.serviceWorker
    .register("./sw.js")
    .then(() => {

      log(
        "Modo sin conexión preparado."
      );

    })
    .catch(error => {

      log(
        "Error del servicio offline: " +
        error.message,
        "warning"
      );

    });

}
