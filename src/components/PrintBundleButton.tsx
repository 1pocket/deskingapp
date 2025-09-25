import type { PencilState } from "../types";

export default function PrintPencilButton({ state }: { state: PencilState }) {
  const onClick = () => {
    try {
      const snapshot = {
        ...state,
        _meta: { savedAt: new Date().toISOString() }
      };
      localStorage.setItem("pencil.snapshot", JSON.stringify(snapshot));
      window.open("/print/pencil", "_blank");
    } catch {
      alert("Could not create the printable page (localStorage unavailable).");
    }
  };

  return (
    <button onClick={onClick} className="btn">
      Print Pencil (HTML)
      <style jsx>{`
        .btn { background:#111827; color:#fff; border-radius:10px; padding:10px 14px; }
      `}</style>
    </button>
  );
}
