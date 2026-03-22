/**
 * Utilidades de Tema e Classes CSS Pré-definidas
 * 
 * Este arquivo contém classes CSS pré-definidas para padrões comuns,
 * garantindo consistência no uso de tokens semânticos do dark mode.
 * 
 * Uso: import { themeClasses } from '@/lib/theme-utils';
 */

/**
 * Classes CSS pré-definidas para padrões comuns
 * Usar essas constantes garante consistência
 */
export const themeClasses = {
  // === CARDS ===
  card: 'bg-surface border border-border rounded-lg shadow-sm',
  cardHover: 'hover:bg-surface-hover transition-colors',
  cardInteractive: 'bg-surface border border-border rounded-lg shadow-sm hover:bg-surface-hover transition-colors cursor-pointer',
  
  // === TEXT ===
  textPrimary: 'text-text-primary',
  textSecondary: 'text-text-secondary',
  textTertiary: 'text-text-tertiary',
  textInverse: 'text-text-inverse',
  
  // === BUTTONS ===
  button: {
    primary: 'bg-accent hover:bg-accent-hover text-white transition-colors',
    secondary: 'bg-surface hover:bg-surface-hover text-text-primary border border-border transition-colors',
    ghost: 'bg-transparent hover:bg-surface-hover text-text-primary transition-colors',
    outline: 'bg-transparent hover:bg-surface border border-border text-text-primary transition-colors',
    danger: 'bg-error hover:opacity-90 text-white transition-colors',
  },
  
  // === INPUTS ===
  input: 'bg-surface border border-border text-text-primary placeholder:text-text-tertiary focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors',
  inputError: 'bg-surface border border-error text-text-primary placeholder:text-text-tertiary focus:border-error focus:ring-2 focus:ring-error/20',
  label: 'text-sm font-medium text-text-primary',
  
  // === LAYOUT ===
  sidebar: 'bg-surface border-r border-border',
  header: 'bg-surface border-b border-border',
  footer: 'bg-surface border-t border-border',
  modal: 'bg-surface border border-border rounded-lg shadow-lg',
  modalBackdrop: 'bg-black/50 backdrop-blur-sm',
  
  // === BADGES ===
  badge: {
    default: 'bg-surface-secondary text-text-primary border border-border',
    success: 'bg-success/10 text-success border border-success/20',
    warning: 'bg-warning/10 text-warning border border-warning/20',
    error: 'bg-error/10 text-error border border-error/20',
    info: 'bg-info/10 text-info border border-info/20',
  },
  
  // === DIVIDERS ===
  divider: 'border-t border-border',
  dividerVertical: 'border-r border-border',
  
  // === TOOLTIPS ===
  tooltip: 'bg-surface text-text-primary border border-border shadow-md text-sm',
  
  // === DROPDOWNS ===
  dropdown: 'bg-surface border border-border rounded-lg shadow-lg',
  dropdownItem: 'hover:bg-surface-hover text-text-primary transition-colors cursor-pointer',
  
  // === TABLES ===
  table: {
    header: 'bg-surface-secondary text-text-primary font-semibold border-b border-border',
    row: 'bg-surface hover:bg-surface-hover border-b border-border transition-colors',
    cell: 'text-text-primary',
  },
  
  // === STATES ===
  disabled: 'opacity-50 cursor-not-allowed',
  loading: 'opacity-70 cursor-wait',
  
} as const;

/**
 * Helper para combinar classes com theme-aware defaults
 * 
 * @example
 * withTheme(themeClasses.card, 'p-4 mt-2')
 * // Retorna: 'bg-surface border border-border rounded-lg shadow-sm p-4 mt-2'
 */
export function withTheme(baseClasses: string, additionalClasses?: string): string {
  return `${baseClasses} ${additionalClasses || ''}`.trim();
}

/**
 * Helper para classes condicionais com tema
 * 
 * @example
 * conditionalTheme(isActive, themeClasses.button.primary, themeClasses.button.secondary)
 */
export function conditionalTheme(
  condition: boolean,
  trueClasses: string,
  falseClasses: string
): string {
  return condition ? trueClasses : falseClasses;
}

/**
 * Mapa de cores de status para consistência
 */
export const statusColors = {
  success: {
    bg: 'bg-success',
    text: 'text-success',
    border: 'border-success',
  },
  warning: {
    bg: 'bg-warning',
    text: 'text-warning',
    border: 'border-warning',
  },
  error: {
    bg: 'bg-error',
    text: 'text-error',
    border: 'border-error',
  },
  info: {
    bg: 'bg-info',
    text: 'text-info',
    border: 'border-info',
  },
} as const;

