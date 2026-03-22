export type ThemeVariant = 'default' | 'neon' | 'pastel' | 'cyberpunk' | 'high-contrast';

export const themes: Record<ThemeVariant, Record<string, string>> = {
  default: {
    '--accent': '#16a34a',
    '--accent-hover': '#15803d',
    '--accent-light': '#dcfce7',
  },
  
  neon: {
    '--accent': '#00ff88',
    '--accent-hover': '#00cc6a',
    '--accent-light': '#00ff8833',
    '--glow-primary': '0 0 30px rgba(0, 255, 136, 0.8)',
    '--gradient-success': 'linear-gradient(135deg, #00ff88 0%, #00ccff 100%)',
  },
  
  pastel: {
    '--accent': '#a7f3d0',
    '--accent-hover': '#6ee7b7',
    '--accent-light': '#ecfdf5',
    '--surface': '#fef3f2',
    '--background': '#fef9f8',
    '--gradient-success': 'linear-gradient(135deg, #a7f3d0 0%, #b4d5ff 100%)',
  },
  
  cyberpunk: {
    '--accent': '#ff00ff',
    '--accent-hover': '#cc00cc',
    '--accent-light': '#ff00ff33',
    '--background': '#1a1a1a',
    '--surface': '#2a2a2a',
    '--glow-primary': '0 0 30px rgba(255, 0, 255, 0.8)',
    '--gradient-premium': 'linear-gradient(135deg, #ff00ff 0%, #00ffff 100%)',
  },
  
  'high-contrast': {
    '--accent': '#00ff00',
    '--accent-hover': '#00cc00',
    '--background': '#000000',
    '--surface': '#111111',
    '--text-primary': '#86efac', /* verde claro legível */
    '--border': '#00ff00',
    '--gradient-success': 'linear-gradient(135deg, #00ff00 0%, #00ffff 100%)',
  },
};

export const applyTheme = (variant: ThemeVariant) => {
  const root = document.documentElement;
  const themeVars = themes[variant];
  
  Object.entries(themeVars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
  
  // Adicionar classe ao body para facilitar estilização específica de tema
  document.body.classList.remove('theme-default', 'theme-neon', 'theme-pastel', 'theme-cyberpunk', 'theme-high-contrast');
  document.body.classList.add(`theme-${variant}`);
  
  localStorage.setItem('theme-variant', variant);
};

export const getStoredThemeVariant = (): ThemeVariant => {
  if (typeof window === 'undefined') return 'cyberpunk';
  
  const stored = localStorage.getItem('theme-variant');
  return (stored as ThemeVariant) || 'cyberpunk';
};

export const initializeTheme = () => {
  if (typeof window === 'undefined') return;
  
  const variant = getStoredThemeVariant();
  applyTheme(variant);
};

