import Setting from "../models/Setting.js";
import { ThermalPrinter, PrinterTypes, CharacterSet, BreakLine } from "node-thermal-printer";

export const printReceipt = async (req, res) => {
  try {
    const { sale } = req.body;
    if (!sale) {
      return res.status(400).json({ message: "Sale data is required for printing" });
    }

    const settings = await Setting.findOne() || {};
    const shopName = settings.shopName || "MARHABA PHOTOSTATE";
    const tagline = settings.shopTagline || "STATIONERY SHOP";
    const subTagline = "All Kinds of Stationery, Printing & Computer Needs.";
    const phone1 = settings.phone1 || "0333-6297546";
    const phone2 = settings.phone2 || "0334-7791579";
    const address = settings.address || "Main Bazar, Lahore";
    const currency = settings.currency || "Rs";
    const footerLines = (settings.receiptFooter || "Visit Again. Keep Writing, Keep Learning!\nGOODS ONCE SOLD WILL NOT BE TAKEN BACK\nTHANK YOU FOR SHOPPING WITH US!").split("\n");
    
    const printerName = settings.thermalPrinterName || "POS-58"; // The installed windows printer name

    let printer = new ThermalPrinter({
      type: PrinterTypes.EPSON,
      interface: `printer:${printerName}`,
      characterSet: CharacterSet.PC852_LATIN2,
      removeSpecialCharacters: false,
      lineCharacter: "-",
      breakLine: BreakLine.WORD,
      options: {
        timeout: 5000
      }
    });

    const isConnected = await printer.isPrinterConnected();
    if (!isConnected) {
      return res.status(503).json({ message: `Printer '${printerName}' not found or not connected.` });
    }

    // ── Header ──
    printer.alignCenter();
    printer.bold(true);
    printer.setTextDoubleHeight();
    printer.setTextDoubleWidth();
    printer.println(shopName.toUpperCase());
    
    printer.setTextNormal();
    printer.bold(false);
    printer.println(`— ${tagline.toUpperCase()} —`);
    
    printer.println(subTagline);
    printer.drawLine();
    
    if (address) printer.println(`Loc: ${address}`);
    printer.println(`Ph: ${phone1}${phone2 ? ' | ' + phone2 : ''}`);
    
    printer.drawLine();

    // ── Meta Grid ──
    if (sale.is_deleted) {
      printer.bold(true);
      printer.println("✕ CANCELLED / DELETED ✕");
      printer.bold(false);
      printer.drawLine();
    }

    printer.alignLeft();
    printer.leftRight(`BILL NO. : ${sale.invoiceNo}`, `CASHIER : ${(sale.cashierName || "ADMIN").toUpperCase()}`);
    
    const dateObj = new Date(sale.createdAt || Date.now());
    printer.println(`DATE     : ${dateObj.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })}`);
    printer.println(`TIME     : ${dateObj.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`);

    printer.drawLine();

    // ── Items Table Header ──
    printer.bold(true);
    printer.tableCustom([
      { text:"ITEM", align:"LEFT", width:0.45 },
      { text:"QTY", align:"RIGHT", width:0.15 },
      { text:"RATE", align:"RIGHT", width:0.20 },
      { text:"AMOUNT", align:"RIGHT", width:0.20 }
    ]);
    printer.bold(false);
    printer.drawLine();
    
    const subtotal = sale.subtotal || sale.items?.reduce((s, i) => s + (i.subtotal || i.salePrice * i.qty), 0) || 0;
    
    // ── Item Lines ──
    if (sale.items && sale.items.length > 0) {
      sale.items.forEach(item => {
        const itemLineTotal = item.subtotal || (item.salePrice * item.qty);
        // Truncate name if too long to fit
        let name = item.name;
        if (name.length > 18) name = name.substring(0, 16) + "..";
        
        printer.tableCustom([
          { text: name, align:"LEFT", width:0.45 },
          { text: item.qty.toString(), align:"RIGHT", width:0.15 },
          { text: item.salePrice.toString(), align:"RIGHT", width:0.20 },
          { text: itemLineTotal.toString(), align:"RIGHT", width:0.20 }
        ]);
      });
    }

    printer.drawLine();

    // ── Summary ──
    printer.leftRight("SUBTOTAL", subtotal.toString());
    if (sale.discount > 0) {
      printer.leftRight("DISCOUNT", sale.discount.toString());
    }

    printer.drawLine();

    printer.bold(true);
    printer.setTextDoubleHeight();
    printer.leftRight("TOTAL", `${currency} ${sale.total || 0}`);
    printer.setTextNormal();
    printer.bold(false);

    printer.drawLine();

    // ── Payment Info ──
    printer.leftRight(`PAYMENT MODE : ${(sale.paymentMethod || "CASH").toUpperCase()}`, `PAID AMOUNT : ${currency} ${sale.paid_amount || sale.amountPaid || 0}`);

    printer.drawLine();

    // ── Footer ──
    printer.alignCenter();
    printer.bold(true);
    printer.println("⋟ THANK YOU! ⋞");
    printer.bold(false);
    
    if (footerLines[0]) printer.println(footerLines[0]);
    printer.drawLine();
    
    footerLines.slice(1).forEach(line => {
      printer.println(line.toUpperCase());
    });

    printer.cut();

    await printer.execute();
    
    res.json({ success: true, message: "Receipt printed successfully!" });
  } catch (error) {
    console.error("Print Error:", error);
    res.status(500).json({ message: "Printing failed: " + error.message });
  }
};
