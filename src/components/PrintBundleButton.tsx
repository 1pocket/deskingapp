// src/components/PrintBundleButton.tsx
import { useState } from "react";

export default function PrintBundleButton({ state }: { state: any }) {
  const [loading, setLoading] = useState(false);

  const onClick = async () => {
    try {
      setLoading(true);
      const payload = {
        customer: state?.customer || {},
        deal: state?.deal || {},
        mode: "filled", // overlay key fields on page 1 of each form
        stamp: true,    // gray header with customer & vehicle info on every page
      };

      const resp = await fetch("/api/print-bundle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text || "Failed to generate the PDF bundle");
      }

      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err: any) {
      // FIX: parenthesize so ?? applies to err?.message, not the concatenated string
      alert("Bundle failed: " + (err?.message ?? String(err)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={onClick} disabled={loading} className="btn">
      {loading ? "Building…" : "Print Sales Bundle (PDF)"}
      <style jsx>{`
        .btn {
          background: #111827;
          color: #fff;
          border-radius: 10px;
          padding: 10px 14px;
        }
        .btn[disabled] {
          opacity: 0.7;
          cursor: not-allowed;
        }
      `}</style>
    </button>
  );
}
