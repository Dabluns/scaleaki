import * as LucideIcons from 'lucide-react';
import { Heart } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

function toPascalCase(input: string): string {
  return input
    .trim()
    .replace(/\p{Diacritic}/gu, '') // remover acentos se suportado
    .replace(/[\-_]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('');
}

export function getLucideIconByName(name?: string): LucideIcon {
  if (!name || typeof name !== 'string') return Heart as LucideIcon;
  const candidateNames = [name, toPascalCase(name)];

  for (const key of candidateNames) {
    const Icon = (LucideIcons as any)[key] as LucideIcon | undefined;
    if (Icon) return Icon;
  }

  return Heart as LucideIcon;
}


