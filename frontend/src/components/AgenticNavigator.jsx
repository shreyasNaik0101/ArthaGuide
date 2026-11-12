import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const AgenticNavigator = ({ currentView, onNavigate, isOpen, onClose }) => {
  const { t, i18n } = useTranslation();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState(null);
  const [showSuggestion, setShowSuggestion] = useState(false);
  const inputRef = useRef(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Feature descriptions for autocomplete hints
  const featureHints = {
    en: [
      "Show my dashboard",
      "I need loan advice",
      "Compare loan options",
      "Track my SMS transactions",
      "What can ArthaGuide do?",
      "Show me the business model",
      "Go to home page"
    ],
    hi: [
      "मेरा डैशबोर्ड दिखाओ",
      "मुझे ऋण सलाह चाहिए",
      "ऋण विकल्पों की तुलना करें",
      "मेरे SMS लेनदेन ट्रैक करें"
    ],
    kn: [
      "ನನ್ನ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ತೋರಿಸಿ",
      "ನನಗೆ ಸಾಲದ ಸಲಹೆ ಬೇಕು",
      "ಸಾಲ ಆಯ್ಕೆಗಳನ್ನು ಹೋಲಿಸಿ"
    ]
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSuggestion(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/intent/classify`, {
        query: query.trim(),
        language: i18n.language,
        current_route: currentView
      });

      const result = response.data;
      setSuggestion(result);
      setShowSuggestion(true);

      // Auto-navigate if high confidence
      if (result.confidence >= 0.8) {
        setTimeout(() => {
          onNavigate(result.route);
          handleClose();
        }, 1500);
      }

    } catch (error) {
      console.error('Intent classification error:', error);
      setSuggestion({
        route: 'advisor',
        confidence: 0.5,
        explanation: 'Unable to classify intent. Opening advisor for help.',
        method: 'error_fallback'
      });
      setShowSuggestion(true);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setQuery('');
    setSuggestion(null);
    setShowSuggestion(false);
    onClose();
  };

  const handleNavigateToSuggestion = () => {
    if (suggestion?.route) {
      onNavigate(suggestion.route);
      handleClose();
    }
  };

  const selectHint = (hint) => {
    setQuery(hint);
    inputRef.current?.focus();
  };

  if (!isOpen) return null;

  const currentHints = featureHints[i18n.language] || featureHints.en;

  return (
    <div className="app-dialog-overlay fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden animate-slideUp">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {t('agenticNav.title', 'Smart Navigation')}
              </h2>
              <p className="text-sm text-purple-100">
                {t('agenticNav.subtitle', 'Tell me what you need, I\'ll take you there')}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Search Form */}
          <form onSubmit={handleSubmit} className="mb-6">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('agenticNav.placeholder', 'What would you like to do? e.g., "I need financial advice"')}
                className="w-full px-6 py-4 pr-16 text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 transition-all"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <span>{t('agenticNav.go', 'Go')}</span>
                )}
              </button>
            </div>
          </form>

          {/* Suggestion Result */}
          {showSuggestion && suggestion && (
            <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border-2 border-purple-200 animate-fadeIn">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-lg text-gray-800">
                      {t('agenticNav.suggestion', 'Routing Suggestion')}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      suggestion.confidence >= 0.8 ? 'bg-green-100 text-green-700' :
                      suggestion.confidence >= 0.6 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {Math.round(suggestion.confidence * 100)}% {t('agenticNav.confident', 'confident')}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-3">{suggestion.explanation}</p>
                  {suggestion.suggested_action && (
                    <p className="text-sm text-gray-600 mb-3">
                      💡 {suggestion.suggested_action}
                    </p>
                  )}
                  <button
                    onClick={handleNavigateToSuggestion}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg hover:opacity-90 transition-all font-semibold"
                  >
                    {t('agenticNav.takeMe', `Take me to ${suggestion.route}`)}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Quick Hints */}
          {!showSuggestion && (
            <div>
              <p className="text-sm text-gray-600 mb-3 font-semibold">
                {t('agenticNav.tryThese', 'Try these examples:')}
              </p>
              <div className="flex flex-wrap gap-2">
                {currentHints.map((hint, index) => (
                  <button
                    key={index}
                    onClick={() => selectHint(hint)}
                    className="px-4 py-2 bg-gray-100 hover:bg-purple-100 text-gray-700 rounded-lg text-sm transition-all hover:scale-105"
                  >
                    {hint}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Info Section */}
          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-sm text-gray-600">
                <p className="font-semibold mb-1">{t('agenticNav.howItWorks', 'How it works:')}</p>
                <p>{t('agenticNav.description', 'Our AI analyzes your request and intelligently routes you to the most relevant feature. No need to remember where everything is - just tell us what you need!')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgenticNavigator;
