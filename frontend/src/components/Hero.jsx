import { useTranslation } from 'react-i18next';

export default function Hero({ setCurrentView }) {
  const { t } = useTranslation();

  return (
    <div className="relative pt-32 pb-24 px-4 sm:px-6 lg:px-8 fade-in-up overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-500 to-purple-600 opacity-30 morphing-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-gradient-to-br from-pink-500 to-orange-500 opacity-25 morphing-blob" style={{animationDelay: '-5s'}}></div>
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-gradient-to-br from-cyan-500 to-blue-600 opacity-25 morphing-blob" style={{animationDelay: '-10s'}}></div>
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-gradient-to-br from-purple-500 to-pink-600 opacity-30 wave-animation"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500 to-purple-700 opacity-20 rotate-slow"></div>
      </div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center max-w-4xl mx-auto mb-16 slide-up">
          <div className="inline-block px-4 py-2 bg-blue-50 rounded-full mb-6">
            <p className="text-blue-600 font-medium text-sm">{t('tagline')}</p>
          </div>
          <h1 className="text-6xl md:text-8xl font-bold text-gray-900 mb-8 leading-tight tracking-tight">
            {t('loan_hero_title')}
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            {t('loan_hero_subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center scale-in">
            <button onClick={() => setCurrentView('advisor')} className="px-10 py-4 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition transform hover:scale-105 shadow-lg">
              {t('cta_advisor')}
            </button>
            <button onClick={() => setCurrentView('dashboard')} className="px-10 py-4 border-2 border-gray-900 text-gray-900 rounded-xl font-semibold hover:bg-gray-50 transition transform hover:scale-105">
              {t('cta_dashboard')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
