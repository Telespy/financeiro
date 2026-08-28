import React, { useState, useEffect } from 'react';
import {
  INITIAL_DEMO_TRANSACTIONS,
  loadUserTransactions,
  saveUserTransactions,
  loadBudgets,
  saveBudgets,
  loadCategories,
  saveCategories,
  exportCSV,
  exportJSON
} from './utils/storage';
import {
  getCurrentUser,
  logoutUser,
  isSupabaseConfigured,
  supabase,
  fetchSqlTransactions,
  saveSqlTransaction,
  deleteSqlTransaction
} from './lib/supabase';

import { Header } from './components/Header';
import { MetricsCards } from './components/MetricsCards';
import { ChartsView } from './components/ChartsView';
import { BudgetOverview } from './components/BudgetOverview';
import { BudgetModal } from './components/BudgetModal';
import { TransactionList } from './components/TransactionList';
import { TransactionModal } from './components/TransactionModal';
import { PwaInstallModal } from './components/PwaInstallModal';
import { LoginScreen } from './components/LoginScreen';
import confetti from 'canvas-confetti';

export function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [categories, setCategories] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [theme, setTheme] = useState('dark');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPwaModalOpen, setIsPwaModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [editingBudgetCategory, setEditingBudgetCategory] = useState(null);

  // Auth Initialization
  useEffect(() => {
    async function initAuth() {
      const user = await getCurrentUser();
      setCurrentUser(user);
      setAuthLoading(false);
    }

    initAuth();

    if (isSupabaseConfigured && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setCurrentUser(session?.user || null);
        setAuthLoading(false);
      });
      return () => subscription.unsubscribe();
    }
  }, []);

  // Load User Data when user changes
  useEffect(() => {
    if (!currentUser) return;

    async function loadData() {
      if (currentUser.id === 'demo-local-user') {
        // Demo Mode gets sample data
        setTransactions(INITIAL_DEMO_TRANSACTIONS);
      } else {
        // Real authenticated user: fetch from PostgreSQL SQL database
        const sqlTxs = await fetchSqlTransactions(currentUser.id);
        if (sqlTxs !== null) {
          setTransactions(sqlTxs);
        } else {
          setTransactions(loadUserTransactions(currentUser.id));
        }
      }
      setBudgets(loadBudgets(currentUser.id));
      setCategories(loadCategories(currentUser.id));
    }

    loadData();
  }, [currentUser]);

  // Sync theme to body class
  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, [theme]);

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>
        Carregando FinControl...
      </div>
    );
  }

  // Render Login Screen if user is not authenticated
  if (!currentUser) {
    return <LoginScreen onLoginSuccess={setCurrentUser} />;
  }

  // Filter transactions by selected month
  const monthlyTransactions = transactions.filter(t => {
    if (!t.date) return false;
    return t.date.startsWith(selectedMonth);
  });

  const handleSaveTransaction = async (newOrUpdatedTx) => {
    let updated;
    const exists = transactions.some(t => t.id === newOrUpdatedTx.id);
    if (exists) {
      updated = transactions.map(t => (t.id === newOrUpdatedTx.id ? newOrUpdatedTx : t));
    } else {
      updated = [newOrUpdatedTx, ...transactions];
      if (newOrUpdatedTx.type === 'receita' && newOrUpdatedTx.amount >= 1000) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    }
    setTransactions(updated);
    saveUserTransactions(currentUser.id, updated);
    if (currentUser && currentUser.id !== 'demo-local-user') {
      await saveSqlTransaction(currentUser.id, newOrUpdatedTx);
    }
    setEditingTransaction(null);
  };

  const handleDeleteTransaction = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta transação?')) {
      const updated = transactions.filter(t => t.id !== id);
      setTransactions(updated);
      saveUserTransactions(currentUser.id, updated);
      if (currentUser && currentUser.id !== 'demo-local-user') {
        await deleteSqlTransaction(currentUser.id, id);
      }
    }
  };

  const handleEditTransaction = (tx) => {
    setEditingTransaction(tx);
    setIsAddModalOpen(true);
  };

  const handleSaveBudget = (catId, limit) => {
    const updated = { ...budgets, [catId]: limit };
    setBudgets(updated);
    saveBudgets(currentUser.id, updated);
  };

  const handleRemoveBudget = (catId) => {
    if (window.confirm('Tem certeza que deseja remover o orçamento desta categoria?')) {
      const updated = { ...budgets, [catId]: 0 };
      setBudgets(updated);
      saveBudgets(currentUser.id, updated);
    }
  };

  const handleAddCategory = (newCat) => {
    const updated = [...categories, newCat];
    setCategories(updated);
    saveCategories(currentUser.id, updated);
  };

  const handleUpdateCategory = (updatedCat) => {
    const updated = categories.map(c => (c.id === updatedCat.id ? updatedCat : c));
    setCategories(updated);
    saveCategories(currentUser.id, updated);
  };

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
  };

  const handleExportCSV = () => {
    exportCSV(monthlyTransactions);
  };

  const handleExportJSON = () => {
    exportJSON(transactions, budgets, categories);
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
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Financial Overview Metrics Cards */}
      <MetricsCards transactions={monthlyTransactions} />

      {/* Interactive Charts */}
      <ChartsView
        transactions={monthlyTransactions}
        categories={categories}
        theme={theme}
      />

      {/* Category Budget Target Tracking */}
      <BudgetOverview
        transactions={monthlyTransactions}
        categories={categories}
        budgets={budgets}
        onOpenAddBudgetModal={() => {
          setEditingBudgetCategory(null);
          setIsBudgetModalOpen(true);
        }}
        onEditBudget={(cat) => {
          setEditingBudgetCategory(cat);
          setIsBudgetModalOpen(true);
        }}
        onRemoveBudget={handleRemoveBudget}
      />

      {/* Transaction History & Search/Filters */}
      <TransactionList
        transactions={monthlyTransactions}
        categories={categories}
        onDeleteTransaction={handleDeleteTransaction}
        onEditTransaction={handleEditTransaction}
      />

      {/* Add / Edit Transaction Modal */}
      <TransactionModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingTransaction(null);
        }}
        onSave={handleSaveTransaction}
        editingTransaction={editingTransaction}
        categories={categories}
      />

      {/* Add / Edit Budget Target Modal */}
      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => {
          setIsBudgetModalOpen(false);
          setEditingBudgetCategory(null);
        }}
        onSaveBudget={handleSaveBudget}
        onAddCategory={handleAddCategory}
        onUpdateCategory={handleUpdateCategory}
        editingBudgetCategory={editingBudgetCategory}
        categories={categories}
        budgets={budgets}
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
