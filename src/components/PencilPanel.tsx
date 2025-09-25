import { useState } from "react";
import type { PencilState } from "../types";
import CustomerForm from "./CustomerForm";
import PrintBundleButton from "./PrintBundleButton";

export default function PencilPanel() {
  const [pencil, setPencil] = useState<PencilState>({
    deal: { year: "", make: "", model: "", vin: "", stock: "", newOrUsed: "Used" },
    customer: { firstName: "", lastName: "" },
  });

  return (
    <div className="space-y-6">
      {/* Your existing payment grid / figures go here */}

      <section>
        <h3 className="text-lg font-semibold mb-2">Customer Info</h3>
        <CustomerForm value={pencil.customer} onChange={(v) => setPencil((s) => ({ ...s, customer: v }))} />
      </section>

      <section>
        <PrintBundleButton state={pencil} />
      </section>
    </div>
  );
}
