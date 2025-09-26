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

  const [dealPairs, setDealPairs] = useState<Array<readonly [string, string]>>([]);
  useEffect(() => {
    if (!data?.deal) { setDealPairs([]); return; }
    const d = data.deal as Record<string, any>;
    const keys = new Set(Object.keys(d).filter((k) => d[k] !== undefined && d[k] !== null && d[k] !== ""));
    const ordered: string[] = [];
    preferredDealOrder.forEach((k) => keys.has(k) && ordered.push(k));
    keys.forEach((k) => { if (!ordered.includes(k)) ordered.push(k); });
    setDealPairs(ordered.map((k) => [nice(k), fmt(d[k])] as const));
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
          <img src="/logo.png" alt="Honda" style={{ height: 28, marginRight: 8 }} />
          <div>
            <div className="title">Victory Honda of Jackson</div>
            <div className="subtitle">Deal Pencil</div>
          </div>
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
        .brand { display:flex; align-items:flex-end; gap
