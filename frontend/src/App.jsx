import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Dashboard from './components/Dashboard';
import Advisor from './components/Advisor';
import Features from './components/Features';
import LoanMarketplace from './components/LoanMarketplace';
import BusinessModel from './components/BusinessModel';
import SMSTracking from './components/SMSTracking';
import AgenticNavigator from './components/AgenticNavigator';
import Footer from './components/Footer';
import FinanceScene from './components/FinanceScene';
import './styles/demo-theme.css';
import './styles/workspace-pages.css';

function App() {
  const allowedViews = ['advisor', 'hero', 'dashboard', 'features', 'loans', 'business', 'sms'];
  const readView = () => allowedViews.includes(window.location.hash.slice(1)) ? window.location.hash.slice(1) : 'advisor';
  const [currentView, setCurrentView] = useState(readView);
  const [isNavigatorOpen, setIsNavigatorOpen] = useState(false);
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const handleNavigate = (view) => {
    setCurrentView(view);
    window.history.replaceState(null, '', '#' + view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const syncView = () => setCurrentView(readView());
    window.addEventListener('hashchange', syncView);
    return () => window.removeEventListener('hashchange', syncView);
  }, []);

  // Keyboard shortcut for opening agentic navigator (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyPress = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsNavigatorOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <div className="artha-app min-h-screen" data-view={currentView}>
      <FinanceScene />
      {/* Agentic Navigator - Smart AI-powered navigation */}
      <AgenticNavigator 
        currentView={currentView}
        onNavigate={handleNavigate}
        isOpen={isNavigatorOpen}
        onClose={() => setIsNavigatorOpen(false)}
      />

      <Navbar 
        currentView={currentView} 
        setCurrentView={handleNavigate}
        changeLanguage={changeLanguage}
        currentLanguage={i18n.language}
        onOpenNavigator={() => setIsNavigatorOpen(true)}
      />
      
      <div key={currentView} className="artha-view">
      {currentView === 'hero' && <Hero setCurrentView={handleNavigate} />}
      {currentView === 'dashboard' && <Dashboard onNavigate={handleNavigate} />}
      {currentView === 'advisor' && <Advisor />}
      {currentView === 'features' && <Features onNavigate={handleNavigate} />}
      {currentView === 'loans' && <LoanMarketplace />}
      {currentView === 'business' && <BusinessModel />}
      {currentView === 'sms' && <SMSTracking />}
      </div>
      
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}

export default App;
