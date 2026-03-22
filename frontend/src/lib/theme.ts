export type ThemeMode = 'light' | 'dark' | 'auto';

export function applyTheme(mode: ThemeMode, accentColor?: string) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  // Dark mode via class
  if (mode === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');

  // Auto: seguir prefers-color-scheme
  if (mode === 'auto') {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) root.classList.add('dark');
  }

  // Sincronizar com next-themes (usa storageKey "saas-theme") para evitar desencontro
  try {
    const storageValue = mode === 'auto' ? 'system' : mode; // next-themes usa 'system'
    localStorage.setItem('saas-theme', storageValue);
  } catch {}

  if (accentColor) {
    root.style.setProperty('--accent-color', accentColor);
  }
}

export function applyDensity(density?: 'compact' | 'comfortable' | 'spacious') {
  if (typeof document === 'undefined' || !density) return;
  const root = document.documentElement;
  root.setAttribute('data-density', density);
}

export function applyFontSize(size?: 'small' | 'medium' | 'large' | 'xlarge') {
  if (typeof document === 'undefined' || !size) return;
  const root = document.documentElement;
  const map: Record<string, string> = {
    small: '14px',
    medium: '16px',
    large: '18px',
    xlarge: '20px',
  };
  root.style.fontSize = map[size] || '16px';
}


