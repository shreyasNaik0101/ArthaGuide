export default function WorkspaceHeader({ eyebrow, title, description, action, onAction, motif = 'overview' }) {
  return <header className={`workspace-header workspace-header-${motif}`}>
    <div className="workspace-header-copy"><span className="workspace-eyebrow"><span />{eyebrow}</span><h1>{title}</h1><p>{description}</p>{action && onAction && <button className="workspace-cta" onClick={onAction}>{action}<span aria-hidden="true">↗</span></button>}</div>
    <div className="workspace-art" aria-hidden="true"><div className="workspace-orbit orbit-one"/><div className="workspace-orbit orbit-two"/><div className="workspace-art-tile tile-back"><span className="tile-dot"/><div className="tile-bars"><i/><i/><i/><i/><i/></div></div><div className="workspace-art-tile tile-front"><span className="tile-spark">✦</span><div className="tile-line"/><div className="tile-line short"/><svg viewBox="0 0 140 50" fill="none"><path d="M2 43 25 33 46 38 69 19 92 24 115 8 138 3" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg></div><span className="workspace-art-star">✧</span></div>
  </header>;
}
