import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Chart, registerables } from 'chart.js';
import WorkspaceHeader from './WorkspaceHeader';
import { CONTEXT_EVENT } from '../services/financialContext';

Chart.register(...registerables);

export default function Dashboard({ onNavigate }) {
  const { t } = useTranslation();
  
  // Load transactions from localStorage or use defaults
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('arthaguide_transactions');
    if (saved) {
      return JSON.parse(saved);
    }
    return [
      { amount: 45000, type: 'credit', merchant: 'Salary', category: 'Income', date: '2025-11-01' },
      { amount: 8500, type: 'debit', merchant: 'Swiggy', category: 'Food', date: '2025-11-03' },
      { amount: 3200, type: 'debit', merchant: 'Uber', category: 'Travel', date: '2025-11-05' },
      { amount: 5000, type: 'debit', merchant: 'Electricity', category: 'Bills', date: '2025-11-07' },
      { amount: 2800, type: 'debit', merchant: 'Flipkart', category: 'Shopping', date: '2025-11-10' },
      { amount: 1500, type: 'debit', merchant: 'Cafe', category: 'Food', date: '2025-11-12' },
      { amount: 4200, type: 'debit', merchant: 'Metro', category: 'Travel', date: '2025-11-15' }
    ];
  });
  
  // Save to localStorage whenever transactions change
  useEffect(() => {
    const serialized = JSON.stringify(transactions);
    if (localStorage.getItem('arthaguide_transactions') !== serialized) {
      localStorage.setItem('arthaguide_transactions', serialized);
      window.dispatchEvent(new Event(CONTEXT_EVENT));
    }
  }, [transactions]);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    amount: '',
    type: 'debit',
    merchant: '',
    category: 'Food',
    date: new Date().toISOString().slice(0, 10)
  });
  
  const spendingChartRef = useRef(null);
  const incomeExpenseChartRef = useRef(null);
  const spendingChartInstance = useRef(null);
  const incomeExpenseChartInstance = useRef(null);

  const computeSummary = (txs) => {
    let income = 0, expenses = 0;
    const categories = {};
    txs.forEach(tx => {
      if (tx.type === 'credit') {
        income += tx.amount;
      } else if (tx.type === 'debit') {
        expenses += tx.amount;
        categories[tx.category] = (categories[tx.category] || 0) + tx.amount;
      }
    });
    return { income, expenses, balance: income - expenses, categories };
  };

  const computeHealthScore = () => {
    if (transactions.length === 0) return 0;
    const summary = computeSummary(transactions);
    if (summary.income === 0) return 0;
    const savingRate = summary.balance / summary.income;
    const score = savingRate * 100;
    return Math.max(0, Math.min(100, score));
  };

  const summary = computeSummary(transactions);
  const healthScore = computeHealthScore();

  const handleAddTransaction = () => {
    if (!newTransaction.amount || !newTransaction.merchant) return;
    
    const transaction = {
      amount: parseFloat(newTransaction.amount),
      type: newTransaction.type,
      merchant: newTransaction.merchant,
      category: newTransaction.category,
      date: newTransaction.date
    };
    
    setTransactions([transaction, ...transactions]);
    setShowAddModal(false);
    setNewTransaction({
      amount: '',
      type: 'debit',
      merchant: '',
      category: 'Food',
      date: new Date().toISOString().slice(0, 10)
    });
  };

  const handleDeleteTransaction = (idx) => {
    setTransactions(transactions.filter((_, i) => i !== idx));
  };

  useEffect(() => {
    // Destroy existing charts
    if (spendingChartInstance.current) {
      spendingChartInstance.current.destroy();
    }
    if (incomeExpenseChartInstance.current) {
      incomeExpenseChartInstance.current.destroy();
    }

    // Create spending chart
    if (spendingChartRef.current && Object.keys(summary.categories).length > 0) {
      spendingChartInstance.current = new Chart(spendingChartRef.current, {
        type: 'doughnut',
        data: {
          labels: Object.keys(summary.categories),
          datasets: [{
            data: Object.values(summary.categories),
            backgroundColor: [
              'rgba(255, 99, 132, 0.8)',
              'rgba(54, 162, 235, 0.8)',
              'rgba(255, 206, 86, 0.8)',
              'rgba(75, 192, 192, 0.8)',
              'rgba(153, 102, 255, 0.8)'
            ]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });
    }

    // Create income/expense chart
    if (incomeExpenseChartRef.current) {
      incomeExpenseChartInstance.current = new Chart(incomeExpenseChartRef.current, {
        type: 'bar',
        data: {
          labels: [t('income'), t('expenses'), t('balance')],
          datasets: [{
            data: [summary.income, summary.expenses, Math.max(0, summary.balance)],
            backgroundColor: [
              'rgba(75, 192, 192, 0.8)',
              'rgba(255, 99, 132, 0.8)',
              'rgba(54, 162, 235, 0.8)'
            ]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } }
        }
      });
    }

    return () => {
      if (spendingChartInstance.current) {
        spendingChartInstance.current.destroy();
      }
      if (incomeExpenseChartInstance.current) {
        incomeExpenseChartInstance.current.destroy();
      }
    };
  }, [transactions, t]);

  return (
    <div className="workspace-page workspace-dashboard relative pt-24 pb-20 px-4 sm:px-6 lg:px-8 fade-in-up overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-10 w-72 h-72 bg-gradient-to-br from-green-400 to-blue-500 opacity-20 morphing-blob"></div>
        <div className="absolute bottom-20 left-10 w-80 h-80 bg-gradient-to-br from-purple-400 to-pink-500 opacity-15 morphing-blob" style={{animationDelay: '-7s'}}></div>
      </div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <WorkspaceHeader eyebrow="YOUR MONEY, AT A GLANCE" title={t('dashboard_title')} description="A clearer picture of what comes in, what goes out, and what you can plan next." action="Plan a repayment" onAction={() => onNavigate?.('advisor')} />
        <div className="workspace-dashboard-toolbar">
          <span className="workspace-section-label">Your financial snapshot</span>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition transform hover:scale-105 flex items-center space-x-2"
            >
              <span className="text-xl">+</span>
              <span>{t('add_transaction')}</span>
            </button>
            <div className="flex items-center space-x-2 bg-green-100 px-4 py-2 rounded-lg">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-700 font-medium">{t('live_tracking')}</span>
            </div>
          </div>
        </div>
        
        <div className="workspace-overview-grid">
        <div className="workspace-health-card bg-gradient-to-r from-green-400 to-blue-500 rounded-2xl p-8 mb-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-10 rounded-full -ml-24 -mb-24"></div>
          <div className="relative z-10">
            <h3 className="text-2xl font-semibold mb-4">{t('health_score')}</h3>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-7xl font-bold mb-2">{healthScore.toFixed(0)}</div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg opacity-90">{t('out_of')}</span>
                  {healthScore >= 70 && <span className="text-2xl">✅</span>}
                  {healthScore >= 50 && healthScore < 70 && <span className="text-2xl">👍</span>}
                  {healthScore < 50 && <span className="text-2xl">⚠️</span>}
                </div>
              </div>
              <div className="text-right">
                <div className="bg-white/20 rounded-xl p-4 backdrop-blur">
                  <p className="text-sm opacity-90 mb-1">{t('status')}</p>
                  <p className="text-xl font-bold">
                    {healthScore >= 70 ? t('excellent') : healthScore >= 50 ? t('good') : t('needs_attention')}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 bg-white/20 rounded-full h-4 overflow-hidden backdrop-blur">
              <div 
                className="bg-white h-full rounded-full transition-all duration-1000 shadow-lg" 
                style={{width: `${healthScore}%`}}
              ></div>
            </div>
          </div>
        </div>

        <div className="workspace-metrics grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-green-500 hover:shadow-2xl transition transform hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-600">{t('income')}</p>
              <div className="text-3xl">📈</div>
            </div>
            <p className="text-4xl font-bold text-gray-900 mb-2">₹{summary.income.toLocaleString()}</p>
            <div className="flex items-center text-green-600 text-sm">
              <span>↗ 12% {t('from_last_month')}</span>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-red-500 hover:shadow-2xl transition transform hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-600">{t('expenses')}</p>
              <div className="text-3xl">📉</div>
            </div>
            <p className="text-4xl font-bold text-gray-900 mb-2">₹{summary.expenses.toLocaleString()}</p>
            <div className="flex items-center text-red-600 text-sm">
              <span>↗ 8% {t('from_last_month')}</span>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-blue-500 hover:shadow-2xl transition transform hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-600">{t('balance')}</p>
              <div className="text-3xl">💰</div>
            </div>
            <p className="text-4xl font-bold text-gray-900 mb-2">₹{summary.balance.toLocaleString()}</p>
            <div className="flex items-center text-blue-600 text-sm">
              <span>↗ {t('saving_monthly')}</span>
            </div>
          </div>
        </div>

        </div>
        <div className="workspace-chart-grid grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-2xl transition">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xl font-semibold text-gray-800">{t('spending_pattern')}</h4>
              <span className="text-2xl">🍩</span>
            </div>
            <div className="h-80">
              <canvas ref={spendingChartRef}></canvas>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-2xl transition">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xl font-semibold text-gray-800">{t('income_expense')}</h4>
              <span className="text-2xl">📊</span>
            </div>
            <div className="h-80">
              <canvas ref={incomeExpenseChartRef}></canvas>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-xl font-semibold text-gray-800">{t('last_transactions')}</h4>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-500">{transactions.length} {t('transactions')}</span>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition"
              >
                + {t('quick_add')}
              </button>
            </div>
          </div>
          <div className="space-y-3">
            {transactions.slice(0, 5).map((tx, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition group">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                    tx.type === 'credit' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {tx.category === 'Income' && '💰'}
                    {tx.category === 'Food' && '🍔'}
                    {tx.category === 'Travel' && '🚗'}
                    {tx.category === 'Bills' && '📍'}
                    {tx.category === 'Shopping' && '🛒'}
                    {tx.category === 'Transport' && '⛽'}
                    {tx.category === 'Entertainment' && '🎬'}
                    {tx.category === 'Healthcare' && '🏥'}
                    {tx.category === 'Others' && '💳'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{tx.merchant}</p>
                    <p className="text-sm text-gray-500">{tx.category} • {tx.date}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className={`text-lg font-bold ${
                    tx.type === 'credit' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {tx.type === 'credit' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                  </div>
                  <button
                    onClick={() => handleDeleteTransaction(idx)}
                    className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition text-xl"
                    title={t('delete')}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add Transaction Modal */}
        {showAddModal && (
          <div className="app-dialog-overlay fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl transform scale-in">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">➕ {t('add_transaction')}</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Type Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('transaction_type')}</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setNewTransaction({...newTransaction, type: 'debit', category: 'Food'})}
                      className={`px-4 py-3 rounded-lg font-medium transition ${
                        newTransaction.type === 'debit'
                          ? 'bg-red-500 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      💸 {t('expense')}
                    </button>
                    <button
                      onClick={() => setNewTransaction({...newTransaction, type: 'credit', category: 'Income'})}
                      className={`px-4 py-3 rounded-lg font-medium transition ${
                        newTransaction.type === 'credit'
                          ? 'bg-green-500 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      💰 {t('income')}
                    </button>
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('amount')} (₹)</label>
                  <input
                    type="number"
                    value={newTransaction.amount}
                    onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
                    placeholder={t('amount')}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-800"
                  />
                </div>

                {/* Merchant */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('merchant_desc')}</label>
                  <input
                    type="text"
                    value={newTransaction.merchant}
                    onChange={(e) => setNewTransaction({...newTransaction, merchant: e.target.value})}
                    placeholder={t('merchant_placeholder')}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-800"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('category')}</label>
                  <select
                    value={newTransaction.category}
                    onChange={(e) => setNewTransaction({...newTransaction, category: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-800"
                  >
                    {newTransaction.type === 'credit' ? (
                      <option value="Income">💰 Income</option>
                    ) : (
                      <>
                        <option value="Food">🍔 Food</option>
                        <option value="Travel">🚗 Travel</option>
                        <option value="Transport">⛽ Transport</option>
                        <option value="Shopping">🛒 Shopping</option>
                        <option value="Bills">📍 Bills</option>
                        <option value="Entertainment">🎬 Entertainment</option>
                        <option value="Healthcare">🏥 Healthcare</option>
                        <option value="Others">💳 Others</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('date')}</label>
                  <input
                    type="date"
                    value={newTransaction.date}
                    onChange={(e) => setNewTransaction({...newTransaction, date: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-800"
                  />
                </div>

                {/* Buttons */}
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    onClick={handleAddTransaction}
                    disabled={!newTransaction.amount || !newTransaction.merchant}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('add_transaction')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
