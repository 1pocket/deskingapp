import { useEffect } from "react";
import type { CustomerInfo } from "../types";

type Props = {
  value: CustomerInfo;
  onChange: (next: CustomerInfo) => void;
  storageKey?: string;
};

export default function CustomerForm({ value, onChange, storageKey = "pencil.customer" }: Props) {
  // Load once from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) onChange({ ...value, ...JSON.parse(saved) });
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist to localStorage
  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(value)); } catch {}
  }, [value, storageKey]);

  const set = (k: keyof CustomerInfo) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    onChange({ ...value, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <input className="input" placeholder="First name" value={value.firstName || ""} onChange={set("firstName")} />
      <input className="input" placeholder="Last name"  value={value.lastName || ""}  onChange={set("lastName")} />
      <input className="input" placeholder="Mobile"     value={value.cell || ""}       onChange={set("cell")} />
      <input className="input" placeholder="Email"      value={value.email || ""}      onChange={set("email")} />
      <input className="input col-span-2" placeholder="Address" value={value.address || ""} onChange={set("address")} />
      <input className="input" placeholder="City" value={value.city || ""} onChange={set("city")} />
      <input className="input" placeholder="State" value={value.state || ""} onChange={set("state")} />
      <input className="input" placeholder="ZIP" value={value.zip || ""} onChange={set("zip")} />
      <input className="input" placeholder="Driver’s License #" value={value.driversLicense || ""} onChange={set("driversLicense")} />
      <input className="input" placeholder="DL State" value={value.dlState || ""} onChange={set("dlState")} />
      <input className="input" placeholder="DL Exp (YYYY-MM-DD)" value={value.dlExpires || ""} onChange={set("dlExpires")} />
      <input className="input" placeholder="DOB (YYYY-MM-DD)" value={value.dob || ""} onChange={set("dob")} />
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={!!value.coBuyer} onChange={set("coBuyer")} /> Co-Buyer
      </label>
      <textarea className="textarea col-span-2" placeholder="Notes…" value={value.notes || ""} onChange={set("notes")} />
      <style jsx>{`
        .input, .textarea { border: 1px solid #e5e7eb; border-radius: 10px; padding: 10px; width: 100%; }
        .textarea { min-height: 80px; }
      `}</style>
    </div>
  );
}
