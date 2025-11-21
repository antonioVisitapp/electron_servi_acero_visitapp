// printer.js
const printer = require("pdf-to-printer");
const path = require("path");

class PrinterManager {

    async listPrinters() {
        try {
            const printers = await printer.getPrinters();
            console.log("===== Impresoras Detectadas =====");
            printers.forEach((p, i) => {
                console.log(`${i + 1}. ${p.name}`);
            });
            console.log("=================================");
            return printers;
        } catch (err) {
            console.error("Error al listar impresoras:", err);
        }
    }

    async print(pdfPath, printerName = null) {
        try {
            const absolutePath = path.resolve(pdfPath);

            console.log("Imprimiendo archivo:", absolutePath);

            await printer.print(absolutePath, {
                printer: printerName, // si es null, manda a la predeterminada
                scale: "fit",
                monochrome: true
            });

            console.log("Impresión enviada correctamente.");
        } catch (err) {
            console.error("Error al imprimir:", err);
        }
    }
}

module.exports = PrinterManager;
