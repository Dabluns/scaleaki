"use client";
import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import {
  User,
  Mail,
  Phone,
  Building2,
  Save,
  CheckCircle,
  Camera,
  X,
  Fingerprint,
  Zap,
  Activity,
  Terminal,
  ShieldAlert,
  LoaderCircle
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

// ─────────────────────────────────────────────────────────────────
// @ux-design-expert (Uma) · Premium ProfileForm v5.0
// Design Path: Mastery High-Fidelity / Biometric Node
// ─────────────────────────────────────────────────────────────────

type Profile = {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  avatar?: string;
  avatarType?: string;
};

export default function ProfileForm() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Profile>({});
  const [success, setSuccess] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();
  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${api}/profile`, { credentials: 'include' });
        const json = await res.json();
        const userData = json?.data?.user || {};
        const profile = json?.data?.profile || {};
        setData({
          name: userData.name,
          email: userData.email,
          phone: profile.phone,
          company: profile.company,
          avatar: profile.avatar,
          avatarType: profile.avatarType,
        });
        if (profile.avatar) {
          setAvatarPreview(profile.avatar);
        }
      } catch {
        // noop
      }
    })();
  }, [api]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('REJEIÇÃO DE FORMATO: APENAS IMAGENS SÃO ACEITAS.', 'error', 3000);
      return;
    }

    setUploadingAvatar(true);

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('kind', 'avatar');

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) throw new Error('FALHA NO UPLOAD DO ATIVO');

      const uploadData = await uploadRes.json();
      const avatarUrl = uploadData.url;

      const updateRes = await fetch(`${api}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ avatar: avatarUrl, avatarType: 'upload' }),
      });

      if (updateRes.ok) {
        setData({ ...data, avatar: avatarUrl, avatarType: 'upload' });
        showToast('BIOMETRIA ATUALIZADA COM SUCESSO! ✅', 'success', 3000);
        window.dispatchEvent(new CustomEvent('avatarUpdated', { detail: { avatarUrl } }));
      } else {
        throw new Error('ERRO NA PERSISTÊNCIA DOS DADOS');
      }
    } catch (error) {
      showToast('ERRO OPERACIONAL DE UPLOAD', 'error', 3000);
      setAvatarPreview(data.avatar || null);
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      const res = await fetch(`${api}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ avatar: null, avatarType: 'default' }),
      });

      if (res.ok) {
        setData({ ...data, avatar: undefined, avatarType: 'default' });
        setAvatarPreview(null);
        showToast('FOTO DE PERFIL REMOVIDA', 'success', 3000);
        window.dispatchEvent(new CustomEvent('avatarUpdated', { detail: { avatarUrl: null } }));
      }
    } catch (error) {
      showToast('ERRO NA PURGAÇÃO DE ATIVO', 'error', 3000);
    }
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    try {
      const res = await fetch(`${api}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: data.name,
          phone: data.phone,
          company: data.company,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        showToast('PERFIL ATUALIZADO NO NEXUS! ✅', 'success', 3000);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        showToast('ERRO NA SINCRONIZAÇÃO DE PERFIL', 'error', 3000);
      }
    } catch (error) {
      showToast('ERRO OPERACIONAL DE REDE', 'error', 3000);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-16" onSubmit={onSubmit}>

      {/* Biometric Data Node (Avatar Section) */}
      <div className="flex flex-col md:flex-row items-center gap-12 border-b border-white/5 pb-16">
        <div className="relative group">
          {/* Scan Animation Ring */}
          <div className="absolute -inset-4 border border-green-500/20 rounded-full animate-spin" style={{ animationDuration: '8s' }} />
          <div className="absolute -inset-8 border border-white/5 rounded-full animate-spin-reverse" style={{ animationDuration: '12s' }} />

          <div className="relative w-48 h-48 rounded-full overflow-hidden border-[6px] border-[#111] shadow-[0_0_50px_rgba(34,197,94,0.1)] group">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Biometric Scan" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            ) : (
              <div className="w-full h-full bg-[#080808] flex items-center justify-center">
                <Fingerprint className="w-16 h-16 text-white/10 group-hover:text-green-500 transition-colors" />
              </div>
            )}

            {/* Upload Overlay */}
            <AnimatePresence>
              {uploadingAvatar && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-3"
                >
                  <Activity className="w-8 h-8 text-green-500 animate-pulse" />
                  <span className="text-[9px] font-black text-white uppercase tracking-widest">Uploading...</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quick Actions Positioning */}
          <div className="absolute -bottom-2 right-4 flex gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="w-12 h-12 bg-green-500 hover:bg-green-400 rounded-2xl text-black shadow-2xl transition-all hover:scale-110 active:scale-90 flex items-center justify-center"
            >
              <Camera size={20} fill="currentColor" />
            </button>
            {avatarPreview && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                disabled={uploadingAvatar}
                className="w-12 h-12 bg-red-500/10 hover:bg-red-500 rounded-2xl text-red-500 hover:text-white border border-red-500/20 transition-all hover:scale-110 flex items-center justify-center"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 space-y-4 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-4 text-white/20">
            <Terminal size={14} />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] italic">BIOMETRIC_DATA_NODE // V5</span>
          </div>
          <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">Avatar de Operação</h3>
          <p className="text-[11px] font-bold text-white/20 uppercase tracking-widest italic leading-relaxed max-w-sm">
            Sua imagem de identificação no ecossistema Skaleaki. Recomenda-se o uso de ativos em alta resolução (PNG/JPG).
          </p>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
        </div>
      </div>

      {/* Technical Form Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {[
          { label: 'Nome de Operação', id: 'name', icon: User, placeholder: 'IDENTIFICADOR_CIVIL', value: data.name, color: 'text-green-500' },
          { label: 'Matriz de Email', id: 'email', icon: Mail, placeholder: 'PROTOCOLO_SMTP', value: data.email, color: 'text-cyan-500', disabled: true },
          { label: 'Terminal de Contato', id: 'phone', icon: Phone, placeholder: '(00) 00000-0000', value: data.phone, color: 'text-purple-500' },
          { label: 'Entidade / Corporação', id: 'company', icon: Building2, placeholder: 'ORG_IDENTIFIER', value: data.company, color: 'text-orange-500' }
        ].map((field) => (
          <div key={field.id} className="space-y-4">
            <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] italic flex items-center gap-3 ml-2">
              <field.icon size={11} className={field.color} />
              {field.label}
            </label>
            <div className="relative group">
              <div className={clsx(
                "absolute -inset-0.5 rounded-2xl blur opacity-0 transition-opacity duration-700",
                field.disabled ? "" : "bg-white/10 group-focus-within:opacity-100"
              )} />
              <div className="relative flex items-center">
                <input
                  type={field.id === 'email' ? 'email' : 'text'}
                  value={field.value || ''}
                  onChange={(e) => setData({ ...data, [field.id]: e.target.value })}
                  disabled={field.disabled}
                  placeholder={field.placeholder}
                  className={clsx(
                    "w-full px-8 py-6 bg-[#080808] border rounded-2xl text-[14px] font-black outline-none transition-all uppercase tracking-widest italic",
                    field.disabled
                      ? "border-white/5 text-white/10 cursor-not-allowed"
                      : "border-white/5 text-white placeholder:text-white/5 focus:border-white/20"
                  )}
                />
                {field.disabled && (
                  <ShieldAlert size={14} className="absolute right-6 text-white/10" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Critical Save Action */}
      <div className="pt-10 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-4 text-white/10">
          <Activity size={16} className="animate-pulse" />
          <span className="text-[9px] font-black uppercase tracking-[0.3em]">Estado_Acesso: Autenticado_Seguro</span>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={clsx(
            "w-full sm:w-auto px-16 py-8 rounded-[2rem] font-black text-[14px] uppercase tracking-[0.4em] transition-all duration-700 active:scale-95 shadow-2xl flex items-center justify-center gap-6",
            loading ? "bg-white/5 text-white/20 cursor-wait" :
              success ? "bg-green-500 text-black" : "bg-white text-black hover:bg-green-500"
          )}
        >
          {loading ? (
            <>
              <LoaderCircle className="w-6 h-6 animate-spin" />
              Sincronizando...
            </>
          ) : success ? (
            <>
              <CheckCircle size={22} fill="currentColor" />
              DADOS_PERSISTIDOS
            </>
          ) : (
            <>
              <Save size={22} fill="currentColor" />
              EFETUAR_SALVAMENTO
            </>
          )}
        </button>
      </div>
    </form>
  );
}
