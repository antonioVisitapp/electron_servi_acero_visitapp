class Printer {
    constructor(data) {
        this.data = data;
        this.print();
    }

    print() {
        console.log('Printing data:', this.data);
        // Aquí tu lógica real de impresión
    }
}

module.exports = Printer;
