const ThermalPrinter = require("node-thermal-printer").printer;
const PrinterTypes = require("node-thermal-printer").types;

async function test() {
  console.log("Iniciando test Node...");

  const printer = new ThermalPrinter({
    type: PrinterTypes.EPSON,
    interface: "\\\\localhost\\EPSON TM-T20II Receipt",
    options: {
      encoding: "CP437",
    },
  });

  printer.alignCenter();
  printer.println("=== TEST NODE ===");
  printer.println("EPSON TM-T20II");
  printer.println("Windows OK");
  printer.println(new Date().toLocaleString());
  printer.cut();

  const result = await printer.execute();
  console.log("Resultado:", result);
}

test().catch(err => {
  console.error("❌ Error Node:", err);
});
