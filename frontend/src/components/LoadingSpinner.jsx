import { useEffect, useRef } from 'react';
import './LoadingSpinner.css';

export default function LoadingSpinner({ text = 'Chargement...' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationId;

    // Configuration du canvas
    const resize = () => {
      canvas.width = 200;
      canvas.height = 200;
    };
    resize();

    // Particules pour l'animation
    const particles = Array.from({ length: 12 }, (_, i) => ({
      angle: (i * Math.PI * 2) / 12,
      radius: 30,
      size: 3,
      speed: 0.02 + Math.random() * 0.01,
      opacity: 0.3 + Math.random() * 0.7,
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Centre du cercle
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Dessiner les particules
      particles.forEach((particle, index) => {
        particle.angle += particle.speed;
        
        const x = centerX + Math.cos(particle.angle) * particle.radius;
        const y = centerY + Math.sin(particle.angle) * particle.radius;

        // Opacité pulsante
        const pulseOpacity = particle.opacity * (0.5 + 0.5 * Math.sin(particle.angle * 3));

        ctx.beginPath();
        ctx.arc(x, y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 200, 150, ${pulseOpacity})`;
        ctx.fill();

        // Lignes entre particules proches
        particles.forEach((other, otherIndex) => {
          if (index !== otherIndex) {
            const distance = Math.abs(particle.angle - other.angle);
            if (distance < 0.5 || distance > Math.PI * 2 - 0.5) {
              const otherX = centerX + Math.cos(other.angle) * other.radius;
              const otherY = centerY + Math.sin(other.angle) * other.radius;

              ctx.beginPath();
              ctx.moveTo(x, y);
              ctx.lineTo(otherX, otherY);
              ctx.strokeStyle = `rgba(0, 200, 150, ${pulseOpacity * 0.3})`;
              ctx.lineWidth = 1;
              ctx.stroke();
            }
          }
        });
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

  return (
    <div className="loading-spinner">
      <canvas 
        ref={canvasRef} 
        className="loading-canvas"
        width={200}
        height={200}
      />
      <div className="loading-text">{text}</div>
    </div>
  );
}
