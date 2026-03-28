import { useApp } from '../contexts/AppContext';
import './Notifications.css';

export default function Notifications() {
  const { notifications, removeNotification } = useApp();

  return (
    <div className="notifications-container">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`notification notification-${notification.type}`}
          onClick={() => removeNotification(notification.id)}
        >
          <div className="notification-icon">
            {notification.type === 'success' && '✓'}
            {notification.type === 'error' && '✕'}
            {notification.type === 'warning' && '⚠'}
            {notification.type === 'info' && 'ℹ'}
          </div>
          <div className="notification-message">
            {notification.message}
          </div>
          <button 
            className="notification-close"
            onClick={(e) => {
              e.stopPropagation();
              removeNotification(notification.id);
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
