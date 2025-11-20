const EventEmitter = require('events');
const { SerialPort } = require('serialport');

class SerialReader extends EventEmitter {
    /**
     * @param {string} portPath - El path o nombre del puerto serial a abrir
     */
    constructor(portPath) {
        super();
        if (!portPath) {
            throw new Error('Debe proporcionar el path del puerto serial.');
        }
        this.portPath = portPath;
        this.port = null;
        this.init();
    }

    init() {
        try {
            this.port = new SerialPort({
                path: this.portPath,
                baudRate: 9600
            });

            this.port.on('data', (data) => this.emit('data', data.toString()));

            this.port.on('error', (err) => console.error('Error en el puerto serial:', err));

            console.log(`Puerto serial abierto: ${this.portPath}`);
        } catch (err) {
            console.error('Error al inicializar el puerto serial:', err);
        }
    }
}

module.exports = SerialReader;
