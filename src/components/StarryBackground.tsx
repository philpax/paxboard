import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  radius: number;
  phase: number;
  speed: number;
}

interface ShootingStar {
  x: number;
  y: number;
  angle: number;
  speed: number;
  tailLength: number;
  life: number;
  maxLife: number;
}

export function StarryBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let nextShootingStarTime = performance.now() + 2000 + Math.random() * 3000;

    // Generate stars once
    const stars: Star[] = Array.from({ length: 200 }, () => ({
      x: Math.random(),
      y: Math.random(),
      radius: 0.5 + Math.random() * 2,
      phase: Math.random() * Math.PI * 2,
      speed: 0.5 + Math.random() * 1.5,
    }));

    const shootingStars: ShootingStar[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = (time: number) => {
      const { width, height } = canvas;

      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, "#4a3368");
      grad.addColorStop(1, "#1a0e2e");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Stars
      const t = time / 1000;
      for (const star of stars) {
        const alpha =
          0.4 + 0.6 * ((Math.sin(t * star.speed + star.phase) + 1) / 2);
        ctx.beginPath();
        ctx.arc(star.x * width, star.y * height, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.fill();
      }

      // Spawn shooting stars
      if (time >= nextShootingStarTime) {
        const angle = ((30 + Math.random() * 30) * Math.PI) / 180;
        shootingStars.push({
          x: Math.random() * width * 0.8,
          y: Math.random() * height * 0.4,
          angle,
          speed: 400 + Math.random() * 300,
          tailLength: 80 + Math.random() * 60,
          life: 0,
          maxLife: 1 + Math.random() * 0.5,
        });
        nextShootingStarTime = time + 3000 + Math.random() * 5000;
      }

      // Draw shooting stars
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const ss = shootingStars[i];
        ss.life += 1 / 60;
        const progress = ss.life / ss.maxLife;

        if (progress >= 1) {
          shootingStars.splice(i, 1);
          continue;
        }

        const dx = Math.cos(ss.angle) * ss.speed * ss.life;
        const dy = Math.sin(ss.angle) * ss.speed * ss.life;
        const headX = ss.x + dx;
        const headY = ss.y + dy;
        const tailX = headX - Math.cos(ss.angle) * ss.tailLength;
        const tailY = headY - Math.sin(ss.angle) * ss.tailLength;

        const fade =
          progress < 0.3 ? progress / 0.3 : 1 - (progress - 0.3) / 0.7;
        const gradient = ctx.createLinearGradient(tailX, tailY, headX, headY);
        gradient.addColorStop(0, `rgba(255,255,255,0)`);
        gradient.addColorStop(1, `rgba(255,255,255,${fade})`);

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(headX, headY);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      animationId = requestAnimationFrame(draw);
    };

    animationId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas ref={canvasRef} className="fixed inset-0" style={{ zIndex: -1 }} />
  );
}
