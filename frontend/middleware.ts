import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/auth', '/api', '/_next', '/favicon.ico', '/robots.txt', '/manifest.json', '/uploads'];
const ASSET_EXT_REGEX = /\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|map|txt|json|mp4|webm|woff|woff2|ttf|eot)$/i;
const TOKEN_KEY = 'auth_token';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Permitir acesso livre às rotas públicas e a arquivos estáticos
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path)) || ASSET_EXT_REGEX.test(pathname)) {
    return NextResponse.next();
  }
  
  // Permitir acesso à página inicial (/) para que ela faça o redirecionamento manual
  if (pathname === '/') {
    return NextResponse.next();
  }
  
  // Verificar se o usuário está autenticado através do cookie
  const token = req.cookies.get(TOKEN_KEY)?.value;
  
  // Se não estiver autenticado, redirecionar para login
  if (!token) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/auth';
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // Se estiver autenticado, permitir acesso
  return NextResponse.next();
}

export const config = {
  // Ignorar assets estáticos e uploads
  matcher: [
    '/((?!auth|api|_next|favicon.ico|robots.txt|manifest.json|uploads|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|json|mp4|webm|woff|woff2|ttf|eot)$).*)'
  ],
}; 