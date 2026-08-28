export const CATEGORIES = [
  { id: 'alimentacao', label: 'Alimentação', icon: 'Utensils', color: '#ef4444', defaultBudget: 1200 },
  { id: 'moradia', label: 'Moradia', icon: 'Home', color: '#3b82f6', defaultBudget: 2000 },
  { id: 'transporte', label: 'Transporte', icon: 'Car', color: '#f59e0b', defaultBudget: 600 },
  { id: 'lazer', label: 'Lazer & Entretenimento', icon: 'Tv', color: '#8b5cf6', defaultBudget: 500 },
  { id: 'saude', label: 'Saúde', icon: 'HeartPulse', color: '#10b981', defaultBudget: 400 },
  { id: 'educacao', label: 'Educação', icon: 'GraduationCap', color: '#06b6d4', defaultBudget: 400 },
  { id: 'compras', label: 'Compras & Vestuário', icon: 'ShoppingBag', color: '#ec4899', defaultBudget: 500 },
  { id: 'trabalho', label: 'Renda / Salário', icon: 'Briefcase', color: '#10b981', defaultBudget: 0 },
  { id: 'investimento', label: 'Investimentos', icon: 'TrendingUp', color: '#6366f1', defaultBudget: 800 },
  { id: 'outros', label: 'Outros', icon: 'MoreHorizontal', color: '#64748b', defaultBudget: 300 }
];

export const PAYMENT_METHODS = [
  { id: 'pix', label: 'PIX' },
  { id: 'cartao_credito', label: 'Cartão de Crédito' },
  { id: 'cartao_debito', label: 'Cartão de Débito' },
  { id: 'dinheiro', label: 'Dinheiro Espécie' },
  { id: 'transferencia', label: 'Transferência Bancária' }
];

export function getCategoryObj(catId) {
  return CATEGORIES.find(c => c.id === catId) || CATEGORIES[CATEGORIES.length - 1];
}
