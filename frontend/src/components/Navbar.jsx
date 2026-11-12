import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './Navbar.css';

export default function Navbar({ currentView, setCurrentView, changeLanguage, currentLanguage, onOpenNavigator }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const links = [['hero', 'nav_home'], ['advisor', 'cta_advisor'], ['dashboard', 'nav_dashboard'], ['sms', 'nav_sms'], ['loans', 'nav_loans']];
  const navigate = view => { setCurrentView(view); setOpen(false); };
  return <header className="app-header">
    <div className="app-header-bar">
      <button className="app-brand" onClick={() => navigate('advisor')} aria-label="ArthaGuide loan adviser"><span className="app-brand-mark">a<span>✦</span></span><span>Artha<span className="app-brand-light">Guide</span></span></button>
      <nav className="app-desktop-nav" aria-label="Main navigation">{links.map(([view, label]) => <button key={view} className={view === 'advisor' ? 'app-nav-primary' : undefined} onClick={() => navigate(view)} aria-current={currentView === view ? 'page' : undefined}>{t(label)}</button>)}</nav>
      <div className="app-header-tools">
        <button className="app-search" onClick={onOpenNavigator} aria-label="Open smart navigation" title="Smart navigation · Ctrl/Cmd K"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/></svg></button>
        <span className="app-tool-divider" />
        <label className="app-language"><span className="app-visually-hidden">Language</span><select value={currentLanguage?.split('-')[0] || 'en'} onChange={e => changeLanguage(e.target.value)}><option value="en">EN</option><option value="hi">हिंदी</option><option value="kn">ಕನ್ನಡ</option></select></label>
        <button className="app-menu" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="app-mobile-nav" aria-label={open ? 'Close menu' : 'Open menu'}>{open ? '×' : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 7h16M4 12h16M4 17h16"/></svg>}</button>
      </div>
    </div>
    {open && <nav id="app-mobile-nav" className="app-mobile-nav" aria-label="Mobile navigation">{links.map(([view, label]) => <button key={view} className={view === 'advisor' ? 'app-nav-primary' : undefined} onClick={() => navigate(view)} aria-current={currentView === view ? 'page' : undefined}>{t(label)}</button>)}</nav>}
  </header>;
}
