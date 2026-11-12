import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import WorkspaceHeader from './WorkspaceHeader';

export default function LoanMarketplace() {
  const { t } = useTranslation();
  const [loanAmount, setLoanAmount] = useState(50000);
  const [lenders, setLenders] = useState([]);
  const [eligibilityScore, setEligibilityScore] = useState(0);

  // Mock financial data - in production, fetch from backend
  const financialData = {
    monthlyIncome: 45000,
    monthlyExpenses: 32000,
    balance: 13000,
    creditHistory: 'Good'
  };

  useEffect(() => {
    // Calculate eligibility score
    const score = calculateEligibility(financialData);
    setEligibilityScore(score);

    // Fetch lender offers
    const mockLenders = [
      {
        name: 'PaySense',
        logo: '💳',
        maxAmount: 200000,
        interestRate: 16,
        tenure: '3-24 months',
        processingFee: 2.5,
        eligibility: score >= 65 ? 'Eligible' : 'Not Eligible',
        rating: 4.2,
        disbursalTime: '24 hours'
      },
      {
        name: 'MoneyTap',
        logo: '💰',
        maxAmount: 500000,
        interestRate: 13,
        tenure: '2-36 months',
        processingFee: 2,
        eligibility: score >= 70 ? 'Eligible' : 'Not Eligible',
        rating: 4.5,
        disbursalTime: '2 hours'
      },
      {
        name: 'KreditBee',
        logo: '🐝',
        maxAmount: 100000,
        interestRate: 18,
        tenure: '3-15 months',
        processingFee: 3,
        eligibility: score >= 60 ? 'Eligible' : 'Not Eligible',
        rating: 4.0,
        disbursalTime: '30 minutes'
      },
      {
        name: 'LazyPay',
        logo: '🎯',
        maxAmount: 150000,
        interestRate: 15,
        tenure: '1-12 months',
        processingFee: 1.5,
        eligibility: score >= 65 ? 'Eligible' : 'Not Eligible',
        rating: 4.3,
        disbursalTime: '1 hour'
      },
      {
        name: 'CRED',
        logo: '💎',
        maxAmount: 300000,
        interestRate: 12,
        tenure: '3-36 months',
        processingFee: 1,
        eligibility: score >= 75 ? 'Eligible' : 'Pre-approved',
        rating: 4.6,
        disbursalTime: '12 hours'
      }
    ];

    setLenders(mockLenders);
  }, []);

  const calculateEligibility = (data) => {
    const savingRate = (data.balance / data.monthlyIncome) * 100;
    const expenseRatio = (data.monthlyExpenses / data.monthlyIncome) * 100;
    
    let score = 50; // Base score
    
    // Add points for good saving rate
    if (savingRate > 20) score += 20;
    else if (savingRate > 10) score += 10;
    
    // Add points for low expense ratio
    if (expenseRatio < 60) score += 15;
    else if (expenseRatio < 75) score += 10;
    
    // Credit history bonus
    if (data.creditHistory === 'Good') score += 15;
    
    return Math.min(100, score);
  };

  const calculateEMI = (principal, rate, months) => {
    const r = rate / 12 / 100;
    const emi = (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
    return Math.round(emi);
  };

  return (
    <div className="workspace-page workspace-loans relative pt-24 pb-20 px-4 sm:px-6 lg:px-8 fade-in-up overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-96 h-96 bg-gradient-to-br from-green-400 to-emerald-500 opacity-20 morphing-blob"></div>
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-gradient-to-br from-blue-400 to-cyan-500 opacity-15 wave-animation"></div>
      </div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <WorkspaceHeader eyebrow="EXPLORE YOUR OPTIONS" title={t('loan_marketplace_title')} description={t('loan_marketplace_subtitle')} motif="loans" />

        {/* Eligibility Score Card */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 mb-8 text-white shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-semibold mb-2">{t('eligibility_score_title')}</h3>
              <p className="opacity-90">{t('eligibility_based_on')}</p>
            </div>
            <div className="text-center">
              <div className="text-6xl font-bold">{eligibilityScore}</div>
              <div className="text-sm opacity-75">/ 100</div>
            </div>
          </div>
          <div className="mt-4 bg-white/20 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-white h-full rounded-full transition-all duration-1000" 
              style={{width: `${eligibilityScore}%`}}
            ></div>
          </div>
        </div>

        {/* Loan Amount Selector */}
        <div className="bg-white rounded-xl p-6 shadow-lg mb-8">
          <label className="block text-lg font-semibold mb-4">{t('loan_amount_needed')}</label>
          <input 
            type="range" 
            min="10000" 
            max="500000" 
            step="10000"
            value={loanAmount}
            onChange={(e) => setLoanAmount(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between mt-2">
            <span className="text-2xl font-bold text-blue-600">₹{loanAmount.toLocaleString()}</span>
            <span className="text-gray-500">₹10k - ₹5L</span>
          </div>
        </div>

        {/* Lender Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lenders.map((lender, idx) => {
            const emi12 = calculateEMI(loanAmount, lender.interestRate, 12);
            const emi24 = calculateEMI(loanAmount, lender.interestRate, 24);
            const isEligible = lender.maxAmount >= loanAmount && lender.eligibility.includes('Eligible');
            
            return (
              <div key={idx} className={`bg-white rounded-xl p-6 shadow-lg hover:shadow-2xl transition transform hover:scale-105 border-2 ${isEligible ? 'border-green-400' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-4xl">{lender.logo}</div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{lender.name}</h3>
                      <div className="flex items-center text-sm text-yellow-500">
                        ⭐ {lender.rating}
                      </div>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${isEligible ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {lender.eligibility}
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('max_amount')}</span>
                    <span className="font-semibold">₹{(lender.maxAmount/1000).toFixed(0)}k</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('interest_rate')}</span>
                    <span className="font-semibold text-blue-600">{lender.interestRate}% p.a.</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('tenure')}</span>
                    <span className="font-semibold">{lender.tenure}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('processing_fee')}</span>
                    <span className="font-semibold">{lender.processingFee}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('disbursal')}</span>
                    <span className="font-semibold text-green-600">{lender.disbursalTime}</span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-600 mb-2">Estimated EMI</p>
                  <div className="flex justify-between text-sm">
                    <span>12 months: <span className="font-bold">₹{emi12.toLocaleString()}</span></span>
                    <span>24 months: <span className="font-bold">₹{emi24.toLocaleString()}</span></span>
                  </div>
                </div>

                <button 
                  disabled={!isEligible}
                  className={`w-full py-3 rounded-lg font-semibold transition ${isEligible ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                >
                  {isEligible ? `✅ ${t('apply_now')}` : `❌ ${t('not_eligible')}`}
                </button>
              </div>
            );
          })}
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg">
          <div className="flex items-start">
            <div className="text-2xl mr-3">💡</div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Pre-filled Applications</h4>
              <p className="text-gray-700">Your financial data from SMS tracking is automatically used to fill loan applications. One-click apply across all platforms!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
