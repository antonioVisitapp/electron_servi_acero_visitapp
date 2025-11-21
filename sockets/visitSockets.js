const request = require('request');
const fs = require('fs');
const exec = require('child_process').exec;
const io = require('socket.io-client');
const ThermalPrinter = require('node-thermal-printer').printer;
const PrinterTypes = require('node-thermal-printer').types;

class VisitSocket {

    constructor(channel = "serviacero-2") {
        this.channel = channel;
        this.token = "1e3a8be01c4cjsd98dss87ds4kjds0c9b256fcfce1e3a8b55d01c4c74e21c96efa5d01c375c96efed01266e0dbef53d0";

        // Crear conexión socket
        this.socket = io.connect("https://ws-industrial.visitapp.io/", {
            transports: ["websocket"],
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 2000
        });

        this.initLogs();
        this.registerEvents();
    }

    /* -----------------------------------------
       LOGS
    ----------------------------------------- */
    initLogs() {
        console.log("======================================================");
        console.log("   Iniciando Socket IO Client ");
        console.log("   Socket.IO Client Version:", require("socket.io-client/package.json").version);
        console.log(`   Canal: ${this.channel}`);
        console.log("======================================================");

        this.socket.on("connect", () => {
            console.log(`[CONECTADO] -> ID: ${this.socket.id}`);
        });

        this.socket.on("connect_error", (err) => {
            console.log(" [ERROR DE CONEXIÓN]:", err.message);
        });

        this.socket.on("disconnect", (reason) => {
            console.log(`[DESCONECTADO]: ${reason}`);
        });

        this.socket.on("reconnect_attempt", attempt => {
            console.log(`Intento de reconexión #${attempt}`);
        });

        this.socket.on("reconnect_failed", () => {
            console.log(" No fue posible reconectar.");
        });
    }

    /* -----------------------------------------
       FUNCIONES QR Y FOTOS
    ----------------------------------------- */

