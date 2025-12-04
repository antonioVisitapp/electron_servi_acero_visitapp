module.exports = {
  packagerConfig: {
    asar: true, // empaquetar en un asar
    executableName: "MyElectronApp", // nombre del ejecutable
  },
  rebuildConfig: {},
makers: [
  {
    name: "@electron-forge/maker-squirrel",
    config: {
      name: "my_electron_app",
      setupExe: "MyElectronAppSetup.exe",
      // iconUrl: "https://example.com/icon.ico",  // para el instalador online
      // setupIcon: "./assets/icon.ico",           // para el instalador local
    },
  },
],

  plugins: [], // sin plugins para evitar errores
};
