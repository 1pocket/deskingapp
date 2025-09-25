import { useEffect, useMemo, useState } from "react";
import type { PencilState } from "../../src/types";

type Snapshot = PencilState & { _meta?: { savedAt?: string } };

export default function PrintablePencil() {
  const [data, setData] = useState<Snapshot | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("pencil.snapshot");
      if (raw) setData(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    if (!data) return;
    const t = setTimeout(() => window.print(), 400);
    return () => clearTimeout(t);
  }, [data]);

  const fmt = (v?: string | number) => (v === undefined || v === null ? "" : String(v).trim());
  const nice = (k: string) =>
    k.replace(/([A-Z])/g, " $1").replace(/_/g, " ").replace(/\s+/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()).trim();
  const preferredDealOrder = [
    "stock","vin","year","make","model","newOrUsed","msrp","price","sellingPrice","docFee","tax","taxes","tag","title","tagAndTitle",
    "tradeValue","payoff","netTrade","cashDown","downPayment","amountFinanced","apr","rate","term","termMonths","payment","estPayment"
  ];

  const dealPairs = useMemo(() => {
    if (!data?.deal) return [];
    const d = data.deal as Record<string, any>;
    const keys = new Set(Object.keys(d).filter((k) => d[k] !== undefined && d[k] !== null && d[k] !== ""));
    const ordered: string[] = [];
    preferredDealOrder.forEach((k) => keys.has(k) && ordered.push(k));
    keys.forEach((k) => { if (!ordered.includes(k)) ordered.push(k); });
    return ordered.map((k) => [nice(k), fmt(d[k])] as const);
  }, [data]);

  if (!data) {
    return (
      <main style={{ fontFamily: "Inter, system-ui, Arial, sans-serif", padding: 24 }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>Printable Pencil</h1>
        <p>Open your deal screen, click <b>Print Pencil (HTML)</b> to generate a snapshot, then this page will populate and print.</p>
      </main>
    );
  }

  const { customer, deal, _meta } = data;
  const fullName = [fmt(customer?.firstName), fmt(customer?.lastName)].filter(Boolean).join(" ");
  const address = [fmt(customer?.address), [fmt(customer?.city), fmt(customer?.state), fmt(customer?.zip)].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  const vehicleLine = [fmt(deal?.year), fmt(deal?.make), fmt(deal?.model)].filter(Boolean).join(" ");

  return (
    <main className="sheet">
      <header className="hdr">
        <div className="brand">
          <div className="title">Victory Honda of Jackson</div>
          <div className="subtitle">Deal Pencil</div>
        </div>
        <div className="meta">
          <div><b>Date:</b> {new Date().toLocaleDateString()}</div>
          {_meta?.savedAt && <div><b>Saved:</b> {new Date(_meta.savedAt).toLocaleString()}</div>}
        </div>
      </header>

      <section className="grid">
        <div className="card">
          <h2>Customer</h2>
          <div className="row"><label>Name</label><span>{fullName || "—"}</span></div>
          <div className="row"><label>Mobile</label><span>{fmt(customer?.cell) || "—"}</span></div>
          <div className="row"><label>Email</label><span>{fmt(customer?.email) || "—"}</span></div>
          <div className="row"><label>Address</label><span>{address || "—"}</span></div>
          <div className="row"><label>DL</label>
            <span>
              {fmt(customer?.driversLicense)}
              {customer?.dlState ? ` (${customer.dlState})` : ""}
              {customer?.dlExpires ? ` • Exp ${customer.dlExpires}` : ""}
            </span>
          </div>
          <div className="row"><label>DOB</label><span>{fmt(customer?.dob) || "—"}</span></div>
          {customer?.coBuyer && <div className="row"><label>Co-Buyer</label><span>Yes</span></div>}
          {customer?.notes && <div className="row notes"><label>Notes</label><span>{customer.notes}</span></div>}
        </div>

        <div className="card">
          <h2>Vehicle</h2>
          <div className="row"><label>Vehicle</label><span>{vehicleLine || "—"}</span></div>
          <div className="row"><label>VIN</label><span>{fmt(deal?.vin) || "—"}</span></div>
          <div className="row"><label>Stock</label><span>{fmt(deal?.stock) || "—"}</span></div>
          <div className="row"><label>Type</label><span>{fmt(deal?.newOrUsed) || "—"}</span></div>
        </div>
      </section>

      <section className="card">
        <h2>Deal Numbers</h2>
        {dealPairs.length === 0 ? (
          <div className="muted">No figures captured yet.</div>
        ) : (
          <table className="kv">
            <tbody>
              {dealPairs.map(([k, v]) => (
                <tr key={k}>
                  <td className="k">{k}</td>
                  <td className="v">{v || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="sign">
        <div className="sig"><div className="line" /> Customer</div>
        <div className="sig"><div className="line" /> Co-Buyer</div>
        <div className="sig"><div className="line" /> Salesperson</div>
        <div className="sig"><div className="line" /> Manager</div>
      </section>

      <style jsx>{`
        :global(html, body) { background:#fff; }
        .sheet { font-family: Inter, system-ui, Arial, sans-serif; padding: 24px; max-width: 8.5in; margin: 0 auto; color:#111; }
        .hdr { display:flex; justify-content:space-between; align-items:flex-end; border-bottom:1px solid #e5e7eb; padding-bottom:10px; margin-bottom:16px; }
        .title { font-size:20px; font-weight:700; }
        .subtitle { color:#6b7280; font-size:13px; }
        .meta { text-align:right; color:#111; font-size:13px; }
        h2 { font-size:16px; margin:0 0 8px; }
        .grid { display:grid; grid-template-columns: 1fr 1fr; gap:16px; margin-bottom:16px; }
        .card { border:1px solid #e5e7eb; border-radius:12px; padding:12px; }
        .row { display:flex; gap:10px; padding:4px 0; align-items:flex-start; }
        .row label { width:120px; color:#6b7280; }
        .row span { flex:1; }
        .row.notes span { white-space:pre-wrap; }
        .kv { width:100%; border-collapse:collapse; }
        .kv .k { width:40%; padding:6px 8px; color:#374151; background:#f9fafb; border-bottom:1px solid #f0f0f0; }
        .kv .v { width:60%; padding:6px 8px; border-bottom:1px solid #f0f0f0; }
        .muted { color:#6b7280; }
        .sign { display:grid; grid-template-columns: repeat(2, 1fr); gap:18px; margin-top:24px; }
        .sig { display:flex; flex-direction:column; gap:6px; align-items:flex-start; font-size:13px; }
        .line { width:100%; height:1px; background:#111; margin-top:18px; }
        @media print {
          :global(body
