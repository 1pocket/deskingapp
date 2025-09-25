import { useState } from "react";
import type { PencilState } from "../types";

export default function PrintBundleButton({ state }: { state: PencilState }) {
  // "Filled" = draw into boxes; "Blank" = only merge PDFs.
  // We ALWAYS stamp customer info across the top of every page.
  const [mode, setMode] = useState<"filled" | "blank">("filled");

  const onClick = async () => {
    const res = await fetch("/api/print-bundle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customer: state.customer, deal: state.deal, mode, stamp: true }),
    });
    if (!res.ok) {
      alert(`Print error: ${res.status} ${res.statusText}`);
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const w = window.open(url, "_blank");
    if (!w) alert("Pop-up blocked. Please allow pop-ups and try again.");
  };

  return (
    <div className="flex items-center gap-3">
      <select className="input" value={mode} onChange={(e) => setMode(e.target.value as any)}>
        <option value="filled">Filled bundle</option>
        <option value="blank">Blank bundle</option>
      </select>
      <button className="btn" onClick={onClick}>Print Sales Bundle (PDF)</button>
      <style jsx>{`
        .input { border:1px solid #e5e7eb; border-radius:10px; padding:8px; }
        .btn { background:#111827; color:#fff; border-radius:10px; padding:10px 14px; }
      `}</style>
    </div>
  );
}
