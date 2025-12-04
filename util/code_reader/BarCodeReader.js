const NUMPAD_MAP = {
  NUMPAD0: "0",
  NUMPAD1: "1",
  NUMPAD2: "2",
  NUMPAD3: "3",
  NUMPAD4: "4",
  NUMPAD5: "5",
  NUMPAD6: "6",
  NUMPAD7: "7",
  NUMPAD8: "8",
  NUMPAD9: "9",
};

const VALID_KEYS = [
  "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
  ...Object.keys(NUMPAD_MAP)
];

class BarcodeScanner {
  constructor(onScan, minLength = 5, timeout = 80) {
    console.log('cosntructor scanner------------------------')
    console.log(typeof (onScan))
    this.onScan = typeof onScan === "function" ? onScan : null;
    this.minLength = minLength;
    this.timeout = timeout;

    this.buffer = "";
    this.timer = null;

    // ahora guardamos el timestamp, no la tecla
    this.lastEventTime = 0;

    this.start();
  }

  start() {
    const { GlobalKeyboardListener } = require("node-global-key-listener");
    this.listener = new GlobalKeyboardListener();

    this.listener.addListener(event => {
      if (event.state !== "UP") return;

      const now = Date.now();

      // Si dos eventos llegan en menos de 5ms → es duplicado real del HID
      if (now - this.lastEventTime < 5) return;
      this.lastEventTime = now;

      clearTimeout(this.timer);
      this.timer = setTimeout(() => (this.buffer = ""), this.timeout);

      const key = event.name;

      // ENTER finaliza lectura
      if (["RETURN", "ENTER", "NUMPADENTER"].includes(key)) {
        const scanned = this.buffer.trim();
        console.log(scanned)
        this.buffer = "";

        if (scanned.length >= this.minLength) {
          console.log("Codigo detectado:", scanned);
          if (this.onScan) this.onScan(scanned);
        }
        return;
      }

      // Solo números
      if (!VALID_KEYS.includes(key)) return;

      // Numpad
      if (NUMPAD_MAP[key]) {
        this.buffer += NUMPAD_MAP[key];
        return;
      }

      // Tecla numérica normal
      if (/^[0-9]$/.test(key)) {
        this.buffer += key;
      }
    });

    console.log("BarcodeScanner listo, sin duplicados falsos y sin perder dígitos.");
  }
}

module.exports = BarcodeScanner;
