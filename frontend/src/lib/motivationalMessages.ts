export interface MotivationalMessage {
  text: string;
  emoji: string;
  category: 'greeting' | 'achievement' | 'encouragement' | 'milestone' | 'daily';
}

export const motivationalMessages: MotivationalMessage[] = [
  // Greeting
  {
    text: 'Bom dia, explorador! 🌅',
    emoji: '🌅',
    category: 'greeting',
  },
  {
    text: 'Que tal descobrir ofertas incríveis hoje? 🚀',
    emoji: '🚀',
    category: 'greeting',
  },
  {
    text: 'Vamos escalar novos patamares! 💪',
    emoji: '💪',
    category: 'greeting',
  },

  // Achievement
  {
    text: 'Parabéns pela sua dedicação! 🎉',
    emoji: '🎉',
    category: 'achievement',
  },
  {
    text: 'Você está no caminho certo! ⭐',
    emoji: '⭐',
    category: 'achievement',
  },
  {
    text: 'Grandes conquistas começam com pequenos passos! 👣',
    emoji: '👣',
    category: 'achievement',
  },

  // Encouragement
  {
    text: 'Continue explorando, há muito mais por descobrir! 🔍',
    emoji: '🔍',
    category: 'encouragement',
  },
  {
    text: 'A persistência é a chave do sucesso! 🔑',
    emoji: '🔑',
    category: 'encouragement',
  },
  {
    text: 'A cada oferta favoritada, você se aproxima do topo! 🏔️',
    emoji: '🏔️',
    category: 'encouragement',
  },
  {
    text: 'Não desista, você está evoluindo! 📈',
    emoji: '📈',
    category: 'encouragement',
  },

  // Milestone
  {
    text: 'Wow! Você chegou em um novo nível! 🎊',
    emoji: '🎊',
    category: 'milestone',
  },
  {
    text: 'Incrível progresso! Continue assim! 🌟',
    emoji: '🌟',
    category: 'milestone',
  },
  {
    text: 'Você é uma máquina de conquistas! 🤖',
    emoji: '🤖',
    category: 'milestone',
  },

  // Daily
  {
    text: 'Que seu dia seja repleto de descobertas valiosas! 💎',
    emoji: '💎',
    category: 'daily',
  },
  {
    text: 'Cada dia é uma nova oportunidade de crescimento! 🌱',
    emoji: '🌱',
    category: 'daily',
  },
  {
    text: 'Mantenha a chama acesa! 🔥',
    emoji: '🔥',
    category: 'daily',
  },
];

export const getRandomMessage = (category?: MotivationalMessage['category']): MotivationalMessage => {
  const filtered = category
    ? motivationalMessages.filter(msg => msg.category === category)
    : motivationalMessages;
  
  return filtered[Math.floor(Math.random() * filtered.length)];
};

export const getMessageByContext = (
  context: 'morning' | 'afternoon' | 'evening' | 'achievement' | 'level-up'
): MotivationalMessage => {
  switch (context) {
    case 'morning':
      return getRandomMessage('greeting');
    case 'afternoon':
    case 'evening':
      return getRandomMessage('daily');
    case 'achievement':
      return getRandomMessage('achievement');
    case 'level-up':
      return getRandomMessage('milestone');
    default:
      return getRandomMessage('encouragement');
  }
};

