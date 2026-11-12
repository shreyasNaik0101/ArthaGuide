import { useTranslation } from 'react-i18next';
import WorkspaceHeader from './WorkspaceHeader';

export default function Features({ onNavigate }) {
  const { t } = useTranslation();

  const features = [
    { icon: '📱', title: t('feature_1_title'), desc: t('feature_1_desc'), color: 'bg-blue-100' },
    { icon: '🌐', title: t('feature_2_title'), desc: t('feature_2_desc'), color: 'bg-purple-100' },
    { icon: '🔮', title: t('feature_3_title'), desc: t('feature_3_desc'), color: 'bg-green-100' },
    { icon: '⭐', title: t('feature_4_title'), desc: t('feature_4_desc'), color: 'bg-yellow-100' }
  ];

  return (
    <div className="workspace-page workspace-features relative pt-24 pb-20 px-4 sm:px-6 lg:px-8 fade-in-up overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-yellow-400 to-orange-500 opacity-15 morphing-blob"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gradient-to-br from-pink-400 to-red-500 opacity-10 rotate-slow"></div>
      </div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <WorkspaceHeader eyebrow="BUILT AROUND YOUR WORK" title={t('features_title')} description="From everyday transactions to your next borrowing decision, keep the important pieces together." motif="features" />
        
        <div className="workspace-feature-grid">
          {features.map((feature, idx) => (
            <div key={idx} className="workspace-feature-card bg-white rounded-xl p-6 shadow-lg">
              <span className="workspace-feature-number">0{idx + 1}</span>
              <div className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center text-2xl mb-4`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">{feature.title}</h3>
              <p className="text-gray-600">{feature.desc}</p>
              <button className="workspace-feature-link" onClick={() => onNavigate?.(['sms', 'advisor', 'dashboard', 'dashboard'][idx])}>Explore <span aria-hidden="true">↗</span></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
