import { useState } from "react";

export default function Home() {
  const [salePrice, setSalePrice] = useState("");
  const [term, setTerm] = useState("60");
  const [payment, setPayment] = useState(null);

  function calculate() {
    const price = parseFloat(salePrice || "0");
    const months = parseInt(term);
    const apr = 0.0349; // 3.49% demo APR
    const monthly = (price * (1 + apr)) / months;
    setPayment(monthly.toFixed(2));
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow p-6 space-y-4">
        <h1 className="text-xl font-bold text-center">Victory Desking (MVP)</h1>

        <label className="block">
          <span className="text-sm font-medium">Sale Price ($)</span>
          <input
            type="number"
            value={salePrice}
            onChange={(e) => setSalePrice(e.target.value)}
            className="mt-1 w-full rounded-md border p-2"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Term (months)</span>
          <select
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            className="mt-1 w-full rounded-md border p-2"
          >
            <option value="60">60</option>
            <option value="72">72</option>
            <option value="84">84</option>
          </select>
        </label>

        <button
          onClick={calculate}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
        >
          Desk It
        </button>

        {payment && (
          <div className="text-center mt-4">
            <p className="text-lg font-semibold">Estimated Payment</p>
            <p className="text-2xl">${payment}/mo</p>
          </div>
        )}
      </div>
    </div>
  );
}
