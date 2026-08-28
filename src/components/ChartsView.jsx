import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { getCategoryObj } from '../utils/categories';
import { PieChart, BarChart2 } from 'lucide-react';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement
);

export function ChartsView({ transactions, categories = [], theme }) {
  const expenses = transactions.filter(t => t.type === 'despesa');

  // Calculate totals per category
  const categoryTotals = {};
  expenses.forEach(t => {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + Number(t.amount);
  });

  const activeCategoryIds = Object.keys(categoryTotals).filter(catId => categoryTotals[catId] > 0);
  const activeCategoriesObj = activeCategoryIds.map(catId => getCategoryObj(catId, categories));

  const doughnutData = {
    labels: activeCategoriesObj.map(c => c.label),
    datasets: [
      {
        data: activeCategoriesObj.map(c => categoryTotals[c.id]),
        backgroundColor: activeCategoriesObj.map(c => c.color || '#64748b'),
        borderColor: theme === 'dark' ? '#0f172a' : '#ffffff',
        borderWidth: 2
      }
    ]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: theme === 'dark' ? '#94a3b8' : '#334155',
          font: { family: 'Plus Jakarta Sans', size: 12 },
          padding: 14,
          usePointStyle: true
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const val = context.raw || 0;
            const formatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
            return ` ${context.label}: ${formatted}`;
          }
        }
      }
    },
    cutout: '70%'
  };

  // Daily cashflow timeline
  const daysInMonth = {};
  transactions.forEach(t => {
    const day = t.date;
    if (!daysInMonth[day]) daysInMonth[day] = { income: 0, expense: 0 };
    if (t.type === 'receita') daysInMonth[day].income += Number(t.amount);
    else daysInMonth[day].expense += Number(t.amount);
  });

  const sortedDays = Object.keys(daysInMonth).sort();

  const barData = {
    labels: sortedDays.map(d => {
      const parts = d.split('-');
      return `${parts[2]}/${parts[1]}`;
    }),
    datasets: [
      {
        label: 'Receitas (Entradas)',
        data: sortedDays.map(d => daysInMonth[d].income),
        backgroundColor: '#10b981',
        borderRadius: 4
      },
      {
        label: 'Despesas (Saídas)',
        data: sortedDays.map(d => daysInMonth[d].expense),
        backgroundColor: '#ef4444',
        borderRadius: 4
      }
    ]
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: theme === 'dark' ? '#94a3b8' : '#334155',
          font: { family: 'Plus Jakarta Sans', size: 12 },
          usePointStyle: true
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const val = context.raw || 0;
            const formatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
            return ` ${context.dataset.label}: ${formatted}`;
          }
        }
      }
    },
    scales: {
      x: {
        ticks: { color: theme === 'dark' ? '#64748b' : '#64748b' },
        grid: { display: false }
      },
      y: {
        ticks: { color: theme === 'dark' ? '#64748b' : '#64748b' },
        grid: { color: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }
      }
    }
  };

  return (
    <div className="dashboard-grid">
      {/* Daily Cashflow Bar Chart */}
      <div className="glass-card chart-card">
        <div className="chart-title-row">
          <div className="section-title">
            <BarChart2 size={20} style={{ color: 'var(--color-primary)' }} />
            <span>Fluxo Diário de Caixa</span>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Entradas vs Saídas</span>
        </div>
        <div style={{ flex: 1, minHeight: '240px', position: 'relative' }}>
          {sortedDays.length > 0 ? (
            <Bar data={barData} options={barOptions} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-dim)' }}>
              Nenhuma transação registrada neste período.
            </div>
          )}
        </div>
      </div>

      {/* Doughnut Category Breakdown */}
      <div className="glass-card chart-card">
        <div className="chart-title-row">
          <div className="section-title">
            <PieChart size={20} style={{ color: 'var(--color-savings)' }} />
            <span>Gastos por Categoria</span>
          </div>
        </div>
        <div style={{ flex: 1, minHeight: '240px', position: 'relative' }}>
          {activeCategoriesObj.length > 0 ? (
            <Doughnut data={doughnutData} options={doughnutOptions} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-dim)' }}>
              Sem despesas registradas neste período.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
