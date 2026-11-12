const rupees = amount => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount / 100);

export default function CashRunway({ result }) {
  if (!result) return null;
  const all = result.offers.flatMap(offer => offer.timeline);
  const low = Math.min(0, ...all.map(row => row.balance_minor));
  const high = Math.max(1, ...all.map(row => row.balance_minor));
  const first = Math.min(...all.map(row => Date.parse(row.date)));
  const last = Math.max(...all.map(row => Date.parse(row.date)));
  const x = row => 12 + (Date.parse(row.date) - first) / Math.max(last - first, 1) * 476;
  const y = amount => 12 + (high - amount) / (high - low) * 80;
  return <section className="runway-panel" aria-label="Loan balance forecasts"><div className="runway-intro"><span className="fa-eyebrow">SEE THE TIMING</span><h2>A little breathing room.</h2><p>{result.late ? 'One week late. Two different outcomes.' : 'The same income. Different repayment dates.'}</p><span>Forecast · not confirmed cash</span></div><div className="runway-charts">{result.offers.map((offer, index) => {
    const points = offer.timeline.map(row => `${x(row)},${y(row.balance_minor)}`).join(' ');
    const danger = offer.lowest_balance_minor < 0;
    return <div className="runway-chart" key={offer.name}><div><strong>{offer.name}</strong><span className={danger ? 'fa-red' : 'fa-green'}>Lowest ₹{rupees(offer.lowest_balance_minor)}</span></div><svg viewBox="0 0 500 110" role="img" aria-label={`${offer.name} forecast. Lowest balance ${rupees(offer.lowest_balance_minor)} rupees.`}><defs><linearGradient id={`runway-${index}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={danger ? '#e6978b' : '#9980e8'} stopOpacity=".23"/><stop offset="100%" stopColor="#fff" stopOpacity="0"/></linearGradient></defs><line x1="12" x2="488" y1={y(0)} y2={y(0)} stroke="#c8c6da" strokeDasharray="4 4"/><polygon points={`${x(offer.timeline[0])},${y(0)} ${points} ${x(offer.timeline.at(-1))},${y(0)}`} fill={`url(#runway-${index})`}/><polyline points={points} fill="none" stroke={danger ? '#d77b69' : '#8c72d6'} strokeWidth="2.5" strokeLinejoin="round"/>{offer.timeline.filter(row => row.kind === 'installment').map((row, i) => <circle key={i} cx={x(row)} cy={y(row.balance_minor)} r="4" fill={row.balance_minor < 0 ? '#d77b69' : '#8c72d6'} stroke="white" strokeWidth="2"/>)}</svg><small>Repair → client payment → final installment · dotted line = ₹0</small></div>;
  })}</div></section>;
}
