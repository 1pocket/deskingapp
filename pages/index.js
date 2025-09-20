// pages/index.js
import { useMemo, useState } from "react";

/** Simple loan payment (principal, APR %, months, cashDown)
 *  PMT = r*PV / (1 - (1+r)^-n), r = APR/12
 *  Returns monthly payment (rounded to cents)
 */
function pmt({ price, aprPct, months, cashDown }) {
  const pv = Math.max(price - (cashDown || 0), 0);
  const r = (aprPct / 100) / 12;
  if (pv <= 0) return 0;
  if (r === 0) return +(pv / months).toFixed(2);
  const factor = r / (1 - Math.pow(1 + r, -months));
  return +(pv * factor).toFixed(2);
}

export default function Home() {
  // Inputs the rep controls
  const [salePrice, setSalePrice] = useState(26987);     // example from your sheet's "Total Purchase"
  const [aprPct, setAprPct]       = useState(9.99);      // matches the worksheet header
  const [terms, setTerms]         = useState([60, 72, 75]);
  const [downs, setDowns]         = useState([0, 1000, 2000]);

  // Optional toggles the desk controls could expose later
  const [showOTD, setShowOTD]     = useState(false);

  const grid = useMemo(() => {
    return terms.map((m) => {
      const row = downs.map((d) => pmt({ price: salePrice, aprPct, months: m, cashDown: d }));
      return { months: m, cells: row };
    });
  }, [salePrice, aprPct, terms, downs]);

  // Helpers to edit terms/downs inline
  function updateTerm(i, v) {
    const copy = [...terms];
    copy[i] = parseInt(v || 0) || 0;
    setTerms(copy);
  }
  function updateDown(i, v) {
    const copy = [...downs];
    copy[i] = parseFloat(v || 0) || 0;
    setDowns(copy);
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Victory Desking — Payment Grid</h1>
          <div className="text-sm text-gray-500">Internal Use Only</div>
        </header>

        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white rounded-2xl shadow p-4">
          <label className="text-sm">
            <div className="font-medium">Sale Price ($)</div>
            <input
              type="number"
              className="mt-1 w-full rounded-md border p-2"
              value={salePrice}
              onChange={(e) => setSalePrice(parseFloat(e.target.value || "0"))}
            />
          </label>

          <label className="text-sm">
            <div className="font-medium">APR (%)</div>
            <input
              type="number"
              step="0.01"
              className="mt-1 w-full rounded-md border p-2"
              value={aprPct}
              onChange={(e) => setAprPct(parseFloat(e.target.value || "0"))}
            />
          </label>

          <label className="text-sm">
            <div className="font-medium">Down Columns ($)</div>
            <div className="mt-1 grid grid-cols-3 gap-2">
              {downs.map((d, i) => (
                <input key={i} type="number" className="rounded-md border p-2"
                  value={d} onChange={(e) => updateDown(i, e.target.value)} />
              ))}
            </div>
          </label>

          <label className="text-sm">
            <div className="font-medium">Term Rows (months)</div>
            <div className="mt-1 grid grid-cols-3 gap-2">
              {terms.map((t, i) => (
                <input key={i} type="number" className="rounded-md border p-2"
                  value={t} onChange={(e) => updateTerm(i, e.target.value)} />
              ))}
            </div>
          </label>
        </div>

        {/* Grid */}
        <div className="bg-white rounded-2xl shadow p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Loan Payments Estimated</h2>
            <div className="text-sm text-gray-500">APR shown: {aprPct}%</div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left p-2 border-b">Term / Down</th>
                  {downs.map((d, i) => (
                    <th key={i} className="text-right p-2 border-b">${d.toLocaleString()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grid.map((row) => (
                  <tr key={row.months} className="odd:bg-gray-50/50">
                    <td className="p-2 font-medium border-b">{row.months} Months</td>
                    {row.cells.map((val, i) => (
                      <td key={i} className="p-2 text-right tabular-nums border-b">
                        ${val.toLocaleString(undefined, { minimumFractionDigits: 2 }) }
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-xs text-gray-500">
            * Estimated A.P.R. and payments subject to equity and credit requirements. Figures are illustrative and for internal use.
          </p>
        </div>

        {/* Customer View (clean) */}
        <div className="bg-white rounded-2xl shadow p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Customer View</h3>
            <label className="text-sm flex items-center gap-2">
              <input type="checkbox" checked={showOTD} onChange={(e)=>setShowOTD(e.target.checked)} />
              Show estimated OTD
            </label>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Vehicle price used: <strong>${salePrice.toLocaleString()}</strong> • APR: <strong>{aprPct}%</strong>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left p-2 border-b">Term</th>
                  <th className="text-right p-2 border-b">Payment (w/ ${downs[0].toLocaleString()} down)</th>
                  <th className="text-right p-2 border-b">Payment (w/ ${downs[1].toLocaleString()} down)</th>
                  <th className="text-right p-2 border-b">Payment (w/ ${downs[2].toLocaleString()} down)</th>
                </tr>
              </thead>
              <tbody>
                {grid.map((row) => (
                  <tr key={row.months} className="odd:bg-gray-50/50">
                    <td className="p-2 font-medium border-b">{row.months} mo</td>
                    {row.cells.map((val, i) => (
                      <td key={i} className="p-2 text-right tabular-nums border-b">
                        ${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {showOTD && (
            <p className="mt-2 text-xs text-gray-500">
              OTD placeholder: we’ll pull taxes/fees/addendums from the Admin “Programs” setup in the next step.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
