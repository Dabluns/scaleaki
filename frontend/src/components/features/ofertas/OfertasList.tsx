"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { EmptyStateIllustration } from '@/components/ui/EmptyStateIllustration';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { SkeletonGrid } from '@/components/ui/SkeletonCard';
import { InfiniteScrollIndicator } from '@/components/ui/InfiniteScrollIndicator';
import { Card3D } from '@/components/ui/Card3D';
import { Eye, Edit3, Trash2, ExternalLink, Play, DollarSign, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useNichos } from '@/context/NichoContext';
import { Oferta } from '@/types/oferta';
import { FavoritoButton } from './FavoritoButton';
import { useSettings } from '@/context/SettingsContext';
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal';
import { OfertaCard } from './OfertaCard';

interface OfertasListProps {
  ofertas: Oferta[];
  onViewOferta: (oferta: Oferta) => void;
  onEditOferta?: (oferta: Oferta) => void;
  onDeleteOferta?: (ofertaId: string) => void;
  getNichoName: (nichoId: string) => string;
  getBadgeColor: (type: string, value: string) => string;
}

const OfertaItem = ({
  oferta,
  onViewOferta,
  onEditOferta,
  onDeleteOferta,
  getNichoName,
  getBadgeColor
}: OfertasListProps & { oferta: Oferta }) => {
  const { settings } = useSettings();
  const [imageError, setImageError] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);
  const { nichos } = useNichos();
  const nicho = Array.isArray(nichos) ? nichos.find(n => n.id === oferta.nichoId) : undefined;
  const showMetrics = (settings as any)?.showMetricsOnCard ?? true;
  const cardRef = useRef<HTMLDivElement>(null);

  const handleConfirmDelete = async () => {
    if (!onDeleteOferta) return;

    setIsDeleting(true);
    try {
      await onDeleteOferta(oferta.id);
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Erro ao deletar:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const userLocale = ((settings as any)?.language || 'pt_BR').replace('_', '-');

  const formatMetric = (value: number | string | null | undefined) => {
    if (value === null || value === undefined) return 'N/A';
    const num = Number(value);
    if (isNaN(num)) return 'N/A';
    try {
      return num.toLocaleString(userLocale);
    } catch {
      return num.toLocaleString('pt-BR');
    }
  };

  const formatCurrency = (value: number | string | null | undefined) => {
    if (value === null || value === undefined) return 'N/A';
    const num = Number(value);
    if (isNaN(num)) return 'N/A';
    const currencyByLocale: Record<string, string> = {
      'pt-BR': 'BRL',
      'en-US': 'USD',
      'es-ES': 'EUR',
      'fr-FR': 'EUR',
      'de-DE': 'EUR'
    };
    const currency = currencyByLocale[userLocale] || 'BRL';
    try {
      return new Intl.NumberFormat(userLocale, { style: 'currency', currency }).format(num);
    } catch {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
    }
  };

  const formatPercentage = (value: number | string | null | undefined) => {
    if (value === null || value === undefined) return 'N/A';
    const num = Number(value);
    if (isNaN(num)) return 'N/A';
    return `${num.toFixed(2)}%`;
  };

  const createRipple = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newRipple = { x, y, id: Date.now() };
    setRipples(prev => [...prev, newRipple]);
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 600);
  };

  return (
    <div ref={cardRef} onClick={createRipple} className="relative">
      <Card3D
        variant="glass"
        hover={true}
        glow={true}
        has3DRotation={true}
        hasParallax={true}
        animatedBorder={true}
        className="group relative overflow-hidden cursor-pointer animate-scale-in"
      >
        {/* Ripple Effects */}
        {ripples.map((ripple) => (
          <span
            key={ripple.id}
            className="ripple"
            style={{
              left: ripple.x - 5,
              top: ripple.y - 5,
              width: 10,
              height: 10,
              background: 'rgba(34, 197, 94, 0.6)',
            }}
          />
        ))}

        {/* Background Pattern Verde Dopaminérgico */}
        <div className="absolute inset-0 opacity-[0.08] pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.5),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(34,197,94,0.4),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(34,197,94,0.3),transparent_60%)]" />
        </div>

        {/* Container Verde Sólido */}
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            backgroundColor: 'rgba(34, 197, 94, 0.12)',
          }}
        >
          {/* Glow Effect Verde */}
          <div className="absolute -inset-1 rounded-2xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{ backgroundColor: 'rgba(34, 197, 94, 0.4)' }}
          />

          {/* Imagem com Parallax */}
          <div className="relative h-48 overflow-hidden">
            {oferta.imagem && !imageError ? (
              <>
                <ImageParallax
                  src={oferta.imagem}
                  alt={oferta.titulo}
                  className="w-full h-full object-cover"
                  intensity={0.3}
                />
                {/* Overlay Verde Sutil */}
                <div className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'linear-gradient(to bottom, rgba(34, 197, 94, 0.1), transparent)'
                  }}
                />
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center"
                style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)' }}
              >
                <div className="text-5xl animate-bounce">💰</div>
              </div>
            )}

            {/* Badges Dopaminérgicos - Top Left */}
            <div className="absolute top-3 left-3 flex flex-wrap gap-2 z-20">
              {/* Badge Linguagem */}
              <div className="relative group/badge">
                <div className="absolute -inset-1 rounded-full blur-md opacity-0 group-hover/badge:opacity-100 transition-opacity duration-300 animate-glow-pulse"
                  style={{ backgroundColor: 'rgba(34, 197, 94, 0.6)' }}
                />
                <div
                  className="relative px-3 py-1.5 rounded-full text-white text-xs font-black uppercase tracking-wide transition-all duration-300 cursor-pointer animate-bounce-in"
                  style={{
                    backgroundColor: '#22c55e',
                    border: '2px solid rgba(74, 222, 128, 0.8)',
                    boxShadow: '0 0 20px rgba(34, 197, 94, 0.6), inset 0 0 10px rgba(74, 222, 128, 0.3)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.15) rotate(5deg)';
                    e.currentTarget.style.boxShadow = '0 0 30px rgba(34, 197, 94, 0.9), inset 0 0 15px rgba(74, 222, 128, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
                    e.currentTarget.style.boxShadow = '0 0 20px rgba(34, 197, 94, 0.6), inset 0 0 10px rgba(74, 222, 128, 0.3)';
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.currentTarget.style.transform = 'scale(0.9)';
                    setTimeout(() => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }, 150);
                  }}
                >
                  <span className="relative z-10 drop-shadow-lg">
                    {oferta.linguagem === 'pt_BR' ? 'PT' : oferta.linguagem.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Badge Plataforma */}
              {oferta.plataforma && (
                <div className="relative group/badge">
                  <div className="absolute -inset-1 rounded-full blur-md opacity-0 group-hover/badge:opacity-100 transition-opacity duration-300 animate-glow-pulse"
                    style={{ backgroundColor: 'rgba(34, 197, 94, 0.6)' }}
                  />
                  <div
                    className="relative px-3 py-1.5 rounded-full text-white text-xs font-black uppercase tracking-wide transition-all duration-300 cursor-pointer animate-bounce-in"
                    style={{
                      backgroundColor: '#22c55e',
                      border: '2px solid rgba(74, 222, 128, 0.8)',
                      boxShadow: '0 0 20px rgba(34, 197, 94, 0.6), inset 0 0 10px rgba(74, 222, 128, 0.3)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.15) rotate(-5deg)';
                      e.currentTarget.style.boxShadow = '0 0 30px rgba(34, 197, 94, 0.9), inset 0 0 15px rgba(74, 222, 128, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
                      e.currentTarget.style.boxShadow = '0 0 20px rgba(34, 197, 94, 0.6), inset 0 0 10px rgba(74, 222, 128, 0.3)';
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.currentTarget.style.transform = 'scale(0.9)';
                      setTimeout(() => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }, 150);
                    }}
                  >
                    <span className="relative z-10 drop-shadow-lg">
                      {(['facebook_ads', 'instagram_ads', 'meta_ads'].includes(oferta.plataforma as any)
                        ? 'META'
                        : oferta.plataforma.replace('_ads', '').toUpperCase())}
                    </span>
                  </div>
                </div>
              )}

              {/* Badge Status */}
              {oferta.status && (
                <div className="relative group/badge">
                  <div className="absolute -inset-1 rounded-full blur-md opacity-0 group-hover/badge:opacity-100 transition-opacity duration-300 animate-glow-pulse"
                    style={{ backgroundColor: 'rgba(34, 197, 94, 0.6)' }}
                  />
                  <div
                    className="relative px-3 py-1.5 rounded-full text-white text-xs font-black uppercase tracking-wide transition-all duration-300 cursor-pointer animate-bounce-in"
                    style={{
                      backgroundColor: '#22c55e',
                      border: '2px solid rgba(74, 222, 128, 0.8)',
                      boxShadow: '0 0 20px rgba(34, 197, 94, 0.6), inset 0 0 10px rgba(74, 222, 128, 0.3)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.15) rotate(5deg)';
                      e.currentTarget.style.boxShadow = '0 0 30px rgba(34, 197, 94, 0.9), inset 0 0 15px rgba(74, 222, 128, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
                      e.currentTarget.style.boxShadow = '0 0 20px rgba(34, 197, 94, 0.6), inset 0 0 10px rgba(74, 222, 128, 0.3)';
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.currentTarget.style.transform = 'scale(0.9)';
                      setTimeout(() => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }, 150);
                    }}
                  >
                    <span className="relative z-10 drop-shadow-lg">{oferta.status}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Botões de Ação - Top Right */}
            <div className="absolute top-3 right-3 flex flex-col gap-2 z-20">
              {/* Favorito Button */}
              <div className="relative">
                <div className="absolute -inset-1 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-glow-pulse"
                  style={{ backgroundColor: 'rgba(236, 72, 153, 0.5)' }}
                />
                <FavoritoButton
                  oferta={oferta}
                  size="sm"
                  variant="secondary"
                  className="relative bg-pink-500/90 hover:bg-pink-500 shadow-[0_0_20px_rgba(236,72,153,0.6)] backdrop-blur-sm border-2 border-pink-400/60 hover:scale-110 hover:rotate-12 transition-all duration-300 hover:shadow-[0_0_30px_rgba(236,72,153,0.9)] animate-bounce-in"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-1.5">
                {/* View Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewOferta(oferta);
                  }}
                  className="relative group/btn p-2.5 rounded-xl text-white transition-all duration-300 animate-bounce-in"
                  style={{
                    backgroundColor: '#22c55e',
                    border: '2px solid rgba(74, 222, 128, 0.8)',
                    boxShadow: '0 0 20px rgba(34, 197, 94, 0.6), inset 0 0 10px rgba(74, 222, 128, 0.3)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.2) rotate(12deg)';
                    e.currentTarget.style.boxShadow = '0 0 35px rgba(34, 197, 94, 0.9), inset 0 0 15px rgba(74, 222, 128, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
                    e.currentTarget.style.boxShadow = '0 0 20px rgba(34, 197, 94, 0.6), inset 0 0 10px rgba(74, 222, 128, 0.3)';
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.transform = 'scale(0.9)';
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.transform = 'scale(1.2) rotate(12deg)';
                  }}
                >
                  <div className="absolute inset-0 rounded-xl opacity-0 group-hover/btn:opacity-60 blur-lg transition-opacity duration-300"
                    style={{ backgroundColor: 'rgba(74, 222, 128, 0.9)' }}
                  />
                  <Eye className="w-4 h-4 relative z-10 group-hover/btn:animate-pulse" />
                </button>

                {/* Edit Button */}
                {onEditOferta && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditOferta(oferta);
                    }}
                    className="relative group/btn p-2.5 rounded-xl text-white transition-all duration-300 animate-bounce-in"
                    style={{
                      backgroundColor: '#22c55e',
                      border: '2px solid rgba(74, 222, 128, 0.8)',
                      boxShadow: '0 0 20px rgba(34, 197, 94, 0.6), inset 0 0 10px rgba(74, 222, 128, 0.3)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.2) rotate(-12deg)';
                      e.currentTarget.style.boxShadow = '0 0 35px rgba(34, 197, 94, 0.9), inset 0 0 15px rgba(74, 222, 128, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
                      e.currentTarget.style.boxShadow = '0 0 20px rgba(34, 197, 94, 0.6), inset 0 0 10px rgba(74, 222, 128, 0.3)';
                    }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.transform = 'scale(0.9)';
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.transform = 'scale(1.2) rotate(-12deg)';
                    }}
                  >
                    <div className="absolute inset-0 rounded-xl opacity-0 group-hover/btn:opacity-60 blur-lg transition-opacity duration-300"
                      style={{ backgroundColor: 'rgba(74, 222, 128, 0.9)' }}
                    />
                    <Edit3 className="w-4 h-4 relative z-10 group-hover/btn:animate-pulse" />
                  </button>
                )}

                {/* Delete Button */}
                {onDeleteOferta && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteModal(true);
                    }}
                    className="relative group/btn p-2.5 rounded-xl text-white transition-all duration-300 animate-bounce-in"
                    style={{
                      backgroundColor: '#ef4444',
                      border: '2px solid rgba(248, 113, 113, 0.8)',
                      boxShadow: '0 0 20px rgba(239, 68, 68, 0.6), inset 0 0 10px rgba(248, 113, 113, 0.3)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.2) rotate(12deg)';
                      e.currentTarget.style.boxShadow = '0 0 35px rgba(239, 68, 68, 0.9), inset 0 0 15px rgba(248, 113, 113, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
                      e.currentTarget.style.boxShadow = '0 0 20px rgba(239, 68, 68, 0.6), inset 0 0 10px rgba(248, 113, 113, 0.3)';
                    }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.transform = 'scale(0.9)';
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.transform = 'scale(1.2) rotate(12deg)';
                    }}
                  >
                    <div className="absolute inset-0 rounded-xl opacity-0 group-hover/btn:opacity-60 blur-lg transition-opacity duration-300"
                      style={{ backgroundColor: 'rgba(248, 113, 113, 0.9)' }}
                    />
                    <Trash2 className="w-4 h-4 relative z-10 group-hover/btn:animate-pulse" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Conteúdo */}
          <div className="p-5 relative" style={{ backgroundColor: 'rgba(34, 197, 94, 0.08)' }}>
            {/* Título e Nicho */}
            <div className="mb-3">
              <h3
                className="font-bold text-lg text-text-primary mb-1 line-clamp-2 transition-all duration-300 group-hover:text-green-400"
                style={{ textShadow: '0 2px 10px rgba(34, 197, 94, 0.3)' }}
              >
                <Link
                  href={`/oferta/${nicho?.slug ?? ''}/${oferta.id}`}
                  className="hover:underline"
                >
                  {oferta.titulo}
                </Link>
              </h3>
              <p className="text-sm text-text-secondary font-medium">
                {getNichoName(oferta.nichoId)}
              </p>
            </div>

            {/* Descrição */}
            <p className="text-sm text-text-primary mb-4 line-clamp-2">
              {oferta.texto}
            </p>

            {/* Métricas */}
            {showMetrics && (
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="flex items-center gap-1.5 text-xs text-text-secondary bg-surface/30 rounded-lg px-2 py-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-green-400" />
                  <span className="font-semibold">ROI: {formatPercentage(oferta.roi)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-text-secondary bg-surface/30 rounded-lg px-2 py-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-green-400" />
                  <span className="font-semibold">CPC: {formatCurrency(oferta.cpc)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-text-secondary bg-surface/30 rounded-lg px-2 py-1.5">
                  <Play className="w-3.5 h-3.5 text-green-400" />
                  <span className="font-semibold">CTR: {formatPercentage(oferta.ctr)}</span>
                </div>
              </div>
            )}

            {/* Data */}
            <div className="text-xs text-text-tertiary mb-3">
              {oferta.createdAt && (() => {
                try {
                  return new Date(oferta.createdAt).toLocaleDateString(userLocale);
                } catch {
                  return new Date(oferta.createdAt).toLocaleDateString('pt-BR');
                }
              })()}
            </div>

            {/* Botão Ver Mais - Dopaminérgico */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="w-full px-4 py-3 rounded-xl font-bold text-sm transition-all duration-300 relative overflow-hidden group/btn"
              style={{
                backgroundColor: '#22c55e',
                color: 'white',
                border: '2px solid rgba(74, 222, 128, 0.8)',
                boxShadow: '0 0 15px rgba(34, 197, 94, 0.4), inset 0 0 10px rgba(74, 222, 128, 0.2)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 0 25px rgba(34, 197, 94, 0.7), inset 0 0 15px rgba(74, 222, 128, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 0 15px rgba(34, 197, 94, 0.4), inset 0 0 10px rgba(74, 222, 128, 0.2)';
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.95)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
            >
              <span className="relative z-10 drop-shadow-lg">
                {isExpanded ? 'Ver menos' : 'Ver mais'}
              </span>
              <div className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300 shimmer" />
            </button>

            {/* Conteúdo Expandido */}
            {isExpanded && (
              <div className="mt-4 pt-4 border-t border-green-500/30 animate-slide-in-bottom">
                <div className="space-y-2.5">
                  {oferta.tipoOferta && (
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary font-medium">Tipo:</span>
                      <span className="font-bold text-green-400">{oferta.tipoOferta}</span>
                    </div>
                  )}
                  {oferta.tags && oferta.tags.length > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary font-medium">Tags:</span>
                      <div className="flex gap-1.5">
                        {oferta.tags.slice(0, 3).map((tag, index) => (
                          <Badge
                            key={index}
                            className="text-xs bg-green-500/20 text-green-400 border border-green-500/40 font-semibold"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {oferta.receita && (
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary font-medium">Receita:</span>
                      <span className="font-bold text-green-400">
                        {formatCurrency(oferta.receita)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <ConfirmDeleteModal
          isOpen={showDeleteModal}
          title="Excluir Oferta"
          description="Tem certeza que deseja excluir esta oferta? Esta ação é irreversível."
          itemName={oferta.titulo}
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowDeleteModal(false)}
          isDeleting={isDeleting}
        />
      </Card3D>
    </div>
  );
};

export function OfertasList({
  ofertas,
  onViewOferta,
  onEditOferta,
  onDeleteOferta,
  getNichoName,
  getBadgeColor
}: OfertasListProps) {
  const { settings } = useSettings();
  const defaultPageSize = Math.max(10, Math.min(100, Number((settings as any)?.itemsPerPage) || 25));
  const [visibleCount, setVisibleCount] = useState(defaultPageSize);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);

  const visibleOfertas = useMemo(() => {
    return ofertas.slice(0, visibleCount);
  }, [ofertas, visibleCount]);

  const hasMore = visibleCount < ofertas.length;

  const loadMore = useCallback(() => {
    setVisibleCount(prev => {
      const next = Math.min(prev + defaultPageSize, ofertas.length);
      return next;
    });
  }, [ofertas.length, defaultPageSize]);

  // Intersection Observer para infinite scroll
  useEffect(() => {
    if (!hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadingRef.current) {
      observer.observe(loadingRef.current);
    }

    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loadMore]);

  if (ofertas.length === 0) {
    return (
      <Card className="p-8">
        <EmptyStateIllustration
          illustration="searching"
          title="Nenhuma oferta encontrada"
          message="Explorando o universo de ofertas..."
          cta="Ajustar filtros"
          onCtaClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        />
      </Card>
    );
  }

  const layout = ((settings as any)?.defaultLayout || 'grid') as 'grid' | 'list' | 'compact';

  const containerClass = layout === 'grid'
    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'
    : layout === 'list'
      ? 'flex flex-col gap-4'
      : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';

  return (
    <div className="space-y-6">
      {/* Lista/Grade de ofertas conforme preferência */}
      <div className={containerClass}>
        {visibleOfertas.map((oferta) => (
          <div key={oferta.id} className={layout === 'list' ? 'w-full' : ''}>
            <OfertaCard
              oferta={oferta}
              onView={onViewOferta}
              getNichoName={getNichoName}
              isAdmin={!!onDeleteOferta}
              onDelete={onDeleteOferta}
            />
          </div>
        ))}
      </div>

      {/* Loading indicator */}
      {hasMore && (
        <div ref={loadingRef} className="py-8">
          <InfiniteScrollIndicator
            hasProgressBar={true}
            current={visibleCount}
            total={ofertas.length}
            isLoading={true}
          />
          <SkeletonGrid count={8} shimmer gradient />
        </div>
      )}

      {/* End of list */}
      {!hasMore && ofertas.length > 0 && (
        <InfiniteScrollIndicator
          hasProgressBar={true}
          hasConfetti={false}
          current={visibleCount}
          total={ofertas.length}
          isLoading={false}
        />
      )}
    </div>
  );
} 