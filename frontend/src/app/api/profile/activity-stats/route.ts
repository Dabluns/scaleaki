import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function GET(request: NextRequest) {
  try {
    // Pegar o token do cookie
    const token = request.cookies.get('auth_token')?.value;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    // Passar cookie para o backend
    if (token) {
      headers['Cookie'] = `auth_token=${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/profile/activity-stats`, {
      method: 'GET',
      headers,
      credentials: 'include',
    });
    
    const data = await response.json();
    
    if (response.ok) {
      return NextResponse.json(data);
    } else {
      return NextResponse.json(
        { error: data.error || 'Erro ao buscar estatísticas de atividade' }, 
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('Error fetching activity stats:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' }, 
      { status: 500 }
    );
  }
}

