import React, { useState, useEffect } from 'react';
import {
  loadTransactions,
  saveTransactions,
  loadBudgets,
  saveBudgets,
  exportCSV,
  exportJSON
} from './utils/storage';
import { Header } from './components/Header';
import { MetricsCards } from './components/MetricsCards';
import { ChartsView } from './components/ChartsView';
import { BudgetOverview } from './components/BudgetOverview';
import { TransactionList } from './components/TransactionList';
import { TransactionModal } from './components/TransactionModal';
import { PwaInstallModal } from './components/PwaInstallModal';
import confetti from 'canvas-confetti';

export function App() {
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [theme, setTheme] = useState('dark');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPwaModalOpen, setIsPwaModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  // Load initial data
  useEffect(() => {
    setTransactions(loadTransactions());
    setBudgets(loadBudgets());
  }, []);

  // Sync theme to body class
  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, [theme]);

  // Filter transactions by selected month
  const monthlyTransactions = transactions.filter(t => {
    if (!t.date) return false;
    return t.date.startsWith(selectedMonth);
  });

  const handleSaveTransaction = (newOrUpdatedTx) => {
    let updated;
    const exists = transactions.some(t => t.id === newOrUpdatedTx.id);
    if (exists) {
      updated = transactions.map(t => (t.id === newOrUpdatedTx.id ? newOrUpdatedTx : t));
    } else {
      updated = [newOrUpdatedTx, ...transactions];
      // Trigger celebration confetti if a high income is added!
      if (newOrUpdatedTx.type === 'receita' && newOrUpdatedTx.amount >= 1000) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    }
    setTransactions(updated);
    saveTransactions(updated);
    setEditingTransaction(null);
  };

  const handleDeleteTransaction = (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta transação?')) {
      const updated = transactions.filter(t => t.id !== id);
      setTransactions(updated);
      saveTransactions(updated);
    }
  };

  const handleEditTransaction = (tx) => {
    setEditingTransaction(tx);
    setIsAddModalOpen(true);
  };

  const handleSaveBudget = (catId, limit) => {
    const updated = { ...budgets, [catId]: limit };
    setBudgets(updated);
    saveBudgets(updated);
  };

  const handleExportCSV = () => {
    exportCSV(monthlyTransactions);
  };

  const handleExportJSON = () => {
    exportJSON(transactions, budgets);
  };

  return (
    <div className="app-container">
      {/* Header Bar */}
      <Header
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        onOpenAddModal={() => {
          setEditingTransaction(null);
          setIsAddModalOpen(true);
        }}
        onOpenPwaModal={() => setIsPwaModalOpen(true)}
        onExportCSV={handleExportCSV}
        onExportJSON={handleExportJSON}
        theme={theme}
        onToggleTheme={() => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))}
      />

      {/* Financial Overview Metrics Cards */}
      <MetricsCards transactions={monthlyTransactions} />

      {/* Interactive Charts (Cashflow Timeline & Category Doughnut) */}
      <ChartsView transactions={monthlyTransactions} theme={theme} />

      {/* Category Budget Target Tracking */}
      <BudgetOverview
        transactions={monthlyTransactions}
        budgets={budgets}
        onSaveBudget={handleSaveBudget}
      />

      {/* Transaction History & Search/Filters */}
      <TransactionList
        transactions={monthlyTransactions}
        onDeleteTransaction={handleDeleteTransaction}
        onEditTransaction={handleEditTransaction}
      />

      {/* Add / Edit Modal */}
      <TransactionModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingTransaction(null);
        }}
        onSave={handleSaveTransaction}
        editingTransaction={editingTransaction}
      />

      {/* PWA Mobile Installation Guide Modal */}
      <PwaInstallModal
        isOpen={isPwaModalOpen}
        onClose={() => setIsPwaModalOpen(false)}
      />
    </div>
  );
}

export default App;
