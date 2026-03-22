import { NextRequest, NextResponse } from 'next/server';

// Função para extrair recursos de uma URL
async function extractResources(html: string, baseUrl: string) {
  const urlObj = new URL(baseUrl);
  const baseOrigin = urlObj.origin;
  const basePath = urlObj.pathname.substring(0, urlObj.pathname.lastIndexOf('/') + 1);
  
  const resources: { type: string; url: string; content: string | ArrayBuffer; path: string }[] = [];
  const visitedUrls = new Set<string>();
  
  // Extrair CSS
  const cssRegex = /<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["']/gi;
  let match;
  while ((match = cssRegex.exec(html)) !== null) {
    const cssUrl = match[1];
    const fullUrl = cssUrl.startsWith('http') ? cssUrl : cssUrl.startsWith('/') ? baseOrigin + cssUrl : baseOrigin + basePath + cssUrl;
    
    if (!visitedUrls.has(fullUrl)) {
      visitedUrls.add(fullUrl);
      try {
        const cssResponse = await fetch(fullUrl);
        if (cssResponse.ok) {
          const cssContent = await cssResponse.text();
          const cssPath = cssUrl.startsWith('/') ? cssUrl.substring(1) : cssUrl.replace(/^https?:\/\/[^\/]+/, '');
          resources.push({ type: 'css', url: fullUrl, content: cssContent, path: cssPath });
        }
      } catch (e) {
        console.error(`Erro ao baixar CSS: ${fullUrl}`, e);
      }
    }
  }
  
  // Extrair JavaScript
  const jsRegex = /<script[^>]+src=["']([^"']+)["']/gi;
  while ((match = jsRegex.exec(html)) !== null) {
    const jsUrl = match[1];
    const fullUrl = jsUrl.startsWith('http') ? jsUrl : jsUrl.startsWith('/') ? baseOrigin + jsUrl : baseOrigin + basePath + jsUrl;
    
    if (!visitedUrls.has(fullUrl)) {
      visitedUrls.add(fullUrl);
      try {
        const jsResponse = await fetch(fullUrl);
        if (jsResponse.ok) {
          const jsContent = await jsResponse.text();
          const jsPath = jsUrl.startsWith('/') ? jsUrl.substring(1) : jsUrl.replace(/^https?:\/\/[^\/]+/, '');
          resources.push({ type: 'js', url: fullUrl, content: jsContent, path: jsPath });
        }
      } catch (e) {
        console.error(`Erro ao baixar JS: ${fullUrl}`, e);
      }
    }
  }
  
  // Extrair imagens
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  while ((match = imgRegex.exec(html)) !== null) {
    const imgUrl = match[1];
    if (imgUrl.startsWith('data:')) continue; // Pular data URIs
    
    const fullUrl = imgUrl.startsWith('http') ? imgUrl : imgUrl.startsWith('/') ? baseOrigin + imgUrl : baseOrigin + basePath + imgUrl;
    
    if (!visitedUrls.has(fullUrl)) {
      visitedUrls.add(fullUrl);
      try {
        const imgResponse = await fetch(fullUrl);
        if (imgResponse.ok) {
          const imgBuffer = await imgResponse.arrayBuffer();
          const imgPath = imgUrl.startsWith('/') ? imgUrl.substring(1) : imgUrl.replace(/^https?:\/\/[^\/]+/, '');
          resources.push({ type: 'image', url: fullUrl, content: imgBuffer, path: imgPath });
        }
      } catch (e) {
        console.error(`Erro ao baixar imagem: ${fullUrl}`, e);
      }
    }
  }
  
  return resources;
}

export async function POST(request: NextRequest) {
  try {
    const { url, fullSite = false } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL é obrigatória' },
        { status: 400 }
      );
    }

    // Validar URL
    let urlObj: URL;
    try {
      urlObj = new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'URL inválida' },
        { status: 400 }
      );
    }

    // Fazer fetch do HTML
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Erro ao acessar URL: ${response.status}` },
        { status: response.status }
      );
    }

    const html = await response.text();

    // Se for extração completa do site
    if (fullSite) {
      const resources = await extractResources(html, url);
      
      return NextResponse.json({ 
        html,
        resources,
        fullSite: true
      });
    }

    // Retorno simples apenas HTML
    return NextResponse.json({ html, fullSite: false });
  } catch (error) {
    console.error('Erro ao extrair HTML:', error);
    return NextResponse.json(
      { error: 'Erro ao extrair HTML do site' },
      { status: 500 }
    );
  }
}
