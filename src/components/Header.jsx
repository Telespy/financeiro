import React from 'react';
import { DollarSign, Plus, Smartphone, Moon, Sun, FileSpreadsheet, LogOut, User } from 'lucide-react';

export function Header({
  selectedMonth,
  onMonthChange,
  onOpenAddModal,
  onOpenPwaModal,
  onExportCSV,
  onExportJSON,
  theme,
  onToggleTheme,
  currentUser,
  onLogout
}) {
  return (
    <header className="header-bar glass-card" style={{ padding: '1rem 1.5rem' }}>
      <div className="brand-logo">
        <div className="brand-icon">
          <DollarSign size={24} strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="brand-title">FinControl</h1>
          {currentUser && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: '#38bdf8', fontWeight: 600 }}>
              <User size={12} />
              <span>{currentUser.email || 'Usuário'}</span>
            </div>
          )}
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

        {/* Logout Button */}
        {currentUser && (
          <button
            className="btn btn-secondary btn-icon-only"
            onClick={onLogout}
            title="Sair do FinControl"
            style={{ color: '#ef4444' }}
          >
            <LogOut size={18} />
          </button>
        )}

        {/* Add Transaction Primary Button */}
        <button className="btn btn-primary" onClick={onOpenAddModal}>
          <Plus size={18} />
          <span>Nova Transação</span>
        </button>
      </div>
    </header>
  );
}
