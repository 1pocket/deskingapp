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
  stamp?: boolean; // draw a header with customer/vehicle info on every page
};

const FORM_PATHS = [
  "Flying 50.pdf",
  "Social Release.pdf",
  "Tag Reg Form.pdf",
  "Insurance and Payoff.pdf",
];

function loadPdfBytes(file: string) {
  const p = path.join(process.cwd(), "public", "forms", file);
  return fs.readFileSync(p);
}
const label = (v?: string) => (v ?? "").trim();

async function stampEveryPage(pdf: PDFDocument, header: string) {
  const pages = pdf.getPages();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  pages.forEach((page) => {
    const w = page.getWidth();
    const h = page.getHeight();
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

    // 1) Stamp customer info at top of every page
    if (stamp) await stampEveryPage(basePdf, header);

    // 2) In filled mode, write some key fields onto page 1 (adjust coords after a test print)
    if (mode === "filled") {
      if (fname === "Flying 50.pdf") {
        await drawOnFirstPage(basePdf, [
          { text: new Date().toLocaleDateString(), x: 80, y: 740 },
          { text: "Victory Honda of Jackson", x: 260, y: 740 },
          { text: name, x: 140, y: 705 },
          { text: [label(deal.year), label(deal.make), label(deal.model)].filter(Boolea
