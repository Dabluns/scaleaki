'use client';

import { OfertasDestaque } from '@/components/features/dashboard/OfertasDestaque';
import { NichosPopulares } from '@/components/features/dashboard/NichosPopulares';
import { MetricasUsuario } from '@/components/features/dashboard/MetricasUsuario';
import { AcoesRapidas } from '@/components/features/dashboard/AcoesRapidas';
import { HomeBanner } from '@/components/features/dashboard/HomeBanner';
import { DashboardHero } from '@/components/features/dashboard/DashboardHero';
import { BadgeCollection } from '@/components/gamification/BadgeCollection';
import { AchievementNotifier } from '@/components/gamification/AchievementNotifier';
import { motion } from 'framer-motion';

// ─────────────────────────────────────────────────────────────────
// @ux-design-expert (Uma) · Dashboard Premium Mastery v4.0
// Pegada: Editorial Asymmetric Grid, Immersive depth, Technical Luxury.
// ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <div className="relative min-h-screen bg-transparent selection:bg-green-500/30">
      <AchievementNotifier />

      {/* Background Atmosphere - Ultra Refined */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-green-500/5 blur-[120px] rounded-full animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/5 blur-[120px] rounded-full animate-pulse-slow" style={{ animationDelay: '2s' }} />

        {/* Subtle Technical Grid Overlay */}
        <div className="absolute inset-0 opacity-[0.02]"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}
        />
      </div>

      <div className="relative z-10 max-w-[1700px] mx-auto pt-10 pb-20 px-8 lg:px-12">

        {/* PROMINENT BANNER: Visual Anchor at the Top */}
        <section className="mb-20">
          <HomeBanner />
        </section>

        {/* IDENTITY: Personal Status & Greeting */}
        <section className="mb-20">
          <DashboardHero />
        </section>

        {/* CORE ANALYTICS: Asymmetric Editorial Flow */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 lg:gap-20">

          {/* Main Intelligence Column (Left/Center) */}
          <div className="xl:col-span-8 space-y-24">

            <motion.section
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <OfertasDestaque />
            </motion.section>

            <div className="h-px w-full bg-gradient-to-r from-white/5 via-white/10 to-transparent" />

            <motion.section
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <AcoesRapidas />
            </motion.section>

            <div className="h-px w-full bg-gradient-to-r from-white/5 via-white/10 to-transparent" />

            <motion.section
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <NichosPopulares />
            </motion.section>
          </div>

          {/* Side Performance Column (Right) */}
          <div className="xl:col-span-4 space-y-12">
            <div className="sticky top-12">
              <motion.section
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <MetricasUsuario />
              </motion.section>

              {/* Achievement Summary Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="mt-12 p-8 rounded-3xl bg-white/[0.02] border border-white/5 backdrop-blur-md"
              >
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">Galeria de Elite</h3>
                  <span className="text-2xl">🏆</span>
                </div>
                <BadgeCollection />
              </motion.div>
            </div>
          </div>

        </div>

        {/* Footer Filler */}
        <div className="mt-32 flex flex-col items-center">
          <div className="h-20 w-[1px] bg-gradient-to-b from-green-500/50 to-transparent mb-8" />
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/10">Skaleaki Intelligence Systems © 2026</p>
        </div>
      </div>
    </div>
  );
}
