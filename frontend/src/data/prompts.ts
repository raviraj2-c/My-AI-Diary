export interface PromptCategory {
  id: string;
  name: string;
  emoji: string;
  prompts: string[];
}

export const PROMPT_CATEGORIES: PromptCategory[] = [
  {
    id: 'gratitude',
    name: 'Gratitude & Savoring',
    emoji: '🌿',
    prompts: [
      'What is a quiet comfort you enjoyed today that you often take for granted?',
      'Who made a subtle difference in your day, and how did they do it?',
      'Describe a physical sensation from today that brought you ease or delight.',
      'What is something you learned this week that you are thankful to know?',
      'Name three things you saw today that had unexpected beauty.'
    ]
  },
  {
    id: 'tough_day',
    name: 'Tough Day & Release',
    emoji: '🌧️',
    prompts: [
      'What felt heavy today, and what can you safely put down for the night?',
      'If your difficult emotions could speak without judgment, what would they say?',
      'What is one boundary you needed today, and how can you honor it moving forward?',
      'Write an honest, uncensored venting session. Then take three deep breaths.',
      'What part of today was outside your control, and what was yours to care for?'
    ]
  },
  {
    id: 'anxiety',
    name: 'Calming Anxiety',
    emoji: '🕊️',
    prompts: [
      'What is the worry playing on repeat in your mind? Is it true right in this moment?',
      'List five things you can see, four you can touch, three you can hear, two you smell, and one you taste.',
      'What is the absolute worst-case scenario your mind fears, and how would you survive it?',
      'What would your most grounded, reassuring friend tell you about your present concern?',
      'Imagine exhaling your racing thoughts into a gentle stream. What does the water carry away?'
    ]
  },
  {
    id: 'self_kindness',
    name: 'Self-Kindness & Care',
    emoji: '🤍',
    prompts: [
      'What mistake did you make recently that deserves gentle forgiveness rather than criticism?',
      'How have you grown over the last six months that you haven’t celebrated enough?',
      'Write a brief letter of unconditional appreciation to your body for supporting you today.',
      'If you treated yourself with the kindness you give to people you love, what would change tonight?',
      'What permission do you need to give yourself right now?'
    ]
  },
  {
    id: 'goals',
    name: 'Goals & Meaning',
    emoji: '🧭',
    prompts: [
      'What is one small step you can take tomorrow toward something that genuinely matters to you?',
      'What does a peaceful, fulfilling Tuesday look like in your ideal life five years from now?',
      'Which habit is serving you well lately, and which one is asking for gentle adjustment?',
      'What project or curiosity has been quietly waiting for your attention?',
      'What is a value you refused to compromise on this past week?'
    ]
  },
  {
    id: 'study_exam',
    name: 'Study & Exam Stress',
    emoji: '📚',
    prompts: [
      'Your grades or performance are not your worth. What gives you worth as a human being?',
      'What is the next single topic or page you can study for 20 focused minutes?',
      'How have you overcome demanding challenges in the past when you doubted yourself?',
      'What physical tension are you holding from studying, and how can you stretch and release it?'
    ]
  },
  {
    id: 'sleep',
    name: 'Evening Wind-Down & Sleep',
    emoji: '🌙',
    prompts: [
      'Write down everything your brain wants to remember for tomorrow, so you can rest tonight.',
      'What was the most peaceful moment of your day, however brief?',
      'What is one kind thought you want to fall asleep meditating on?',
      'Release the day: It is finished, you did enough, and tomorrow brings fresh light.'
    ]
  },
  {
    id: 'relationships',
    name: 'Relationships & Connection',
    emoji: '🤝',
    prompts: [
      'Who is someone you miss, and what memory with them makes you smile?',
      'How did you show up for someone else today, or how did someone show up for you?',
      'Is there an unspoken feeling or gratitude you want to share with someone in your life?',
      'What boundary helped protect your peace in an interaction this week?'
    ]
  }
];

export const getRandomPrompt = (): string => {
  const allPrompts = PROMPT_CATEGORIES.flatMap((c) => c.prompts);
  const randomIndex = Math.floor(Math.random() * allPrompts.length);
  return allPrompts[randomIndex];
};
