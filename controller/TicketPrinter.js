// TicketPrinter.js
const ThermalPrinter = require("node-thermal-printer").printer;
const PrinterTypes = require("node-thermal-printer").types;
const bwipjs = require("bwip-js");
const moment = require("moment"); // Librería para fechas

class TicketPrinter {
  constructor(printerName) {
    // Configuración de la impresora EPSON con encoding explícito
    this.printerName = printerName;
    this.printer = new ThermalPrinter({
      type: PrinterTypes.EPSON,
      interface: `\\\\localhost\\${printerName}`,
      options: {
        encoding: 'CP437', // Evita warnings y caracteres mal codificados
      }
    });
  }

  async print(data) {
    try {
      // =========================
      // Fecha actual
      // =========================
      const fechaActual = moment().format("DD/MM/YYYY HH:mm");

      // =========================
      // Texto compacto
      // =========================
      this.printer.setTextSize(0, 0); // Tamaño mínimo
      this.printer.alignCenter();      // Todo centrado

      // =========================
      // Información del ticket
      // =========================
      this.printer.println(`Fecha: ${fechaActual}`);
      this.printer.println(`Numero de visita: ${data.ticket_id}`);
      this.printer.println(`Asunto: ${data.subject}`);
      this.printer.println(`Conductor: ${data.driver}`);
      this.printer.println(`Camion: ${data.truck}`);
      this.printer.println(`Tipo Camion: ${data.truck_kind}`);

      // =========================
      // Mensaje final
      // =========================
      this.printer.println("Presente su codigo al llegar a la caseta"); // Solo ASCII

      // =========================
      // Código de barras más pequeño
      // =========================
      const barcodeBuffer = await bwipjs.toBuffer({
        bcid: "code128",
        text: data.folio,
        scale: 2,
        height: 25,
        includetext: true,
        textxalign: "center",
      });

      this.printer.printImageBuffer(barcodeBuffer);

      // =========================
      // Cortar e imprimir
      // =========================
      this.printer.cut();
      const result = await this.printer.execute();
      console.log("Ticket impreso correctamente con codigo de barras:", result);

    } catch (err) {
      console.error("Error imprimiendo ticket:", err);
    }
  }
}

module.exports = TicketPrinter;