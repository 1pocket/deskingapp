// pages/index.js
import { useMemo, useRef, useState, useEffect } from "react";
import dynamic from "next/dynamic";

// Load print buttons client-side (they use localStorage/window)
const PrintBundleButton = dynamic(() => import("../src/components/PrintBundleButton"), { ssr: false });
const PrintPencilButton = dynamic(() => import("../src/components/PrintPencilButton"), { ssr: false });

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
    { key: "combo", label: "Selected Combo" }, // NEW
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

/* ---------- SIMPLE SIGNATURE PAD ---------- */
function SignaturePad({ onChange }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000";

    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches ? e.touches[0] : e;
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    };

    const down = (e) => {
      drawing.current = true;
      const p = getPos(e);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      e.preventDefault();
    };
    const move = (e) => {
      if (!drawing.current) return;
      const p = getPos(e);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      e.preventDefault();
      onChange?.(canvas.toDataURL("image/png"));
    };
    const up = () => { drawing.current = false; };

    canvas.addEventListener("mousedown", down);
    canvas.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    canvas.addEventListener("touchstart", down, { passive: false });
    canvas.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("touchend", up);

    return () => {
      canvas.removeEventListener("mousedown", down);
      canvas.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      canvas.removeEventListener("touchstart", down);
      canvas.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", up);
    };
  }, [onChange]);

  const clearSig = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onChange?.("");
  };

  return (
    <div>
      <canvas
        id="sigpad"
        ref={canvasRef}
        width={500}
        height={160}
        className="border rounded bg-white w-full"
        style={{ touchAction: "none" }}
      />
      <div className="mt-2 flex gap-2">
        <button type="button" onClick={clearSig} className="secondary px-3 py-1 rounded">Clear</button>
      </div>
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
  const [menuDownIndex, setMenuDownIndex] = useState(1); // which Down to use for Product Menu

  // Deal structure
  const [rebate, setRebate] = useState(0);
  const [tradeAllowance, setTradeAllowance] = useState(0);
  const [payoff, setPayoff] = useState(0);
  const tradeEquity = Math.max(tradeAllowance - payoff, 0);

  // Fees & required package (included on all vehicles)
  const [docFee, setDocFee] = useState(799); // ← default updated
  const [titleFee, setTitleFee] = useState(101); // ← default updated (Tag/Title)
  const [tempTag, setTempTag] = useState(5);
  const [protectionPkgName] = useState("Victory Protection Package (included)");
  const [protectionPkgAmt] = useState(2998); // INCLUDED addendum

  // Optional add-on products
  const [carDocMaintAmt] = useState(1695);   // 5yr
  const [carDocConnectAmt] = useState(1295); // 6yr + Anti-Theft
  const [gapAmt] = useState(1198);
  const [vscAmt] = useState(2998);

  // Customer-chosen add-ons for the "Selected Combo" column
  const [selMaint, setSelMaint] = useState(true);
  const [selConnect, setSelConnect] = useState(true);
  const [selGap, setSelGap] = useState(false);
  const [selVsc, setSelVsc] = useState(false);

  // Tax settings
  const [isTNMode, setIsTNMode] = useState(true);
  const [tnCapEnabled, setTnCapEnabled] = useState(true);
  const [stateRate, setStateRate] = useState(0.07);
  const [localRate, setLocalRate] = useState(0.0275);
  const [singleArticleRate, setSingleArticleRate] = useState(0.0275);

  // Presentation toggles
  const [showCustomerView, setShowCustomerView] = useState(true);
  const [showOTD, setShowOTD] = useState(true);

  // e-Sign modal & acknowledgment fields
  const [showSign, setShowSign] = useState(false);
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custEmail, setCustEmail] = useState("");
  const [agreedTerm, setAgreedTerm] = useState(72);
  const [agreedSigData, setAgreedSigData] = useState("");
  const [agreedOption, setAgreedOption] = useState("combo"); // base | maint | connect | gap | vsc | full | combo

  // Vehicle identifiers (for print headers)
  const [year, setYear] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [vin, setVin] = useState("");
  const [stock, setStock] = useState("");
  const [newOrUsed, setNewOrUsed] = useState("Used");

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

  // Product Menu scenarios for chosen Down (downs[menuDownIndex]), incl. Selected Combo
  const productMenu = useMemo(() => {
    const down = downs[Math.min(menuDownIndex, Math.max(downs.length - 1, 0))] || 0;

    const A_MAINT = carDocMaintAmt;
    const A_CONNECT = carDocConnectAmt;
    const A_GAP = gapAmt;
    const A_VSC = vscAmt;

    const byTerm = {};
    terms.forEach((m) => {
      const base = buildCalc(down, 0);
      const maint = buildCalc(down, A_MAINT);
      const connect = buildCalc(down, A_CONNECT);
      const gap = buildCalc(down, A_GAP);
      const vsc = buildCalc(down, A_VSC);
      const full = buildCalc(down, A_MAINT + A_CONNECT + A_GAP + A_VSC);
      const combo = buildCalc(
        down,
        (selMaint ? A_MAINT : 0) + (selConnect ? A_CONNECT : 0) + (selGap ? A_GAP : 0) + (selVsc ? A_VSC : 0)
      );

      const pBase = pmt({ principal: base.amountFinanced, aprPct, months: m });
      const pMaint = pmt({ principal: maint.amountFinanced, aprPct, months: m });
      const pConnect = pmt({ principal: connect.amountFinanced, aprPct, months: m });
      const pGap = pmt({ principal: gap.amountFinanced, aprPct, months: m });
      const pVsc = pmt({ principal: vsc.amountFinanced, aprPct, months: m });
      const pFull = pmt({ principal: full.amountFinanced, aprPct, months: m });
      const pCombo = pmt({ principal: combo.amountFinanced, aprPct, months: m });

      byTerm[m] = {
        base:   { payment: pBase,   delta: 0 },
        maint:  { payment: pMaint,  delta: +(pMaint - pBase).toFixed(2) },
        connect:{ payment: pConnect,delta: +(pConnect - pBase).toFixed(2) },
        gap:    { payment: pGap,    delta: +(pGap - pBase).toFixed(2) },
        vsc:    { payment: pVsc,    delta: +(pVsc - pBase).toFixed(2) },
        full:   { payment: pFull,   delta: +(pFull - pBase).toFixed(2) },
        combo:  { payment: pCombo,  delta: +(pCombo - pBase).toFixed(2) },
      };
    });

    return { down, byTerm };
  }, [
    downs, menuDownIndex, terms, aprPct,
    salePrice, rebate, tradeAllowance, payoff,
    docFee, titleFee, tempTag, protectionPkgAmt,
    carDocMaintAmt, carDocConnectAmt, gapAmt, vscAmt,
    isTNMode, tnCapEnabled, stateRate, localRate, singleArticleRate,
    selMaint, selConnect, selGap, selVsc
  ]);

  // Build the "pencil" snapshot for printing features
  const pencil = useMemo(() => {
    const first = (custName || "").trim().split(" ")[0] || "";
    const last = (custName || "").trim().split(" ").slice(1).join(" ");
    return {
      deal: { year, make, model, vin, stock, newOrUsed },
      customer: {
        firstName: first,
        lastName: last,
        cell: custPhone || "",
        email: custEmail || "",
      },
    };
  }, [year, make, model, vin, stock, newOrUsed, custName, custPhone, custEmail]);

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
                <input type="number" className="mt-1 w-full rounded-md border p-2" autoComplete="off"
                  value={salePrice} onChange={(e)=>setSalePrice(parseFloat(e.target.value||"0"))}/>
              </label>
              <label className="text-sm">
                <div className="font-medium">APR (%)</div>
                <input type="number" step="0.01" className="mt-1 w-full rounded-md border p-2" autoComplete="off"
                  value={aprPct} onChange={(e)=>setAprPct(parseFloat(e.target.value||"0"))}/>
              </label>
              <label className="text-sm">
                <div className="font-medium">Rebate ($)</div>
                <input type="number" className="mt-1 w-full rounded-md border p-2" autoComplete="off"
                  value={rebate} onChange={(e)=>setRebate(parseFloat(e.target.value||"0"))}/>
              </label>
              <label className="text-sm">
                <div className="font-medium">Trade Allow ($)</div>
                <input type="number" className="mt-1 w-full rounded-md border p-2" autoComplete="off"
                  value={tradeAllowance} onChange={(e)=>setTradeAllowance(parseFloat(e.target.value||"0"))}/>
              </label>
              <label className="text-sm">
                <div className="font-medium">Payoff ($)</div>
                <input type="number" className="mt-1 w-full rounded-md border p-2" autoComplete="off"
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
                <input type="number" className="mt-1 w-full rounded-md border p-2" autoComplete="off"
                  value={docFee} onChange={(e)=>setDocFee(parseFloat(e.target.value||"0"))}/>
              </label>
              <label className="text-sm">
                <div className="font-medium">Title</div>
                <input type="number" className="mt-1 w-full rounded-md border p-2" autoComplete="off"
                  value={titleFee} onChange={(e)=>setTitleFee(parseFloat(e.target.value||"0"))}/>
              </label>
              <label className="text-sm">
                <div className="font-medium">Temp Tag</div>
                <input type="number" className="mt-1 w-full rounded-md border p-2" autoComplete="off"
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

              {/* Custom mix toggles */}
              <div className="mt-3">
                <div className="font-medium text-sm mb-1">Build a Custom Mix (for the “Selected Combo” column)</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={selMaint} onChange={(e)=>setSelMaint(e.target.checked)} />
                    CarDoc Maintenance (5yr) — ${carDocMaintAmt.toLocaleString()}
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={selConnect} onChange={(e)=>setSelConnect(e.target.checked)} />
                    Connect + Anti-Theft (6yr) — ${carDocConnectAmt.toLocaleString()}
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={selGap} onChange={(e)=>setSelGap(e.target.checked)} />
                    GAP — ${gapAmt.toLocaleString()}
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={selVsc} onChange={(e)=>setSelVsc(e.target.checked)} />
                    VSC — ${vscAmt.toLocaleString()}
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  The Product Menu will show a “Selected Combo” column using this mix at the chosen down.
                </p>
              </div>
            </div>
          </div>

          {/* Vehicle / Print */}
          <div className="bg-white rounded-2xl shadow p-4 space-y-3">
            <h2 className="font-semibold">Vehicle / Print</h2>
            <div className="grid grid-cols-3 gap-3">
              <label className="text-sm">
                <div className="font-medium">Year</div>
                <input className="mt-1 w-full rounded-md border p-2" value={year} onChange={(e)=>setYear(e.target.value)} />
              </label>
              <label className="text-sm">
                <div className="font-medium">Make</div>
                <input className="mt-1 w-full rounded-md border p-2" value={make} onChange={(e)=>setMake(e.target.value)} />
              </label>
              <label className="text-sm">
                <div className="font-medium">Model</div>
                <input className="mt-1 w-full rounded-md border p-2" value={model} onChange={(e)=>setModel(e.target.value)} />
              </label>
              <label className="text-sm">
                <div className="font-medium">VIN</div>
                <input className="mt-1 w-full rounded-md border p-2" value={vin} onChange={(e)=>setVin(e.target.value)} />
              </label>
              <label className="text-sm">
                <div className="font-medium">Stock</div>
                <input className="mt-1 w-full rounded-md border p-2" value={stock} onChange={(e)=>setStock(e.target.value)} />
              </label>
              <label className="text-sm">
                <div className="font-medium">Type</div>
                <select className="mt-1 w-full rounded-md border p-2" value={newOrUsed} onChange={(e)=>setNewOrUsed(e.target.value)}>
                  <option>Used</option>
                  <option>New</option>
                </select>
              </label>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <PrintBundleButton state={pencil} />
              <PrintPencilButton state={pencil} />
            </div>

            <p className="text-xs text-gray-500">
              The Sales Bundle PDF always prints a header with the customer & vehicle info above.
              “Filled” mode also drops key fields onto page 1 of each form (you can nudge coords later).
            </p>
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
                src="/logo.png"
                alt="Victory Honda Logo"
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

            {/* Hide this tall grid when printing */}
            <div className="hide-on-print">
              <CustomerGridTable downs={downs} grid={grid} showOTD={showOTD} />
            </div>

            {/* Product Menu grid (prints) */}
            <div className="mt-6">
              <h3 className="font-semibold">
                Ownership Protection Options (using ${ (productMenu.down||0).toLocaleString() } down)
              </h3>
              <ProductMenuTable terms={terms} scenarios={productMenu.byTerm} highlightFull />

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

              {/* Commit & e-Sign button (screen only) */}
              <div className="mt-4 no-print">
                <button type="button" onClick={()=>setShowSign(true)} className="primary bg-blue-600 text-white px-4 py-2 rounded">
                  Commit & e-Sign (non-legal)
                </button>
                <p className="text-xs text-gray-500 mt-1">
                  This is a non-binding acknowledgment to pass along to Finance with your selected option.
                </p>
              </div>
            </div>

            {/* Printable acknowledgment of the customer's selection */}
            <div className="mt-6 border rounded p-3">
              <h4 className="font-semibold mb-2">Customer Acknowledgment (Non-Legal)</h4>
              <p className="text-sm">
                Name: <strong>{custName || "_____"} </strong>&nbsp;•&nbsp;
                Phone: <strong>{custPhone || "_____"} </strong>&nbsp;•&nbsp;
                Email: <strong>{custEmail || "_____"} </strong>
              </p>
              <p className="text-sm">
                Selected Term: <strong>{agreedTerm}</strong> months &nbsp;•&nbsp;
                Option: <strong>{
                  { base:"Base", maint:"+CarDoc Maint", connect:"+Connect+Theft", gap:"+GAP", vsc:"+VSC", full:"Full Protection", combo:"Selected Combo" }[agreedOption]
                }</strong> &nbsp;•&nbsp;
                Down: <strong>${(productMenu.down||0).toLocaleString()}</strong>
              </p>
              <p className="text-sm">
                Estimated Payment: <strong>
                  {(() => {
                    const rec = productMenu.byTerm?.[agreedTerm]?.[agreedOption];
                    return rec ? `$${rec.payment.toLocaleString(undefined,{minimumFractionDigits:2})}/mo` : "—";
                  })()}
                </strong>
              </p>
              <div className="mt-2">
                <div className="text-xs text-gray-500 mb-1">Signature (non-legal):</div>
                {agreedSigData ? (
                  <img src={agreedSigData} alt="signature" style={{ height: 60 }} />
                ) : (
                  <div className="h-16 border rounded"></div>
                )}
              </div>
              <p className="text-[11px] text-gray-500 mt-2">
                This acknowledgment is not a retail installment contract nor a legal e-signature; it reflects the customer’s preferred option to streamline the process with the Finance office. All financing subject to credit approval and final lender terms.
              </p>
            </div>

            {/* Print-only Footer */}
            <div className="print-footer">
              * All figures are estimates and subject to credit approval, equity verification, and program rules. Taxes and fees as configured. See dealer for full details.
            </div>
          </div>
        )}

        {/* e-Sign Modal (screen only) */}
        {showSign && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 no-print">
            <div className="bg-white rounded-2xl shadow p-6 w-full max-w-xl">
              <h3 className="text-lg font-semibold mb-3">Confirm Your Choice</h3>

              <div className="grid grid-cols-1 gap-3">
                <label className="text-sm">
                  <div className="font-medium">Your Name</div>
                  <input className="w-full rounded-md border p-2" value={custName} onChange={(e)=>setCustName(e.target.value)} />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-sm">
                    <div className="font-medium">Phone</div>
                    <input className="w-full rounded-md border p-2" value={custPhone} onChange={(e)=>setCustPhone(e.target.value)} />
                  </label>
                  <label className="text-sm">
                    <div className="font-medium">Email</div>
                    <input className="w-full rounded-md border p-2" value={custEmail} onChange={(e)=>setCustEmail(e.target.value)} />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="text-sm">
                    <div className="font-medium">Term (months)</div>
                    <select className="w-full rounded-md border p-2" value={agreedTerm} onChange={(e)=>setAgreedTerm(parseInt(e.target.value,10))}>
                      {terms.map(t=> <option key={t} value={t}>{t}</option>)}
                    </select>
                  </label>
                  <label className="text-sm">
                    <div className="font-medium">Option</div>
                    <select className="w-full rounded-md border p-2" value={agreedOption} onChange={(e)=>setAgreedOption(e.target.value)}>
                      <option value="base">Base</option>
                      <option value="maint">+CarDoc Maint</option>
                      <option value="connect">+Connect+Theft</option>
                      <option value="gap">+GAP</option>
                      <option value="vsc">+VSC</option>
                      <option value="full">Full Protection</option>
                      <option value="combo">Selected Combo</option>
                    </select>
                  </label>
                </div>

                <div className="text-sm">
                  <div className="font-medium mb-1">Sign Below</div>
                  <SignaturePad onChange={setAgreedSigData} />
                  <div className="text-xs text-gray-500 mt-1">
                    This is not a legal e-signature. It’s an acknowledgment to speed up your visit with Finance.
                  </div>
                </div>
              </div>

              <div className="mt-4 flex gap-2 justify-end">
                <button className="secondary bg-gray-200 px-3 py-2 rounded" onClick={()=>setShowSign(false)}>Cancel</button>
                <button
                  className="primary bg-blue-600 text-white px-3 py-2 rounded"
                  onClick={()=>{ setShowSign(false); setTimeout(()=>window.print(), 50); }}
                  disabled={!custName || !agreedSigData}
                  title={!custName || !agreedSigData ? "Enter name and add a signature" : "Print acknowledgment"}
                >
                  Save & Print Acknowledgment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
