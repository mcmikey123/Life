import { aggregateProjectCosts } from "@/lib/vault";

export const dynamic = "force-dynamic";

const STUB_TX = [
  { date: "May 6, 2026",  desc: "Coffee Shop",     cat: "Food",      amount: -6.50,    status: "Complete" },
  { date: "May 5, 2026",  desc: "Salary Deposit",  cat: "Income",    amount: 5000.00,  status: "Complete" },
  { date: "May 1, 2026",  desc: "Rent Payment",    cat: "Housing",   amount: -1500.00, status: "Complete" },
  { date: "Apr 28, 2026", desc: "Groceries",       cat: "Food",      amount: -124.32,  status: "Complete" },
  { date: "Apr 25, 2026", desc: "Electric Bill",   cat: "Utilities", amount: -89.50,   status: "Pending"  },
  { date: "Apr 20, 2026", desc: "Internet Bill",   cat: "Utilities", amount: -59.99,   status: "Complete" },
  { date: "Apr 18, 2026", desc: "Gym Membership",  cat: "Health",    amount: -45.00,   status: "Complete" },
  { date: "Apr 15, 2026", desc: "Petrol",          cat: "Transport", amount: -62.40,   status: "Complete" },
];

function fmt(n: number) {
  const abs = Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return n >= 0 ? `+$${abs}` : `-$${abs}`;
}

export default function FinancePage() {
  const projectCosts = aggregateProjectCosts();
  const projectActual = projectCosts.reduce((s, p) => s + p.actual, 0);

  const balance = 12480.55;
  const incomeMTD = STUB_TX.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const spendMTD = -STUB_TX.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0);

  return (
    <>
      <h2>Finance</h2>
      <p className="subtitle">Balance · cash flow · transactions</p>

      <div className="finance-kpis">
        <div className="finance-kpi">
          <div className="label">Balance</div>
          <div className="value">${balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div className="finance-kpi">
          <div className="label">Income MTD</div>
          <div className="value">+${incomeMTD.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div className="finance-kpi">
          <div className="label">Spend MTD</div>
          <div className="value">-${spendMTD.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div className="finance-kpi">
          <div className="label">Project costs</div>
          <div className="value">${projectActual.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
      </div>

      <div className="section-title">Recent transactions</div>

      <table className="finance-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Category</th>
            <th style={{ textAlign: "right" }}>Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {STUB_TX.map((t, i) => (
            <tr key={i}>
              <td>{t.date}</td>
              <td>{t.desc}</td>
              <td><span className="tag">{t.cat}</span></td>
              <td style={{ textAlign: "right" }}>
                <span className={t.amount >= 0 ? "amount-pos" : "amount-neg"}>{fmt(t.amount)}</span>
              </td>
              <td>
                <span className={`badge ${t.status === "Complete" ? "good" : "warn"}`}>{t.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {projectCosts.length > 0 && (
        <>
          <div className="section-title">Project budgets</div>
          <table className="finance-table">
            <thead>
              <tr>
                <th>Project</th>
                <th style={{ textAlign: "right" }}>Estimated</th>
                <th style={{ textAlign: "right" }}>Actual</th>
                <th style={{ textAlign: "right" }}>Variance</th>
              </tr>
            </thead>
            <tbody>
              {projectCosts.map((p) => {
                const variance = p.estimated - p.actual;
                return (
                  <tr key={p.slug}>
                    <td>{p.project}</td>
                    <td style={{ textAlign: "right" }}>${p.estimated.toFixed(2)}</td>
                    <td style={{ textAlign: "right" }}>${p.actual.toFixed(2)}</td>
                    <td style={{ textAlign: "right" }}>
                      <span className={variance >= 0 ? "amount-pos" : "amount-neg"}>
                        {variance >= 0 ? "+" : ""}${variance.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}
    </>
  );
}
