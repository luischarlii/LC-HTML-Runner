
"use strict";

const editor = document.getElementById("codeEditor");
const preview = document.getElementById("preview");
const fileInput = document.getElementById("fileInput");
const fileName = document.getElementById("fileName");
const consoleOutput = document.getElementById("consoleOutput");

let currentFile = "Sin título.html";
let installPrompt = null;

function log(message, type = "info") {
  const colors = {
    info: "🟢",
    error: "🔴",
    warning: "🟡"
  };

  consoleOutput.textContent +=
    "\n" + (colors[type] || "•") + " " + String(message);

  consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

function runCode() {
  const code = editor.value;

  consoleOutput.textContent = "Ejecutando código...";

  const script = `
    <script>
    (() => {
      const send = (type, args) => {
        try {
          parent.postMessage({
            source: "LC_HTML_RUNNER",
            type,
            message: Array.from(args).map(x => {
              try {
                if (typeof x === "object" && x !== null) {
                  return JSON.stringify(x);
                }
                return String(x);
              } catch(e) {
                return String(x);
              }
            }).join(" ")
          }, "*");
        } catch(e) {}
      };

      ["log", "info", "warn", "error"].forEach(type => {
        const original = console[type].bind(console);
        console[type] = (...args) => {
          original(...args);
          send(type, args);
        };
      });

      window.addEventListener("error", e => {
        send("error", [e.message + " (línea " + e.lineno + ")"]);
      });

      window.addEventListener("unhandledrejection", e => {
        send("error", ["Promesa rechazada:", e.reason]);
      });

      console.log("LC HTML Runner: página iniciada");
    })();
    <\/script>
  `;

  const instrumented = code.includes("<head>")
    ? code.replace(/<head([^>]*)>/i, "<head$1>" + script)
    : code.includes("<html")
      ? code.replace(/<html([^>]*)>/i, "<html$1><head>" + script + "</head>")
      : "<!DOCTYPE html><html><head>" + script +
        "</head><body>" + code + "</body></html>";

  preview.srcdoc = instrumented;
  log("Código enviado al navegador.");
}

window.addEventListener("message", event => {
  if (event.source !== preview.contentWindow) return;

  const data = event.data;

  if (!data || data.source !== "LC_HTML_RUNNER") return;

  const type = data.type === "error" ? "error" :
    data.type === "warn" ? "warning" : "info";

  log(data.message, type);
});

function saveProject() {
  try {
    localStorage.setItem("lcHtmlRunnerCode", editor.value);
    localStorage.setItem("lcHtmlRunnerName", currentFile);

    log("Proyecto guardado localmente.");
  } catch (error) {
    log("No se pudo guardar: " + error.message, "error");
  }
}

function loadProject() {
  try {
    const savedCode = localStorage.getItem("lcHtmlRunnerCode");
    const savedName = localStorage.getItem("lcHtmlRunnerName");

    if (savedCode !== null) {
      editor.value = savedCode;
      currentFile = savedName || "Proyecto guardado.html";
      fileName.textContent = currentFile;
      log("Proyecto anterior recuperado.");
    }
  } catch (error) {
    log("Error al recuperar proyecto: " + error.message, "error");
  }
}

function newProject() {
  if (editor.value.trim() &&
      !confirm("¿Crear un proyecto nuevo? Se reemplazará el contenido del editor.")) {
    return;
  }

  editor.value = "";
  currentFile = "Sin título.html";
  fileName.textContent = currentFile;
  preview.srcdoc = "";
  consoleOutput.textContent = "Nuevo proyecto creado.";
}

function openFile() {
  fileInput.click();
}

fileInput.addEventListener("change", event => {
  const file = event.target.files[0];

  if (!file) return;

  if (!/\.html?$/i.test(file.name)) {
    alert("Selecciona un archivo HTML válido.");
    fileInput.value = "";
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    editor.value = reader.result;
    currentFile = file.name;
    fileName.textContent = file.name;
    log("Archivo abierto: " + file.name);
  };

  reader.onerror = () => {
    log("No se pudo leer el archivo.", "error");
  };

  reader.readAsText(file);
  fileInput.value = "";
});

function clearEditor() {
  if (!confirm("¿Limpiar todo el código del editor?")) return;

  editor.value = "";
  log("Editor limpiado.");
}

function clearConsole() {
  consoleOutput.textContent = "Consola limpia.";
}

function refreshPreview() {
  runCode();
}

function fullscreenPreview() {
  if (preview.requestFullscreen) {
    preview.requestFullscreen().catch(() => {
      log("No se pudo activar pantalla completa.", "warning");
    });
  } else {
    log("Pantalla completa no disponible en este navegador.", "warning");
  }
}

// Botones principales
document.getElementById("runBtn").addEventListener("click", runCode);
document.getElementById("saveBtn").addEventListener("click", saveProject);
document.getElementById("newBtn").addEventListener("click", newProject);
document.getElementById("openBtn").addEventListener("click", openFile);
document.getElementById("clearBtn").addEventListener("click", clearEditor);
document.getElementById("refreshBtn").addEventListener("click", refreshPreview);
document.getElementById("fullscreenBtn").addEventListener("click", fullscreenPreview);
document.getElementById("clearConsoleBtn").addEventListener("click", clearConsole);

// Instalación PWA
window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault();
  installPrompt = event;
  document.getElementById("installBtn").hidden = false;
});

document.getElementById("installBtn").addEventListener("click", async () => {
  if (!installPrompt) return;

  installPrompt.prompt();
  await installPrompt.userChoice;
  installPrompt = null;
  document.getElementById("installBtn").hidden = true;
});

// Recuperar proyecto al iniciar
loadProject();

// Servicio offline
if ("serviceWorker" in navigator && location.protocol === "https:") {
  navigator.serviceWorker.register("./sw.js")
    .then(() => log("Modo sin conexión preparado."))
    .catch(error => log("Error del servicio offline: " + error.message, "warning"));
}

