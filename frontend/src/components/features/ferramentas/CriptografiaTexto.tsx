"use client";

import { useState } from 'react';
import { Card3D } from '@/components/ui/Card3D';
import { Button } from '@/components/ui/Button';
import {
  Lock,
  Unlock,
  FileText,
  FileUp,
  Copy,
  Download,
  AlertCircle,
  CheckCircle,
  Shield,
  ShieldCheck,
  Zap,
  Activity,
  Terminal,
  Cpu,
  RefreshCw,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

// ─────────────────────────────────────────────────────────────────
// @ux-design-expert (Uma) · Premium CriptografiaTexto v5.0
// Design Path: Mastery High-Fidelity / Cryptographic Text Shield
// ─────────────────────────────────────────────────────────────────

export function CriptografiaTexto() {
  const [textInput, setTextInput] = useState<string>('');
  const [textFile, setTextFile] = useState<File | null>(null);
  const [obfuscatedText, setObfuscatedText] = useState<string>('');
  const [deobfuscatedText, setDeobfuscatedText] = useState<string>('');
  const [obfuscating, setObfuscating] = useState(false);
  const [deobfuscating, setDeobfuscating] = useState(false);
  const [cryptoError, setCryptoError] = useState<string>('');
  const [cryptoCopied, setCryptoCopied] = useState(false);
  const [cryptoMode, setCryptoMode] = useState<'obfuscate' | 'deobfuscate'>('obfuscate');

  const handleTextFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.txt')) {
      setCryptoError('REJEIÇÃO DE FORMATO: APENAS ARQUIVOS .TXT SÃO ACEITOS NO BUFFER.');
      return;
    }

    setTextFile(file);
    setCryptoError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setTextInput(content);
    };
    reader.onerror = () => {
      setCryptoError('FALHA NA LEITURA DA MATRIZ DE TEXTO.');
    };
    reader.readAsText(file);
  };

  // Invisible Chars Logic (Same as original)
  const ZERO_WIDTH_SPACE = '\u200B';
  const ZERO_WIDTH_NON_JOINER = '\u200C';
  const ZERO_WIDTH_JOINER = '\u200D';
  const LEFT_TO_RIGHT_MARK = '\u200E';
  const RIGHT_TO_LEFT_MARK = '\u200F';
  const WORD_JOINER = '\u2060';
  const INVISIBLE_SEPARATOR = '\u2063';
  const INVISIBLE_PLUS = '\u2064';
  const FUNCTION_APPLICATION = '\u2061';
  const INVISIBLE_TIMES = '\u2062';
  const LEFT_TO_RIGHT_EMBEDDING = '\u202A';
  const RIGHT_TO_LEFT_EMBEDDING = '\u202B';
  const POP_DIRECTIONAL_FORMATTING = '\u202C';
  const LEFT_TO_RIGHT_OVERRIDE = '\u202D';
  const RIGHT_TO_LEFT_OVERRIDE = '\u202E';
  const ZERO_WIDTH_NO_BREAK_SPACE = '\uFEFF';
  const SOFT_HYPHEN = '\u00AD';

  const obfuscateText = () => {
    if (!textInput.trim()) {
      setCryptoError('BUFFER VAZIO: INSIRA O TEXTO PARA OFUSCAÇÃO.');
      return;
    }

    setObfuscating(true);
    setCryptoError('');
    setObfuscatedText('');

    setTimeout(() => {
      try {
        let obfuscated = '';
        const invisibleChars = [
          ZERO_WIDTH_SPACE, ZERO_WIDTH_NON_JOINER, ZERO_WIDTH_JOINER,
          LEFT_TO_RIGHT_MARK, RIGHT_TO_LEFT_MARK, WORD_JOINER,
          INVISIBLE_SEPARATOR, INVISIBLE_PLUS, FUNCTION_APPLICATION,
          INVISIBLE_TIMES, LEFT_TO_RIGHT_EMBEDDING, RIGHT_TO_LEFT_EMBEDDING,
          POP_DIRECTIONAL_FORMATTING, LEFT_TO_RIGHT_OVERRIDE, RIGHT_TO_LEFT_OVERRIDE,
          ZERO_WIDTH_NO_BREAK_SPACE, SOFT_HYPHEN,
        ];

        obfuscated += LEFT_TO_RIGHT_MARK + RIGHT_TO_LEFT_MARK +
          LEFT_TO_RIGHT_EMBEDDING + RIGHT_TO_LEFT_EMBEDDING +
          ZERO_WIDTH_NO_BREAK_SPACE;

        for (let i = 0; i < textInput.length; i++) {
          const char = textInput[i];
          const isWhitespace = char === ' ' || char === '\n' || char === '\r' || char === '\t';
          obfuscated += char;

          if (i < textInput.length - 1 && !isWhitespace) {
            if (Math.random() > 0.2) {
              const numInvisible = Math.floor(Math.random() * 4) + 3;
              for (let j = 0; j < numInvisible; j++) {
                obfuscated += invisibleChars[Math.floor(Math.random() * invisibleChars.length)];
              }
              if (Math.random() > 0.6) {
                const directionMarks = [LEFT_TO_RIGHT_EMBEDDING, RIGHT_TO_LEFT_EMBEDDING, LEFT_TO_RIGHT_OVERRIDE, RIGHT_TO_LEFT_OVERRIDE, POP_DIRECTIONAL_FORMATTING];
                obfuscated += directionMarks[Math.floor(Math.random() * directionMarks.length)];
              }
            }
          }
        }
        obfuscated += RIGHT_TO_LEFT_MARK + LEFT_TO_RIGHT_MARK + POP_DIRECTIONAL_FORMATTING + RIGHT_TO_LEFT_EMBEDDING + LEFT_TO_RIGHT_EMBEDDING + ZERO_WIDTH_NO_BREAK_SPACE;
        setObfuscatedText(obfuscated);
      } catch (err) {
        setCryptoError('ERRO NA GERAÇÃO DA CAMADA DE OFUSCAÇÃO.');
      } finally {
        setObfuscating(false);
      }
    }, 800);
  };

  const deobfuscateText = () => {
    if (!textInput.trim()) {
      setCryptoError('BUFFER VAZIO: INSIRA A MATRIZ OFUSCADA.');
      return;
    }

    setDeobfuscating(true);
    setCryptoError('');
    setDeobfuscatedText('');

    setTimeout(() => {
      try {
        let deobfuscated = textInput;
        const invisibleChars = [
          ZERO_WIDTH_SPACE, ZERO_WIDTH_NON_JOINER, ZERO_WIDTH_JOINER,
          LEFT_TO_RIGHT_MARK, RIGHT_TO_LEFT_MARK, WORD_JOINER,
          INVISIBLE_SEPARATOR, INVISIBLE_PLUS, FUNCTION_APPLICATION,
          INVISIBLE_TIMES, LEFT_TO_RIGHT_EMBEDDING, RIGHT_TO_LEFT_EMBEDDING,
          POP_DIRECTIONAL_FORMATTING, LEFT_TO_RIGHT_OVERRIDE, RIGHT_TO_LEFT_OVERRIDE,
          ZERO_WIDTH_NO_BREAK_SPACE, SOFT_HYPHEN,
        ];

        invisibleChars.forEach(char => {
          const escaped = char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          deobfuscated = deobfuscated.replace(new RegExp(escaped, 'g'), '');
        });
        setDeobfuscatedText(deobfuscated);
      } catch (err) {
        setCryptoError('FALHA NA PURGAÇÃO DE CARACTERES INVISÍVEIS.');
      } finally {
        setDeobfuscating(false);
      }
    }, 800);
  };

  const copyCryptoText = () => {
    const textToCopy = cryptoMode === 'obfuscate' ? obfuscatedText : deobfuscatedText;
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCryptoCopied(true);
    setTimeout(() => setCryptoCopied(false), 2000);
  };

  const clearInput = () => {
    setTextInput('');
    setTextFile(null);
    setObfuscatedText('');
    setDeobfuscatedText('');
    setCryptoError('');
  };

  return (
    <div className="space-y-12">

      {/* Dynamic Command Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

        {/* Left: Configuration & Input */}
        <div className="lg:col-span-8 flex flex-col gap-10">

          {/* Encryption Mode Switcher */}
          <div className="flex p-2 bg-white/[0.02] border border-white/5 rounded-[2.5rem] gap-2">
            {[
              { id: 'obfuscate', label: 'MODO_OFUSCAÇÃO', icon: Shield, desc: 'Proteção Algorítmica' },
              { id: 'deobfuscate', label: 'MODO_DECODING', icon: Unlock, desc: 'Purgação de Caracteres' }
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => { setCryptoMode(mode.id as any); clearInput(); }}
                className={clsx(
                  "flex-1 flex flex-col items-center gap-2 py-6 rounded-[2rem] transition-all duration-700",
                  cryptoMode === mode.id ? "bg-blue-500 text-black shadow-2xl" : "text-white/20 hover:text-white/60 hover:bg-white/5"
                )}
              >
                <mode.icon size={20} className={cryptoMode === mode.id ? "text-black" : "text-blue-500/40"} />
                <div className="text-center">
                  <span className="text-[11px] font-black uppercase tracking-widest block">{mode.label}</span>
                  <span className={clsx("text-[9px] font-bold uppercase italic", cryptoMode === mode.id ? "text-black/60" : "text-white/10")}>{mode.desc}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Main Text Surface */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] italic flex items-center gap-3">
                <Terminal size={11} className="text-blue-500/40" />
                TEXT_INPUT // MATRIZ_DE_DADOS
              </label>
              <label htmlFor="text-file-upload" className="cursor-pointer group flex items-center gap-3 px-4 py-1.5 bg-white/5 border border-white/5 rounded-full hover:bg-white/10 transition-all">
                <FileUp size={12} className="text-blue-500/40" />
                <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">{textFile ? textFile.name : 'UPLOAD_.TXT'}</span>
                <input type="file" id="text-file-upload" accept=".txt" onChange={handleTextFileUpload} className="hidden" />
              </label>
            </div>

            <div className="relative group/textarea">
              <div className="absolute -inset-0.5 bg-blue-500/10 rounded-[2.5rem] blur opacity-0 group-focus-within:opacity-100 transition-all duration-700" />
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={cryptoMode === 'obfuscate' ? 'INSERIR TEXTO PARA BLINDAGEM OPERACIONAL...' : 'INSERIR TEXTO OFUSCADO PARA DECODIFICAÇÃO...'}
                className="relative w-full h-80 px-10 py-10 bg-[#080808] border border-white/5 rounded-[2.5rem] text-[15px] font-black text-white placeholder:text-white/10 outline-none focus:border-blue-500/40 transition-all uppercase tracking-tighter italic leading-relaxed scrollbar-none"
              />
              {textInput && (
                <button onClick={clearInput} className="absolute top-6 right-8 p-2 rounded-full bg-white/5 text-white/20 hover:text-red-500 transition-colors z-20">
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Execution Blade */}
          <button
            onClick={cryptoMode === 'obfuscate' ? obfuscateText : deobfuscateText}
            disabled={obfuscating || deobfuscating}
            className={clsx(
              "w-full py-10 rounded-[2.5rem] font-black text-[15px] uppercase tracking-[0.4em] transition-all duration-700 active:scale-95 shadow-[0_50px_100px_rgba(30,58,138,0.2)] flex items-center justify-center gap-6",
              (obfuscating || deobfuscating) ? "bg-white/5 text-white/20 cursor-wait" : "bg-blue-600 text-white hover:bg-blue-500 shadow-[0_20px_50px_rgba(37,99,235,0.3)]"
            )}
          >
            {(obfuscating || deobfuscating) ? (
              <>
                <RefreshCw className="animate-spin" size={24} />
                EXECUTANDO_PROTOCOLO...
              </>
            ) : (
              <>
                {cryptoMode === 'obfuscate' ? <Lock size={22} fill="currentColor" /> : <Unlock size={22} fill="currentColor" />}
                {cryptoMode === 'obfuscate' ? 'INICIALIZAR_BLINDAGEM' : 'INICIALIZAR_DECODING'}
              </>
            )}
          </button>

        </div>

        {/* Right: Security Manual & Status */}
        <div className="lg:col-span-4 flex flex-col gap-10">

          <div className="p-10 bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] space-y-10 group">
            <div className="flex items-center gap-3 border-b border-white/5 pb-8">
              <ShieldCheck size={14} className="text-white/20" />
              <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">MANUAL_PROTEÇÃO // V5.0</span>
            </div>

            <div className="space-y-8 flex-1">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Cpu size={14} className="text-blue-500/40" />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Procedimento Heurístico</span>
                </div>
                <p className="text-[11px] font-bold text-white/30 uppercase italic leading-relaxed">
                  Utiliza 17 camadas de caracteres invisíveis Unicode (Zero-Width) inseridos de forma randômica entre cada node de dado.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Activity size={14} className="text-blue-500/40" />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Efeito Bio-Identical</span>
                </div>
                <p className="text-[11px] font-bold text-white/30 uppercase italic leading-relaxed">
                  O output permanece 100% visualmente idêntico à fonte original, confundindo apenas indexadores algorítmicos.
                </p>
              </div>
            </div>

            <div className="pt-8 border-t border-white/5">
              <div className="flex items-center gap-5 px-6 py-4 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                <Lock size={16} className="text-blue-500" />
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest animate-pulse">SHIELD_ACTIVE</span>
              </div>
            </div>
          </div>

          {/* Summary Widget */}
          <div className="p-8 bg-white/[0.01] border border-white/5 rounded-[2.5rem] space-y-4">
            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Network_Integrity</span>
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(i => <div key={i} className="w-1.5 h-6 bg-blue-500/20 rounded-full" />)}
              </div>
              <span className="text-2xl font-black text-white italic">0.00%</span>
            </div>
          </div>

        </div>
      </div>

      {/* Output Results Blade */}
      <AnimatePresence>
        {cryptoError && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="p-8 bg-red-500/5 border border-red-500/20 rounded-[2.5rem] flex items-center gap-8">
            <AlertCircle size={32} className="text-red-500" />
            <div className="space-y-1">
              <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">ERROR_LOG_V3</span>
              <p className="text-xl font-black text-white italic uppercase tracking-tighter">{cryptoError}</p>
            </div>
          </motion.div>
        )}

        {(obfuscatedText || deobfuscatedText) && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
            <div className="p-10 lg:p-14 bg-white/[0.02] border border-white/5 rounded-[4rem] relative overflow-hidden group">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-12 border-b border-white/5 pb-10 mb-10 relative z-10">
                <div className="flex items-center gap-8">
                  <div className="w-20 h-20 rounded-[2rem] bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-500">
                    <CheckCircle size={32} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">OUTPUT_SYNC // CONCLUÍDO</h3>
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest italic font-mono">ID: {Math.random().toString(16).slice(2, 10).toUpperCase()}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={copyCryptoText}
                    className={clsx(
                      "px-10 py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all duration-700 flex items-center justify-center gap-4",
                      cryptoCopied ? "bg-green-500 text-black shadow-2xl" : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <Copy size={18} />
                    {cryptoCopied ? 'CÓPIA_SUCESSO' : 'COPIAR_DADOS'}
                  </button>
                  <button onClick={downloadCryptoText} className="px-10 py-5 rounded-2xl bg-[#111] border border-white/5 text-white font-black text-[11px] uppercase tracking-[0.2em] transition-all hover:bg-white hover:text-black">
                    <Download size={18} />
                    BAIXAR_MATRIZ
                  </button>
                </div>
              </div>

              <div className="bg-[#050505] rounded-[2.5rem] p-10 lg:p-14 overflow-x-auto max-h-[60vh] border border-white/5 relative group/code">
                <div className="absolute top-6 right-8 opacity-20 pointer-events-none group-hover/code:opacity-40 transition-opacity">
                  <Lock size={120} />
                </div>
                <pre className="font-mono text-[13px] leading-relaxed text-blue-500/60 selection:bg-blue-500/20 selection:text-blue-500 italic">
                  <code>{cryptoMode === 'obfuscate' ? obfuscatedText : deobfuscatedText}</code>
                </pre>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
