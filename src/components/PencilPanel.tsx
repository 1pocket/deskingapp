import { useState } from "react";
import type { PencilState } from "../types";
import CustomerForm from "./CustomerForm";
import PrintBundleButton from "./PrintBundleButton";
import PrintPencilButton from "./PrintPencilButton";

export default function PencilPanel() {
  const [pencil, setPencil] = useState<PencilState>({
    deal: {
      year: "", make: "", model: "",
      vin: "", stock: "", newOrUsed: "Used",
      // add any of your payment/fee fields here; they'll show on the HTML print page
      // e.g. price: "", taxes: "", docFee: "", termMonths: "", rate: "", payment: ""
    },
    customer: { firstName: "", lastName: "" }
  });

  return (
    <div className="space-y-6">
      {/* ===== Customer Info ===== */}
      <section>
        <h3 className="title">Customer Info</h3>
        <CustomerForm
          value={pencil.customer}
          onChange={(v) => setPencil((s) => ({ ...s, customer: v }))}
        />
      </section>

      {/* ===== Vehicle / Deal quick fields (optional example) ===== */}
      <section>
        <h3 className="title">Vehicle</h3>
        <div className="grid">
          <input className="input" placeholder="Year"  value={pencil.deal.year || ""}  onChange={e => setPencil(s => ({...s, deal:{...s.deal, year:e.target.value}}))} />
          <input className="input" placeholder="Make"  value={pencil.deal.make || ""}  onChange={e => setPencil(s => ({...s, deal:{...s.deal, make:e.target.value}}))} />
          <input className="input" placeholder="Model" value={pencil.deal.model || ""} onChange={e => setPencil(s => ({...s, deal:{...s.deal, model:e.target.value}}))} />
          <input className="input" placeholder="VIN"    value={pencil.deal.vin || ""}   onChange={e => setPencil(s => ({...s, deal:{...s.deal, vin:e.target.value}}))} />
          <input className="input" placeholder="Stock"  value={pencil.deal.stock || ""} onChange={e => setPencil(s => ({...s, deal:{...s.deal, stock:e.target.value}}))} />
          <select className="input" value={pencil.deal.newOrUsed || "Used"} onChange={e => setPencil(s => ({...s, deal:{...s.deal, newOrUsed: e.target.value as any}}))}>
            <option>Used</option>
            <option>New</option>
          </select>
        </div>
      </section>

      {/* ===== Actions ===== */}
      <section className="actions">
        <PrintBundleButton state={pencil} />
        <PrintPencilButton state={pencil} />
      </section>

      <style jsx>{`
        .title { font-weight:600; margin-bottom:8px; }
        .grid { display:grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap:10px; }
        .input { border:1px solid #e5e7eb; border-radius:10px; padding:10px; width:100%; }
        .actions { display:flex; gap:12px; align-items:center; }
      `}</style>
    </div>
  );
}
