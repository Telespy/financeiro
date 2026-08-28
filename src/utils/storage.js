import { DEFAULT_CATEGORIES } from './categories';

export const INITIAL_DEMO_TRANSACTIONS = [
  {
    id: 'demo-1',
    description: 'Salário Mensal',
    amount: 5200.00,
    type: 'receita',
    category: 'trabalho',
    paymentMethod: 'transferencia',
    date: new Date(new Date().setDate(2)).toISOString().split('T')[0]
  },
  {
    id: 'demo-2',
    description: 'Supermercado Mensal',
    amount: 850.40,
    type: 'despesa',
    category: 'alimentacao',
    paymentMethod: 'cartao_credito',
    date: new Date(new Date().setDate(5)).toISOString().split('T')[0]
  },
  {
    id: 'demo-3',
    description: 'Aluguel & Condomínio',
    amount: 1650.00,
    type: 'despesa',
    category: 'moradia',
    paymentMethod: 'pix',
    date: new Date(new Date().setDate(10)).toISOString().split('T')[0]
  },
  {
    id: 'demo-4',
    description: 'Combustível / Posto Shell',
    amount: 220.00,
    type: 'despesa',
    category: 'transporte',
    paymentMethod: 'cartao_debito',
    date: new Date(new Date().setDate(12)).toISOString().split('T')[0]
  },
  {
    id: 'demo-5',
    description: 'Jantar Restaurante',
    amount: 145.90,
    type: 'despesa',
    category: 'lazer',
    paymentMethod: 'pix',
    date: new Date(new Date().setDate(18)).toISOString().split('T')[0]
  },
  {
    id: 'demo-6',
    description: 'Aporte Renda Fixa',
    amount: 600.00,
    type: 'despesa',
    category: 'investimento',
    paymentMethod: 'pix',
    date: new Date(new Date().setDate(20)).toISOString().split('T')[0]
  },
  {
    id: 'demo-7',
    description: 'Farmácia Medicamentos',
    amount: 89.50,
    type: 'despesa',
    category: 'saude',
    paymentMethod: 'cartao_credito',
    date: new Date(new Date().setDate(22)).toISOString().split('T')[0]
  }
];

export function loadUserTransactions(userId) {
  if (!userId || userId === 'demo-local-user') {
    return INITIAL_DEMO_TRANSACTIONS;
  }
  try {
    const raw = localStorage.getItem(`fincontrol_txs_${userId}`);
    if (!raw) {
      return []; // Brand new real users start with 0 transactions!
    }
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

export function saveUserTransactions(userId, txs) {
  if (!userId) return;
  try {
    localStorage.setItem(`fincontrol_txs_${userId}`, JSON.stringify(txs));
  } catch (e) {
    console.error('Error saving user transactions', e);
  }
}

export function loadCategories(userId) {
  try {
    const raw = localStorage.getItem(`fincontrol_cats_${userId || 'default'}`);
    if (!raw) {
      return DEFAULT_CATEGORIES;
    }
    return JSON.parse(raw);
  } catch (e) {
    return DEFAULT_CATEGORIES;
  }
}

export function saveCategories(userId, cats) {
  try {
    localStorage.setItem(`fincontrol_cats_${userId || 'default'}`, JSON.stringify(cats));
  } catch (e) {
    console.error('Error saving categories', e);
  }
}

export function loadBudgets(userId) {
  try {
    const raw = localStorage.getItem(`fincontrol_budgets_${userId || 'default'}`);
    if (!raw) {
      const initialMap = {};
      DEFAULT_CATEGORIES.forEach(c => {
        if (c.defaultBudget > 0) {
          initialMap[c.id] = c.defaultBudget;
        }
      });
      return initialMap;
    }
    return JSON.parse(raw);
  } catch (e) {
    return {};
  }
}

export function saveBudgets(userId, budgets) {
  try {
    localStorage.setItem(`fincontrol_budgets_${userId || 'default'}`, JSON.stringify(budgets));
  } catch (e) {
    console.error('Error saving budgets', e);
  }
}

export function exportCSV(transactions) {
  const headers = ['ID', 'Data', 'Descrição', 'Tipo', 'Categoria', 'Forma de Pagamento', 'Valor (R$)'];
  const rows = transactions.map(t => [
    t.id,
    t.date,
    `"${t.description.replace(/"/g, '""')}"`,
    t.type,
    t.category,
    t.paymentMethod,
    t.amount.toFixed(2).replace('.', ',')
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + 
    [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
  
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `FinControl_Gastos_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportJSON(transactions, budgets, categories) {
  const data = {
    transactions,
    budgets,
    categories,
    exportedAt: new Date().toISOString()
  };
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `FinControl_Backup_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
