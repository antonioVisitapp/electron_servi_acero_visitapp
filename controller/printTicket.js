// controller/TicketPrinter.js
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const PrinterManager = require("./printer"); // tu printer.js con pdf-to-printer

class TicketPrinter {

    constructor(printerName = null) {
        this.printerName = printerName; // Nombre de la impresora, opcional
        this.ticketsDir = path.resolve(__dirname, "../tickets"); // Carpeta de tickets
        if (!fs.existsSync(this.ticketsDir)) fs.mkdirSync(this.ticketsDir);

        // === Configuración general del PDF ===
        this.pdfConfig = {
            size: [103 * 2.835, 164 * 2.835], // Tamaño del papel en puntos (103x164 mm)
            margins: { top: 10, bottom: 10, left: 10, right: 10 }, // Márgenes del documento
            fonts: {
                header: "Helvetica-Bold",
                normal: "Helvetica"
            },
            fontSizes: {
                header: 16, // tamaño de la cabecera
                subHeader: 12, // tamaño de subtítulos
                content: 10, // tamaño de texto normal
                footer: 8 // tamaño de pie de página
            }
        };
    }

    /**
     * Genera un ticket en PDF, lo imprime y programa limpieza del archivo después de 1 minuto
     * @param {Object} ticketData Datos del ticket
     */
    async printTicket(ticketData) {
        try {
            // === Mostrar en consola cómo se vería el ticket ===
            console.log("\n================ TICKET DE VISITA =================");
            console.log(`SERVIACERO`.padStart(25, " "));
            console.log(`Visita Industrial`.padStart(25, " "));
            console.log("----------------------------------------------");
            console.log(`Folio       : ${ticketData.folio}`);
            console.log(`Visit ID    : ${ticketData.visit_id}`);
            console.log(`Ticket ID   : ${ticketData.ticket_id}`);
            console.log(`Asunto      : ${ticketData.subject}`);
            console.log(`Conductor   : ${ticketData.driver}`);
            console.log(`Camión      : ${ticketData.truck}`);
            console.log(`Tipo Ticket : ${ticketData.ticket_kind}`);
            console.log(`Tipo Camión : ${ticketData.truck_kind}`);
            console.log("----------------------------------------------");
            console.log(`Gracias por su visita. Mantengamos la seguridad y eficiencia.`);
            console.log(`Serviacero S.A. de C.V.`);
            console.log("================================================\n");

            // === Crear PDF temporal con formato basado en pdfConfig ===
            const tempPdfPath = path.join(this.ticketsDir, `ticket_${ticketData.folio}.pdf`);
            const doc = new PDFDocument({
                size: this.pdfConfig.size,
                margins: this.pdfConfig.margins
            });
            const writeStream = fs.createWriteStream(tempPdfPath);
            doc.pipe(writeStream);

            // Cabecera centrada
            doc.font(this.pdfConfig.fonts.header)
                .fontSize(this.pdfConfig.fontSizes.header)
                .text("SERVIACERO", { align: "center" });
            doc.moveDown(0.2);
            doc.font(this.pdfConfig.fonts.normal)
                .fontSize(this.pdfConfig.fontSizes.subHeader)
                .text("Visita Industrial", { align: "center" });
            doc.moveDown(1);

            // Datos del ticket
            const writeLine = (label, value) => {
                doc.font(this.pdfConfig.fonts.header).fontSize(this.pdfConfig.fontSizes.content).text(`${label}: `, { continued: true });
                doc.font(this.pdfConfig.fonts.normal).fontSize(this.pdfConfig.fontSizes.content).text(value);
            };

            writeLine("Folio", ticketData.folio);
            writeLine("Visit ID", ticketData.visit_id);
            writeLine("Ticket ID", ticketData.ticket_id);
            writeLine("Asunto", ticketData.subject);
            writeLine("Conductor", ticketData.driver);
            writeLine("Camión", ticketData.truck);
            writeLine("Tipo Ticket", ticketData.ticket_kind);
            writeLine("Tipo Camión", ticketData.truck_kind);

            doc.moveDown(0.5);
            doc.moveTo(10, doc.y).lineTo(this.pdfConfig.size[0] - 10, doc.y).stroke(); // línea separadora
            doc.moveDown(0.5);

            // Pie de página
            doc.font(this.pdfConfig.fonts.normal)
                .fontSize(this.pdfConfig.fontSizes.footer)
                .text("Gracias por su visita. Mantengamos la seguridad y eficiencia.", { align: "center" });
            doc.text("Serviacero S.A. de C.V.", { align: "center" });

            doc.end();

            // Esperar a que se genere el PDF
            await new Promise((resolve, reject) => {
                writeStream.on("finish", resolve);
                writeStream.on("error", reject);
            });

            // === Enviar PDF a la impresora ===
            const printer = new PrinterManager();
            await printer.print(tempPdfPath, this.printerName);
            console.log("Ticket enviado a la impresora correctamente.");

            // === Programar eliminación del ticket después de 1 minuto ===
            setTimeout(() => {
                if (fs.existsSync(tempPdfPath)) {
                    fs.unlinkSync(tempPdfPath);
                    console.log("Ticket eliminado automáticamente:", tempPdfPath);
                }
            }, 60 * 1000); // 60 segundos

        } catch (err) {
            console.error("Fallo en la generación o impresión del ticket:", err);
        }
    }
}

module.exports = TicketPrinter;
