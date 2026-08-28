import React, { useState } from 'react';
import { Search, Filter, Trash2, Edit3, ArrowUpCircle, ArrowDownCircle, ListFilter } from 'lucide-react';
import { CATEGORIES, PAYMENT_METHODS, getCategoryObj } from '../utils/categories';

export function TransactionList({ transactions, onDeleteTransaction, onEditTransaction }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('todos');
  const [selectedCategory, setSelectedCategory] = useState('todas');
  const [selectedPayment, setSelectedPayment] = useState('todos');

  // Filtering
  const filtered = transactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.amount.toString().includes(searchTerm);
    const matchesType = selectedType === 'todos' || t.type === selectedType;
    const matchesCategory = selectedCategory === 'todas' || t.category === selectedCategory;
    const matchesPayment = selectedPayment === 'todos' || t.paymentMethod === selectedPayment;

    return matchesSearch && matchesType && matchesCategory && matchesPayment;
  });

  // Sort by date (newest first)
  const sorted = [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));

  const formatBRL = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  return (
    <div className="glass-card" style={{ padding: '1.5rem' }}>
      <div className="chart-title-row" style={{ marginBottom: '1rem' }}>
        <div className="section-title">
          <ListFilter size={20} style={{ color: 'var(--color-primary)' }} />
          <span>Histórico de Transações</span>
        </div>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
          {sorted.length} registros encontrados
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar glass-card" style={{ background: 'rgba(0, 0, 0, 0.25)', marginBottom: '1.25rem' }}>
        {/* Search */}
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Buscar por descrição ou valor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filter Type */}
        <select
          className="select-input"
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
        >
          <option value="todos">Todos os Tipos</option>
          <option value="receita">Receitas (Ganhos)</option>
          <option value="despesa">Despesas (Gastos)</option>
        </select>

        {/* Filter Category */}
        <select
          className="select-input"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="todas">Todas as Categorias</option>
          {CATEGORIES.map(c => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>

        {/* Filter Payment */}
        <select
          className="select-input"
          value={selectedPayment}
          onChange={(e) => setSelectedPayment(e.target.value)}
        >
          <option value="todos">Formas de Pagamento</option>
          {PAYMENT_METHODS.map(p => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>
      </div>

      {/* Transactions Table */}
      <div className="table-container">
        {sorted.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-dim)' }}>
            Nenhuma transação encontrada para os filtros selecionados.
          </div>
        ) : (
          <table className="transactions-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th>Categoria</th>
                <th>Pagamento</th>
                <th>Valor</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(t => {
                const catObj = getCategoryObj(t.category);
                const payObj = PAYMENT_METHODS.find(p => p.id === t.paymentMethod) || { label: t.paymentMethod };
                const isIncome = t.type === 'receita';

                return (
                  <tr key={t.id}>
                    <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                      {formatDate(t.date)}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {isIncome ? (
                          <ArrowUpCircle size={16} style={{ color: 'var(--color-income)', flexShrink: 0 }} />
                        ) : (
                          <ArrowDownCircle size={16} style={{ color: 'var(--color-expense)', flexShrink: 0 }} />
                        )}
                        <span>{t.description}</span>
                      </div>
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          backgroundColor: `${catObj.color}15`,
                          color: catObj.color,
                          border: `1px solid ${catObj.color}40`
                        }}
                      >
                        {catObj.label}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-payment">
                        {payObj.label}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: isIncome ? 'var(--color-income)' : 'var(--color-expense)', whiteSpace: 'nowrap' }}>
                      {isIncome ? '+' : '-'} {formatBRL(Number(t.amount))}
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        onClick={() => onEditTransaction(t)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-dim)',
                          cursor: 'pointer',
                          marginRight: '0.5rem',
                          padding: '4px'
                        }}
                        title="Editar"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => onDeleteTransaction(t.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          padding: '4px'
                        }}
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
