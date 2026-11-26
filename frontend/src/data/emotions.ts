export interface EmotionNode {
  name: string;
  subEmotions?: EmotionNode[];
}

export interface CoreEmotion {
  id: string;
  name: string;
  emoji: string;
  color: string;
  badgeClass: string;
  subEmotions: Array<{
    name: string;
    subEmotions: string[];
  }>;
}

export const EMOTION_WHEEL: CoreEmotion[] = [
  {
    id: 'joy',
    name: 'Joy',
    emoji: '☀️',
    color: '#eab308',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/40 dark:text-amber-200',
    subEmotions: [
      {
        name: 'Happy',
        subEmotions: ['Playful', 'Delighted', 'Amused']
      },
      {
        name: 'Content',
        subEmotions: ['Peaceful', 'Satisfied', 'Serene']
      },
      {
        name: 'Proud',
        subEmotions: ['Accomplished', 'Confident', 'Triumphant']
      },
      {
        name: 'Optimistic',
        subEmotions: ['Hopeful', 'Eager', 'Inspired']
      },
      {
        name: 'Grateful',
        subEmotions: ['Thankful', 'Blessed', 'Appreciative']
      }
    ]
  },
  {
    id: 'love',
    name: 'Love',
    emoji: '🌿',
    color: '#10b981',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-200',
    subEmotions: [
      {
        name: 'Affectionate',
        subEmotions: ['Fond', 'Warm', 'Tender']
      },
      {
        name: 'Compassionate',
        subEmotions: ['Empathetic', 'Kind', 'Caring']
      },
      {
        name: 'Connected',
        subEmotions: ['Understood', 'Accepted', 'Belonging']
      }
    ]
  },
  {
    id: 'sadness',
    name: 'Sadness',
    emoji: '💧',
    color: '#3b82f6',
    badgeClass: 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/40 dark:text-blue-200',
    subEmotions: [
      {
        name: 'Lonely',
        subEmotions: ['Isolated', 'Abandoned', 'Forgotten']
      },
      {
        name: 'Grief',
        subEmotions: ['Heartbroken', 'Loss', 'Sorrowful']
      },
      {
        name: 'Disappointed',
        subEmotions: ['Let down', 'Dismayed', 'Disheartened']
      },
      {
        name: 'Helpless',
        subEmotions: ['Vulnerable', 'Paralyzed', 'Hopeless']
      }
    ]
  },
  {
    id: 'fear',
    name: 'Fear',
    emoji: '🌪️',
    color: '#8b5cf6',
    badgeClass: 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950/40 dark:text-purple-200',
    subEmotions: [
      {
        name: 'Anxious',
        subEmotions: ['Worried', 'Overwhelmed', 'Restless']
      },
      {
        name: 'Insecure',
        subEmotions: ['Inadequate', 'Self-conscious', 'Hesitant']
      },
      {
        name: 'Frightened',
        subEmotions: ['Terrified', 'Nervous', 'Panicked']
      }
    ]
  },
  {
    id: 'anger',
    name: 'Anger',
    emoji: '🔥',
    color: '#ef4444',
    badgeClass: 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950/40 dark:text-rose-200',
    subEmotions: [
      {
        name: 'Frustrated',
        subEmotions: ['Annoyed', 'Exasperated', 'Agitated']
      },
      {
        name: 'Resentful',
        subEmotions: ['Bitter', 'Envious', 'Grudging']
      },
      {
        name: 'Critical',
        subEmotions: ['Skeptical', 'Dismissive', 'Judgmental']
      }
    ]
  },
  {
    id: 'surprise',
    name: 'Surprise',
    emoji: '✨',
    color: '#06b6d4',
    badgeClass: 'bg-cyan-100 text-cyan-900 border-cyan-300 dark:bg-cyan-950/40 dark:text-cyan-200',
    subEmotions: [
      {
        name: 'Awestruck',
        subEmotions: ['Amazed', 'Astonished', 'Humbled']
      },
      {
        name: 'Confused',
        subEmotions: ['Perplexed', 'Disillusioned', 'Puzzled']
      },
      {
        name: 'Startled',
        subEmotions: ['Shocked', 'Dismayed', 'Speechless']
      }
    ]
  }
];
