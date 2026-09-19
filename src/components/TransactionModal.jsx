import React, { useState, useEffect } from 'react';
import { X, Check, Gauge } from 'lucide-react';
import { PAYMENT_METHODS } from '../utils/categories';
import {
  getSavedCarConsumption,
  saveCarConsumption,
  getSavedFuelRegion,
  getPriceForRegion,
  saveCustomFuelPrice
} from '../utils/fuelService';

export function TransactionModal({ isOpen, onClose, onSave, editingTransaction, categories = [] }) {
  const [type, setType] = useState('despesa');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0].id);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Fuel calculator state (placed directly in the amount field for Transporte)
  const [fuelMode, setFuelMode] = useState('km'); // 'km' or 'manual'
  const [distanceKm, setDistanceKm] = useState('');
  const [carConsumption, setCarConsumption] = useState(() => getSavedCarConsumption());
  const [fuelPrice, setFuelPrice] = useState(() => getPriceForRegion(getSavedFuelRegion()));
  const [showFuelSettings, setShowFuelSettings] = useState(false);

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
      setFuelMode('manual');
      setDistanceKm('');
      setShowFuelSettings(false);
    } else {
      setType('despesa');
      setDescription('');
      setAmount('');
      setCategory(categories[0]?.id || '');
      setPaymentMethod(PAYMENT_METHODS[0].id);
      setDate(new Date().toISOString().split('T')[0]);
      setFuelMode('km');
      setDistanceKm('');
      setCarConsumption(getSavedCarConsumption());
      setFuelPrice(getPriceForRegion(getSavedFuelRegion()));
      setShowFuelSettings(false);
    }
  }, [editingTransaction, isOpen, categories]);

  if (!isOpen) return null;

  const isTransportExpense = category === 'transporte' && type === 'despesa';

  const handleConsumptionChange = (newVal) => {
    setCarConsumption(newVal);
    saveCarConsumption(newVal);
    // Recalculate amount if distance is set
    const km = parseFloat(distanceKm);
    const cons = parseFloat(newVal);
    if (!isNaN(km) && km > 0 && !isNaN(cons) && cons > 0) {
      const liters = km / cons;
      const cost = liters * fuelPrice;
      setAmount(cost.toFixed(2));
    }
  };

  const handleFuelPriceChange = (newPrice) => {
    setFuelPrice(newPrice);
    saveCustomFuelPrice(newPrice);
    const km = parseFloat(distanceKm);
    const price = parseFloat(newPrice);
    if (!isNaN(km) && km > 0 && !isNaN(price) && price > 0) {
      const liters = km / carConsumption;
      const cost = liters * price;
      setAmount(cost.toFixed(2));
    }
  };

  const handleKmChange = (val) => {
    setDistanceKm(val);
    const km = parseFloat(val);
    const cons = parseFloat(carConsumption) || 8;
    const price = parseFloat(fuelPrice) || 6.92;

    if (!isNaN(km) && km > 0) {
      const liters = km / cons;
      const totalCost = liters * price;
      setAmount(totalCost.toFixed(2));

      // Auto update description if empty or previous fuel description
      if (!description.trim() || description.startsWith('Combustível')) {
        setDescription(`Combustível - ${km} km (${liters.toFixed(1)}L)`);
      }
    } else {
      setAmount('');
    }
  };

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

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Descrição</label>
            <input
              type="text"
              className="form-input"
              placeholder={isTransportExpense ? 'Ex: Combustível / Gasolina...' : 'Ex: Supermercado, Aluguel, Farmácia...'}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          {/* Amount (or Km Rodados if Transporte) & Date */}
          <div className="form-row">
            {isTransportExpense && fuelMode === 'km' ? (
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label className="form-label" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#f59e0b' }}>
                    <Gauge size={15} />
                    <span>Km's Rodados</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setFuelMode('manual');
                      setAmount('');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-dim)',
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    Digitar R$ direto
                  </button>
                </div>

                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    step="any"
                    min="0.1"
                    className="form-input"
                    placeholder="Ex: 50"
                    value={distanceKm}
                    onChange={(e) => handleKmChange(e.target.value)}
                    required
                    autoFocus
                  />
                  <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', fontSize: '0.85rem', pointerEvents: 'none' }}>
                    km
                  </span>
                </div>

                {/* Real-time Calculation Badge */}
                {distanceKm && parseFloat(distanceKm) > 0 && (
                  <div style={{
                    marginTop: '0.4rem',
                    padding: '0.45rem 0.65rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(245, 158, 11, 0.12)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    fontSize: '0.78rem',
                    color: '#f59e0b',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>
                      {(parseFloat(distanceKm) / carConsumption).toFixed(2)}L (÷ {carConsumption} km/l) × R$ {Number(fuelPrice).toFixed(2)}
                    </span>
                    <span style={{ fontWeight: 'bold', fontSize: '0.92rem' }}>
                      = R$ {amount ? Number(amount).toFixed(2).replace('.', ',') : '0,00'}
                    </span>
                  </div>
                )}

                {/* Small indicator / settings toggle */}
                <div style={{ marginTop: '0.35rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                    Padrão: {carConsumption} km/l • R$ {Number(fuelPrice).toFixed(2)}/L
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowFuelSettings(!showFuelSettings)}
                    style={{ background: 'none', border: 'none', color: '#f59e0b', fontSize: '0.7rem', cursor: 'pointer' }}
                  >
                    {showFuelSettings ? 'Ocultar' : 'Ajustar ⚙️'}
                  </button>
                </div>

                {/* Optional settings dropdown */}
                {showFuelSettings && (
                  <div style={{
                    marginTop: '0.5rem',
                    padding: '0.65rem',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--border-card)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.5rem'
                  }}>
                    <div>
                      <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Média do carro (km/l):</label>
                      <input
                        type="number"
                        step="0.5"
                        min="1"
                        className="form-input"
                        style={{ padding: '0.4rem', fontSize: '0.85rem' }}
                        value={carConsumption}
                        onChange={(e) => handleConsumptionChange(e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Gasolina (R$/L):</label>
                      <input
                        type="number"
                        step="0.01"
                        min="1"
                        className="form-input"
                        style={{ padding: '0.4rem', fontSize: '0.85rem' }}
                        value={fuelPrice}
                        onChange={(e) => handleFuelPriceChange(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>Valor (R$)</label>
                  {isTransportExpense && (
                    <button
                      type="button"
                      onClick={() => setFuelMode('km')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#f59e0b',
                        fontSize: '0.72rem',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      🚗 Colocar Km's rodados
                    </button>
                  )}
                </div>
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
            )}

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


