import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import WorkspaceHeader from './WorkspaceHeader';

export default function BusinessModel() {
  const { t } = useTranslation();
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [chatMessages, setChatMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const apiPlans = [
    {
      id: 'free',
      name: 'Free Tier',
      price: '₹0',
      period: '/month',
      requests: '1,000 API calls',
      features: [
        'SMS parsing API',
        'Basic transaction categorization',
        'Health score calculation',
        'Community support',
        'Rate limit: 10 req/min'
      ],
      color: 'from-gray-400 to-gray-600',
      recommended: false
    },
    {
      id: 'pro',
      name: 'Professional',
      price: '₹4,999',
      period: '/month',
      requests: '50,000 API calls',
      features: [
        'Everything in Free',
        'Advanced analytics API',
        'Loan eligibility engine',
        'WhatsApp bot integration',
        'Priority support',
        'Rate limit: 100 req/min',
        'Custom categorization rules',
        'Webhook support'
      ],
      color: 'from-blue-500 to-purple-600',
      recommended: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: '₹19,999',
      period: '/month',
      requests: 'Unlimited API calls',
      features: [
        'Everything in Pro',
        'Dedicated account manager',
        'Custom AI model training',
        'White-label solution',
        '99.9% SLA guarantee',
        'On-premise deployment option',
        'Multi-tenant architecture',
        'Advanced security features',
        'Custom integrations'
      ],
      color: 'from-purple-500 to-pink-600',
      recommended: false
    }
  ];

  const revenueStreams = [
    {
      icon: '💬',
      titleKey: 'whatsapp_bot_api',
      revenueKey: 'whatsapp_bot_price',
      descKey: 'whatsapp_bot_desc',
      details: [
        'Automated SMS parsing via WhatsApp',
        'Multilingual conversational AI',
        'Instant loan eligibility checks',
        'Transaction insights & alerts',
        'Branded experience for partners'
      ],
      market: 'Target: 500+ NBFCs, Co-operative Banks'
    },
    {
      icon: '🔌',
      titleKey: 'b2b_api_platform',
      revenueKey: 'b2b_api_price',
      descKey: 'b2b_api_desc',
      details: [
        'SMS transaction parsing API',
        'Credit scoring algorithm',
        'Expense categorization engine',
        'Fraud detection API',
        'Cash flow forecasting'
      ],
      market: 'Target: Fintech startups, Banks, Lenders'
    },
    {
      icon: '💰',
      titleKey: 'loan_referral_fees',
      revenueKey: 'loan_referral_price',
      descKey: 'loan_referral_desc',
      details: [
        'Lead generation for lenders',
        'Pre-verified customer data',
        'Higher conversion rates',
        'Reduced CAC for lenders',
        'Performance-based payouts'
      ],
      market: 'Partners: MoneyTap, PaySense, KreditBee'
    },
    {
      icon: '📊',
      titleKey: 'data_analytics_saas',
      revenueKey: 'data_analytics_price',
      descKey: 'data_analytics_desc',
      details: [
        'Aggregate spending patterns',
        'Income stability metrics',
        'Regional financial trends',
        'Anonymized data insights',
        'Custom reports for enterprises'
      ],
      market: 'Target: Market research firms, Policy makers'
    },
    {
      icon: '🎓',
      titleKey: 'financial_literacy',
      revenueKey: 'financial_literacy_price',
      descKey: 'financial_literacy_desc',
      details: [
        'Regional language video courses',
        'Certificate programs',
        'Sponsored by banks/NBFCs',
        'Gamified learning',
        'Community discussions'
      ],
      market: 'Target: 10M+ gig workers in India'
    },
    {
      icon: '🏢',
      titleKey: 'enterprise_licensing',
      revenueKey: 'enterprise_licensing_price',
      descKey: 'enterprise_licensing_desc',
      details: [
        'Custom branding & deployment',
        'On-premise installation',
        'Dedicated support team',
        'Custom feature development',
        'Training & onboarding'
      ],
      market: 'Target: Large banks, Ride-sharing companies'
    }
  ];

  const whatsappBotFeatures = [
    {
      command: '📊 Balance Check',
      example: 'Send "Balance" to get instant summary',
      response: 'Your balance: ₹13,000\nIncome: ₹45k | Spent: ₹32k'
    },
    {
      command: '➕ Add Expense',
      example: 'Send "500 food swiggy"',
      response: '✅ ₹500 expense added to Food category'
    },
    {
      command: '📍 Smart Insights',
      example: 'Send "Insights"',
      response: '⚠️ Food spending up 15%. Tip: Cook at home 2x/week to save ₹2k'
    },
    {
      command: '💳 Loan Check',
      example: 'Send "Loan 50000"',
      response: '✅ Eligible for ₹50k @ 13% APR\n🏦 Best offer: MoneyTap\nEMI: ₹4,200/month'
    }
  ];

  const quickCommands = [
    { text: 'Balance', description: 'Check my balance' },
    { text: '200 food Swiggy', description: 'Add expense' },
    { text: 'Insights', description: 'Get smart tips' },
    { text: 'Loan 30000', description: 'Check loan eligibility' }
  ];

  const handleSendMessage = (message = userInput) => {
    if (!message.trim()) return;

    // Add user message
    const newUserMsg = { role: 'user', text: message, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) };
    setChatMessages(prev => [...prev, newUserMsg]);
    setUserInput('');
    setIsTyping(true);

    // Simulate bot response
    setTimeout(() => {
      let botResponse = '';
      const lowerMsg = message.toLowerCase();

      if (lowerMsg.includes('balance') || lowerMsg === 'bal') {
        botResponse = `💰 *Your Financial Summary*

✅ Balance: ₹13,000
📈 Income: ₹45,000
📉 Expenses: ₹32,000
📈 Health Score: 72/100

_Last updated: Just now_`;
      } else if (lowerMsg.match(/\d+.*food|swiggy|zomato/)) {
        const amount = message.match(/\d+/)?.[0] || '500';
        botResponse = `✅ *Expense Added!*

💸 Amount: ₹${amount}
🍔 Category: Food
📍 Merchant: ${lowerMsg.includes('swiggy') ? 'Swiggy' : lowerMsg.includes('zomato') ? 'Zomato' : 'Food'}

📊 Total Food spending this month: ₹${parseInt(amount) + 8500}
⚠️ You've spent 23% more on food than last month`;
      } else if (lowerMsg.includes('insight') || lowerMsg.includes('tip')) {
        botResponse = `📍 *Your Smart Insights*

1️⃣ Food spending is up 15% (₹2,000 extra)
   📍 Tip: Cook at home 2x/week to save

2️⃣ You're on track to save ₹13k this month! 🎉

3️⃣ Travel costs can be reduced:
   🚌 Use metro instead of Uber = Save ₹1,200

_Want detailed report? Reply "Report"_`;
      } else if (lowerMsg.match(/loan|borrow/)) {
        const amount = message.match(/\d+/)?.[0] || '50000';
        const emi = Math.round((parseInt(amount) * 1.13) / 12);
        botResponse = `💳 *Loan Eligibility Results*

✅ You're eligible for ₹${parseInt(amount).toLocaleString()}!

✓ *Best Offers:*

1. MoneyTap
   • Rate: 13% APR
   • EMI: ₹${emi.toLocaleString()}/month
   • Disbursal: 2 hours

2. PaySense
   • Rate: 16% APR
   • EMI: ₹${Math.round(emi * 1.03).toLocaleString()}/month
   • Disbursal: 24 hours

_Reply "APPLY" to proceed_`;
      } else if (lowerMsg.includes('report')) {
        botResponse = `📊 *Monthly Financial Report*

*November 2025*

💰 Income: ₹45,000
   • Salary: ₹45,000

💸 Expenses: ₹32,000
   • Food: ₹10,000 (31%)
   • Travel: ₹7,400 (23%)
   • Bills: ₹5,000 (16%)
   • Shopping: ₹2,800 (9%)
   • Others: ₹6,800 (21%)

✅ Savings: ₹13,000 (29%)
📈 Health Score: 72/100

_Doing great! Keep it up! 🎉_`;
      } else if (lowerMsg.includes('help')) {
        botResponse = `💬 *ArthaGuide Bot Commands*

• *Balance* - Check your balance
• *[Amount] [Category] [Merchant]* - Add expense
  Example: "500 food Swiggy"

• *Insights* - Get smart financial tips
• *Loan [Amount]* - Check loan eligibility
• *Report* - Get monthly summary
• *Help* - Show this menu

_Need human help? Call 1800-XXX-XXXX_`;
      } else {
        botResponse = `Hi! 👋 I'm your ArthaGuide assistant.\n\nI can help you with:\n✅ Balance checks\n✅ Expense tracking\n✅ Smart insights\n✅ Loan eligibility\n\nTry: "Balance" or "Help"`;
      }

      const newBotMsg = { 
        role: 'bot', 
        text: botResponse, 
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) 
      };
      
      setChatMessages(prev => [...prev, newBotMsg]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleQuickCommand = (command) => {
    setUserInput(command);
    handleSendMessage(command);
  };

  return (
    <div className="workspace-page workspace-business relative pt-24 pb-20 px-4 sm:px-6 lg:px-8 fade-in-up overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-br from-green-400 to-emerald-500 opacity-15 morphing-blob"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-br from-blue-400 to-purple-500 opacity-20 rotate-slow"></div>
      </div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <WorkspaceHeader eyebrow="THE BIGGER PICTURE" title={t('business_model_title')} description={t('revenue_streams_subtitle')} motif="business" />

        {/* Revenue Streams Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {revenueStreams.map((stream, idx) => (
            <div key={idx} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-2xl transition transform hover:scale-105">
              <div className="text-4xl mb-4">{stream.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{t(stream.titleKey)}</h3>
              <div className="text-2xl font-bold text-green-600 mb-3">{t(stream.revenueKey)}</div>
              <p className="text-gray-600 mb-4">{t(stream.descKey)}</p>
              
              <div className="border-t border-gray-200 pt-4 mb-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">{t('key_features')}:</p>
                <ul className="space-y-1">
                  {stream.details.map((detail, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs text-gray-700">
                  <strong>{t('market')}:</strong> {stream.market}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* WhatsApp Bot Integration */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-8 mb-16 text-white shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-3xl font-bold mb-2">{t('whatsapp_demo')}</h3>
              <p className="text-lg opacity-90">{t('whatsapp_subtitle')}</p>
            </div>
            <div className="text-6xl">💬</div>
          </div>
          
          {/* Interactive WhatsApp Chat Demo */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-2xl mb-6">
            {/* WhatsApp Header */}
            <div className="bg-green-600 text-white px-6 py-4 flex items-center space-x-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl">💬</div>
              <div>
                <h4 className="font-bold text-lg">ArthaGuide Bot</h4>
                <p className="text-sm opacity-90">Online • Typically replies instantly</p>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="bg-gray-50 p-6 h-96 overflow-y-auto">
              {chatMessages.length === 0 && (
                <div className="text-center text-gray-500 mt-20">
                  <p className="text-lg mb-2">{t('start_chatting')}</p>
                  <p className="text-sm">{t('try_commands')}</p>
                </div>
              )}
              
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`mb-4 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs ${
                    msg.role === 'user' 
                      ? 'bg-green-500 text-white rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl' 
                      : 'bg-white text-gray-800 rounded-tr-2xl rounded-tl-2xl rounded-br-2xl shadow-md'
                  } px-4 py-3`}>
                    <p className="whitespace-pre-line text-sm">{msg.text}</p>
                    <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-green-100' : 'text-gray-500'}`}>
                      {msg.time}
                    </p>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start mb-4">
                  <div className="bg-white text-gray-800 rounded-tr-2xl rounded-tl-2xl rounded-br-2xl shadow-md px-4 py-3">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Commands */}
            <div className="bg-white border-t border-gray-200 px-6 py-3">
              <p className="text-sm text-gray-600 mb-2 font-semibold">{t('quick_commands')}:</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {quickCommands.map((cmd, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickCommand(cmd.text)}
                    className="px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm hover:bg-green-100 transition border border-green-200"
                    title={cmd.description}
                  >
                    {cmd.text}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Area */}
            <div className="bg-gray-100 px-6 py-4 flex items-center space-x-3">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={t('type_message')}
                className="flex-1 px-4 py-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-800"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!userInput.trim()}
                className="bg-green-500 text-white p-3 rounded-full hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {whatsappBotFeatures.map((feature, idx) => (
              <div key={idx} className="bg-white/10 backdrop-blur rounded-lg p-4">
                <h4 className="font-semibold text-lg mb-2">{feature.command}</h4>
                <div className="bg-white/20 rounded p-3 mb-2">
                  <p className="text-sm opacity-90">Example: <code className="font-mono">{feature.example}</code></p>
                </div>
                <div className="bg-green-800/30 rounded p-3">
                  <p className="text-sm">Response: {feature.response}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 bg-white/10 rounded-lg p-4">
            <p className="text-sm">
              <strong>📱 Monetization:</strong> ₹99/user/month subscription OR ₹2/conversation for B2B API access. 
              Partner with Uber, Swiggy, Zomato to offer as employee benefit.
            </p>
          </div>
        </div>

        {/* API Pricing Plans */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-8">{t('api_pricing')}</h3>
          <div className="grid md:grid-cols-3 gap-8">
            {apiPlans.map((plan) => (
              <div 
                key={plan.id}
                className={`relative bg-white rounded-2xl shadow-lg overflow-hidden transform transition hover:scale-105 ${plan.recommended ? 'ring-4 ring-blue-500' : ''}`}
              >
                {plan.recommended && (
                  <div className="absolute top-0 right-0 bg-blue-500 text-white px-4 py-1 text-sm font-semibold rounded-bl-lg">
                    Recommended
                  </div>
                )}
                
                <div className={`bg-gradient-to-r ${plan.color} p-6 text-white`}>
                  <h4 className="text-2xl font-bold mb-2">{plan.name}</h4>
                  <div className="flex items-end mb-2">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-lg opacity-75 ml-2">{plan.period}</span>
                  </div>
                  <p className="opacity-90">{plan.requests}</p>
                </div>
                
                <div className="p-6">
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start text-gray-700">
                        <span className="text-green-500 mr-2 mt-1">✓</span>
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <button 
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`w-full py-3 rounded-lg font-semibold transition ${
                      selectedPlan === plan.id 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {selectedPlan === plan.id ? `${t('selected')} ✓` : t('select_plan')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Projections */}
        <div className="bg-white rounded-xl p-8 shadow-lg">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">{t('revenue_projections')}</h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold text-gray-700 mb-4">{t('conservative')}</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-gray-700">WhatsApp Bot (1,000 users)</span>
                  <span className="font-bold text-gray-900">₹11.9L/year</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-gray-700">B2B API (50 clients)</span>
                  <span className="font-bold text-gray-900">₹30L/year</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-gray-700">Loan Referrals (500 loans)</span>
                  <span className="font-bold text-gray-900">₹15L/year</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded border-2 border-green-500">
                  <span className="font-bold text-gray-900">{t('total_revenue')}</span>
                  <span className="font-bold text-2xl text-green-600">₹56.9L</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-700 mb-4">{t('optimistic')}</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-gray-700">WhatsApp Bot (10,000 users)</span>
                  <span className="font-bold text-gray-900">₹1.19Cr/year</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-gray-700">B2B API (200 clients)</span>
                  <span className="font-bold text-gray-900">₹1.2Cr/year</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-gray-700">Loan Referrals (5,000 loans)</span>
                  <span className="font-bold text-gray-900">₹1.5Cr/year</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded border-2 border-blue-500">
                  <span className="font-bold text-gray-900">{t('total_revenue')}</span>
                  <span className="font-bold text-2xl text-blue-600">₹3.89Cr</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Competitive Advantage */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-500 p-6 rounded-lg">
            <h4 className="font-bold text-gray-900 mb-3 flex items-center">
              <span className="text-2xl mr-2">📌</span>
              Network Effect
            </h4>
            <p className="text-gray-700 text-sm">
              More users = Better AI models = More accurate insights = Higher API value
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500 p-6 rounded-lg">
            <h4 className="font-bold text-gray-900 mb-3 flex items-center">
              <span className="text-2xl mr-2">💎</span>
              Data Moat
            </h4>
            <p className="text-gray-700 text-sm">
              Exclusive access to gig economy financial data - Impossible to replicate
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-purple-500 p-6 rounded-lg">
            <h4 className="font-bold text-gray-900 mb-3 flex items-center">
              <span className="text-2xl mr-2">📱</span>
              Scalability
            </h4>
            <p className="text-gray-700 text-sm">
              API-first architecture - Zero marginal cost for each new B2B customer
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
