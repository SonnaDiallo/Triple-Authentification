import { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export function useApp() {
  return useContext(AppContext);
}

export function AppProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [theme, setTheme] = useState('dark');
  const [soundEnabled, setSoundEnabled] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    const savedSound = localStorage.getItem('soundEnabled') === 'true';
    
    setTheme(savedTheme);
    setSoundEnabled(savedSound);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const addNotification = (message, type = 'info', duration = 4000) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    if (soundEnabled) playNotificationSound(type);
    setTimeout(() => removeNotification(id), duration);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const playNotificationSound = (type) => {
    try {
      const audio = new Audio();
      switch(type) {
        case 'success':
          audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE';
          break;
        case 'error':
          audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE';
          break;
        default:
          audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE';
      }
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch {
      // pas grave si le son ne marche pas
    }
  };

  const value = {
    notifications,
    addNotification,
    removeNotification,
    theme,
    toggleTheme,
    soundEnabled,
    setSoundEnabled,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}
