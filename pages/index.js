// pages/index.js
import { useMemo, useState } from "react";

/* ---------- FINANCE MATH ---------- */
// Monthly payment: PMT = r*PV / (1 - (1+r)^-n), r = APR/12
function pmt({ principal, aprPct, months }) {
  const r = (aprPct / 100) / 12;
  if (principal <= 0) return 0;
  if (r === 0) return +(principal / months).toFixed(2);
  const factor = r / (1 - Math.pow(1 + r, -months));
  return +(principal * factor).toFixed(2);
}

/* ---------- TAX (TN or Simple) ---------- */
function tnSalesTax({
  base,                 // taxable base
  stateRate = 0.07,     // 7.00% state
  localRate = 0.0275,   // up to 2.75% local
  useSingleArticleCap = true,
  localCapBase = 1600,  // local applies only to first $1,600
  singleArticleRate = 0.0275, // 2.75% state single-article tax
  singleArticleUpper = 3200,   // $1,600.01 - $3,200 range
}) {
  if (base <= 0) return 0;

  // Always apply full 7% state tax across the full base
  const state = base * stateRate;

  if (!useSingleArticleCap) {
    // Simple: local on full base (works for non-TN or approximation)
    const local = base * localRate;
    return +(state + local).toFixed(2);
  }

  // Local: only on first $1,600
  const local = Math.min(base, localCapBase) * localRate;

  // State single-article 2.75%: only on portion 1600.01 - 3200
  const singleArticlePortion = Math.max(Math.min(base, singleArticleUpper) - localCapBase, 0);
  const singleArticle = singleArticlePortion * singleArticleRate;

  return +(state + local + singleArticle).toFixed(2);
}

