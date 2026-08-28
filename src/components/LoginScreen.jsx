import React, { useState } from 'react';
import { DollarSign, Lock, Mail, Eye, EyeOff, LogIn, Database, ArrowRight, ShieldCheck } from 'lucide-react';
import { loginOrRegister, isSupabaseConfigured } from '../lib/supabase';

export function LoginScreen({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!email.trim() || !password) {
      setErrorMessage('Por favor, preencha o e-mail e a senha.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const { user, error } = await loginOrRegister(email.trim(), password);
      if (error) {
        setErrorMessage(error);
      } else if (user) {
        onLoginSuccess(user);
      }
    } catch (err) {
      setErrorMessage('Ocorreu um erro ao processar seu acesso.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoMode = () => {
    const demoUser = { id: 'demo-local-user', email: 'visitante@fincontrol.app' };
    localStorage.setItem('fincontrol_local_user', JSON.stringify(demoUser));
    onLoginSuccess(demoUser);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        background: 'radial-gradient(circle at 50% 30%, rgba(59, 130, 246, 0.15) 0%, transparent 60%)'
      }}
    >
      <div className="glass-card" style={{ width: '100%', maxWidth: '440px', padding: '2.25rem 2rem' }}>
        {/* Logo and Brand */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            className="brand-icon"
            style={{ width: '56px', height: '56px', margin: '0 auto 1rem auto', borderRadius: '16px' }}
          >
            <DollarSign size={30} strokeWidth={2.5} />
          </div>
          <h1 className="brand-title" style={{ fontSize: '1.8rem' }}>FinControl</h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
            Acesse seus gastos e orçamentos pessoais
          </p>
        </div>

        {/* Database Status Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 0.85rem',
            borderRadius: 'var(--radius-sm)',
            background: isSupabaseConfigured ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
            border: `1px solid ${isSupabaseConfigured ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
            marginBottom: '1.5rem',
            fontSize: '0.78rem',
            color: isSupabaseConfigured ? '#10b981' : '#f59e0b'
          }}
        >
          <Database size={15} style={{ flexShrink: 0 }} />
          <span>
            {isSupabaseConfigured
              ? 'Conectado ao Banco de Dados SQL PostgreSQL'
              : 'Modo Local / Adicione suas chaves do Supabase no .env para banco SQL.'}
          </span>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              fontSize: '0.85rem',
              marginBottom: '1.25rem'
            }}
          >
            {errorMessage}
          </div>
        )}

        {/* Login / Register Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Mail size={15} /> E-mail ou Nome de Usuário
            </label>
            <input
              type="email"
              className="form-input"
              placeholder="seuemail@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Lock size={15} /> Senha
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Sua senha secreta"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-dim)',
                  cursor: 'pointer'
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', padding: '0.75rem', fontSize: '1rem' }}
          >
            {loading ? (
              <span>Autenticando...</span>
            ) : (
              <>
                <LogIn size={18} />
                <span>Entrar ou Cadastrar</span>
              </>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
          <ShieldCheck size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle', color: '#38bdf8' }} />
          Se for o seu primeiro acesso, sua conta será **criada automaticamente** no banco de dados!
        </div>

        <div style={{ margin: '1.5rem 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-card)' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>OU</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-card)' }} />
        </div>

        {/* Demo Mode Button */}
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleDemoMode}
          style={{ width: '100%', fontSize: '0.85rem', color: 'var(--text-muted)' }}
        >
          <span>Entrar em Modo Demonstração</span>
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}
