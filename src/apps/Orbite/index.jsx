import { useState } from 'react'
import { useOrbite } from './hooks/useOrbite'
import DashboardScreen from './screens/DashboardScreen'
import LogScreen from './screens/LogScreen'
import HistoryScreen from './screens/HistoryScreen'
import SettingsScreen from './screens/SettingsScreen'

const NAV = [
  { id: 'dashboard', emoji: '🛰️', label: 'Mission' },
  { id: 'log', emoji: '➕', label: 'Logger' },
  { id: 'history', emoji: '📡', label: 'Historique' },
  { id: 'settings', emoji: '⚙️', label: 'Réglages' },
]

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Inter:wght@400;500;600&display=swap');

  .orbite-app {
    min-height: 100vh;
    background: #080c14;
    color: #e8eaf0;
    font-family: 'Inter', sans-serif;
    position: relative;
    overflow-x: hidden;
  }

  .orbite-app::before {
    content: '';
    position: fixed;
    inset: 0;
    background:
      radial-gradient(ellipse at 20% 20%, rgba(255,120,30,0.06) 0%, transparent 60%),
      radial-gradient(ellipse at 80% 80%, rgba(30,80,200,0.08) 0%, transparent 60%);
    pointer-events: none;
    z-index: 0;
  }

  /* Stars */
  .orbite-stars {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    overflow: hidden;
  }
  .orbite-star {
    position: absolute;
    border-radius: 50%;
    background: white;
    animation: orbite-twinkle var(--dur, 3s) ease-in-out infinite var(--delay, 0s);
  }
  @keyframes orbite-twinkle {
    0%, 100% { opacity: 0.2; transform: scale(1); }
    50% { opacity: 0.8; transform: scale(1.3); }
  }

  /* Layout */
  .orbite-content {
    position: relative;
    z-index: 1;
    padding-bottom: 80px;
  }

  /* Nav */
  .orbite-nav {
    position: fixed;
    bottom: 0;
    left: 0; right: 0;
    z-index: 100;
    background: rgba(10,14,24,0.95);
    border-top: 1px solid rgba(255,255,255,0.07);
    display: flex;
    padding: 8px 0 env(safe-area-inset-bottom, 8px);
    backdrop-filter: blur(20px);
  }
  .orbite-nav-btn {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 6px 4px;
    background: none;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
  }
  .orbite-nav-btn-emoji {
    font-size: 20px;
    transition: transform 0.2s;
  }
  .orbite-nav-btn--active .orbite-nav-btn-emoji {
    transform: scale(1.15);
  }
  .orbite-nav-btn-label {
    font-size: 10px;
    font-family: 'Orbitron', monospace;
    font-weight: 700;
    letter-spacing: 0.05em;
    color: rgba(255,255,255,0.3);
    transition: color 0.2s;
  }
  .orbite-nav-btn--active .orbite-nav-btn-label {
    color: #ff7a1e;
  }

  /* ─── DASHBOARD ─── */
  .orbite-dashboard {
    padding: 20px 16px 100px;
    max-width: 480px;
    margin: 0 auto;
  }

  .orbite-week-label {
    font-family: 'Orbitron', monospace;
    font-size: 10px;
    letter-spacing: 0.15em;
    color: rgba(255,255,255,0.3);
    text-transform: uppercase;
    text-align: center;
    padding: 16px 0 8px;
  }

  .orbite-encourage {
    background: linear-gradient(135deg, rgba(255,122,30,0.12), rgba(255,60,0,0.06));
    border: 1px solid rgba(255,122,30,0.25);
    border-radius: 12px;
    padding: 12px 14px;
    font-size: 13px;
    color: #ffb380;
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
  }
  .orbite-encourage-icon { font-size: 16px; flex-shrink: 0; }

  .orbite-section {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 16px;
    padding: 16px;
    margin-bottom: 14px;
  }
  .orbite-section-title {
    font-family: 'Orbitron', monospace;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.18em;
    color: rgba(255,255,255,0.25);
    margin-bottom: 14px;
  }

  /* Face à face */
  .orbite-face2face { display: flex; flex-direction: column; gap: 12px; }
  .orbite-pbar { display: flex; flex-direction: column; gap: 8px; }
  .orbite-pbar-header { display: flex; align-items: center; gap: 10px; }
  .orbite-pbar-avatar { font-size: 22px; }
  .orbite-pbar-info { flex: 1; display: flex; flex-direction: column; }
  .orbite-pbar-name { font-size: 14px; font-weight: 600; color: #e8eaf0; }
  .orbite-pbar-streak { font-size: 11px; color: rgba(255,255,255,0.4); }
  .orbite-pbar-props {
    font-family: 'Orbitron', monospace;
    font-size: 16px;
    font-weight: 700;
    color: #ff7a1e;
  }
  .orbite-pbar-props small { font-size: 10px; font-weight: 400; color: rgba(255,122,30,0.6); }
  .orbite-pbar-track {
    height: 6px;
    background: rgba(255,255,255,0.07);
    border-radius: 99px;
    overflow: hidden;
  }
  .orbite-pbar--me .orbite-pbar-fill {
    height: 100%;
    background: linear-gradient(90deg, #ff7a1e, #ffb34d);
    border-radius: 99px;
    transition: width 0.6s cubic-bezier(.16,1,.3,1);
  }
  .orbite-pbar--other .orbite-pbar-fill {
    height: 100%;
    background: linear-gradient(90deg, #4a8cff, #8ab4ff);
    border-radius: 99px;
    transition: width 0.6s cubic-bezier(.16,1,.3,1);
  }
  .orbite-total {
    margin-top: 12px;
    text-align: center;
    font-size: 12px;
    color: rgba(255,255,255,0.4);
  }
  .orbite-total strong { color: rgba(255,255,255,0.7); }

  /* Rocket */
  .orbite-rocket-container { padding: 4px 0; }
  .orbite-rocket-label {
    font-family: 'Orbitron', monospace;
    font-size: 12px;
    font-weight: 700;
    color: #ff7a1e;
    text-align: center;
    margin-bottom: 16px;
    letter-spacing: 0.1em;
  }
  .orbite-rocket-bar-wrap {
    position: relative;
    height: 28px;
    display: flex;
    align-items: center;
    margin-bottom: 6px;
  }
  .orbite-rocket-bar-bg {
    width: 100%;
    height: 8px;
    background: rgba(255,255,255,0.07);
    border-radius: 99px;
    overflow: hidden;
  }
  .orbite-rocket-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #ff4500, #ff7a1e, #ffb34d);
    border-radius: 99px;
    transition: width 0.8s cubic-bezier(.16,1,.3,1);
    box-shadow: 0 0 10px rgba(255,122,30,0.5);
  }
  .orbite-rocket-icon {
    position: absolute;
    font-size: 22px;
    top: 50%;
    transform: translateY(-50%);
    transition: left 0.8s cubic-bezier(.16,1,.3,1);
    filter: drop-shadow(0 0 6px rgba(255,122,30,0.8));
  }
  .orbite-rocket-launched {
    animation: orbite-launch 0.6s ease-out forwards;
  }
  @keyframes orbite-launch {
    0% { transform: translateY(-50%) rotate(0deg); }
    100% { transform: translateY(-120px) rotate(-45deg) scale(1.5); opacity: 0; }
  }
  .orbite-rocket-targets {
    display: flex;
    justify-content: space-between;
    font-size: 10px;
    color: rgba(255,255,255,0.25);
    font-family: 'Orbitron', monospace;
  }

  /* Activités récentes */
  .orbite-activity-list { display: flex; flex-direction: column; gap: 8px; }
  .orbite-activity-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    background: rgba(255,255,255,0.03);
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.05);
  }
  .orbite-activity-emoji { font-size: 18px; flex-shrink: 0; }
  .orbite-activity-body { flex: 1; display: flex; flex-direction: column; }
  .orbite-activity-who { font-size: 12px; color: rgba(255,255,255,0.5); }
  .orbite-activity-desc { font-size: 13px; color: #e8eaf0; }
  .orbite-activity-props {
    font-family: 'Orbitron', monospace;
    font-size: 13px;
    font-weight: 700;
    color: #ff7a1e;
  }
  .orbite-activity-props small { font-size: 10px; }

  .orbite-empty {
    text-align: center;
    color: rgba(255,255,255,0.3);
    font-size: 13px;
    line-height: 1.6;
    padding: 20px 0;
  }

  .orbite-fab {
    position: fixed;
    bottom: 76px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #ff7a1e, #ff4500);
    color: white;
    font-family: 'Orbitron', monospace;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    border: none;
    border-radius: 99px;
    padding: 12px 24px;
    cursor: pointer;
    box-shadow: 0 4px 20px rgba(255,122,30,0.4);
    transition: all 0.2s;
    z-index: 90;
    white-space: nowrap;
  }
  .orbite-fab:active { transform: translateX(-50%) scale(0.96); }

  /* ─── LOG SCREEN ─── */
  .orbite-log {
    padding: 20px 16px 100px;
    max-width: 480px;
    margin: 0 auto;
  }
  .orbite-log-title {
    font-family: 'Orbitron', monospace;
    font-size: 18px;
    font-weight: 700;
    color: #e8eaf0;
    margin: 16px 0 24px;
  }
  .orbite-type-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }
  .orbite-type-btn {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 16px;
    padding: 20px 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .orbite-type-btn:active {
    background: rgba(255,122,30,0.12);
    border-color: rgba(255,122,30,0.4);
    transform: scale(0.97);
  }
  .orbite-type-emoji { font-size: 32px; }
  .orbite-type-label {
    font-family: 'Orbitron', monospace;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.1em;
    color: rgba(255,255,255,0.6);
  }

  .orbite-log-section { margin-bottom: 20px; }
  .orbite-log-label {
    font-size: 12px;
    font-family: 'Orbitron', monospace;
    letter-spacing: 0.1em;
    color: rgba(255,255,255,0.35);
    margin-bottom: 10px;
  }
  .orbite-unit-grid { display: flex; gap: 10px; }
  .orbite-unit-btn {
    flex: 1;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 10px;
    padding: 12px;
    color: rgba(255,255,255,0.6);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  .orbite-unit-btn--active {
    background: rgba(255,122,30,0.15);
    border-color: #ff7a1e;
    color: #ff7a1e;
  }

  .orbite-value-wrap {
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 12px;
    padding: 4px 16px;
  }
  .orbite-value-input {
    flex: 1;
    background: none;
    border: none;
    outline: none;
    font-family: 'Orbitron', monospace;
    font-size: 28px;
    font-weight: 700;
    color: #e8eaf0;
    padding: 12px 0;
    width: 100%;
  }
  .orbite-value-input::placeholder { color: rgba(255,255,255,0.15); }
  .orbite-value-unit {
    font-size: 14px;
    color: rgba(255,255,255,0.4);
    font-weight: 500;
    flex-shrink: 0;
  }

  .orbite-preview {
    background: linear-gradient(135deg, rgba(255,122,30,0.12), rgba(255,60,0,0.06));
    border: 1px solid rgba(255,122,30,0.25);
    border-radius: 12px;
    padding: 14px 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  .orbite-preview-label { font-size: 13px; color: rgba(255,255,255,0.5); }
  .orbite-preview-value {
    font-family: 'Orbitron', monospace;
    font-size: 20px;
    font-weight: 700;
    color: #ff7a1e;
  }

  /* Success */
  .orbite-log-success {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    text-align: center;
    gap: 8px;
  }
  .orbite-log-success-rocket {
    font-size: 64px;
    animation: orbite-bounce 0.6s ease-out;
  }
  @keyframes orbite-bounce {
    0% { transform: translateY(20px) scale(0.8); opacity: 0; }
    60% { transform: translateY(-10px) scale(1.1); }
    100% { transform: translateY(0) scale(1); opacity: 1; }
  }
  .orbite-log-success-props {
    font-family: 'Orbitron', monospace;
    font-size: 48px;
    font-weight: 900;
    color: #ff7a1e;
    text-shadow: 0 0 30px rgba(255,122,30,0.5);
    margin: 8px 0;
  }
  .orbite-log-success-label {
    font-family: 'Orbitron', monospace;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.15em;
    color: rgba(255,255,255,0.7);
  }
  .orbite-log-success-sub { font-size: 13px; color: rgba(255,255,255,0.35); margin-bottom: 32px; }
  .orbite-log-success-actions { display: flex; flex-direction: column; gap: 10px; width: 100%; max-width: 280px; }

  /* Buttons */
  .orbite-btn {
    border: none;
    border-radius: 12px;
    padding: 14px 20px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  .orbite-btn--full { width: 100%; }
  .orbite-btn--primary {
    background: linear-gradient(135deg, #ff7a1e, #ff4500);
    color: white;
    box-shadow: 0 4px 16px rgba(255,122,30,0.3);
  }
  .orbite-btn--primary:disabled { opacity: 0.4; cursor: not-allowed; }
  .orbite-btn--primary:not(:disabled):active { transform: scale(0.97); }
  .orbite-btn--ghost {
    background: rgba(255,255,255,0.06);
    color: rgba(255,255,255,0.6);
    border: 1px solid rgba(255,255,255,0.1);
  }
  .orbite-btn--saved { background: rgba(80,200,80,0.2); color: #80e080; border: 1px solid rgba(80,200,80,0.3); }

  .orbite-back {
    background: none;
    border: none;
    color: rgba(255,255,255,0.4);
    font-size: 13px;
    cursor: pointer;
    padding: 0;
    margin-bottom: 8px;
  }

  /* ─── HISTORY ─── */
  .orbite-history {
    padding: 20px 16px 100px;
    max-width: 480px;
    margin: 0 auto;
  }
  .orbite-history-title {
    font-family: 'Orbitron', monospace;
    font-size: 16px;
    font-weight: 700;
    color: #e8eaf0;
    margin: 16px 0 20px;
  }
  .orbite-week-list { display: flex; flex-direction: column; gap: 12px; }
  .orbite-week-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 14px;
    padding: 14px;
  }
  .orbite-week-card--launched {
    border-color: rgba(255,122,30,0.3);
    background: rgba(255,122,30,0.05);
  }
  .orbite-week-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }
  .orbite-week-card-date {
    font-size: 12px;
    color: rgba(255,255,255,0.4);
    font-family: 'Orbitron', monospace;
    font-size: 10px;
    letter-spacing: 0.1em;
  }
  .orbite-week-badge {
    font-family: 'Orbitron', monospace;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.1em;
    color: #ff7a1e;
    background: rgba(255,122,30,0.15);
    border-radius: 99px;
    padding: 3px 8px;
  }
  .orbite-week-profiles { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
  .orbite-week-profile {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    color: rgba(255,255,255,0.5);
  }
  .orbite-week-profile--winner { color: #e8eaf0; font-weight: 600; }
  .orbite-week-profile-props { font-family: 'Orbitron', monospace; font-size: 12px; }
  .orbite-week-footer { display: flex; flex-direction: column; gap: 6px; }
  .orbite-week-total { font-size: 11px; color: rgba(255,255,255,0.3); }
  .orbite-week-mini-bar {
    height: 3px;
    background: rgba(255,255,255,0.06);
    border-radius: 99px;
    overflow: hidden;
  }
  .orbite-week-mini-fill {
    height: 100%;
    background: linear-gradient(90deg, #ff4500, #ff7a1e);
    border-radius: 99px;
  }

  /* ─── SETTINGS ─── */
  .orbite-settings {
    padding: 20px 16px 100px;
    max-width: 480px;
    margin: 0 auto;
  }
  .orbite-settings-title {
    font-family: 'Orbitron', monospace;
    font-size: 16px;
    font-weight: 700;
    color: #e8eaf0;
    margin: 16px 0 20px;
  }
  .orbite-settings-section {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 14px;
    padding: 14px;
    margin-bottom: 12px;
  }
  .orbite-settings-section-title {
    font-size: 12px;
    font-weight: 700;
    color: rgba(255,255,255,0.5);
    margin-bottom: 12px;
  }
  .orbite-setting-field {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 8px 0;
    border-bottom: 1px solid rgba(255,255,255,0.04);
  }
  .orbite-setting-field:last-child { border-bottom: none; }
  .orbite-setting-field-info { flex: 1; display: flex; flex-direction: column; }
  .orbite-setting-field-label { font-size: 13px; color: #e8eaf0; }
  .orbite-setting-field-hint { font-size: 11px; color: rgba(255,255,255,0.3); margin-top: 2px; }
  .orbite-setting-input {
    width: 80px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px;
    padding: 8px 10px;
    color: #ff7a1e;
    font-family: 'Orbitron', monospace;
    font-size: 14px;
    font-weight: 700;
    text-align: right;
    outline: none;
    flex-shrink: 0;
  }
  .orbite-setting-input:focus { border-color: rgba(255,122,30,0.5); }

  .orbite-settings-preview {
    background: rgba(255,122,30,0.05);
    border: 1px solid rgba(255,122,30,0.15);
    border-radius: 12px;
    padding: 14px;
    margin-bottom: 20px;
  }
  .orbite-settings-preview-title {
    font-size: 11px;
    color: rgba(255,122,30,0.6);
    font-family: 'Orbitron', monospace;
    letter-spacing: 0.1em;
    margin-bottom: 10px;
  }
  .orbite-settings-preview-list {
    display: flex;
    flex-direction: column;
    gap: 5px;
    font-size: 12px;
    color: rgba(255,255,255,0.45);
  }
`

// Stars background component
function Stars() {
  const stars = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 0.5,
    dur: (Math.random() * 3 + 2).toFixed(1),
    delay: (Math.random() * 4).toFixed(1),
  }))
  return (
    <div className="orbite-stars">
      {stars.map(s => (
        <div
          key={s.id}
          className="orbite-star"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            '--dur': `${s.dur}s`,
            '--delay': `${s.delay}s`,
          }}
        />
      ))}
    </div>
  )
}

export default function Orbite({ profile }) {
  const [screen, setScreen] = useState('dashboard')
  const hook = useOrbite(profile)

  return (
    <>
      <style>{CSS}</style>
      <div className="orbite-app">
        <Stars />
        <div className="orbite-content">
          {screen === 'dashboard' && (
            <DashboardScreen
              profile={profile}
              hook={hook}
              onLog={() => setScreen('log')}
            />
          )}
          {screen === 'log' && (
            <LogScreen
              profile={profile}
              hook={hook}
              onBack={() => setScreen('dashboard')}
            />
          )}
          {screen === 'history' && (
            <HistoryScreen profile={profile} hook={hook} />
          )}
          {screen === 'settings' && (
            <SettingsScreen profile={profile} hook={hook} />
          )}
        </div>

        <nav className="orbite-nav">
          {NAV.map(n => (
            <button
              key={n.id}
              className={`orbite-nav-btn ${screen === n.id ? 'orbite-nav-btn--active' : ''}`}
              onClick={() => setScreen(n.id)}
            >
              <span className="orbite-nav-btn-emoji">{n.emoji}</span>
              <span className="orbite-nav-btn-label">{n.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </>
  )
}
