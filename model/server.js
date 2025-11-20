const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const morgan = require('morgan')
const initSockets = require('../sockets/visitSockets');
const SerialReader = require('../controller/serial_reader_controller');


const port = 8002

class Server {



    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.port = port;

        this.middlewares();
        this.routes();
        this.initSockets();
        this.initSerial();
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
        socket = initSockets();

    }

    initSerial() {
        const serial = new SerialReader('COM3');
        serial.on('data', (folio) => {
            console.log('Dato serial recibido:', folio);
            // Aquí iría tu lógica de folio -> qrArrive o visitorArrive
        });
    }

    listen() {
        this.middlewares();
        this.routes();
        this.initSockets();
        this.initSerial();
        this.server.listen(this.port, () => {

            console.log(`Server running on port ${this.port}`);
        });
    }
}

module.exports = Server;
