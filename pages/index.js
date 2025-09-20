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
  base,
  stateRate = 0.07,
  localRate = 0.0275,
  useSingleArticleCap = true,
  localCapBase = 1600,
  singleArticleRate = 0.0275,
  singleArticleUpper = 3200,
}) {
  if (base <= 0) return 0;
  const state = base * stateRate;
  if (!useSingleArticleCap) {
    const local = base * localRate;
    return +(state + local).toFixed(2);
  }
  const local = Math.min(base, localCapBase) * localRate;
  const singleArticlePortion = Math.max(Math.min(base, singleArticleUpper) - localCapBase, 0);
  const singleArticle = singleArticlePortion * singleArticleRate;
  return +(state + local + singleArticle).toFixed(2);
}

/* ---------- SHARED TABLES ---------- */
function CustomerGridTable({ downs, grid, showOTD }) {
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left p-2 border-b">Term</th>
            {downs.map((d, i) => (
              <th key={i} className="text-right p-2 border-b">
                ${d.toLocaleString()} down
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grid.map((row) => (
            <tr key={row.months} className="odd:bg-gray-50/50">
              <td className="p-2 font-medium border-b">{row.months} months</td>
              {row.cells.map((c, i) => (
                <td key={i} className="p-2 text-right tabular-nums border-b">
                  ${c.payment.toLocaleString(undefined, { minimumFractionDigits: 2 })}/mo
                  {showOTD && (
                    <div className="text-[11px] text-gray-500">
                      Est. OTD ${c.otd.toLocaleString()}
                    </div>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProductMenuTable({ terms, scenarios, highlightFull = true }) {
  const cols = [
    { key: "base", label: "Base" },
    { key: "maint", label: "+CarDoc Maint" },
    { key: "connect", label: "+Connect+Theft" },
    { key: "gap", label: "+GAP" },
    { key: "vsc", label: "+VSC" },
    { key: "full", label: "Full Protection" },
  ];
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left p-2 border-b">Term</th>
            {cols.map((c) => (
              <th key={c.key} className="text-right p-2 border-b">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {terms.map((m) => (
            <tr key={m} className="odd:bg-gray-50/50">
              <td className="p-2 font-medium border-b">{m} months</td>
              {cols.map((c) => {
                const cell = scenarios[m][c.key];
                const isFull = c.key === "full";
                return (
                  <td
                    key={c.key}
                    className={`p-2 text-right tabular-nums border-b ${highlightFull && isFull ? "bg-yellow-50 font-semibold" : ""}`}
                  >
                    ${cell.payment.toLocaleString(undefined, { minimumFractionDigits: 2 })}/mo
                    <div className="text-[11px] text-gray-500">
                      {c.key === "base" ? "Base" : `+${cell.delta.toLocaleString(undefined, { minimumFractionDigits: 2 })}/mo`}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- MAIN UI ---------- */
export default function Home() {
  // Vehicle & program inputs
  const [salePrice, setSalePrice] = useState(34240);
  const [aprPct, setAprPct] = useState(6.99);
  const [terms, setTerms] = useState([60, 72, 84]);    // rows
  const [downs, setDowns] = useState([0, 1000, 2000]); // columns
  const [menuDownIndex, setMenuDownIndex] = useState(1); // which Down to use for Product Menu (index into downs)

  // Deal structure
  const [rebate, setRebate] = useState(0);
  const [tradeAllowance, setTradeAllowance] = useState(0);
  const [payoff, setPayoff] = useState(0);
  const tradeEquity = Math.max(tradeAllowance - payoff, 0);

  // Fees & required package (included on all vehicles)
  const [docFee, setDocFee] = useState(699);
  const [titleFee, setTitleFee] = useState(89);
  const [tempTag, setTempTag] = useState(5);
  const [protectionPkgName] = useState("Victory Protection Package (included)");
  const [protectionPkgAmt] = useState(2998); // INCLUDED addendum

  // Optional add-on products
  const [carDocMaintAmt] = useState(1695);   // 5yr
  const [carDocConnectAmt] = useState(1295); // 6yr + Anti-Theft
  const [gapAmt] = useState(1198);
  const [vscAmt] = useState(2998);

  // Tax settings
  const [isTNMode, setIsTNMode] = useState(true);
  const [tnCapEnabled, setTnCapEnabled] = useState(true);
  const [stateRate, setStateRate] = useState(0.07);
  const [localRate, setLocalRate] = useState(0.0275);
  const [singleArticleRate, setSingleArticleRate] = useState(0.0275);

  // Presentation toggles
  const [showCustomerView, setShowCustomerView] = useState(true);
  const [showOTD, setShowOTD] = useState(true);

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

  // Base calc builder. extraAddons is total $ of selected optional products to finance.
  function buildCalc(cashDown, extraAddons = 0) {
    const addendumsIncluded = protectionPkgAmt; // always included
    const taxableBase = Math.max(salePrice - tradeAllowance, 0) + docFee + addendumsIncluded + extraAddons;

    const taxes = isTNMode
      ? tnSalesTax({
          base: taxableBase,
          stateRate,
          localRate,
          useSingleArticleCap: tnCapEnabled,
          singleArticleRate,
        })
      : +(taxableBase * (stateRate + localRate)).toFixed(2);

    const dueBeforeDowns = salePrice + docFee + titleFee + tempTag + addendumsIncluded + extraAddons + taxes;

    const capReductions = (cashDown || 0) + (rebate || 0) + tradeEquity;

    const amountFinanced = Math.max(dueBeforeDowns - capReductions, 0);

    const negativeEquity = Math.max(payoff - tradeAllowance, 0);
    const amountFinancedWithNE = amountFinanced + negativeEquity;

    return {
      taxes,
      amountFinanced: +amountFinancedWithNE.toFixed(2),
      otdWithDown: +(dueBeforeDowns + negativeEquity - (cashDown || 0) - rebate - tradeEquity).toFixed(2),
    };
  }

  // Original grid (terms × downs), BASE only (no optional add-ons)
  const grid = useMemo(() => {
    return terms.map((m) => {
      const cells = downs.map((d) => {
        const base = buildCalc(d, 0);
        const pay = pmt({ principal: base.amountFinanced, aprPct, months: m });
        return { down: d, months: m, payment: pay, amountFinanced: base.amountFinanced, otd: base.otdWithDown };
      });
      return { months: m, cells };
    });
  }, [
    salePrice, aprPct, terms, downs,
    rebate, tradeAllowance, payoff,
    docFee, titleFee, tempTag,
    protectionPkgAmt,
    isTNMode, tnCapEnabled, stateRate, localRate, singleArticleRate
  ]);

  // Product Menu scenarios for a chosen Down (downs[menuDownIndex])
  const productMenu = useMemo(() => {
    const down = downs[Math.min(menuDownIndex, Math.max(downs.length - 1, 0))] || 0;

    // Precompute addon totals
    const A_BASE = 0;
    const A_MAINT = carDocMaintAmt;
    const A_CONNECT = carDocConnectAmt;
    const A_GAP = gapAmt;
    const A_VSC = vscAmt;
    const A_FULL = A_MAINT + A_CONNECT + A_GAP + A_VSC;

    const byTerm = {};
    terms.forEach((m) => {
      const base = buildCalc(down, A_BASE);
      const maint = buildCalc(down, A_MAINT);
      const connect = buildCalc(down, A_CONNECT);
      const gap = buildCalc(down, A_GAP);
      const vsc = buildCalc(down, A_VSC);
      const full = buildCalc(down, A_FULL);

      const pBase = pmt({ principal: base.amountFinanced, aprPct, months: m });
      const pMaint = pmt({ principal: maint.amountFinanced, aprPct, months: m });
      const pConnect = pmt({ principal: connect.amountFinanced, aprPct, months: m });
      const pGap = pmt({ principal: gap.amountFinanced, aprPct, months: m });
      const pVsc = pmt({ principal: vsc.amountFinanced, aprPct, months: m });
      const pFull = pmt({ principal: full.amountFinanced, aprPct, months: m });

      byTerm[m] = {
        base:   { payment: pBase,   delta: 0 },
        maint:  { payment: pMaint,  delta: +(pMaint - pBase).toFixed(2) },
        connect:{ payment: pConnect,delta: +(pConnect - pBase).toFixed(2) },
        gap:    { payment: pGap,    delta: +(pGap - pBase).toFixed(2) },
        vsc:    { payment: pVsc,    delta: +(pVsc - pBase).toFixed(2) },
        full:   { payment: pFull,   delta: +(pFull - pBase).toFixed(2) },
      };
    });
    return { down, byTerm, addonTotals: { A_MAINT, A_CONNECT, A_GAP, A_VSC, A_FULL } };
  }, [
    downs, menuDownIndex, terms, aprPct,
    salePrice, rebate, tradeAllowance, payoff,
    docFee, titleFee, tempTag, protectionPkgAmt,
    carDocMaintAmt, carDocConnectAmt, gapAmt, vscAmt,
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
              className="no-print hidden print:hidden md:inline-flex bg-gray-800 text-white px-3 py-2 rounded-md"
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
              <div className="text-right text-sm">
                <span className="inline-block rounded bg-gray-100 px-2 py-1">
                  {protectionPkgName}: ${protectionPkgAmt.toLocaleString()} (included)
                </span>
              </div>
            </div>
          </div>

          {/* Fees & Tax */}
          <div className="bg-white rounded-2xl shadow p-4 space-y-3">
            <h2 className="font-semibold">Fees & Taxes</h2>
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

          {/* Grid & Menu settings */}
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
              <h3 className="font-medium text-sm mb-1">Product Menu Settings</h3>
              <label className="text-sm">
                <div className="font-medium">Presentation Down ($)</div>
                <select
                  className="mt-1 w-full rounded-md border p-2"
                  value={menuDownIndex}
                  onChange={(e)=>setMenuDownIndex(parseInt(e.target.value,10))}
                >
                  {downs.map((d,i)=>(<option key={i} value={i}>Use ${d.toLocaleString()} down</option>))}
                </select>
                <div className="text-xs text-gray-500 mt-1">
                  Product Menu uses this down across all terms to compare Base vs add-ons.
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* INTERNAL PAYMENT GRID (terms × downs) */}
        <div className="bg-white rounded-2xl shadow p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Estimated Payments (Base)</h2>
            <div className="text-sm text-gray-500">
              APR: {aprPct}% • Sale Price: ${salePrice.toLocaleString()}
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
            * Base includes {protectionPkgName}. Estimates only; subject to credit approval and program rules.
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
                style={{ height: 40, marginBottom: 8 }}
              />
              <h2 style={{ margin: 0 }}>Victory Honda of Jackson</h2>
              <p style={{ margin: 0, fontSize: 13 }}>
                1408 Highway 45 Bypass • Jackson, TN 38305 • (731) 660-0100
              </p>
              <p style={{ margin: 0, fontSize: 12 }}>
                Prepared by: ____________________ &nbsp; Date: ____________
              </p>
              <hr style={{ margin: "12px 0" }} />
            </div>

            {/* Customer intro */}
            <h3 className="font-semibold">Customer View</h3>
            <p className="text-sm text-gray-600">
              We’ve prepared options using a price of <strong>${salePrice.toLocaleString()}</strong>, an APR of{" "}
              <strong>{aprPct}%</strong>, and <strong>${(productMenu.down||0).toLocaleString()}</strong> down.
            </p>

            {/* Base terms × downs table (readable view) */}
            <CustomerGridTable downs={downs} grid={grid} showOTD={showOTD} />

            {/* Product Menu grid (Base vs add-ons) */}
            <div className="mt-6">
              <h3 className="font-semibold">Ownership Protection Options (using ${ (productMenu.down||0).toLocaleString() } down)</h3>
              <ProductMenuTable
                terms={terms}
                scenarios={productMenu.byTerm}
                highlightFull
              />
              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
                <div>
                  <div className="font-medium">Included:</div>
                  <ul className="list-disc list-inside">
                    <li>Victory Protection Package — Lifetime Nitrogen, All-Season Mats, Cargo Tray</li>
                    <li>3M Door Edge Guards, Wheel Locks, Splash Guards</li>
                  </ul>
                </div>
                <div>
                  <div className="font-medium">Add-Ons:</div>
                  <ul className="list-disc list-inside">
                    <li><strong>CarDoc Maintenance (5yr)</strong> — scheduled maintenance plan</li>
                    <li><strong>CarDoc Connect + Anti-Theft (6yr)</strong> — app, geo fencing, speed alerts, $5,000 theft benefit</li>
                    <li><strong>GAP</strong> — covers the loan/lease balance if vehicle is totaled</li>
                    <li><strong>VSC</strong> — extended service contract for major repairs</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Print-only Footer */}
            <div className="print-footer">
              * All figures are estimates and subject to credit approval, equity verification, and program rules. Taxes and fees as configured. See dealer for full details.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


