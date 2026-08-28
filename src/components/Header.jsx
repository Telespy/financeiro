import React from 'react';
import { Wallet, Plus, Download, Smartphone, Moon, Sun, FileSpreadsheet } from 'lucide-react';

export function Header({
  selectedMonth,
  onMonthChange,
  onOpenAddModal,
  onOpenPwaModal,
  onExportCSV,
  onExportJSON,
  theme,
  onToggleTheme
}) {
  return (
    <header className="header-bar glass-card" style={{ padding: '1rem 1.5rem' }}>
      <div className="brand-logo">
        <div className="brand-icon">
          <Wallet size={24} />
        </div>
        <div>
          <h1 className="brand-title">FinControl</h1>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 500 }}>
            Gestão Financeira Pessoal
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        {/* Month Selector */}
        <input
          type="month"
          className="select-input"
          value={selectedMonth}
          onChange={(e) => onMonthChange(e.target.value)}
          style={{ cursor: 'pointer' }}
        />

        {/* PWA Mobile Install Info Button */}
        <button
          className="btn btn-secondary"
          onClick={onOpenPwaModal}
          title="Como instalar no seu celular"
          style={{ gap: '0.4rem' }}
        >
          <Smartphone size={18} style={{ color: '#38bdf8' }} />
          <span className="hide-mobile">No Celular</span>
        </button>

        {/* Export CSV / Excel */}
        <button
          className="btn btn-secondary"
          onClick={onExportCSV}
          title="Exportar para Excel (CSV)"
          style={{ gap: '0.4rem' }}
        >
          <FileSpreadsheet size={18} style={{ color: '#10b981' }} />
          <span className="hide-mobile">Excel (CSV)</span>
        </button>

        {/* Theme Toggle */}
        <button
          className="btn btn-secondary btn-icon-only"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
        >
          {theme === 'dark' ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#6366f1" />}
        </button>

        {/* Add Transaction Primary Button */}
        <button className="btn btn-primary" onClick={onOpenAddModal}>
          <Plus size={18} />
          <span>Nova Transação</span>
        </button>
      </div>
    </header>
  );
}