/* ---------- MAIN UI ---------- */
export default function Home() {
  // Vehicle & program inputs (rep-facing)
  const [salePrice, setSalePrice] = useState(34240); // example
  const [aprPct, setAprPct] = useState(6.99);
  const [terms, setTerms] = useState([60, 72, 84]);      // rows
  const [downs, setDowns] = useState([0, 1000, 2000]);   // columns

  // Deal structure
  const [rebate, setRebate] = useState(0);               // taxable manufacturer or dealer cash you want to treat as cap reduction
  const [tradeAllowance, setTradeAllowance] = useState(0);
  const [payoff, setPayoff] = useState(0);
  const tradeEquity = Math.max(tradeAllowance - payoff, 0); // negative equity handled below

  // Fees & addendums (admin would set defaults later)
  const [docFee, setDocFee] = useState(699);
  const [titleFee, setTitleFee] = useState(89);
  const [tempTag, setTempTag] = useState(5);

  const [addendumRequiredName, setAddendumRequiredName] = useState("Protection Package");
  const [addendumRequiredAmt, setAddendumRequiredAmt] = useState(2998);
  const [addendumOptName, setAddendumOptName] = useState("Security Product");
  const [addendumOptAmt, setAddendumOptAmt] = useState(1295);
  const [addendumOptSelected, setAddendumOptSelected] = useState(true);

  // Tax settings
  const [isTNMode, setIsTNMode] = useState(true);
  const [tnCapEnabled, setTnCapEnabled] = useState(true);
  const [stateRate, setStateRate] = useState(0.07);
  const [localRate, setLocalRate] = useState(0.0275);
  const [singleArticleRate, setSingleArticleRate] = useState(0.0275);

  // Presentation toggles
  const [showCustomerView, setShowCustomerView] = useState(true);
  const [showOTD, setShowOTD] = useState(true);

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

  // Central calculation for a given cash down:
  function buildCalc(cashDown) {
    const optAdd = addendumOptSelected ? addendumOptAmt : 0;
    const addendums = (addendumRequiredAmt || 0) + optAdd;

    // Taxable base: price - trade credit + doc + (addendums if you tax them)
    // In TN, trade credit reduces the taxable base.
    const taxableBase =
      Math.max(salePrice - tradeAllowance, 0) + docFee + addendums;

    const taxes = isTNMode
      ? tnSalesTax({
          base: taxableBase,
          stateRate,
          localRate,
          useSingleArticleCap: tnCapEnabled,
          singleArticleRate,
        })
      : // Simple combined rate (state+local) without caps
        +(taxableBase * (stateRate + localRate)).toFixed(2);

    // Amount Due (pre-finance): price + fees + addendums + taxes
    const dueBeforeDowns =
      salePrice + docFee + titleFee + tempTag + addendums + taxes;

    // Cap reductions: cash down + rebate + trade equity (if positive)
    const capReductions = (cashDown || 0) + (rebate || 0) + tradeEquity;

    // Amount financed (cannot be < 0)
    const amountFinanced = Math.max(dueBeforeDowns - capReductions, 0);

    // If payoff > tradeAllowance, that's negative equity; roll into amount financed
    const negativeEquity = Math.max(payoff - tradeAllowance, 0);
    const amountFinancedWithNE = amountFinanced + negativeEquity;

    // Monthly payment per selected term happens later for grid rows
    return {
      addendums,
      taxes,
      dueBeforeDowns,
      capReductions,
      amountFinanced: +amountFinancedWithNE.toFixed(2),
      // For OTD (cash deal), show due at signing with this down:
      otdWithDown: +(dueBeforeDowns + negativeEquity - (cashDown || 0) - rebate - tradeEquity).toFixed(2),
    };
  }

  const grid = useMemo(() => {
    return terms.map((m) => {
      const cells = downs.map((d) => {
        const c = buildCalc(d);
        const pay = pmt({ principal: c.amountFinanced, aprPct, months: m });
        return {
          down: d,
          months: m,
          payment: pay,
          amountFinanced: c.amountFinanced,
          otd: c.otdWithDown,
        };
      });
      return { months: m, cells };
    });
  }, [
    salePrice, aprPct, terms, downs,
    rebate, tradeAllowance, payoff,
    docFee, titleFee, tempTag,
    addendumRequiredAmt, addendumOptAmt, addendumOptSelected,
    isTNMode, tnCapEnabled, stateRate, localRate, singleArticleRate
  ]);

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-6xl space-y-6 print:max-w-none">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Victory Desking — Payment Grid (Buy)</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="hidden print:hidden md:inline-flex bg-gray-800 text-white px-3 py-2 rounded-md"
            >
              Print
            </button>
            <label className="text-sm flex items-center gap-2">
              <input type="checkbox" checked={showCustomerView} onChange={(e)=>setShowCustomerView(e.target.checked)} />
              Customer view
            </label>
          </div>
        </header>

        {/* Inputs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Deal basics */}
          <div className="bg-white rounded-2xl shadow p-4 space-y-3">
            <h2 className="font-semibold">Deal Basics</h2>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm">
                <div className="font-medium">Sale Price ($)</div>
                <input type="number" className="mt-1 w-full rounded-md border p-2"
                  value={salePrice} onChange={(e)=>setSalePrice(parseFloat(e.target.value||"0"))}/>
              </label>
              <label className="text-sm">
                <div className="font-medium">APR (%)</div>
                <input type="number" step="0.01" className="mt-1 w-full rounded-md border p-2"
                  value={aprPct} onChange={(e)=>setAprPct(parseFloat(e.target.value||"0"))}/>
              </label>

              <label className="text-sm">
                <div className="font-medium">Rebate ($)</div>
                <input type="number" className="mt-1 w-full rounded-md border p-2"
                  value={rebate} onChange={(e)=>setRebate(parseFloat(e.target.value||"0"))}/>
              </label>
              <label className="text-sm">
                <div className="font-medium">Trade Allow ($)</div>
                <input type="number" className="mt-1 w-full rounded-md border p-2"
                  value={tradeAllowance} onChange={(e)=>setTradeAllowance(parseFloat(e.target.value||"0"))}/>
              </label>
              <label className="text-sm">
                <div className="font-medium">Payoff ($)</div>
                <input type="number" className="mt-1 w-full rounded-md border p-2"
                  value={payoff} onChange={(e)=>setPayoff(parseFloat(e.target.value||"0"))}/>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="text-xs text-gray-500">
                * Trade equity reduces taxable base in TN. Negative equity rolls into amount financed.
              </div>
              <label className="text-sm justify-self-end flex items-center gap-2">
                <input type="checkbox" checked={showOTD} onChange={(e)=>setShowOTD(e.target.checked)} />
                Show OTD in grid
              </label>
            </div>
          </div>

          {/* Fees & Addendums */}
          <div className="bg-white rounded-2xl shadow p-4 space-y-3">
            <h2 className="font-semibold">Fees & Addendums</h2>
            <div className="grid grid-cols-3 gap-3">
              <label className="text-sm">
                <div className="font-medium">Doc Fee</div>
                <input type="number" className="mt-1 w-full rounded-md border p-2"
                  value={docFee} onChange={(e)=>setDocFee(parseFloat(e.target.value||"0"))}/>
              </label>
              <label className="text-sm">
                <div className="font-medium">Title</div>
                <input type="number" className="mt-1 w-full rounded-md border p-2"
                  value={titleFee} onChange={(e)=>setTitleFee(parseFloat(e.target.value||"0"))}/>
              </label>
              <label className="text-sm">
                <div className="font-medium">Temp Tag</div>
                <input type="number" className="mt-1 w-full rounded-md border p-2"
                  value={tempTag} onChange={(e)=>setTempTag(parseFloat(e.target.value||"0"))}/>
              </label>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center gap-2">
                <input className="w-full rounded-md border p-2" value={addendumRequiredName} onChange={(e)=>setAddendumRequiredName(e.target.value)} />
                <input type="number" className="w-36 rounded-md border p-2" value={addendumRequiredAmt} onChange={(e)=>setAddendumRequiredAmt(parseFloat(e.target.value||"0"))}/>
                <span className="text-xs text-gray-500">Required</span>
              </div>
              <div className="flex items-center gap-2">
                <input className="w-full rounded-md border p-2" value={addendumOptName} onChange={(e)=>setAddendumOptName(e.target.value)} />
                <input type="number" className="w-36 rounded-md border p-2" value={addendumOptAmt} onChange={(e)=>setAddendumOptAmt(parseFloat(e.target.value||"0"))}/>
                <label className="text-xs flex items-center gap-2">
                  <input type="checkbox" checked={addendumOptSelected} onChange={(e)=>setAddendumOptSelected(e.target.checked)} />
                  include
                </label>
              </div>
            </div>
          </div>

          {/* Terms & Downs */}
          <div className="bg-white rounded-2xl shadow p-4 space-y-3">
            <h2 className="font-semibold">Grid Settings</h2>
            <label className="text-sm block">
              <div className="font-medium">Down Columns ($)</div>
              <div className="mt-1 grid grid-cols-3 gap-2">
                {downs.map((d, i) => (
                  <input key={i} type="number" className="rounded-md border p-2"
                    value={d} onChange={(e)=>updateDown(i, e.target.value)} />
                ))}
              </div>
            </label>

            <label className="text-sm block">
              <div className="font-medium">Term Rows (months)</div>
              <div className="mt-1 grid grid-cols-3 gap-2">
                {terms.map((t, i) => (
                  <input key={i} type="number" className="rounded-md border p-2"
                    value={t} onChange={(e)=>updateTerm(i, e.target.value)} />
                ))}
              </div>
            </label>

            <div className="pt-2 border-t mt-2">
              <h3 className="font-medium text-sm mb-1">Tax Mode</h3>
              <div className="flex items-center gap-3 text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={isTNMode} onChange={(e)=>setIsTNMode(e.target.checked)} />
                  Tennessee mode
                </label>
                {isTNMode ? (
                  <>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={tnCapEnabled} onChange={(e)=>setTnCapEnabled(e.target.checked)} />
                      Single-article cap
                    </label>
                    <span>State {Math.round(stateRate*10000)/100}%</span>
                    <span>Local {Math.round(localRate*10000)/100}%</span>
                    <span>SA {Math.round(singleArticleRate*10000)/100}%</span>
                  </>
                ) : (
                  <>
                    <span>State</span>
                    <input type="number" step="0.0001" className="w-20 rounded-md border p-1"
                      value={stateRate} onChange={(e)=>setStateRate(parseFloat(e.target.value||"0"))}/>
                    <span>Local</span>
                    <input type="number" step="0.0001" className="w-20 rounded-md border p-1"
                      value={localRate} onChange={(e)=>setLocalRate(parseFloat(e.target.value||"0"))}/>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* GRID */}
        <div className="bg-white rounded-2xl shadow p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Estimated Payments</h2>
            <div className="text-sm text-gray-500">
              APR shown: {aprPct}% • Sale Price used: ${salePrice.toLocaleString()}
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left p-2 border-b">Term / Down</th>
                  {downs.map((d,i)=>(
                    <th key={i} className="text-right p-2 border-b">${d.toLocaleString()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grid.map((row)=>(
                  <tr key={row.months} className="odd:bg-gray-50/50 align-top">
                    <td className="p-2 font-medium border-b">{row.months} mo</td>
                    {row.cells.map((c,i)=>(
                      <td key={i} className="p-2 text-right tabular-nums border-b">
                        <div className="text-base font-semibold">
                          ${c.payment.toLocaleString(undefined,{minimumFractionDigits:2})}/mo
                        </div>
                        <div className="text-[11px] text-gray-500">
                          Amt Fin: ${c.amountFinanced.toLocaleString()}
                        </div>
                        {showOTD && (
                          <div className="text-[11px] text-gray-500">
                            Est. OTD: ${c.otd.toLocaleString()}
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-xs text-gray-500">
            * Estimates only. Taxes per TN rules (toggleable), fees/addendums as shown, subject to credit approval and equity. Program terms subject to change.
          </p>
        </div>

        {/* CUSTOMER VIEW (print-optimized) */}
{showCustomerView && (
  <div id="customer-print" className="bg-white rounded-2xl shadow p-4">
    {/* Print-only Header */}
    <div className="print-header">
      <img
        src="https://upload.wikimedia.org/wikipedia/commons/0/08/Honda_logo.png"
        alt="Honda Logo"
        style={{ height: "40px", marginBottom: "8px" }}
      />
      <h2 style={{ margin: 0 }}>Victory Honda of Jackson</h2>
      <p style={{ margin: 0, fontSize: "13px" }}>
        1408 Highway 45 Bypass • Jackson, TN 38305 • (731) 555-1234
      </p>
      <hr style={{ margin: "12px 0" }} />
    </div>

    {/* Existing Customer View Content */}
    <h3 className="font-semibold">Customer View</h3>
    <p className="text-sm text-gray-600">
      We’ve prepared a few options using a price of{" "}
      <strong>${salePrice.toLocaleString()}</strong> and an APR of{" "}
      <strong>{aprPct}%</strong>. Figures are estimates only.
    </p>

    {/* ... your existing table goes here ... */}

    {/* Print-only Footer */}
    <div className="print-footer">
      * All figures are estimates only and subject to credit approval, equity
      verification, and program rules. Taxes, fees, and addendums shown as of
      current month. See dealer for complete details.
    </div>
  </div>
)
}


