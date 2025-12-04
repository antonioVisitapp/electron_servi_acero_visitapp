const { app, BrowserWindow } = require('electron');
const path = require('path');

// Importar tu server
const Server = require('./model/server');
// const { default: TestPrint } = require('./controller/testPrinter');

// Crear instancia del server
const server = new Server({
  channel: "serviacero-2",
  token: "1e3a8be01c4cjsd98dss87ds4kjds0c9b256fcfce1e3a8b55d01c4c74e21c96efa5d01c375c96efed01266e0dbef53d0",
  path: "/tickets/images/"
});

// Función para crear la ventana principal
async function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      // disableBlinkFeatures: "Autofill",
      nodeIntegration: false, // para simplificar testing
      contextIsolation: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Abrir DevTools opcional
  mainWindow.webContents.openDevTools();

  mainWindow.minimize();
  server.listen();
}

// Eventos de la app
app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
//  server.listen();
