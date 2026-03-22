import confetti from 'canvas-confetti';

export const confettiPresets = {
  // Celebração básica
  basic: () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#06b6d4', '#8b5cf6', '#ec4899'],
    });
  },

  // Explosão de coração (favoritar)
  heart: (x: number, y: number) => {
    confetti({
      particleCount: 30,
      spread: 360,
      origin: { x, y },
      colors: ['#ec4899', '#f43f5e', '#fb7185'],
      shapes: ['circle'],
      scalar: 1.2,
      gravity: 1.5,
      ticks: 100,
    });
  },

  // Fogo (streak)
  fire: (x: number, y: number) => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { x, y },
      colors: ['#f97316', '#fbbf24', '#ef4444'],
      startVelocity: 45,
      gravity: 0.5,
      ticks: 200,
    });
  },

  // Premium (milestone)
  premium: () => {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#8b5cf6', '#ec4899', '#06b6d4'],
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#8b5cf6', '#ec4899', '#06b6d4'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  },

  // Chuva de moedas (dinheiro)
  money: () => {
    const duration = 2000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 90,
        spread: 45,
        origin: { x: Math.random(), y: 0 },
        colors: ['#fbbf24', '#f59e0b', '#10b981'],
        shapes: ['circle'],
        scalar: 1.5,
        gravity: 1.2,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  },

  // Fireworks (conquista especial)
  fireworks: () => {
    const duration = 5000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval = window.setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#10b981', '#06b6d4', '#8b5cf6'],
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#ec4899', '#f97316', '#fbbf24'],
      });
    }, 250);
  },
};

// Hook para usar confetti
export const useConfetti = () => {
  return {
    celebrate: confettiPresets.basic,
    heart: confettiPresets.heart,
    fire: confettiPresets.fire,
    premium: confettiPresets.premium,
    money: confettiPresets.money,
    fireworks: confettiPresets.fireworks,
  };
};

