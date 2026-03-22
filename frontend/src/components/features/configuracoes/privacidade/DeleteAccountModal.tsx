"use client";
import React, { useState } from 'react';
import { Card3D } from '@/components/ui/Card3D';
import { Button } from '@/components/ui/Button';
import { Trash2, AlertTriangle } from 'lucide-react';

export default function DeleteAccountModal() {
  const [status, setStatus] = useState<string>('');
  const [confirm, setConfirm] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  async function requestDeletion() {
    if (!confirm) {
      setStatus('Por favor, marque a confirmação para continuar.');
      return;
    }
    setLoading(true);
    setStatus('Solicitando exclusão...');
    try {
      const res = await fetch(`${api}/account/delete`, { method: 'POST', credentials: 'include' });
      const json = await res.json();
      if (res.ok) {
        setStatus('Solicitação de exclusão criada com sucesso. Você pode cancelar em até 14 dias. ✅');
      } else {
        setStatus(json.error || 'Erro ao solicitar exclusão');
      }
    } catch (error) {
      setStatus('Erro ao solicitar exclusão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card3D
      variant="elevated"
      hover={true}
      glow={true}
      has3DRotation={true}
      animatedBorder={true}
      className="p-8 relative overflow-hidden group"
    >
      <div className="absolute -inset-1 bg-gradient-to-r from-red-500/20 via-rose-500/20 to-pink-500/20 rounded-2xl blur-2xl opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 shimmer opacity-20" />
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative group/icon">
            <div className="absolute -inset-2 bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 rounded-full blur-lg opacity-30 group-hover/icon:opacity-50 transition-opacity duration-300" />
            <div className="relative w-12 h-12 bg-gradient-to-br from-red-500/30 via-rose-500/30 to-pink-500/30 rounded-full flex items-center justify-center border-2 border-red-500/50 backdrop-blur-sm">
              <Trash2 className="w-6 h-6 text-red-400" style={{ filter: 'drop-shadow(0 0 6px rgba(239, 68, 68, 0.6))' }} />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-black bg-gradient-to-r from-red-400 via-rose-400 to-pink-400 bg-clip-text text-transparent mb-1">
              Excluir Conta
            </h2>
            <p className="text-text-secondary">
              Solicite a exclusão definitiva da sua conta.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-lg border-2 border-red-500/30 bg-red-500/10">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-semibold text-red-400 text-sm mb-1">Atenção: Ação Irreversível</div>
                <p className="text-xs text-red-300/80">
                  Esta ação é irreversível e removerá todos os seus dados após o período de carência de 14 dias.
                  Durante esse período, você pode cancelar a solicitação.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg border-2 border-border bg-surface-secondary hover:border-red-500/50 transition-all duration-300">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex-1">
                <div className="font-semibold text-text-primary mb-1">Confirmar exclusão</div>
                <p className="text-xs text-text-secondary">
                  Confirmo que desejo excluir minha conta permanentemente
                </p>
              </div>
              <input
                type="checkbox"
                className="sr-only peer"
                checked={confirm}
                onChange={(e) => {
                  setConfirm(e.target.checked);
                  if (e.target.checked) setStatus('');
                }}
              />
              <div className="ml-4 w-11 h-6 bg-surface border-2 border-border peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500 peer-checked:border-red-500"></div>
            </label>
          </div>

          <Button
            onClick={requestDeletion}
            disabled={!confirm || loading}
            variant="gradient"
            className="px-6 py-2 w-full"
            style={{
              background: !confirm || loading
                ? 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
                : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Solicitando exclusão...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Trash2 className="w-4 h-4" />
                Solicitar Exclusão da Conta
              </span>
            )}
          </Button>

          {status && (
            <div className={`p-3 rounded-lg border-2 ${status.includes('sucesso') || status.includes('criada')
                ? 'border-green-500/30 bg-green-500/10'
                : status.includes('confirmação')
                  ? 'border-yellow-500/30 bg-yellow-500/10'
                  : 'border-red-500/30 bg-red-500/10'
              }`}>
              <p className={`text-sm ${status.includes('sucesso') || status.includes('criada')
                  ? 'text-green-400'
                  : status.includes('confirmação')
                    ? 'text-yellow-400'
                    : 'text-red-400'
                }`}>
                {status}
              </p>
            </div>
          )}
        </div>
      </div>
    </Card3D>
  );
}
