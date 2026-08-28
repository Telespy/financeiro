import React, { useState } from 'react';
import { Target, AlertTriangle, CheckCircle2, Edit2 } from 'lucide-react';
import { CATEGORIES } from '../utils/categories';

export function BudgetOverview({ transactions, budgets, onSaveBudget }) {
  const [editingCatId, setEditingCatId] = useState(null);
  const [tempBudgetVal, setTempBudgetVal] = useState('');

  const expenses = transactions.filter(t => t.type === 'despesa');

  const getSpent = (catId) => {
    return expenses
      .filter(t => t.category === catId)
      .reduce((sum, t) => sum + Number(t.amount), 0);
  };

  const formatBRL = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const handleEditClick = (cat) => {
    setEditingCatId(cat.id);
    const current = budgets[cat.id] !== undefined ? budgets[cat.id] : cat.defaultBudget;
    setTempBudgetVal(current);
  };

  const handleSave = (catId) => {
    const val = parseFloat(tempBudgetVal);
    onSaveBudget(catId, isNaN(val) ? 0 : val);
    setEditingCatId(null);
  };

  // Only display categories that have budgets or expenses (skip work/income category)
  const budgetableCategories = CATEGORIES.filter(c => c.id !== 'trabalho');

  return (
    <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
      <div className="chart-title-row">
        <div className="section-title">
          <Target size={20} style={{ color: 'var(--color-warning)' }} />
          <span>Orçamento Mensal por Categoria</span>
        </div>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
          Monitore e defina metas de limitação de gastos
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginTop: '1rem' }}>
        {budgetableCategories.map(cat => {
          const spent = getSpent(cat.id);
          const limit = budgets[cat.id] !== undefined ? budgets[cat.id] : cat.defaultBudget;
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
                padding: '1rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-card)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: cat.color,
                      display: 'inline-block'
                    }}
                  />
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{cat.label}</span>
                </div>

                <button
                  onClick={() => handleEditClick(cat)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-dim)',
                    cursor: 'pointer',
                    padding: '2px'
                  }}
                  title="Alterar meta deste orçamento"
                >
                  <Edit2 size={14} />
                </button>
              </div>

              {editingCatId === cat.id ? (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                  <input
                    type="number"
                    className="form-input"
                    value={tempBudgetVal}
                    onChange={(e) => setTempBudgetVal(e.target.value)}
                    placeholder="Novo limite (R$)"
                    style={{ padding: '0.3rem 0.5rem', fontSize: '0.85rem' }}
                    autoFocus
                  />
                  <button className="btn btn-primary" style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }} onClick={() => handleSave(cat.id)}>
                    OK
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '0.85rem' }}>
                  <span style={{ fontWeight: 700, color: isOver ? 'var(--color-expense)' : 'var(--text-main)' }}>
                    {formatBRL(spent)}
                  </span>
                  <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                    de {formatBRL(limit)} ({percent}%)
                  </span>
                </div>
              )}

              {/* Progress bar */}
              <div className="progress-bar-bg">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${percent}%`, backgroundColor: barColor }}
                />
              </div>

              {/* Status footer message */}
              <div style={{ marginTop: '0.4rem', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                {isOver ? (
                  <span style={{ color: 'var(--color-expense)', fontWeight: 600 }}>
                    <AlertTriangle size={12} style={{ display: 'inline', marginRight: '3px' }} />
                    Estourou em {formatBRL(spent - limit)}
                  </span>
                ) : isWarning ? (
                  <span style={{ color: 'var(--color-warning)', fontWeight: 600 }}>
                    <AlertTriangle size={12} style={{ display: 'inline', marginRight: '3px' }} />
                    Próximo do limite (80%+)
                  </span>
                ) : (
                  <span style={{ color: 'var(--text-dim)' }}>
                    <CheckCircle2 size={12} style={{ display: 'inline', marginRight: '3px', color: 'var(--color-income)' }} />
                    Dentro da meta
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
