// test_print.js
const TicketPrinter = require("./controller/TicketPrinter");

const ticketData = {
  folio: "252141106488",
  ticket_id: "278113",
  subject: "Visita de transportista",
  driver: "FERMIN JASSO AGUILERA",
  truck: "GT2533C",
  ticket_kind: "Embarque de Material",
  truck_kind: "Trailer Kenworth",
};

const printer = new TicketPrinter("EPSON TM-T20II Receipt5");

(async () => {
  await printer.print(ticketData);
})();
