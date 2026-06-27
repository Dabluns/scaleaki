import { NextRequest, NextResponse } from 'next/server';
import { isPlusRouteBlocked } from '@/lib/featureFlags';

// ─────────────────────────────────────────────────────────────────
// Middleware simplificado: a proteção de autenticação é feita
// pelo AuthContext no lado do cliente. O middleware apenas
// garante que assets e rotas públicas passem sem interferência.
// Isso evita o loop infinito de redirecionamento entre domínios
// cross-origin (Vercel frontend ↔ Render backend).
//
// Exceção: rotas "Scaleaki+" desabilitadas no MVP fechado são
// bloqueadas aqui (acessíveis por URL direta). Redirect same-origin
// para /anuncios-fb — não causa loop cross-origin.
// ─────────────────────────────────────────────────────────────────

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Bloqueia features Plus desligadas no MVP, mesmo via URL direta.
  if (isPlusRouteBlocked(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = '/anuncios-fb';
    url.search = '';
    return NextResponse.redirect(url);
  }

  // Demais requisições passam — proteção de rota é feita pelo
  // AuthContext (client-side) que verifica o token via /auth/me
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|favicon.ico|robots.txt|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|json|mp4|webm|woff|woff2|ttf|eot)$).*)'
  ],
};