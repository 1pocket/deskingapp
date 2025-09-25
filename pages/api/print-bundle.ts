import type { NextApiRequest, NextApiResponse } from "next";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "fs";
import path from "path";

export const config = { api: { bodyParser: { sizeLimit: "1mb" } } };

type Payload = {
  customer: {
    firstName?: string; lastName?: string; cell?: string; email?: string;
    address?: string; city?: string; state?: string; zip?: string;
    driversLicense?: string; dlState?: string; dlExpires?: string; dob?: string;
    coBuyer?: boolean; notes?: string;
  };
  deal: {
    stock?: string; year?: string; make?: string; model?: string; vin?: string; newOrUsed?: "New" | "Used";
  };
  mode?: "blank" | "filled";
  stamp?: boolean;
};

const FORM_PATHS = [
  "Flying 50.pdf",
  "Social Release.pdf",
  "Tag Reg Form.pdf",
  "Insurance and Payoff.pdf",
];

const label = (v?: string) => (v ?? "").trim();
const loadPdfBytes = (file: string) => fs.readFileSync(path.join(process.cwd(), "public", "forms", file));

async function stampEveryPage(pdf: PDFDocument, header: string) {
  const pages = pdf.getPages();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  pages.forEach((page) => {
    const w = page.getWidth(), h = page.getHeight();
    page.drawRectangle({ x: 0, y: h - 28, width: w, height: 28, color: rgb(0.95, 0.95, 0.95) });
    page.drawLine({ start: { x: 0, y: h - 28 }, end: { x: w, y: h - 28 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
    page.drawText(header, { x: 12, y: h - 20, size: 9, font, color: rgb(0, 0, 0) });
  });
}

async function drawOnFirstPage(
  pdf: PDFDocument,
  textPairs: Array<{ text: string; x: number; y: number; size?: number }>
) {
  const page = pdf.getPages()[0];
  if (!page) return;
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  textPairs.forEach(({ text, x, y, size = 10 }) => {
    if (!text) return;
    page.drawText(text, { x, y, size, font, color: rgb(0, 0, 0) });
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");

  const { customer, deal, mode = "filled", stamp = true } =
    (typeof req.body === "string" ? JSON.parse(req.body) : req.body) as Payload;

  const out = await PDFDocument.create();

  // Header (ALWAYS prints customer info on the bundle)
  const name = `${label(customer.firstName)} ${label(customer.lastName)}`.trim();
  const contactBits = [label(customer.cell), label(customer.email)].filter(Boolean).join(" • ");
  const addrBits = [label(customer.address), `${label(customer.city)} ${label(customer.state)} ${label(customer.zip)}`.trim()]
    .filter(Boolean).join(", ");
  const idBits = [
    customer.driversLicense ? `DL ${customer.driversLicense}${customer.dlState ? ` (${customer.dlState})` : ""}` : "",
    customer.dlExpires ? `DL Exp ${customer.dlExpires}` : "",
    customer.dob ? `DOB ${customer.dob}` : "",
  ].filter(Boolean).join(" • ");
  const vehicleBits = [
    [label(deal.year), label(deal.make), label(deal.model)].filter(Boolean).join(" "),
    deal.vin ? `VIN ${deal.vin}` : "",
    deal.stock ? `Stock ${deal.stock}` : "",
    deal.newOrUsed ? deal.newOrUsed : "",
  ].filter(Boolean).join(" | ");
  const header = [name || "Customer", contactBits, addrBits, idBits, vehicleBits, new Date().toLocaleDateString()]
    .filter(Boolean).join("  •  ");

  for (const fname of FORM_PATHS) {
    const basePdf = await PDFDocument.load(loadPdfBytes(fname));
    if (stamp) await stampEveryPage(basePdf, header);

    if (mode === "filled") {
      if (fname === "Flying 50.pdf") {
        await drawOnFirstPage(basePdf, [
          { text: new Date().toLocaleDateString(), x: 80, y: 740 },
          { text: "Victory Honda of Jackson", x: 260, y: 740 },
          { text: name, x: 140, y: 705 },
          { text: [label(deal.year), label(deal.make), label(deal.model)].filter(Boolean).join(" "), x: 140, y: 650 },
          { text: deal.newOrUsed ?? "", x: 100, y: 630 },
          { text: label(deal.stock), x: 260, y: 630 },
          { text: label(deal.vin), x: 140, y: 610 },
        ]);
      }
      if (fname === "Social Release.pdf") {
        await drawOnFirstPage(basePdf, [
          { text: name, x: 110, y: 735 },
          { text: label(deal.vin), x: 420, y: 735 },
          { text: label(customer.cell), x: 110, y: 718 },
        ]);
      }
      if (fname === "Tag Reg Form.pdf") {
        await drawOnFirstPage(basePdf, [
          { text: name, x: 120, y: 720 },
          { text: label(customer.address), x: 120, y: 700 },
          { text: `${label(customer.city)}${customer.city ? ", " : ""}${label(customer.state)} ${label(customer.zip)}`.trim(), x: 120, y: 682 },
        ]);
      }
      if (fname === "Insurance and Payoff.pdf") {
        await drawOnFirstPage(basePdf, [
          { text: [label(deal.year), label(deal.make), label(deal.model)].filter(Boolean).join(" "), x: 140, y: 720 },
          { text: label(deal.vin), x: 140, y: 703 },
          { text: name, x: 60, y: 595 },
          { text: label(customer.cell), x: 60, y: 578 },
        ]);
      }
    }

    const copied = await out.copyPages(basePdf, basePdf.getPageIndices());
    copied.forEach((p) => out.addPage(p));
  }

  const pdfBytes = await out.save();
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "inline; filename=\"sales-bundle.pdf\"");
  res.send(Buffer.from(pdfBytes));
}
