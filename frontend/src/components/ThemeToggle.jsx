import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import './ThemeToggle.css';

export default function ThemeToggle() {
  const { theme, toggleTheme, soundEnabled, setSoundEnabled } = useApp();

  return (
    <div className="theme-toggle-container">
      <button
        className="theme-toggle-btn"
        onClick={toggleTheme}
        title={`Passer en mode ${theme === 'dark' ? 'clair' : 'sombre'}`}
      >
        {theme === 'dark' ? '🌙' : '☀️'}
        <span className="theme-label">
          {theme === 'dark' ? 'Sombre' : 'Clair'}
        </span>
      </button>
      
      <button
        className={`sound-toggle-btn ${soundEnabled ? 'enabled' : ''}`}
        onClick={() => setSoundEnabled(!soundEnabled)}
        title={soundEnabled ? 'Désactiver les sons' : 'Activer les sons'}
      >
        {soundEnabled ? '🔊' : '🔇'}
        <span className="sound-label">
          {soundEnabled ? 'Son activé' : 'Son désactivé'}
        </span>
      </button>
    </div>
  );
}
