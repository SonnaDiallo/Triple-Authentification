import { useEffect, useRef, useState } from 'react';
import './LandingPage.css';

const TERMINAL_LINES = [
  '> Initialisation du protocole de sécurité...',
  '> Chargement des modules de chiffrement...',
  '> Connexion au serveur sécurisé... OK',
  '> Triple authentification activée.',
  '> Système prêt.',
];

function TerminalIntro({ onDone }) {
  const [lines, setLines]   = useState([]);
  const [done, setDone]     = useState(false);

  useEffect(() => {
    let i = 0;
    const next = () => {
      if (i >= TERMINAL_LINES.length) {
        setTimeout(() => setDone(true), 600);
        return;
      }
      setLines(prev => [...prev, TERMINAL_LINES[i]]);
      i++;
      setTimeout(next, 480);
    };
    setTimeout(next, 300);
  }, []);

  return (
    <div className={`terminal-overlay ${done ? 'terminal-fade' : ''}`}
         onAnimationEnd={() => onDone()}>
      <div className="terminal-window">
        <div className="terminal-bar">
          <span className="t-dot red" />
          <span className="t-dot yellow" />
          <span className="t-dot green" />
          <span className="t-title">secure_auth.sh</span>
        </div>
        <div className="terminal-body">
          {lines.map((l, i) => (
            <p key={i} className="t-line" style={{ animationDelay: `${i * 0.05}s` }}>{l}</p>
          ))}
          <span className="t-cursor" />
        </div>
      </div>
    </div>
  );
}

function GridBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    let raf;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const dots = Array.from({ length: 80 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      dots.forEach(d => {
        d.x += d.vx;
        d.y += d.vy;
        if (d.x < 0 || d.x > canvas.width)  d.vx *= -1;
        if (d.y < 0 || d.y > canvas.height) d.vy *= -1;

        ctx.beginPath();
        ctx.arc(d.x, d.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 200, 150, 0.5)';
        ctx.fill();
      });

      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx   = dots[i].x - dots[j].x;
          const dy   = dots[i].y - dots[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(dots[i].x, dots[i].y);
            ctx.lineTo(dots[j].x, dots[j].y);
            ctx.strokeStyle = `rgba(0, 200, 150, ${0.15 * (1 - dist / 120)})`;
            ctx.lineWidth   = 0.5;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="grid-canvas" />;
}

const FEATURES = [
  { icon: '', titre: 'Mot de passe',     desc: 'Haché avec bcrypt, jamais stocké en clair.' },
  { icon: '', titre: 'Question secrète', desc: 'Une réponse personnelle connue de vous seul.' },
  { icon: '', titre: 'Code OTP email',   desc: 'Un code à 6 chiffres valable 5 minutes.' },
];

export default function LandingPage({ onLogin, onRegister }) {
  const [introDone, setIntroDone] = useState(false);

  const [visible,   setVisible]   = useState(false);

  const handleIntroDone = () => {
    setIntroDone(true);
    setTimeout(() => setVisible(true), 100);
  };

  return (
    <>
      {!introDone && <TerminalIntro onDone={handleIntroDone} />}

      <div className={`landing ${visible ? 'landing-visible' : ''}`}>
        <GridBackground />

        <nav className="landing-nav">
          <div className="landing-logo">
            <span className="logo-bracket">[</span>
            TRIPLEAUTH
            <span className="logo-bracket">]</span>
          </div>
          <div className="nav-actions">
            <button className="btn-ghost" onClick={onLogin}>Connexion</button>
            <button className="btn-accent" onClick={onRegister}>S'inscrire</button>
          </div>
        </nav>

        <section className="hero">
          <div className="hero-badge">SYSTÈME SÉCURISÉ</div>
          <h1 className="hero-title">
            Authentification<br />
            <span className="hero-accent">en trois couches</span>
          </h1>
          <p className="hero-sub">
            Protégez vos accès avec un système de triple vérification :<br />
            mot de passe, question secrète et code OTP par email.
          </p>
          <div className="hero-btns">
            <button className="btn-primary-lg" onClick={onRegister}>
              Créer un compte
              <span className="btn-arrow">→</span>
            </button>
            <button className="btn-outline-lg" onClick={onLogin}>
              Se connecter
            </button>
          </div>
        </section>

        <section className="features">
          {FEATURES.map((f, i) => (
            <div key={i} className="feature-card" style={{ animationDelay: `${0.2 + i * 0.15}s` }}>
              <div className="feature-icon">{f.icon}</div>
              <div className="feature-step">Étape {i + 1}</div>
              <h3 className="feature-titre">{f.titre}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </section>

        <footer className="landing-footer">
          <span>Triple Auth - Système de démonstration</span>
        </footer>
      </div>
    </>
  );
}
