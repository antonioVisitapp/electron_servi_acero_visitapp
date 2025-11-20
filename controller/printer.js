
const escpos = require('escpos');
const moment = require('moment');

class Printer {
    
    
    device;
    
    constructor(data) {
        this.data = data;
        this.device = new escpos.USB();
        this.print();
    }
    
    print() {
        const printer = new escpos.Printer(this.device);
        console.log('Printing data:', this.data);
        // Aquí tu lógica real de impresión


        const text = `Fecha: ${moment().format('DD/MM/YYYY, h:mm:ss a')}\nNum. de Visita: ${this.data.visit_id}\n` +
            `Asunto: ${this.data.subject}\nNum. de ticket: ${this.data.ticket_id}\n` +
            `Chofer: ${this.data.driver}\nTipo de ticket: ${this.data.ticket_kind}\n` +
            `Tipo de camion: ${this.data.truck_kind}\nPlacas:${this.data.truck}`
        this.device.open(() => {
            printer
                .encode('857')
                .font('a')
                .align('ct')
                .style('bu')
                .size(1, 1)
                .text(text + '\n\nPresenta tu codigo al llegar a caseta.\n', '857')
                .barcode(String(this.data.folio), 'EAN13', 200, 3, 'BELOW', 'B').cut().close();
        });
    }
}

module.exports = Printer;
