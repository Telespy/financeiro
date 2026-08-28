import React from 'react';
import { Wallet, ArrowUpCircle, ArrowDownCircle, PiggyBank } from 'lucide-react';

export function MetricsCards({ transactions }) {
  const totalIncome = transactions
    .filter(t => t.type === 'receita')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpense = transactions
    .filter(t => t.type === 'despesa')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const balance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.max(0, Math.round(((totalIncome - totalExpense) / totalIncome) * 100)) : 0;

  const formatBRL = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="metrics-grid">
      {/* Saldo Total */}
      <div className="glass-card metric-card" style={{ borderColor: 'rgba(59, 130, 246, 0.3)' }}>
        <div className="metric-header">
          <span className="metric-title">Saldo no Mês</span>
          <div className="metric-icon-box" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
            <Wallet size={20} />
          </div>
        </div>
        <div className="metric-value" style={{ color: balance >= 0 ? 'var(--text-main)' : '#ef4444' }}>
          {formatBRL(balance)}
        </div>
        <div className="metric-subtitle">
          {balance >= 0 ? 'Balanço positivo neste mês' : 'Atenção: Gastos superam as receitas'}
        </div>
      </div>

      {/* Receitas */}
      <div className="glass-card metric-card" style={{ borderColor: 'rgba(16, 185, 129, 0.3)' }}>
        <div className="metric-header">
          <span className="metric-title">Entradas / Ganhos</span>
          <div className="metric-icon-box" style={{ background: 'var(--color-income-bg)', color: 'var(--color-income)' }}>
            <ArrowUpCircle size={20} />
          </div>
        </div>
        <div className="metric-value" style={{ color: 'var(--color-income)' }}>
          {formatBRL(totalIncome)}
        </div>
        <div className="metric-subtitle">Total de receitas cadastradas</div>
      </div>

      {/* Despesas */}
      <div className="glass-card metric-card" style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
        <div className="metric-header">
          <span className="metric-title">Saídas / Gastos</span>
          <div className="metric-icon-box" style={{ background: 'var(--color-expense-bg)', color: 'var(--color-expense)' }}>
            <ArrowDownCircle size={20} />
          </div>
        </div>
        <div className="metric-value" style={{ color: 'var(--color-expense)' }}>
          {formatBRL(totalExpense)}
        </div>
        <div className="metric-subtitle">Total de despesas do mês</div>
      </div>

      {/* Taxa de Economia */}
      <div className="glass-card metric-card" style={{ borderColor: 'rgba(139, 92, 246, 0.3)' }}>
        <div className="metric-header">
          <span className="metric-title">Economia Guardada</span>
          <div className="metric-icon-box" style={{ background: 'var(--color-savings-bg)', color: 'var(--color-savings)' }}>
            <PiggyBank size={20} />
          </div>
        </div>
        <div className="metric-value" style={{ color: 'var(--color-savings)' }}>
          {savingsRate}%
        </div>
        <div className="metric-subtitle">
          {totalIncome > 0 ? `Retenção de ${formatBRL(Math.max(0, balance))}` : 'Sem receitas no mês'}
        </div>
      </div>
    </div>
  );
}
