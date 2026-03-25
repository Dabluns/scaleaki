import { NextRequest, NextResponse } from 'next/server';

// ─────────────────────────────────────────────────────────────────
// Middleware simplificado: a proteção de autenticação é feita
// pelo AuthContext no lado do cliente. O middleware apenas
// garante que assets e rotas públicas passem sem interferência.
// Isso evita o loop infinito de redirecionamento entre domínios
// cross-origin (Vercel frontend ↔ Render backend).
// ─────────────────────────────────────────────────────────────────

export function middleware(req: NextRequest) {
  // Permitir todas as requisições — a proteção de rota é feita
  // pelo AuthContext (client-side) que verifica o token via /auth/me
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|favicon.ico|robots.txt|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|json|mp4|webm|woff|woff2|ttf|eot)$).*)'
  ],
};