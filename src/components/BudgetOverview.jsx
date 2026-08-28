import React from 'react';
import { Target, AlertTriangle, CheckCircle2, Edit2, Trash2, Plus } from 'lucide-react';

export function BudgetOverview({
  transactions,
  categories,
  budgets,
  onOpenAddBudgetModal,
  onEditBudget,
  onRemoveBudget
}) {
  const expenses = transactions.filter(t => t.type === 'despesa');

  const getSpent = (catId) => {
    return expenses
      .filter(t => t.category === catId)
      .reduce((sum, t) => sum + Number(t.amount), 0);
  };

  const formatBRL = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // Only display categories that have an active budget > 0 or have expense transactions
  const budgetableCategories = categories.filter(c => {
    if (c.id === 'trabalho') return false;
    const hasLimit = budgets[c.id] !== undefined ? budgets[c.id] > 0 : (c.defaultBudget > 0);
    const hasExpense = getSpent(c.id) > 0;
    return hasLimit || hasExpense;
  });

  return (
    <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
      <div className="chart-title-row" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div className="section-title">
            <Target size={20} style={{ color: 'var(--color-warning)' }} />
            <span>Orçamento Mensal por Categoria</span>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            Monitore, edite, adicione e gerencie suas metas de limitação de gastos
          </span>
        </div>

        {/* Add New Budget Button */}
        <button
          className="btn btn-secondary"
          onClick={onOpenAddBudgetModal}
          style={{ gap: '0.4rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
        >
          <Plus size={16} style={{ color: 'var(--color-income)' }} />
          <span>Novo Orçamento</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginTop: '1.25rem' }}>
        {budgetableCategories.length === 0 ? (
          <div style={{ textAlignment: 'center', padding: '2rem 1rem', color: 'var(--text-dim)', width: '100%', gridColumn: '1 / -1' }}>
            Nenhum orçamento configurado. Clique em <strong>"+ Novo Orçamento"</strong> para definir suas metas de gastos!
          </div>
        ) : (
          budgetableCategories.map(cat => {
            const spent = getSpent(cat.id);
            const limit = budgets[cat.id] !== undefined ? budgets[cat.id] : (cat.defaultBudget || 0);
            const percent = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;
            const isOver = limit > 0 && spent > limit;
            const isWarning = limit > 0 && percent >= 80 && !isOver;

            let barColor = 'var(--color-income)';
            if (isWarning) barColor = 'var(--color-warning)';
            if (isOver) barColor = 'var(--color-expense)';

            return (
              <div
                key={cat.id}
                style={{
                  background: 'rgba(0, 0, 0, 0.2)',
                  padding: '1.1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-card)',
                  display: 'flex',
                  flexDirection: 'column',
                  justify: 'space-between',
                  transition: 'border-color 0.2s ease'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: cat.color || '#64748b',
                          display: 'inline-block',
                          boxShadow: `0 0 8px ${cat.color}60`
                        }}
                      />
                      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{cat.label}</span>
                    </div>

                    {/* Action buttons (Edit & Remove) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <button
                        onClick={() => onEditBudget(cat)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-dim)',
                          cursor: 'pointer',
                          padding: '4px',
                          borderRadius: '4px'
                        }}
                        title="Editar limite ou dados deste orçamento"
                      >
                        <Edit2 size={15} />
                      </button>

                      <button
                        onClick={() => onRemoveBudget(cat.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          padding: '4px',
                          borderRadius: '4px',
                          opacity: 0.8
                        }}
                        title="Remover orçamento desta categoria"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '0.88rem', marginBottom: '0.4rem' }}>
                    <span style={{ fontWeight: 800, color: isOver ? 'var(--color-expense)' : 'var(--text-main)', fontSize: '1.05rem' }}>
                      {formatBRL(spent)}
                    </span>
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.78rem' }}>
                      {limit > 0 ? `de ${formatBRL(limit)} (${percent}%)` : 'Sem limite definido'}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="progress-bar-bg">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${percent}%`, backgroundColor: barColor }}
                    />
                  </div>
                </div>

                {/* Status Footer Message */}
                <div style={{ marginTop: '0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  {isOver ? (
                    <span style={{ color: 'var(--color-expense)', fontWeight: 600 }}>
                      <AlertTriangle size={13} style={{ display: 'inline', marginRight: '3px' }} />
                      Estourou em {formatBRL(spent - limit)}
                    </span>
                  ) : isWarning ? (
                    <span style={{ color: 'var(--color-warning)', fontWeight: 600 }}>
                      <AlertTriangle size={13} style={{ display: 'inline', marginRight: '3px' }} />
                      Próximo do limite (80%+)
                    </span>
                  ) : limit > 0 ? (
                    <span style={{ color: 'var(--text-dim)' }}>
                      <CheckCircle2 size={13} style={{ display: 'inline', marginRight: '3px', color: 'var(--color-income)' }} />
                      Dentro da meta ({formatBRL(limit - spent)} restantes)
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-dim)' }}>
                      Sem limite fixado
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
