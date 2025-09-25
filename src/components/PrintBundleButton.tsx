import type { PencilState } from "../types";

export default function PrintBundleButton({ state }: { state: PencilState }) {
  const onClick = async () => {
    try {
      const payload = {
        customer: state.customer || {},
        deal: state.deal || {},
        mode: "filled", // "blank" also supported by the API
        stamp: true,
      };
      const res = await fetch("/api/print-bundle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const t = await res.text();
        alert("Could not generate bundle: " + t);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err: any) {
      alert("Bundle failed: " + err?.message ?? String(err));
    }
  };

  return (
    <button onClick={onClick} className="btn">
      Print Sales Bundle (PDF)
      <style jsx>{`
        .btn { background:#111827; color:#fff; border-radius:10px; padding:10px 14px; }
      `}</style>
    </button>
  );
}
