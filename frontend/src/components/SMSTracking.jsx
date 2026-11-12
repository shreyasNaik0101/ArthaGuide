import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import WorkspaceHeader from './WorkspaceHeader';

export default function SMSTracking() {
  const { t } = useTranslation();
  const [smsText, setSmsText] = useState('');
  const [parsedTransactions, setParsedTransactions] = useState([]);

  const parseSMS = (text) => {
    const lines = text.split(/\n+/).map(l => l.trim()).filter(Boolean);
    const transactions = [];
    const amountRegex = /(INR|Rs\.?|₹)\s*([0-9,]+\.?[0-9]*)/i;
    const debitRegex = /(debited|spent|withdrawn|paid)/i;
    const creditRegex = /(credited|received|deposit|salary|refund)/i;
    const merchantRegex = /(Swiggy|Zomato|Uber|Ola|Amazon|Flipkart|IRCTC|Metro|Fuel|HP|IOCL|Cafe|Restaurant|Hotel|Movie|Netflix|Spotify|PhonePe|GPay|Paytm)/i;
    const dateRegex = /(\d{2}[\/-]\d{2}[\/-]\d{2,4}|\d{4}-\d{2}-\d{2})/;

    const categorize = (text) => {
      const lower = text.toLowerCase();
      if (/salary|income|credited|neft|rtgs|imps|received|refund/i.test(text)) return 'Income';
      if (/swiggy|zomato|restaurant|cafe|food|dining/i.test(text)) return 'Food';
      if (/uber|ola|metro|irctc|travel|ticket|train|bus|flight/i.test(text)) return 'Travel';
      if (/fuel|petrol|diesel|hp|iocl|gas/i.test(text)) return 'Transport';
      if (/amazon|flipkart|shopping|mall|store/i.test(text)) return 'Shopping';
      if (/bill|electricity|water|rent|recharge|mobile|internet/i.test(text)) return 'Bills';
      if (/netflix|spotify|prime|subscription|entertainment|movie|cinema/i.test(text)) return 'Entertainment';
      if (/hospital|doctor|medicine|pharmacy|health/i.test(text)) return 'Healthcare';
      return 'Others';
    };

    lines.forEach(line => {
      const amtMatch = line.match(amountRegex);
      if (!amtMatch) return;
      
      const amount = parseFloat(amtMatch[2].replace(/,/g, '')) || 0;
      const type = creditRegex.test(line) ? 'credit' : debitRegex.test(line) ? 'debit' : 'debit';
      const merchant = (line.match(merchantRegex)?.[1]) || (type === 'credit' ? 'Payment Received' : 'Payment');
      const category = categorize(line);
      const date = (line.match(dateRegex)?.[0]) || new Date().toISOString().slice(0,10);
      
      transactions.push({ amount, type, merchant, category, date, raw: line });
    });

    return transactions;
  };

  const handleParse = () => {
    if (!smsText.trim()) return;
    const parsed = parseSMS(smsText);
    setParsedTransactions(parsed);
  };

  const handleClear = () => {
    setSmsText('');
    setParsedTransactions([]);
  };

  const exampleSMS = `INR 500.00 debited from your account via UPI to Swiggy on 25-11-2025
Rs 1200 credited to your account as Salary on 2025-11-20
₹350 spent at Uber on 24/11/2025
INR 2500.00 debited for Amazon purchase on 23-11-2025
Rs 5000 credited as refund from Flipkart on 2025-11-22`;

  return (
    <div className="workspace-page workspace-sms relative pt-24 pb-20 px-4 sm:px-6 lg:px-8 fade-in-up overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-green-500 to-emerald-600 opacity-25 morphing-blob"></div>
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-br from-blue-500 to-cyan-600 opacity-30 wave-animation"></div>
      </div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <WorkspaceHeader eyebrow="LESS TYPING. MORE CLARITY." title={t('sms_tracking_title')} description={t('sms_tracking_subtitle')} motif="messages" />

        {/* How it Works */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 mb-8 text-white shadow-2xl">
          <h3 className="text-2xl font-bold mb-6">📋 {t('how_it_works')}</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur rounded-xl p-6">
              <div className="text-4xl mb-4">📩</div>
              <h4 className="font-bold text-lg mb-2">1. {t('paste_sms')}</h4>
              <p className="text-sm opacity-90">{t('paste_sms_desc')}</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-6">
              <div className="text-4xl mb-4">💬</div>
              <h4 className="font-bold text-lg mb-2">2. {t('auto_parse')}</h4>
              <p className="text-sm opacity-90">{t('auto_parse_desc')}</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-6">
              <div className="text-4xl mb-4">📊</div>
              <h4 className="font-bold text-lg mb-2">3. {t('track_instantly')}</h4>
              <p className="text-sm opacity-90">{t('track_instantly_desc')}</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">{t('paste_your_sms')}</h3>
              <button
                onClick={() => setSmsText(exampleSMS)}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition"
              >
                {t('load_example')}
              </button>
            </div>
            <textarea
              value={smsText}
              onChange={(e) => setSmsText(e.target.value)}
              placeholder={t('sms_placeholder')}
              className="w-full h-64 p-4 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-800 resize-none"
            />
            <div className="mt-4 flex gap-3">
              <button
                onClick={handleParse}
                disabled={!smsText.trim()}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🔍 {t('parse_sms')}
              </button>
              <button
                onClick={handleClear}
                className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                {t('clear')}
              </button>
            </div>
          </div>

          {/* Results Section */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {t('parsed_transactions')} ({parsedTransactions.length})
            </h3>
            
            {parsedTransactions.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-lg">{t('no_transactions')}</p>
                <p className="text-sm">{t('paste_and_parse')}</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {parsedTransactions.map((tx, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${
                          tx.type === 'credit' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {tx.category === 'Income' && '💰'}
                          {tx.category === 'Food' && '🍔'}
                          {tx.category === 'Travel' && '🚗'}
                          {tx.category === 'Transport' && '⛽'}
                          {tx.category === 'Shopping' && '🛒'}
                          {tx.category === 'Bills' && '📋'}
                          {tx.category === 'Entertainment' && '🎬'}
                          {tx.category === 'Healthcare' && '🏥'}
                          {tx.category === 'Others' && '💳'}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{tx.merchant}</p>
                          <p className="text-xs text-gray-500">{tx.category} • {tx.date}</p>
                        </div>
                      </div>
                      <div className={`text-lg font-bold ${
                        tx.type === 'credit' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {tx.type === 'credit' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 italic truncate">{tx.raw}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Supported Formats */}
        <div className="mt-8 bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg">
          <h4 className="font-bold text-gray-900 mb-3 flex items-center">
            <span className="text-2xl mr-2">✅</span>
            {t('supported_formats')}
          </h4>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
            <div>
              <p className="font-semibold mb-2">{t('amount_formats')}</p>
              <ul className="space-y-1 ml-4">
                <li>• INR 500.00</li>
                <li>• Rs. 1,200</li>
                <li>• ₹350</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-2">{t('date_formats')}</p>
              <ul className="space-y-1 ml-4">
                <li>• 25-11-2025</li>
                <li>• 2025-11-20</li>
                <li>• 24/11/2025</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="mt-8 bg-white rounded-xl p-6 shadow-lg">
          <h4 className="font-bold text-gray-900 mb-4 text-xl">{t('auto_categorization')}</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { emoji: '💰', name: 'Income', keywords: 'Salary, Refund' },
              { emoji: '🍔', name: 'Food', keywords: 'Swiggy, Zomato' },
              { emoji: '🚗', name: 'Travel', keywords: 'Uber, Ola, Metro' },
              { emoji: '⛽', name: 'Transport', keywords: 'Fuel, Petrol' },
              { emoji: '🛒', name: 'Shopping', keywords: 'Amazon, Flipkart' },
              { emoji: '📋', name: 'Bills', keywords: 'Electricity, Mobile' },
              { emoji: '🎬', name: 'Entertainment', keywords: 'Netflix, Movie' },
              { emoji: '🏥', name: 'Healthcare', keywords: 'Hospital, Medicine' }
            ].map((cat, idx) => (
              <div key={idx} className="bg-gray-50 rounded-lg p-4 text-center hover:shadow-md transition">
                <div className="text-3xl mb-2">{cat.emoji}</div>
                <p className="font-semibold text-gray-900">{cat.name}</p>
                <p className="text-xs text-gray-500 mt-1">{cat.keywords}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
