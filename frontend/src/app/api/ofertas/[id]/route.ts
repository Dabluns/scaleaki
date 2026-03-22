import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const response = await fetch(`${API_BASE_URL}/ofertas/${id}`, {
      cache: 'no-store'
    });
    const data = await response.json();

    if (response.ok) {
      return NextResponse.json(data.data || data);
    }

    return NextResponse.json({ error: data.error || 'Oferta não encontrada' }, { status: response.status });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}