    qrArrive(folio) {
        const formData = new URLSearchParams({
            channel: this.channel,
            folio,
            token: this.token
        }).toString();

        request({
            headers: {
                'Content-Length': formData.length,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            uri: 'http://industrial.visitapp.com.mx:5004/api/v1/visits/carrier/qr',
            body: formData,
            method: 'POST'
        });
    }

    visitorArrive(folio) {
        const formData = new URLSearchParams({
            channel: this.channel,
            folio
        }).toString();

        request({
            headers: {
                'Content-Length': formData.length,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            uri: 'http://industrial.visitapp.com.mx:5004/api/v1/visits/visitor/qr',
            body: formData,
            method: 'POST'
        }, (error, response, body) => {
            console.log("Visitor arrive error:", error);
            console.log("Visitor arrive body:", body);
        });
    }

    takePhoto(id, url, reference, kind, camera_id) {
        const filename = `/${reference}.jpg`;

        exec(`wget ${url} -O ${filename}`, () => {
            const formData = {
                'visit[token]': this.token,
                'visit[reference]': reference,
                'visit[camera_id]': camera_id,
                'visit[file]': fs.createReadStream(filename)
            };

            request.post({
                url: `http://industrial.visitapp.com.mx:3001/api/v1/visits-access/upload/${id}`,
                headers: { 'Content-Type': 'multipart/form-data' },
                formData
            }, (err) => {
                if (err) console.error('upload failed:', err);
            });
        });
    }

    uploadTagPhoto(id, url, reference, kind, camera_id) {
        const formData = {
            'visit[token]': this.token,
            'visit[reference]': reference,
            'visit[camera_id]': camera_id,
            'visit[file]': fs.createReadStream(`${reference}_old.jpg`)
        };

        request.post({
            url: `http://industrial.visitapp.com.mx:3001/api/v1/visits-access/upload/${id}`,
            headers: { 'Content-Type': 'multipart/form-data' },
            formData
        }, (err) => {
            if (err) console.error('upload failed:', err);
        });
    }

    /* -----------------------------------------
       IMPRESIÓN DE TICKETS
    ----------------------------------------- */
  printTicket(ticketData) {
    try {
        // === Contenido para consola ===
        let ticketContent = "";
        ticketContent += "==== TICKET DE VISITA ====\n";
        ticketContent += `Folio: ${ticketData.folio}\n`;
        ticketContent += `Visit ID: ${ticketData.visit_id}\n`;
        ticketContent += `Ticket ID: ${ticketData.ticket_id}\n`;
        ticketContent += `Asunto: ${ticketData.subject}\n`;
        ticketContent += `Conductor: ${ticketData.driver}\n`;
        ticketContent += `Camión: ${ticketData.truck}\n`;
        ticketContent += `Tipo Ticket: ${ticketData.ticket_kind}\n`;
        ticketContent += `Tipo Camión: ${ticketData.truck_kind}\n`;
        ticketContent += "--------------------------------\n";

        console.log("=== CONTENIDO DEL TICKET ===");
        console.log(ticketContent);
        console.log("============================");

        // === Impresión en impresora ===
        const printer = new ThermalPrinter({
            type: PrinterTypes.EPSON, // Cambia según tu impresora
            interface: 'printer:epson1245', // Nombre de tu impresora
            characterSet: 'SLOVENIA',
            removeSpecialCharacters: false,
            lineChars: 48
        });

        printer.alignCenter();
        printer.println("==== TICKET DE VISITA ====");
        printer.alignLeft();
        printer.println(`Folio: ${ticketData.folio}`);
        printer.println(`Visit ID: ${ticketData.visit_id}`);
        printer.println(`Ticket ID: ${ticketData.ticket_id}`);
        printer.println(`Asunto: ${ticketData.subject}`);
        printer.println(`Conductor: ${ticketData.driver}`);
        printer.println(`Camión: ${ticketData.truck}`);
        printer.println(`Tipo Ticket: ${ticketData.ticket_kind}`);
        printer.println(`Tipo Camión: ${ticketData.truck_kind}`);
        printer.drawLine();
        printer.cut();

        printer.execute()
            .then(() => console.log("Ticket enviado a la impresora"))
            .catch(err => console.error("Error al imprimir ticket:", err));

    } catch (err) {
        console.error("Fallo en la generación o impresión del ticket:", err);
    }
}

    /* -----------------------------------------
       EVENTOS SOCKET
    ----------------------------------------- */
    registerEvents() {

        this.socket.on(`print-ticket-${this.channel}`, (data) => {
            console.log(`EVENTO => print-ticket-${this.channel}`);
            this.printTicket(data);
        });

        this.socket.on(`take-photo-${this.channel}`, (data) => {
            console.log(`EVENTO => take-photo-${this.channel}`);
            data.cameras.forEach(cam =>
                this.takePhoto(data.id, cam.url, cam.reference, cam.kind, cam.id)
            );
        });

        this.socket.on(`take-tag-photo-walking-${this.channel}`, (data) => {
            console.log(` EVENTO => take-tag-photo-walking-${this.channel}`);
            request(
                'http://industrial.visitapp.com.mx:3001/api/v1/cameras-by-kind?branch=2&kind=walking',
                null,
                (err, res, body) => {
                    try {
                        JSON.parse(body).forEach(cam =>
                            this.uploadTagPhoto(data.id, cam.url, cam.reference, cam.kind, cam.id)
                        );
                    } catch (error) {
                        console.log(error);
                    }
                }
            );
        });

        this.socket.on(`take-tag-photo-car-${this.channel}`, (data) => {
            console.log(` EVENTO => take-tag-photo-car-${this.channel}`);
            request(
                'http://industrial.visitapp.com.mx:3001/api/v1/cameras-by-kind?branch=2&kind=car',
                null,
                (err, res, body) => {
                    try {
                        JSON.parse(body).forEach(cam =>
                            this.uploadTagPhoto(data.id, cam.url, cam.reference, cam.kind, cam.id)
                        );
                    } catch (error) {
                        console.log(error);
                    }
                }
            );
        });
    }

}

module.exports = VisitSocket;
