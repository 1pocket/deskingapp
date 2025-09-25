import { useEffect, useState } from "react";

type Customer = {
  firstName?: string; lastName?: string; cell?: string; email?: string;
  address?: string; city?: string; state?: string; zip?: string;
  driversLicense?: string; dlState?: string; dlExpires?: string; dob?: string;
  coBuyer?: boolean; notes?: string;
};

export default function CustomerInfoTab({
  value,
  onSave
}: {
  value?: Customer;
  onSave?: (c: Customer) => void;
}) {
  const [open, setOpen] = useState(false);
  const [c, setC] = useState<Customer>({
    firstName: "", lastName: "", cell: "", email: "",
    address: "", city: "", state: "", zip: "",
    driversLicense: "", dlState: "", dlExpires: "", dob: "",
    coBuyer: false, notes: ""
  });

  // load from LS or prop
  useEffect(() => {
    try {
      const raw = localStorage.getItem("pencil.customer");
      if (raw) {
        setC(JSON.parse(raw));
        return;
      }
    } catch {}
    if (value) setC({ ...c, ...value });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = () => {
    try { localStorage.setItem("pencil.customer", JSON.stringify(c)); } catch {}
    onSave?.(c);
    setOpen(false);
  };

  const input = (k: keyof Customer, type: "text" | "date" = "text", extra?: any) => (
    <label className="text-sm">
      <div className="font-medium">{pretty(k)}</div>
      <input
        type={type}
        className="mt-1 w-full rounded-md border p-2"
        value={(c[k] as any) ?? ""}
        onChange={(e)=>setC(prev=>({ ...prev, [k]: e.target.value }))}
        {...extra}
      />
    </label>
  );

  return (
    <>
      {/* file-folder style tab */}
      <button
        type="button"
        onClick={()=>setOpen(true)}
        title="Customer Info"
        className="fixed left-0 top-40 z-40 rounded-r-lg bg-amber-200 text-amber-900 shadow px-3 py-2 border border-amber-300"
        style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
      >
        Customer Info
      </button>

      {/* modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow w-full max-w-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Customer Information</h3>
              <button onClick={()=>setOpen(false)} className="text-sm px-2 py-1 rounded bg-gray-100">Close</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {input("firstName")}
              {input("lastName")}
              {input("cell")}
              {input("email")}
              {input("address")}
              {input("city")}
              {input("state")}
              {input("zip")}
              {input("driversLicense")}
              {input("dlState")}
              {input("dlExpires","date")}
              {input("dob","date")}
              <label className="text-sm md:col-span-2">
                <div className="font-medium">Notes</div>
                <textarea
                  className="mt-1 w-full rounded-md border p-2"
                  rows={3}
                  value={c.notes ?? ""}
                  onChange={(e)=>setC(prev=>({ ...prev, notes: e.target.value }))}
                />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!!c.coBuyer}
                  onChange={(e)=>setC(prev=>({ ...prev, coBuyer: e.target.checked }))}
                />
                Co-buyer
              </label>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button className="px-3 py-2 bg-gray-200 rounded" onClick={()=>setOpen(false)}>Cancel</button>
              <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={save}>Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function pretty(k: string) {
  return k
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}
