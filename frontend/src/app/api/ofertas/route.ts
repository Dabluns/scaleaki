import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || undefined;
    const limit = searchParams.get('limit') || undefined;
    const sortBy = searchParams.get('sortBy') || undefined;
    const sortOrder = searchParams.get('sortOrder') || undefined;
    const search = searchParams.get('search') || undefined;
    let plataforma = searchParams.get('plataforma') || undefined;
    // meta_ads é entendido pelo backend (mapeado para facebook+instagram)
    const tipoOferta = searchParams.get('tipoOferta') || undefined;
    const nichoId = searchParams.get('nichoId') || undefined;
    const linguagem = searchParams.get('linguagem') || undefined;

    const qs = new URLSearchParams();
    if (page) qs.set('page', page);
    if (limit) qs.set('limit', limit);
    if (sortBy) qs.set('sortBy', sortBy);
    if (sortOrder) qs.set('sortOrder', sortOrder);
    if (search) qs.set('search', search);
    if (plataforma) qs.set('plataforma', plataforma);
    if (tipoOferta) qs.set('tipoOferta', tipoOferta);
    if (nichoId) qs.set('nichoId', nichoId);
    if (linguagem) qs.set('linguagem', linguagem);

    const response = await fetch(`${API_BASE_URL}/ofertas${qs.toString() ? `?${qs.toString()}` : ''}`);
    const data = await response.json();
    
    if (response.ok) {
      // Retorna payload completo (data + pagination) quando houver
      return NextResponse.json(data);
    } else {
      return NextResponse.json({ error: data.error || 'Erro ao buscar ofertas' }, { status: response.status });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Normalizar plataforma meta_ads para backend (deixar undefined para usar default ou mapear)
    if (body && body.plataforma === 'meta_ads') {
      // Preferimos omitir para cair no default (facebook_ads) no backend
      delete body.plataforma;
    }
    
    // Pegar o token do cookie
    const token = request.cookies.get('auth_token')?.value;
    console.log('Token encontrado no cookie:', token ? 'Sim' : 'Não');
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    // Adicionar token se existir
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/ofertas`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      credentials: 'include' // Incluir cookies na requisição
    });
    
    console.log('Resposta do backend:', response.status, response.statusText);
    const data = await response.json();
    console.log('Dados do backend:', data);
    
    if (response.ok) {
      return NextResponse.json(data.data || data);
    } else {
      return NextResponse.json({ error: data.error || 'Erro ao criar oferta' }, { status: response.status });
    }
  } catch (error) {
    console.error('Erro na API route:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    
    // Pegar o token do cookie
    const token = request.cookies.get('auth_token')?.value;
    console.log('Token encontrado no cookie (PUT):', token ? 'Sim' : 'Não');
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    // Adicionar token se existir
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/ofertas/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updateData),
      credentials: 'include' // Incluir cookies na requisição
    });
    
    console.log('Resposta do backend (PUT):', response.status, response.statusText);
    const data = await response.json();
    console.log('Dados do backend (PUT):', data);
    
    if (response.ok) {
      return NextResponse.json(data.data || data);
    } else {
      return NextResponse.json({ error: data.error || 'Erro ao atualizar oferta' }, { status: response.status });
    }
  } catch (error) {
    console.error('Erro na API route PUT:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;
    
    // Pegar o token do cookie
    const token = request.cookies.get('auth_token')?.value;
    console.log('Token encontrado no cookie (DELETE):', token ? 'Sim' : 'Não');
    
    const headers: Record<string, string> = {};
    
    // Adicionar token se existir
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/ofertas/${id}`, {
      method: 'DELETE',
      headers,
      credentials: 'include' // Incluir cookies na requisição
    });
    
    console.log('Resposta do backend (DELETE):', response.status, response.statusText);
    const data = await response.json();
    console.log('Dados do backend (DELETE):', data);
    
    if (response.ok) {
      return NextResponse.json(data);
    } else {
      return NextResponse.json({ error: data.error || 'Erro ao deletar oferta' }, { status: response.status });
    }
  } catch (error) {
    console.error('Erro na API route DELETE:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 