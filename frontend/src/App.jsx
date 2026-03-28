import { useState, useEffect } from 'react';
import { logout } from './api';
import Login from './components/Login';
import Inscription from './components/Inscription';
import Dashboard from './components/Dashboard';
import LandingPage from './components/LandingPage';
import LogsViewer from './components/LogsViewer';
import './App.css';

// Gère le routing principal et l'état de l'app
// Les vues possibles : landing, login, inscription, dashboard, logs
export default function App() {
  // Quelle page on affiche ?
  const [vue, setVue] = useState('landing');
  
  // Où on en est dans la connexion (1, 2 ou 3)
  const [etape, setEtape] = useState(1);
  
  // L'utilisateur connecté ou null
  const [userConnecte, setUserConnecte] = useState(null);

  // Gère le hash routing pour les logs (#logs)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1); // Enlever le #
      
      // Si on demande les logs, vérifier si c'est un admin
      if (hash === 'logs') {
        const userRole = sessionStorage.getItem('userRole') || 'user';
        console.log('Vérification accès logs - Rôle:', userRole);
        if (userRole === 'admin') {
          setVue('logs');
        } else {
          // Rediriger vers login si non admin
          setVue('login');
          alert('Accès aux logs réservé aux administrateurs');
          window.location.hash = '';
        }
      } else if (hash === 'login') {
        setVue('login');
      } else if (hash === 'inscription') {
        setVue('inscription');
      } else {
        setVue('landing');
      }
    };

    // Vérifier au chargement
    handleHashChange();

    // Écouter les changements
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Vérifie périodiquement l'accès aux logs après connexion admin
  useEffect(() => {
    const checkLogsAccess = () => {
      if (window.location.hash === '#logs') {
        const userRole = sessionStorage.getItem('userRole') || 'user';
        console.log('Re-vérification accès logs - Rôle:', userRole);
        if (userRole === 'admin') {
          setVue('logs');
        } else {
          setVue('login');
          window.location.hash = '';
        }
      }
    };

    // Vérifier toutes les 500ms pendant 5 secondes après connexion admin
    const interval = setInterval(checkLogsAccess, 500);
    const timeout = setTimeout(() => clearInterval(interval), 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  // Déconnecte l'utilisateur et nettoie tout
  const gererLogout = async () => {
    try {
      // Appelle le backend pour invalider la session
      await logout();
    } catch {
      // Si erreur réseau, on fait quand même le logout local
    }
    setUserConnecte(null);
    setEtape(1);
    setVue('landing'); // Retour à la page d'accueil
    window.location.hash = ''; // Nettoyer le hash
  };

  return (
    <>
      {/* Routing conditionnel selon l'état */}
      {userConnecte ? (
        // Connecté -> dashboard
        <Dashboard user={userConnecte} onLogout={gererLogout} />
      ) : vue === 'logs' ? (
        // Page de gestion des logs
        <LogsViewer onRetour={() => setVue('landing')} />
      ) : vue === 'landing' ? (
        // Page d'accueil avec les animations
        <LandingPage 
          onLogin={() => setVue('login')} 
          onRegister={() => setVue('inscription')} 
        />
      ) : vue === 'inscription' ? (
        // Formulaire pour créer un compte
        <Inscription onRetour={() => setVue('landing')} />
      ) : (
        // Par défaut : formulaire de connexion en 3 étapes
        <Login
          etape={etape}
          setEtape={setEtape}
          onInscription={() => setVue('inscription')}
          onSucces={u => setUserConnecte(u)}
          onRetour={() => setVue('landing')}
        />
      )}
    </>
  );
}