export default function Footer({ onNavigate }) {
  return (
    <footer className="workspace-footer">
      <div><button className="workspace-footer-brand" onClick={() => onNavigate?.('advisor')}>Artha<span>Guide</span></button><p>Your money. Your language. Your guide.</p></div>
      <nav aria-label="Footer navigation">{[['dashboard', 'Dashboard'], ['advisor', 'Loan adviser'], ['sms', 'SMS tracking'], ['loans', 'Loan options'], ['features', 'Features'], ['business', 'Business']].map(([view, label]) => <button key={view} onClick={() => onNavigate?.(view)}>{label}</button>)}</nav>
      <span>© {new Date().getFullYear()} ArthaGuide</span>
    </footer>
  );
}
