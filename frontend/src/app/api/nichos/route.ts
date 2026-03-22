import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function GET() {
  try {
    const response = await fetch(`${API_BASE_URL}/nichos`);
    const data = await response.json();
    
    if (response.ok) {
      return NextResponse.json(data.data || data);
    } else {
      return NextResponse.json({ error: data.error || 'Erro ao buscar nichos' }, { status: response.status });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Pegar o token do cookie (nome correto: auth_token)
    const token = request.cookies.get('auth_token')?.value;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    // Passar cookie para o backend
    if (token) {
      headers['Cookie'] = `auth_token=${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/nichos`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      return NextResponse.json(data.data || data);
    } else {
      return NextResponse.json({ error: data.error || 'Erro ao criar nicho' }, { status: response.status });
    }
  } catch (error) {
    console.error('Error creating nicho:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    
    // Pegar o token do cookie (nome correto: auth_token)
    const token = request.cookies.get('auth_token')?.value;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    // Passar cookie para o backend
    if (token) {
      headers['Cookie'] = `auth_token=${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/nichos/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updateData)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      return NextResponse.json(data.data || data);
    } else {
      return NextResponse.json({ error: data.error || 'Erro ao atualizar nicho' }, { status: response.status });
    }
  } catch (error) {
    console.error('Error updating nicho:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;
    
    // Pegar o token do cookie (nome correto: auth_token)
    const token = request.cookies.get('auth_token')?.value;
    
    const headers: HeadersInit = {};
    
    // Passar cookie para o backend
    if (token) {
      headers['Cookie'] = `auth_token=${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/nichos/${id}`, {
      method: 'DELETE',
      headers
    });
    
    const data = await response.json();
    
    if (response.ok) {
      return NextResponse.json(data);
    } else {
      return NextResponse.json({ error: data.error || 'Erro ao deletar nicho' }, { status: response.status });
    }
  } catch (error) {
    console.error('Error deleting nicho:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 