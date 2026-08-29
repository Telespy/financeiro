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
  deleteSqlTransaction,
  fetchSqlBudgets,
  saveSqlBudget,
  fetchSqlCategories,
  saveSqlCategory
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
  const [syncWarning, setSyncWarning] = useState(null);

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
      setSyncWarning(null);
      if (currentUser.id === 'demo-local-user') {
        // Demo Mode gets sample data
        setTransactions(INITIAL_DEMO_TRANSACTIONS);
        setBudgets(loadBudgets(currentUser.id));
        setCategories(loadCategories(currentUser.id));
      } else {
        const localTxs = loadUserTransactions(currentUser.id);
        const localBudgets = loadBudgets(currentUser.id);
        const localCats = loadCategories(currentUser.id);

        // Real authenticated user: fetch from PostgreSQL SQL database
        const sqlTxs = await fetchSqlTransactions(currentUser.id);
        if (sqlTxs !== null) {
          if (sqlTxs.length > 0) {
            setTransactions(sqlTxs);
            saveUserTransactions(currentUser.id, sqlTxs);
          } else if (localTxs.length > 0) {
            // Cloud has 0 records but local browser has records: upload local records to cloud!
            setTransactions(localTxs);
            for (const tx of localTxs) {
              await saveSqlTransaction(currentUser.id, tx);
            }
          } else {
            setTransactions([]);
          }
        } else {
          setTransactions(localTxs);
          setSyncWarning('⚠️ Não foi possível se conectar com as tabelas do Supabase. Certifique-se de executar o script SQL no painel do Supabase e configurar VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY na Vercel.');
        }

        const sqlBudgets = await fetchSqlBudgets(currentUser.id);
        if (sqlBudgets !== null && Object.keys(sqlBudgets).length > 0) {
          setBudgets(sqlBudgets);
          saveBudgets(currentUser.id, sqlBudgets);
        } else {
          setBudgets(localBudgets);
        }

        const sqlCats = await fetchSqlCategories(currentUser.id);
        if (sqlCats !== null && sqlCats.length > 0) {
          setCategories(sqlCats);
          saveCategories(currentUser.id, sqlCats);
        } else {
          setCategories(localCats);
        }
      }
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
      const res = await saveSqlTransaction(currentUser.id, newOrUpdatedTx);
      if (res?.error) {
        setSyncWarning(`⚠️ Erro ao salvar no Supabase: ${res.error}. Verifique se a tabela "transactions" foi criada e o RLS está liberado.`);
      }
    }
    setEditingTransaction(null);
  };

  const handleDeleteTransaction = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta transação?')) {
      const updated = transactions.filter(t => t.id !== id);
      setTransactions(updated);
      saveUserTransactions(currentUser.id, updated);
      if (currentUser && currentUser.id !== 'demo-local-user') {
        const res = await deleteSqlTransaction(currentUser.id, id);
        if (res?.error) {
          setSyncWarning(`⚠️ Erro ao excluir no Supabase: ${res.error}`);
        }
      }
    }
  };

  const handleEditTransaction = (tx) => {
    setEditingTransaction(tx);
    setIsAddModalOpen(true);
  };

  const handleSaveBudget = async (catId, limit) => {
    const updated = { ...budgets, [catId]: limit };
    setBudgets(updated);
    saveBudgets(currentUser.id, updated);
    if (currentUser && currentUser.id !== 'demo-local-user') {
      const res = await saveSqlBudget(currentUser.id, catId, limit);
      if (res?.error) {
        setSyncWarning(`⚠️ Erro ao salvar orçamento no Supabase: ${res.error}`);
      }
    }
  };

  const handleRemoveBudget = async (catId) => {
    if (window.confirm('Tem certeza que deseja remover o orçamento desta categoria?')) {
      const updated = { ...budgets, [catId]: 0 };
      setBudgets(updated);
      saveBudgets(currentUser.id, updated);
      if (currentUser && currentUser.id !== 'demo-local-user') {
        const res = await saveSqlBudget(currentUser.id, catId, 0);
        if (res?.error) {
          setSyncWarning(`⚠️ Erro ao remover orçamento no Supabase: ${res.error}`);
        }
      }
    }
  };

  const handleAddCategory = async (newCat) => {
    const updated = [...categories, newCat];
    setCategories(updated);
    saveCategories(currentUser.id, updated);
    if (currentUser && currentUser.id !== 'demo-local-user') {
      const res = await saveSqlCategory(currentUser.id, newCat);
      if (res?.error) {
        setSyncWarning(`⚠️ Erro ao salvar categoria no Supabase: ${res.error}`);
      }
    }
  };

  const handleUpdateCategory = async (updatedCat) => {
    const updated = categories.map(c => (c.id === updatedCat.id ? updatedCat : c));
    setCategories(updated);
    saveCategories(currentUser.id, updated);
    if (currentUser && currentUser.id !== 'demo-local-user') {
      const res = await saveSqlCategory(currentUser.id, updatedCat);
      if (res?.error) {
        setSyncWarning(`⚠️ Erro ao atualizar categoria no Supabase: ${res.error}`);
      }
    }
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

      {/* Sync Warning Alert Banner */}
      {syncWarning && (
        <div
          style={{
            margin: '1rem 0',
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            color: '#f59e0b',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem'
          }}
        >
          <span>{syncWarning}</span>
          <button
            onClick={() => setSyncWarning(null)}
            style={{ background: 'none', border: 'none', color: '#f59e0b', cursor: 'pointer', fontWeight: 'bold' }}
          >
            ✕
          </button>
        </div>
      )}

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
