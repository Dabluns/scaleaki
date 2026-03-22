import React from 'react';
import { Button } from './Button';
import { BadgeAnimated } from './BadgeAnimated';
import { Card3D } from './Card3D';

export const TestComponents: React.FC = () => {
  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold text-text">Teste dos Componentes Dopaminérgicos</h1>
      
      {/* Teste dos Botões */}
      <Card3D variant="elevated" className="p-6">
        <h2 className="text-xl font-semibold mb-4">Botões</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="default">Botão Padrão</Button>
          <Button variant="gradient">Botão Gradiente</Button>
          <Button variant="default" hasRipple>Com Ripple</Button>
          <Button variant="gradient" hasGlow>Com Glow</Button>
        </div>
      </Card3D>

      {/* Teste dos Badges */}
      <Card3D variant="glass" className="p-6">
        <h2 className="text-xl font-semibold mb-4">Badges Animados</h2>
        <div className="flex flex-wrap gap-4">
          <BadgeAnimated variant="new" color="green">Novo</BadgeAnimated>
          <BadgeAnimated variant="trending" color="purple">Trending</BadgeAnimated>
          <BadgeAnimated variant="premium" color="gradient" shimmer>Premium</BadgeAnimated>
          <BadgeAnimated variant="achievement" color="orange" glow>Conquista</BadgeAnimated>
        </div>
      </Card3D>

      {/* Teste dos Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card3D variant="default" hover>
          <h3 className="font-semibold mb-2">Card Padrão</h3>
          <p className="text-sm text-text-secondary">Card com hover básico</p>
        </Card3D>
        
        <Card3D variant="elevated" glow>
          <h3 className="font-semibold mb-2">Card Elevado</h3>
          <p className="text-sm text-text-secondary">Card com glow effect</p>
        </Card3D>
        
        <Card3D variant="glass" gradient>
          <h3 className="font-semibold mb-2">Card Glass</h3>
          <p className="text-sm text-text-secondary">Card com gradiente</p>
        </Card3D>
      </div>
    </div>
  );
};

