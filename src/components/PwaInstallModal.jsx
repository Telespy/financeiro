import React, { useState } from 'react';
import { X, Smartphone, Share, MoreVertical, PlusSquare, CheckCircle2 } from 'lucide-react';

export function PwaInstallModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('android');

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Smartphone size={22} style={{ color: '#38bdf8' }} />
            <h2 className="modal-title">Como Instalar no Celular</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          O FinControl é um Web App (PWA). Você pode adicioná-lo diretamente à Tela Inicial do seu celular para usá-lo como um aplicativo comum, sem precisar baixar na Play Store ou App Store.
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <button
            className="btn"
            style={{
              background: activeTab === 'android' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(0, 0, 0, 0.2)',
              color: activeTab === 'android' ? '#38bdf8' : 'var(--text-dim)',
              border: `1px solid ${activeTab === 'android' ? '#38bdf8' : 'var(--border-card)'}`
            }}
            onClick={() => setActiveTab('android')}
          >
            Android (Chrome / Edge)
          </button>

          <button
            className="btn"
            style={{
              background: activeTab === 'ios' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(0, 0, 0, 0.2)',
              color: activeTab === 'ios' ? '#a78bfa' : 'var(--text-dim)',
              border: `1px solid ${activeTab === 'ios' ? '#a78bfa' : 'var(--border-card)'}`
            }}
            onClick={() => setActiveTab('ios')}
          >
            iPhone / iPad (Safari)
          </button>
        </div>

        {/* Steps for Android */}
        {activeTab === 'android' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <div style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>
                1
              </div>
              <div style={{ fontSize: '0.9rem' }}>
                Abra este site no <strong>Google Chrome</strong> ou <strong>Microsoft Edge</strong> no celular.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <div style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>
                2
              </div>
              <div style={{ fontSize: '0.9rem' }}>
                Toque no ícone de <strong>três pontos (<MoreVertical size={16} style={{ display: 'inline', verticalAlign: 'middle' }} />)</strong> no canto superior direito do navegador.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <div style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>
                3
              </div>
              <div style={{ fontSize: '0.9rem' }}>
                Selecione a opção <strong>"Adicionar à Tela inicial"</strong> ou <strong>"Instalar aplicativo"</strong>.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <div style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>
                4
              </div>
              <div style={{ fontSize: '0.9rem' }}>
                Confirme em <strong>"Instalar"</strong>. O ícone do FinControl surgirá entre seus apps!
              </div>
            </div>
          </div>
        )}

        {/* Steps for iOS */}
        {activeTab === 'ios' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <div style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>
                1
              </div>
              <div style={{ fontSize: '0.9rem' }}>
                Abra este site utilizando o navegador <strong>Safari</strong> no seu iPhone ou iPad.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <div style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>
                2
              </div>
              <div style={{ fontSize: '0.9rem' }}>
                Toque no botão <strong>Compartilhar (<Share size={16} style={{ display: 'inline', verticalAlign: 'middle' }} />)</strong> na barra inferior do Safari.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <div style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>
                3
              </div>
              <div style={{ fontSize: '0.9rem' }}>
                Role as opções para baixo e toque em <strong>"Adicionar à Tela de Início" (<PlusSquare size={16} style={{ display: 'inline', verticalAlign: 'middle' }} />)</strong>.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <div style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>
                4
              </div>
              <div style={{ fontSize: '0.9rem' }}>
                Toque em <strong>"Adicionar"</strong> no canto superior direito. Pronto!
              </div>
            </div>
          </div>
        )}

        <div style={{ marginTop: '1.75rem', textAlign: 'right' }}>
          <button className="btn btn-primary" onClick={onClose}>
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
}
