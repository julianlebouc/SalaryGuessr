import React, { useEffect, useRef } from 'react';
import './TwilightBackground.css';

/**
 * TwilightBackground component creates an animated starfield and particle effect using HTML5 Canvas.
 * It provides a deep, immersive "midnight" atmosphere.
 */
const TwilightBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let w, h;
    const stars = [];
    const particles = [];
    const starCount = 150;
    const particleCount = 40;

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resize);
    resize();

    // Initialize Stars
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        size: Math.random() * 1.5,
        opacity: Math.random(),
        speed: Math.random() * 0.05,
        twinkleSpeed: Math.random() * 0.02 + 0.005
      });
    }

    // Initialize Particles (larger, glowing blobs)
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        radius: Math.random() * 2 + 1,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        hue: 260 + Math.random() * 40, // Purple range
        opacity: Math.random() * 0.5 + 0.1
      });
    }

    const draw = () => {
      // Clear with a very slight gradient or solid dark
      ctx.clearRect(0, 0, w, h);
      
      // Draw Stars
      stars.forEach(star => {
        star.opacity += star.twinkleSpeed;
        if (star.opacity > 1 || star.opacity < 0) {
          star.twinkleSpeed = -star.twinkleSpeed;
        }
        
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        
        star.y -= star.speed;
        if (star.y < 0) star.y = h;
      });

      // Draw Particles
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;

        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 4);
        gradient.addColorStop(0, `hsla(${p.hue}, 80%, 70%, ${p.opacity})`);
        gradient.addColorStop(1, `hsla(${p.hue}, 80%, 70%, 0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 4, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="twilight-container">
      <canvas ref={canvasRef} className="twilight-canvas" />
      <div className="twilight-overlay"></div>
    </div>
  );
};

export default TwilightBackground;
