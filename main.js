
const { app, BrowserWindow, dialog } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const http = require("http");

let mainWindow;
let backendProcess;

const backendPath = app.isPackaged
  ? path.join(process.resourcesPath, "app.asar.unpacked", "backend")
  : path.join(__dirname, "backend");

const serverPath = path.join(backendPath, "server.js");

function comprobarServidor() {
  return new Promise((resolve) => {
    const req = http.get("http://127.0.0.1:3000/api", (res) => {
      res.resume();
      resolve(res.statusCode >= 200 && res.statusCode < 500);
    });

    req.setTimeout(1500, () => {
      req.destroy();
      resolve(false);
    });

    req.on("error", () => resolve(false));
  });
}

async function iniciarBackend() {
  if (await comprobarServidor()) {
    console.log("El servidor de inventario ya está funcionando.");
    return;
  }

  backendProcess = spawn(
    process.execPath,
    [serverPath],
    {
      cwd: backendPath,
      env: {
        ...process.env,
        ELECTRON_RUN_AS_NODE: "1",
        PORT: "3000"
      },
      stdio: "inherit",
      windowsHide: true
    }
  );

  backendProcess.on("error", (error) => {
    console.error("Error al iniciar el backend:", error);
  });

  for (let intento = 0; intento < 30; intento++) {
    if (await comprobarServidor()) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(
    "El servidor no respondió en http://127.0.0.1:3000/api"
  );
}

async function crearVentana() {
  await iniciarBackend();

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 650,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  await mainWindow.loadFile(
    path.join(__dirname, "frontend", "indexte.html")
  );
}

app.whenReady().then(async () => {
  try {
    await crearVentana();
  } catch (error) {
    console.error(error);

    dialog.showErrorBox(
      "Error al iniciar Inventario",
      error.message
    );

    app.quit();
  }
});

app.on("before-quit", () => {
  if (backendProcess && !backendProcess.killed) {
    backendProcess.kill();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
