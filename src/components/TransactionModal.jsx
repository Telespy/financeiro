import React, { useState, useEffect } from 'react';
import { X, Check, Fuel, Gauge, Sparkles, MapPin } from 'lucide-react';
import { PAYMENT_METHODS } from '../utils/categories';
import {
  FUEL_REGIONS,
  getSavedCarConsumption,
  saveCarConsumption,
  getSavedFuelRegion,
  saveFuelRegion,
  getPriceForRegion,
  saveCustomFuelPrice,
  calculateFuelCost
} from '../utils/fuelService';

export function TransactionModal({ isOpen, onClose, onSave, editingTransaction, categories = [] }) {
  const [type, setType] = useState('despesa');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0].id);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Fuel calculator state
  const [fuelMode, setFuelMode] = useState('km'); // 'km' or 'manual'
  const [distanceKm, setDistanceKm] = useState('');
  const [carConsumption, setCarConsumption] = useState(() => getSavedCarConsumption());
  const [fuelRegion, setFuelRegion] = useState(() => getSavedFuelRegion());
  const [fuelPrice, setFuelPrice] = useState(() => getPriceForRegion(getSavedFuelRegion()));

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
      setFuelMode('manual'); // Keep manual when editing existing transaction
      setDistanceKm('');
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
      const currentRegion = getSavedFuelRegion();
      setFuelRegion(currentRegion);
      setFuelPrice(getPriceForRegion(currentRegion));
    }
  }, [editingTransaction, isOpen, categories]);

  // Recalculate amount whenever distance, car consumption or fuel price changes in km mode
  useEffect(() => {
    if (category === 'transporte' && type === 'despesa' && fuelMode === 'km') {
      const calc = calculateFuelCost(distanceKm, carConsumption, fuelPrice);
      if (calc.totalCost > 0) {
        setAmount(calc.formattedCost);
      }
    }
  }, [distanceKm, carConsumption, fuelPrice, fuelMode, category, type]);

  if (!isOpen) return null;

  const handleConsumptionChange = (newVal) => {
    setCarConsumption(newVal);
    saveCarConsumption(newVal);
  };

  const handleRegionChange = (regionId) => {
    setFuelRegion(regionId);
    saveFuelRegion(regionId);
    const newPrice = getPriceForRegion(regionId);
    setFuelPrice(newPrice);
  };

  const handleCustomPriceChange = (val) => {
    setFuelPrice(val);
    saveCustomFuelPrice(val);
  };

  const currentFuelCalculation = calculateFuelCost(distanceKm, carConsumption, fuelPrice);

  const applySuggestedDescription = () => {
    const liters = currentFuelCalculation.liters;
    const kmText = distanceKm ? `${distanceKm} km` : '';
    const litersText = liters > 0 ? ` (${liters.toFixed(1)}L)` : '';
    setDescription(`Combustível - ${kmText}${litersText}`.trim());
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

  const isTransportExpense = category === 'transporte' && type === 'despesa';

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

          {/* Smart Fuel Calculator for Transport Category */}
          {isTransportExpense && (
            <div className="fuel-calc-box">
              <div className="fuel-calc-header">
                <div className="fuel-calc-title">
                  <Fuel size={18} />
                  <span>Calculadora de Combustível</span>
                </div>
                <div className="fuel-mode-toggle">
                  <button
                    type="button"
                    className={`fuel-mode-btn ${fuelMode === 'km' ? 'active' : ''}`}
                    onClick={() => setFuelMode('km')}
                  >
                    Por Km Rodados
                  </button>
                  <button
                    type="button"
                    className={`fuel-mode-btn ${fuelMode === 'manual' ? 'active' : ''}`}
                    onClick={() => setFuelMode('manual')}
                  >
                    Valor Manual
                  </button>
                </div>
              </div>

              {fuelMode === 'km' ? (
                <>
                  <div className="form-row" style={{ marginBottom: '0.65rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Gauge size={14} color="#f59e0b" />
                        <span>Km Rodados</span>
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0.1"
                        className="form-input"
                        placeholder="Ex: 50"
                        value={distanceKm}
                        onChange={(e) => setDistanceKm(e.target.value)}
                        autoFocus
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">
                        Consumo do Carro (Km/L)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        className="form-input"
                        placeholder="Ex: 10.0"
                        value={carConsumption}
                        onChange={(e) => handleConsumptionChange(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label" style={{ marginTop: '0.5rem', marginBottom: '0.2rem' }}>
                      Preço Gasolina Comum:
                    </label>
                    <div className="fuel-region-chips">
                      {FUEL_REGIONS.map(reg => (
                        <button
                          key={reg.id}
                          type="button"
                          className={`fuel-region-chip ${fuelRegion === reg.id ? 'active' : ''}`}
                          onClick={() => handleRegionChange(reg.id)}
                        >
                          <MapPin size={12} />
                          <span>{reg.label} {reg.id !== 'custom' ? `(R$ ${reg.price.toFixed(2)})` : ''}</span>
                        </button>
                      ))}
                    </div>

                    {fuelRegion === 'custom' && (
                      <div style={{ marginBottom: '0.65rem' }}>
                        <input
                          type="number"
                          step="0.01"
                          min="1"
                          className="form-input"
                          placeholder="Digite o preço por litro (ex: 6.89)"
                          value={fuelPrice}
                          onChange={(e) => handleCustomPriceChange(e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  {/* Summary badge */}
                  <div className="fuel-summary-card">
                    <div>
                      <div className="fuel-summary-label">
                        {currentFuelCalculation.liters > 0
                          ? `${currentFuelCalculation.liters.toFixed(2)}L gastos • R$ ${Number(fuelPrice).toFixed(2)}/L`
                          : 'Informe os km para calcular'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                        Consumo memorizado: {carConsumption} km/L
                      </div>
                    </div>
                    <div className="fuel-summary-val">
                      R$ {currentFuelCalculation.formattedCost}
                    </div>
                  </div>

                  {distanceKm && (
                    <button
                      type="button"
                      className="fuel-suggestion-btn"
                      onClick={applySuggestedDescription}
                    >
                      <Sparkles size={12} />
                      <span>Preencher descrição: "Combustível - {distanceKm} km"</span>
                    </button>
                  )}
                </>
              ) : (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Modo manual ativo. Insira o valor total diretamente no campo abaixo.
                </div>
              )}
            </div>
          )}

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

          {/* Amount & Date */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                Valor Total (R$) {isTransportExpense && fuelMode === 'km' && <span style={{ color: '#f59e0b', fontSize: '0.75rem' }}>(Calculado automaticamente)</span>}
              </label>
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

