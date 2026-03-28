import SuccesMessage from './SuccesMessage';
import SecurityDashboard from './SecurityDashboard';

export default function Dashboard({ user, onLogout }) {
  // Si l'utilisateur est admin, montrer le dashboard de sécurité
  const userRole = sessionStorage.getItem('userRole') || 'user';
  
  if (userRole === 'admin') {
    return <SecurityDashboard user={user} onLogout={onLogout} />;
  }
  
  // Sinon, montrer le message de succès normal
  return <SuccesMessage user={user} onLogout={onLogout} />;
}
