import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { PAYMENT_METHODS } from '../utils/categories';

export function TransactionModal({ isOpen, onClose, onSave, editingTransaction, categories = [] }) {
  const [type, setType] = useState('despesa');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0].id);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (categories.length > 0 && !category) {
      setCategory(categories[0].id);
    }
  }, [categories, category]);

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type || 'despesa');
      setDescription(editingTransaction.description || '');
      setAmount(editingTransaction.amount || '');
      setCategory(editingTransaction.category || (categories[0]?.id || ''));
      setPaymentMethod(editingTransaction.paymentMethod || PAYMENT_METHODS[0].id);
      setDate(editingTransaction.date || new Date().toISOString().split('T')[0]);
    } else {
      setType('despesa');
      setDescription('');
      setAmount('');
      setCategory(categories[0]?.id || '');
      setPaymentMethod(PAYMENT_METHODS[0].id);
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [editingTransaction, isOpen, categories]);

  if (!isOpen) return null;

  const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!description.trim() || !amount || parseFloat(amount) <= 0) return;

    onSave({
      id: editingTransaction ? editingTransaction.id : generateUUID(),
      type,
      description: description.trim(),
      amount: parseFloat(amount),
      category: category || (categories[0]?.id || 'outros'),
      paymentMethod,
      date
    });

    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {editingTransaction ? 'Editar Transação' : 'Nova Transação'}
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Type Selector (Receita / Despesa) */}
          <div className="form-group">
            <label className="form-label">Tipo de Lançamento</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn"
                style={{
                  background: type === 'receita' ? 'var(--color-income-bg)' : 'rgba(0,0,0,0.2)',
                  color: type === 'receita' ? 'var(--color-income)' : 'var(--text-dim)',
                  border: `1px solid ${type === 'receita' ? 'var(--color-income)' : 'var(--border-card)'}`
                }}
                onClick={() => setType('receita')}
              >
                Entrada / Ganho
              </button>

              <button
                type="button"
                className="btn"
                style={{
                  background: type === 'despesa' ? 'var(--color-expense-bg)' : 'rgba(0,0,0,0.2)',
                  color: type === 'despesa' ? 'var(--color-expense)' : 'var(--text-dim)',
                  border: `1px solid ${type === 'despesa' ? 'var(--color-expense)' : 'var(--border-card)'}`
                }}
                onClick={() => setType('despesa')}
              >
                Saída / Gasto
              </button>
            </div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Descrição</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ex: Supermercado, Aluguel, Uber..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          {/* Amount & Date */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Valor (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                className="form-input"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Data</label>
              <input
                type="date"
                className="form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Category & Payment Method */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Categoria</label>
              <select
                className="select-input"
                style={{ width: '100%' }}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Forma de Pagamento</label>
              <select
                className="select-input"
                style={{ width: '100%' }}
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                {PAYMENT_METHODS.map(p => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Submit */}
          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              <Check size={18} />
              <span>Salvar Transação</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
