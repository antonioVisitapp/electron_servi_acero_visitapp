const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const morgan = require('morgan')
const VisitSocket = require('../sockets/VisitSockets');
const BarcodeListener = require("../util/code_reader/BarCodeReader");
const VisitService = require('../controller/VisitService');
// const VisitService = require('../controller/visitService');

const port = 8002
let global_token = '';
let global_channel = '';
let global_path = '';


async function onScan(folio) {
    console.log('dentro de onscan')
    if (!folio) return

    console.log('global_channel',global_channel)
    console.log('global_token',global_token)
    console.log('global_path',global_path)
    const visitService = new VisitService(global_channel, global_token, global_path);
    // const visitObject = new VisitSocket(global_channel, global_token, global_path);
    console.log("codigo recibido:", folio);
    if (folio.includes("visitor-")) {
        const folioSplit = folio.split('visitor-')[1];
        await visitService.visitorArrive(folioSplit);
    } else if (folio.includes("carrier-")) {
        const folioSplit = folio.split('carrier-')[1];
        await visitService.qrArrive(folioSplit);
    } else {
        if (folio.length == 12) {
            await visitService.qrArrive(0 + folio.substring(0, 11))
        } else {
            await visitService.qrArrive(folio.substring(0, 12))
        }
    }


    // // ejemplo folio
    // visitObject.handleFolio("carrier-123456789012");

    // // ejemplo fotos
    // visitService.takePhotos({
    //     id: 55,
    //     cameras: [
    //         { url: "http://cam1/img.jpg", reference: "CAM_1", id: 1 }
    //     ]
    // });

    // // ejemplo tag
    // visitService.uploadTagPhotos({ id: 55 }, "car");

}
class Server {

    constructor({ channel, token, path }) {
        this.channel = channel,
            this.token = token,
            this.path = path,
            global_channel = channel,
            global_token = token,
            global_path = path,
            this.app = express();
        this.server = http.createServer(this.app);
        this.port = port;
        this.socket
    }

    middlewares() {
        this.app.use(bodyParser.urlencoded({ extended: true }));
        this.app.use(bodyParser.json());
        this.app.use(morgan('dev'));
    }

    routes() {
        this.app.get('/test', (req, res) => {
            console.log(req.params, "params");
            console.log(req.body, "get");
            res.send({ status: "ok" });
        });

        this.app.post('/test', (req, res) => {
            console.log(req.body, "post");
            res.send({ status: "ok" });
        });
    }


    initSockets() {
        this.socket = new VisitSocket(
            this.channel,
            this.token, this.path);
    }



    readEvents() {
        try {
            const readerEvents = new BarcodeListener(
                onScan,
                12,
                80,
            );
            readerEvents.start();
        } catch (error) {

            console.log(`error in read events ${error.message}`)
        }
    }

    listen() {
        this.middlewares();
        this.routes();
        this.initSockets();
        this.readEvents();
        this.server.listen(this.port, () => {
            console.log(`Server running on port ${this.port}`);
        });
    }
}

module.exports = Server;
