const axios = require('axios');
const fs = require('fs');
const path = require('path');
const io = require('socket.io-client');
const FormData = require('form-data');
const TicketPrinter = require('../controller/TicketPrinter');
const { config } = require('../config/config');
const sharp = require("sharp");
class VisitSocket {

    constructor(channel, token, basePath) {
        this.channel = channel;
        this.token = token;
        this.basePath = basePath || "/home/visitapp/VisitApp/VisitappIndustry/visitapp-insudstrial-localserver";

        this.socket = io.connect(config.VISITAPP.URL_SOCKETS_INDUSTRY, {
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

        this.socket.on("connect_error", (err) => console.log(" [ERROR DE CONEXIÓN]:", err.message));
        this.socket.on("disconnect", (reason) => console.log(`[DESCONECTADO]: ${reason}`));
        this.socket.on("reconnect_attempt", attempt => console.log(`Intento de reconexión #${attempt}`));
        this.socket.on("reconnect_failed", () => console.log(" No fue posible reconectar."));
    }

    /* -----------------------------------------
       EVENTOS SOCKET
    ----------------------------------------- */
    registerEvents() {
   console.log("========================SOCKETS EN ESCUCHA==============================");
        this.socket.on(`print-ticket-${this.channel}`, (data) => {
            console.log(`EVENTO => print-ticket-${this.channel}`);
            this.printTicket(data);
        });
        this.socket.on(`take-photo-${this.channel}`, async (data) => {
            console.log(`EVENTO => take-photo-${this.channel}`);
            for (const cam of data.cameras) {
                await this.takePhoto(data.id, cam.url, cam.reference, cam.kind, cam.id)
            }
        })
        this.socket.on(`take-tag-photo-walking-${this.channel}`, (data) => {
            console.log(` EVENTO => take-tag-photo-walking-${this.channel}`);
            this.takeTagPhotoWalking(data);
        });
        this.socket.on(`take-tag-photo-car-${this.channel}`, (data) => {
            console.log(` EVENTO => take-tag-photo-car-${this.channel}`);
            this.takeTagPhotoCar(data);
        });
    }

    /* -----------------------------------------
       QR CARRIER
    // ----------------------------------------- */
    async qrArrive(folio) {
        try {
            const url = `${config.VISITAPP.URL_SOCKETS_INDUSTRY}visits/carrier/qr`;
            const body = new URLSearchParams({
                channel: this.channel,
                folio,
                token: this.token
            }).toString();

            const headers = {
                'Content-Type': 'application/x-www-form-urlencoded'
            };

            console.log("\n[qrArrive] =====================");
            console.log("url:", url);
            console.log("body:", body);
            console.log("headers:", headers);

            const { data } = await axios.post(url, body, { headers });

            console.log("[qrArrive] respuesta:", data);

        } catch (e) {
            console.error("[qrArrive] ERROR:", e.message);
        }
    }

    /* -----------------------------------------
       QR VISITOR
    ----------------------------------------- */
    async visitorArrive(folio) {
        try {
            const url = `${config.VISITAPP.URL_SERVER_INDUSTRY}visits/visitor/qr`;
            const body = new URLSearchParams({
                channel: this.channel,
                folio
            }).toString();

            const headers = {
                'Content-Type': 'application/x-www-form-urlencoded'
            };

            console.log("\n[visitorArrive] =====================");
            console.log("url:", url);
            console.log("body:", body);
            console.log("headers:", headers);

            const { data } = await axios.post(url, body, { headers });

            console.log("[visitorArrive] respuesta:", data);

        } catch (e) {
            console.error("[visitorArrive] ERROR:", e.message);
        }
    }
    async downloadFile(url, filename) {
        const writer = fs.createWriteStream(filename);
        console.log('url', url)
        console.log('filename', filename)
        const response = await axios({
            url,
            method: "GET",
            responseType: "stream"
        });

        response.data.pipe(writer);
        // console.log('response.data de la imagen')
        // console.log(response.data)

        return new Promise((resolve, reject) => {
            writer.on("finish", resolve);
            writer.on("error", reject);
        });
    }

    async uploadVisitPhoto(url, filename, token, reference, camera_id, id) {
        try {
            console.log('-----------------------uploadVisitPhoto-------------------------------------')
            await this.downloadFile(url, filename);
            console.log("********************Imagen descargada correctamente:", reference, '********************');
            const compressedPath = filename.replace(".jpg", "_compressed.jpg");

            await sharp(filename)
                .jpeg({ quality: 75 }) // compresión
                .toFile(compressedPath);
            console.log('compressedPath', compressedPath)
            const form = new FormData();
            form.append("id", camera_id);
            form.append("visit[file]", fs.createReadStream(compressedPath));
            form.append("visit[camera_id]", camera_id);
            // form.append("visit[reference]", reference);

            const uploadUrl = `${config.VISITAPP.URL_SERVER_INDUSTRY}${config.VISITAPP.ENDPOINTS.UPLOAD_PHOTO(id)}`;
            // console.log('-------------uploadUrl:', uploadUrl)
            // console.log('form.getHeaders():', form.getHeaders())
            const { data } = await axios.post(uploadUrl, form, {
                headers: {
                    "Authorization": `${token}`,
                    ...form.getHeaders()
                }
            });

            // console.log("Foto enviada correctamente:", data);

        } catch (err) {
            console.error("Error en uploadVisitPhoto:", err.message);

        } finally {
            try {
                if (fs.existsSync(filename)) {
                    fs.unlinkSync(filename);
                    console.log("Archivo temporal eliminado:", filename);
                }
            } catch (e) {
                console.error("No se pudo borrar el archivo temporal:", e.message);
            }
        }
    }
    /* -----------------------------------------
       SUBIR FOTO (FUNCIONA CON AXIOS + FORMDATA)
    ----------------------------------------- */
    async takePhoto(id, url, reference, kind, camera_id) {
        console.log("\n[takePhoto] -----------------------------");

        const filename = path.join(this.basePath, `${reference}.jpg`);

        console.log("filename:", filename);
        console.log("reference:", reference);
        console.log("camera_id:", camera_id);
        console.log("url original:", url);

        // URL temporal para pruebas
        // let urlTest = `https://babymetal.com/contents/1/TO/Title%20SQ2.png`;
        console.log("url usada:", urlTest);


        await this.uploadVisitPhoto(url, filename, this.token, reference, camera_id, id)

    }

    /* -----------------------------------------
       FOTO TAG
    ----------------------------------------- */
    uploadTagPhoto(id, url, reference, kind, camera_id) {
         console.log("\n[takePhoto] -----------------------------");
        //TODO pendiente para la caraga de foto 
        const filename=path.join(this.basePath,`${reference}.jpg`)
        //  let urlTest = `https://www.serviacero.com/wp-content/uploads/2024/02/DSC_3649-scaled.jpg`;
       uploadVisitPhoto(url,filename,this.token,reference,camera_id,id);

    }

    /* -----------------------------------------
       IMPRESIÓN DE TICKETS
    ----------------------------------------- */
    async printTicket(ticketData) {
        try {
            console.log("=== CONTENIDO DEL TICKET ===");
            console.log(ticketData);
            console.log("============================");

            const pt = new TicketPrinter(config.PRINTER_NAME);
            await pt.print(ticketData);

        } catch (err) {
            console.error("Fallo en la impresión del ticket:", err);
        }
    }
    async takeTagPhotoWalking(data) {
        console.log(`[takeTagPhotoWalking] ejecutado`);
        const id = data.id;

        try {
            const url = `${config.VISITAPP.URL_SERVER_INDUSTRY}cameras-by-kind?branch=2&kind=walking`;
            console.log("url:", url);

            const { data: cameras } = await axios.get(url);
            console.log("data:", cameras);

            cameras.forEach(camera => {
                console.log("[Camara walking]", camera);

                this.uploadTagPhoto(
                    id,
                    camera.url,
                    camera.reference,
                    camera.kind,
                    camera.id
                );
            });

        } catch (error) {
            console.error("[takeTagPhotoWalking] ERROR:", error.message);
        }
    }
    async takeTagPhotoCar(data) {
        console.log(`[takeTagPhotoCar] ejecutado`);
        const id = data.id;

        try {
            const url = `${config.VISITAPP.URL_SERVER_INDUSTRY}cameras-by-kind?branch=2&kind=car`;
            console.log("url:", url);

            const { data: cameras } = await axios.get(url);
            console.log("data:", cameras);

            cameras.forEach(camera => {
                console.log("[Camara car]", camera);

                this.uploadTagPhoto(
                    id,
                    camera.url,
                    camera.reference,
                    camera.kind,
                    camera.id
                );
            });

        } catch (error) {
            console.error("[takeTagPhotoCar] ERROR:", error.message);
        }
    }




}

module.exports = VisitSocket;
