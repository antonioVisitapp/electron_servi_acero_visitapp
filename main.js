const { app, BrowserWindow } = require('electron');
const path = require('path');

// Importar tu server
const Server = require('./model/server');

// Crear instancia del server
const server = new Server();

// Función para crear la ventana principal
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true, // para simplificar testing
      contextIsolation: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Abrir DevTools opcional
  mainWindow.webContents.openDevTools();

  // Iniciar tu servidor HTTP
  server.listen();;
}

// Eventos de la app
app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
