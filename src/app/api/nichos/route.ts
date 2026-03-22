import { NextRequest, NextResponse } from 'next/server';

const nichos = [
  { id: 1, nome: 'Tecnologia', descricao: 'Produtos e serviços de tecnologia' },
  { id: 2, nome: 'Saúde', descricao: 'Produtos e serviços de saúde' },
  { id: 3, nome: 'Educação', descricao: 'Produtos e serviços educacionais' },
  { id: 4, nome: 'Finanças', descricao: 'Produtos e serviços financeiros' },
  { id: 5, nome: 'Marketing', descricao: 'Produtos e serviços de marketing' },
];

export async function GET() {
  return NextResponse.json(nichos);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const novoNicho = {
      id: nichos.length + 1,
      ...body
    };
    nichos.push(novoNicho);
    return NextResponse.json(novoNicho, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao criar nicho' },
      { status: 400 }
    );
  }
} 