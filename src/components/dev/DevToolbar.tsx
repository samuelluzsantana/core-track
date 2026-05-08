/**
 * DevToolbar — Floating debug toolbar for development environment.
 * 
 * Shows environment info, allows scenario switching, and provides
 * toggles for failure simulation and mock delay.
 * Only renders when flags.devToolbar is true.
 */

import { useState } from 'react';
import { flags, ENV, serviceOverrides } from '../../config/env';
import { SeedScenario } from '../../services/mock/seeds';

interface DevToolbarProps {
  onSwitchScenario?: (scenario: SeedScenario) => void;
}

const SCENARIOS: { value: SeedScenario; label: string; emoji: string }[] = [
  { value: 'beginner', label: 'Iniciante', emoji: '🌱' },
  { value: 'intermediate', label: 'Intermediário', emoji: '💪' },
  { value: 'advanced', label: 'Avançado', emoji: '🔥' },
  { value: 'newUser', label: 'Novo Usuário', emoji: '👋' },
  { value: 'highPain', label: 'Dor Alta', emoji: '🩹' },
  { value: 'empty', label: 'Vazio', emoji: '📭' },
];

export function DevToolbar({ onSwitchScenario }: DevToolbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'scenarios' | 'flags'>('info');

  if (!flags.devToolbar) return null;

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 99999,
          width: 48,
          height: 48,
          borderRadius: '50%',
          border: '2px solid rgba(167, 139, 250, 0.5)',
          background: 'rgba(30, 20, 60, 0.9)',
          backdropFilter: 'blur(12px)',
          color: '#A78BFA',
          fontSize: 20,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(167, 139, 250, 0.3)',
          transition: 'transform 0.2s',
          transform: isOpen ? 'rotate(45deg)' : 'rotate(0)',
        }}
        title="Dev Toolbar"
      >
        🛠️
      </button>

      {/* Panel */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: 72,
            right: 16,
            zIndex: 99998,
            width: 320,
            maxHeight: '70vh',
            overflowY: 'auto',
            borderRadius: 12,
            border: '1px solid rgba(167, 139, 250, 0.3)',
            background: 'rgba(15, 10, 35, 0.95)',
            backdropFilter: 'blur(16px)',
            color: '#E2E8F0',
            fontFamily: 'monospace',
            fontSize: 12,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid rgba(167, 139, 250, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <span style={{ fontSize: 14 }}>⚙️</span>
            <span style={{ fontWeight: 'bold', color: '#A78BFA', fontSize: 13 }}>
              CoreTracker DevTools
            </span>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(167, 139, 250, 0.15)' }}>
            {(['info', 'scenarios', 'flags'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  padding: '8px 0',
                  background: activeTab === tab ? 'rgba(167, 139, 250, 0.15)' : 'transparent',
                  border: 'none',
                  borderBottom: activeTab === tab ? '2px solid #A78BFA' : '2px solid transparent',
                  color: activeTab === tab ? '#A78BFA' : '#94A3B8',
                  cursor: 'pointer',
                  fontSize: 11,
                  textTransform: 'uppercase',
                  fontFamily: 'monospace',
                }}
              >
                {tab === 'info' ? '📊 Info' : tab === 'scenarios' ? '🎭 Cenários' : '🚩 Flags'}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={{ padding: 16 }}>
            {activeTab === 'info' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <InfoRow label="Ambiente" value={ENV.toUpperCase()} color="#F59E0B" />
                <InfoRow label="Auth" value={serviceOverrides.auth} color={serviceOverrides.auth === 'mock' ? '#A78BFA' : '#22C55E'} />
                <InfoRow label="Storage" value={serviceOverrides.storage} color={serviceOverrides.storage === 'mock' ? '#A78BFA' : '#22C55E'} />
                <InfoRow label="Exercise API" value={serviceOverrides.exerciseApi} color={serviceOverrides.exerciseApi === 'mock' ? '#A78BFA' : '#22C55E'} />
                <InfoRow label="Mock Delay" value={`${flags.mockDelayMs}ms`} />
                <InfoRow label="Sim. Falhas" value={flags.simulateFailures ? `ON (${flags.failureRate * 100}%)` : 'OFF'} color={flags.simulateFailures ? '#EF4444' : '#94A3B8'} />
              </div>
            )}

            {activeTab === 'scenarios' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={{ margin: '0 0 8px', color: '#94A3B8', lineHeight: 1.4 }}>
                  Trocar cenário recarrega os dados mockados:
                </p>
                {SCENARIOS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => {
                      if (onSwitchScenario) {
                        onSwitchScenario(s.value);
                      } else {
                        localStorage.setItem('coretracker_seed_scenario', s.value);
                        localStorage.removeItem('coretracker_mock_data');
                        window.location.reload();
                      }
                    }}
                    style={{
                      padding: '8px 12px',
                      background: 'rgba(167, 139, 250, 0.1)',
                      border: '1px solid rgba(167, 139, 250, 0.2)',
                      borderRadius: 6,
                      color: '#E2E8F0',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: 'monospace',
                      fontSize: 12,
                      transition: 'background 0.2s',
                    }}
                  >
                    {s.emoji} {s.label}
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'flags' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={{ margin: '0 0 8px', color: '#94A3B8', lineHeight: 1.4 }}>
                  Feature flags (configuráveis via .env):
                </p>
                <FlagRow label="VITE_USE_MOCKS" value={flags.useMocks} />
                <FlagRow label="VITE_DEV_TOOLBAR" value={flags.devToolbar} />
                <FlagRow label="VITE_SIMULATE_FAILURES" value={flags.simulateFailures} />
                <FlagRow label="VITE_VERBOSE_LOGGING" value={flags.verboseLogging} />
                <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 6, background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)', lineHeight: 1.5 }}>
                  💡 Edite <code style={{ color: '#A78BFA' }}>.env.development</code> e reinicie o dev server para alterar flags.
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function InfoRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ color: '#94A3B8' }}>{label}</span>
      <span style={{
        color: color ?? '#E2E8F0',
        fontWeight: 'bold',
        padding: '2px 8px',
        borderRadius: 4,
        background: 'rgba(255,255,255,0.05)',
      }}>
        {value}
      </span>
    </div>
  );
}

function FlagRow({ label, value }: { label: string; value: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ color: '#94A3B8', fontSize: 11 }}>{label}</span>
      <span style={{
        color: value ? '#22C55E' : '#EF4444',
        fontWeight: 'bold',
        fontSize: 11,
      }}>
        {value ? '✅ ON' : '❌ OFF'}
      </span>
    </div>
  );
}
