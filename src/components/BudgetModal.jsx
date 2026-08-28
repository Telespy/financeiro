import React, { useState, useEffect } from 'react';
import { X, Check, Plus, Palette } from 'lucide-react';
import { PALETTE_COLORS } from '../utils/categories';

export function BudgetModal({
  isOpen,
  onClose,
  onSaveBudget,
  onAddCategory,
  onUpdateCategory,
  editingBudgetCategory,
  categories,
  budgets
}) {
  const [mode, setMode] = useState('existing'); // 'existing' or 'new'
  const [selectedCatId, setSelectedCatId] = useState('');
  const [newCatLabel, setNewCatLabel] = useState('');
  const [color, setColor] = useState(PALETTE_COLORS[0]);
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (editingBudgetCategory) {
      setMode('existing');
      setSelectedCatId(editingBudgetCategory.id);
      setNewCatLabel(editingBudgetCategory.label || '');
      setColor(editingBudgetCategory.color || PALETTE_COLORS[0]);
      const currentLimit = budgets[editingBudgetCategory.id] !== undefined
        ? budgets[editingBudgetCategory.id]
        : (editingBudgetCategory.defaultBudget || 0);
      setAmount(currentLimit > 0 ? currentLimit : '');
    } else {
      setMode('existing');
      // Pick first category without budget if available
      const available = categories.filter(c => c.id !== 'trabalho' && (budgets[c.id] === undefined || budgets[c.id] === 0));
      setSelectedCatId(available.length > 0 ? available[0].id : (categories[0]?.id || ''));
      setNewCatLabel('');
      setColor(PALETTE_COLORS[Math.floor(Math.random() * PALETTE_COLORS.length)]);
      setAmount('');
    }
  }, [editingBudgetCategory, isOpen, categories, budgets]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 0) return;

    if (mode === 'new') {
      if (!newCatLabel.trim()) return;
      // Generate new category ID
      const catId = `custom_${Date.now()}`;
      const newCategory = {
        id: catId,
        label: newCatLabel.trim(),
        color: color,
        icon: 'Tag',
        defaultBudget: parsedAmount
      };
      onAddCategory(newCategory);
      onSaveBudget(catId, parsedAmount);
    } else {
      if (!selectedCatId) return;
      // If editing existing category details
      if (editingBudgetCategory && editingBudgetCategory.id === selectedCatId && newCatLabel.trim()) {
        onUpdateCategory({
          ...editingBudgetCategory,
          label: newCatLabel.trim(),
          color: color
        });
      }
      onSaveBudget(selectedCatId, parsedAmount);
    }

    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <h2 className="modal-title">
            {editingBudgetCategory ? 'Editar Meta de Orçamento' : 'Adicionar Novo Orçamento'}
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {!editingBudgetCategory && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <button
                type="button"
                className="btn"
                style={{
                  background: mode === 'existing' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(0,0,0,0.2)',
                  color: mode === 'existing' ? '#3b82f6' : 'var(--text-dim)',
                  border: `1px solid ${mode === 'existing' ? '#3b82f6' : 'var(--border-card)'}`
                }}
                onClick={() => setMode('existing')}
              >
                Categoria Existente
              </button>

              <button
                type="button"
                className="btn"
                style={{
                  background: mode === 'new' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(0,0,0,0.2)',
                  color: mode === 'new' ? '#10b981' : 'var(--text-dim)',
                  border: `1px solid ${mode === 'new' ? '#10b981' : 'var(--border-card)'}`
                }}
                onClick={() => setMode('new')}
              >
                <Plus size={16} /> Nova Categoria
              </button>
            </div>
          )}

          {mode === 'existing' ? (
            <div className="form-group">
              <label className="form-label">Selecione a Categoria</label>
              <select
                className="select-input"
                style={{ width: '100%' }}
                value={selectedCatId}
                onChange={(e) => {
                  setSelectedCatId(e.target.value);
                  const cat = categories.find(c => c.id === e.target.value);
                  if (cat) {
                    setNewCatLabel(cat.label);
                    setColor(cat.color);
                  }
                }}
                disabled={!!editingBudgetCategory}
              >
                {categories
                  .filter(c => c.id !== 'trabalho')
                  .map(c => (
                    <option key={c.id} value={c.id}>
                      {c.label} {budgets[c.id] ? `(Atual: R$ ${budgets[c.id]})` : ''}
                    </option>
                  ))}
              </select>
            </div>
          ) : null}

          {(mode === 'new' || editingBudgetCategory) && (
            <div className="form-group">
              <label className="form-label">Nome da Categoria</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ex: Assinaturas, Animais de Estimação, Combustível..."
                value={newCatLabel}
                onChange={(e) => setNewCatLabel(e.target.value)}
                required
              />
            </div>
          )}

          {/* Color palette picker */}
          {(mode === 'new' || editingBudgetCategory) && (
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Palette size={16} /> Cor da Categoria
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                {PALETTE_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: c,
                      border: color === c ? '3px solid #ffffff' : '1px solid transparent',
                      cursor: 'pointer',
                      boxShadow: color === c ? '0 0 10px ' + c : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Monthly Budget Limit Amount */}
          <div className="form-group">
            <label className="form-label">Limite Orçamentário Mensal (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="form-input"
              placeholder="Ex: 800,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              <Check size={18} />
              <span>{editingBudgetCategory ? 'Salvar Alterações' : 'Adicionar Orçamento'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
