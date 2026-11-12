import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import WorkspaceHeader from './WorkspaceHeader';

export default function GeneralAdvisor() {
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Quick suggestion buttons
  const quickQuestions = {
    en: [
      { text: "Am I eligible for a loan?", emoji: "💳" },
      { text: "How much can I borrow?", emoji: "💰" },
      { text: "Best loan for gig workers?", emoji: "📝" },
      { text: "How to improve credit score?", emoji: "📈" }
    ],
    hi: [
      { text: "क्या मैं ऋण के लिए पात्र हूं?", emoji: "💳" },
      { text: "मैं कितना उधार ले सकता हूं?", emoji: "💰" },
      { text: "गिग वर्कर्स के लिए सबसे अच्छा ऋण?", emoji: "📝" },
      { text: "क्रेडिट स्कोर कैसे सुधारें?", emoji: "📈" }
    ],
    kn: [
      { text: "ನಾನು ಸಾಲಕ್ಕೆ ಅರ್ಹನೇ?", emoji: "💳" },
      { text: "ನಾನು ಎಷ್ಟು ಸಾಲ ಪಡೆಯಬಹುದು?", emoji: "💰" },
      { text: "ಗಿಗ್ ವರ್ಕರ್‌ಗಳಿಗೆ ಉತ್ತಮ ಸಾಲ?", emoji: "📝" },
      { text: "ಕ್ರೆಡಿಟ್ ಸ್ಕೋರ್ ಸುಧಾರಿಸುವುದು ಹೇಗೆ?", emoji: "📈" }
    ]
  };

  const currentQuestions = quickQuestions[i18n.language] || quickQuestions.en;

  // Load user's actual financial data from localStorage
  const getUserFinancialData = () => {
    const savedTransactions = localStorage.getItem('arthaguide_transactions');
    if (savedTransactions) {
      const transactions = JSON.parse(savedTransactions);
      let income = 0, expenses = 0;
      transactions.forEach(tx => {
        if (tx.type === 'credit') income += tx.amount;
        else if (tx.type === 'debit') expenses += tx.amount;
      });
      return { 
        monthlyIncome: income, 
        monthlyExpenses: expenses, 
        monthlySavings: income - expenses,
        healthScore: Math.min(100, Math.floor((income - expenses) / income * 100))
      };
    }
    return { monthlyIncome: 45000, monthlyExpenses: 32000, monthlySavings: 13000, healthScore: 72 };
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = { role: 'user', text: input, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) };
    setMessages([...messages, userMsg]);
    const currentInput = input;
    setInput('');
    setIsTyping(true);
    
    try {
      // Call RAG backend API
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const userProfile = getUserFinancialData();
      const response = await fetch(`${API_BASE_URL}/api/rag-chat`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          message: currentInput,
          language: i18n.language,
          user_profile: userProfile
        })
      });
      
      const data = await response.json();
      const botResponse = data.response;
      
      setMessages(prev => [...prev, { 
        role: 'bot', 
        text: botResponse, 
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        sources: data.sources // Store sources for citation
      }]);
    } catch (error) {
      console.error('RAG API Error:', error);
      // Fallback response
      const fallbackMsg = i18n.language === 'en' 
        ? "💬 I'm having trouble connecting to my knowledge base. Please make sure the backend is running!"
        : i18n.language === 'hi'
        ? "💬 मुझे अपने ज्ञान आधार से कनेक्ट करने में समस्या हो रही है। कृपया सुनिश्चित करें कि बैकएंड चल रहा है!"
        : "💬 ನನ್ನ ಜ್ಞಾನ ನೆಲೆಗೆ ಸಂಪರ್ಕಿಸಲು ನನಗೆ ತೊಂದರೆಯಾಗುತ್ತಿದೆ. ದಯವಿಟ್ಟು ಬ್ಯಾಕೆಂಡ್ ಚಾಲನೆಯಲ್ಲಿದೆಯೆ ಎಂದು ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ!";
      setMessages(prev => [...prev, { 
        role: 'bot', 
        text: fallbackMsg, 
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickQuestion = (question) => {
    setInput(question);
    handleSend();
  };

  return (
    <div className="workspace-page workspace-chat relative pt-24 pb-20 px-4 sm:px-6 lg:px-8 fade-in-up overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-br from-blue-500 to-cyan-600 opacity-25 morphing-blob"></div>
        <div className="absolute bottom-10 right-20 w-80 h-80 bg-gradient-to-br from-purple-500 to-indigo-600 opacity-20 wave-animation"></div>
      </div>
      
      <div className="max-w-5xl mx-auto relative z-10">
        <WorkspaceHeader eyebrow="LET’S TALK IT THROUGH" title="Multilingual Loan Advisor" description="Ask your financial questions in English, Hindi, or Kannada." motif="messages" />
        
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl">💬</div>
              <div>
                <h3 className="font-bold text-lg">ArthaGuide AI Advisor</h3>
                <div className="flex items-center space-x-2 text-sm opacity-90">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Online • Replies in {i18n.language === 'en' ? 'English' : i18n.language === 'hi' ? 'हिंदी' : 'ಕನ್ನಡ'}</span>
                </div>
              </div>
            </div>
            <div className="text-3xl">📱</div>
          </div>

          {/* Chat Messages */}
          <div className="h-96 overflow-y-auto p-6 relative">
            {/* Background image */}
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: 'url(${import.meta.env.BASE_URL}hero-finance.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'local',
                opacity: 0.6,
                filter: 'saturate(1.4) brightness(0.95)'
              }}
            />
            <div className="relative z-10">
            {messages.length === 0 && (
              <div className="text-center mt-16">
                <div className="text-6xl mb-4">💬</div>
                <p className="text-xl text-gray-600 mb-6">
                  {i18n.language === 'en' ? 'Start a conversation!' : i18n.language === 'hi' ? 'बातचीत शुरू करें!' : 'ಸಂಭಾಷಣೆ ಪ್ರಾರಂಭಿಸಿ!'}
                </p>
                <div className="grid grid-cols-2 gap-3 max-w-2xl mx-auto">
                  {currentQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleQuickQuestion(q.text)}
                      className="bg-blue-50 hover:bg-blue-100 text-gray-800 px-4 py-3 rounded-lg text-sm font-medium transition transform hover:scale-105 flex items-center justify-center space-x-2"
                    >
                      <span>{q.emoji}</span>
                      <span>{q.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, idx) => (
              <div key={idx} className={`mb-4 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} slide-up`}>
                <div className={`max-w-md ${msg.role === 'user' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl' : 'bg-white text-gray-800 rounded-tr-2xl rounded-tl-2xl rounded-br-2xl shadow-lg border border-gray-100'} px-5 py-4`}>
                  <p className="whitespace-pre-line text-sm leading-relaxed">{msg.text}</p>
                  <p className={`text-xs mt-2 ${msg.role === 'user' ? 'text-blue-100' : 'text-gray-400'}`}>
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start mb-4">
                <div className="bg-white text-gray-800 rounded-tr-2xl rounded-tl-2xl rounded-br-2xl shadow-lg px-5 py-4 border border-gray-100">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                  </div>
                </div>
              </div>
            )}
            </div>
          </div>

          {/* Input Area */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex space-x-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder={t('chat_placeholder')}
                className="flex-1 px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-800"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {t('send')} ➡️
              </button>
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
            <div className="text-3xl mb-3">📱</div>
            <h4 className="font-bold text-lg mb-2">
              {i18n.language === 'en' ? '3 Languages' : i18n.language === 'hi' ? '3 भाषाएँ' : '3 ಭಾಷೆಗಳು'}
            </h4>
            <p className="text-sm opacity-90">
              {i18n.language === 'en' ? 'English, Hindi, Kannada support' : i18n.language === 'hi' ? 'अंग्रेजी, हिंदी, कन्नड़ समर्थन' : 'ಇಂಗ್ಲಿಷ್, ಹಿಂದಿ, ಕನ್ನಡ ಬೆಂಬಲ'}
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
            <div className="text-3xl mb-3">⏱️</div>
            <h4 className="font-bold text-lg mb-2">
              {i18n.language === 'en' ? 'Instant Advice' : i18n.language === 'hi' ? 'तुरंत सलाह' : 'ತತ್ಕಾಲ ಸಲಹೆ'}
            </h4>
            <p className="text-sm opacity-90">
              {i18n.language === 'en' ? 'Get answers in seconds, 24/7' : i18n.language === 'hi' ? 'सेकंड में जवाब, 24/7' : 'ಸೆಕೆಂಡುಗಳಲ್ಲಿ ಉತ್ತರಗಳು, 24/7'}
            </p>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
            <div className="text-3xl mb-3">🔒</div>
            <h4 className="font-bold text-lg mb-2">
              {i18n.language === 'en' ? 'Private & Secure' : i18n.language === 'hi' ? 'निजी और सुरक्षित' : 'ಖಾಸಗಿ & ಸುರಕ್ಷಿತ'}
            </h4>
            <p className="text-sm opacity-90">
              {i18n.language === 'en' ? 'Your data is encrypted & safe' : i18n.language === 'hi' ? 'आपका डेटा एन्क्रिप्टेड और सुरक्षित है' : 'ನಿಮ್ಮ ಡೇಟಾ ೦ನ್ಕ್ರಿಪ್ಟ್ ಮಾಡಲಾಗಿದೆ & ಸುರಕ್ಷಿತ'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
