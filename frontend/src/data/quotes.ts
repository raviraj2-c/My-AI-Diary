export interface QuoteItem {
  id: number;
  text: string;
  author: string;
  moodCategory: 'happy' | 'sad' | 'neutral' | 'excited' | 'anxious' | 'angry' | 'peaceful';
}

export const QUOTES_DATABASE: QuoteItem[] = [
  // Peaceful / Calm
  { id: 1, text: "Peace comes from within. Do not seek it without.", author: "Traditional Proverb", moodCategory: "peaceful" },
  { id: 2, text: "Within you, there is a stillness and a sanctuary to which you can retreat at any time.", author: "Reflective Wisdom", moodCategory: "peaceful" },
  { id: 3, text: "Nature does not hurry, yet everything is accomplished.", author: "Ancient Saying", moodCategory: "peaceful" },
  { id: 4, text: "Breathe in peace, breathe out tension. This moment is all there is.", author: "Mindful Reflection", moodCategory: "peaceful" },
  { id: 5, text: "Quiet the mind, and the soul will speak.", author: "Eastern Proverb", moodCategory: "peaceful" },
  { id: 6, text: "The quieter you become, the more you are able to hear.", author: "Traditional Adage", moodCategory: "peaceful" },
  { id: 7, text: "Still waters run deep; let your inner world settle like gentle water.", author: "Calm Reflection", moodCategory: "peaceful" },
  { id: 8, text: "Silence is a source of great strength.", author: "Ancient Maxim", moodCategory: "peaceful" },
  { id: 9, text: "To a mind that is still, the whole universe surrenders.", author: "Philosophical Thought", moodCategory: "peaceful" },
  { id: 10, text: "Let go of what was, accept what is, and trust what will be.", author: "Timeless Wisdom", moodCategory: "peaceful" },

  // Anxious / Grounding
  { id: 11, text: "You do not have to control your thoughts. You just have to stop letting them control you.", author: "Grounding Note", moodCategory: "anxious" },
  { id: 12, text: "Feel your feet on the ground. You are safe here in this present room.", author: "Somatic Reminder", moodCategory: "anxious" },
  { id: 13, text: "Worry does not empty tomorrow of its sorrow, it empties today of its strength.", author: "Classic Proverb", moodCategory: "anxious" },
  { id: 14, text: "Take life one gentle breath at a time; you do not have to solve the whole story right now.", author: "Comforting Note", moodCategory: "anxious" },
  { id: 15, text: "Feelings are just visitors; let them come and go.", author: "Mindful Living", moodCategory: "anxious" },
  { id: 16, text: "Nothing is permanent in this world, not even our troubles.", author: "Classic Wisdom", moodCategory: "anxious" },
  { id: 17, text: "You have survived 100% of your hardest days so far. You are stronger than your worry.", author: "Affirmation", moodCategory: "anxious" },
  { id: 18, text: "Slow your pace. What is meant for you will not pass you by.", author: "Gentle Truth", moodCategory: "anxious" },
  { id: 19, text: "Anxiety is an echo of the future; your life is happening right now in the present.", author: "Calm Thought", moodCategory: "anxious" },
  { id: 20, text: "Soft belly, relaxed jaw, steady heart. You can handle this hour.", author: "Body Check-in", moodCategory: "anxious" },

  // Sad / Comforting
  { id: 21, text: "The wound is the place where the Light enters you.", author: "Classic Poetry", moodCategory: "sad" },
  { id: 22, text: "It is okay to not be okay. Tender days ask for gentle care, not perfection.", author: "Caring Voice", moodCategory: "sad" },
  { id: 23, text: "Even the darkest night will end and the sun will rise.", author: "Traditional Proverb", moodCategory: "sad" },
  { id: 24, text: "Tears are the safety valves of the heart when too much pressure is laid upon it.", author: "Reflective Saying", moodCategory: "sad" },
  { id: 25, text: "Be gentle with yourself. You are doing the best you can with what you carry.", author: "Affirmation", moodCategory: "sad" },
  { id: 26, text: "Heavy clouds bring nourishing rain; your sadness is valid and will pass.", author: "Nature Metaphor", moodCategory: "sad" },
  { id: 27, text: "Give yourself permission to rest without having to earn it.", author: "Compassionate Note", moodCategory: "sad" },
  { id: 28, text: "When you can't look on the bright side, I will sit with you in the dark.", author: "Heartfelt Proverb", moodCategory: "sad" },
  { id: 29, text: "A tiny seed must rest beneath dark earth before it blooms into the sky.", author: "Growth Metaphor", moodCategory: "sad" },
  { id: 30, text: "Your worth is inherent; it does not disappear when your energy fades.", author: "Self-Compassion", moodCategory: "sad" },

  // Angry / Releasing
  { id: 31, text: "Holding onto anger is like holding a hot coal with the intent of throwing it; you are the one burned.", author: "Ancient Wisdom", moodCategory: "angry" },
  { id: 32, text: "Speak when you are angry and you will make the best speech you will ever regret.", author: "Classic Caution", moodCategory: "angry" },
  { id: 33, text: "Between stimulus and response there is a space. In that space is our power to choose.", author: "Philosophical Thought", moodCategory: "angry" },
  { id: 34, text: "Exhale sharply, let your shoulders drop. Protect your peace above winning arguments.", author: "Mindful Reminder", moodCategory: "angry" },
  { id: 35, text: "Anger is an alarm indicating a boundary was touched; listen to the signal, then act with clarity.", author: "Emotional Intelligence", moodCategory: "angry" },
  { id: 36, text: "He who angers you conquers you. Reclaim your sovereignty.", author: "Traditional Proverb", moodCategory: "angry" },
  { id: 37, text: "Release the burning grip. What happened is in the past; your calmness belongs to today.", author: "Inner Strength", moodCategory: "angry" },
  { id: 38, text: "Do not let the behavior of others destroy your inner tranquility.", author: "Wisdom Note", moodCategory: "angry" },

  // Happy / Gratitude
  { id: 39, text: "Joy is not in things; it is in us.", author: "Reflective Proverb", moodCategory: "happy" },
  { id: 40, text: "Enjoy the little things, for one day you may look back and realize they were the big things.", author: "Timeless Reflection", moodCategory: "happy" },
  { id: 41, text: "Gratitude turns what we have into enough.", author: "Traditional Saying", moodCategory: "happy" },
  { id: 42, text: "A warm cup, an open book, a moment of laughter—treasures hidden in ordinary hours.", author: "Diary Note", moodCategory: "happy" },
  { id: 43, text: "Happiness radiates like fragrance from a flower and draws all good things towards you.", author: "Classic Proverb", moodCategory: "happy" },
  { id: 44, text: "The secret of happiness is to see all the marvels of the world.", author: "Folklore Truth", moodCategory: "happy" },
  { id: 45, text: "Celebrate today's light; anchor this warmth in your memory for stormy afternoons.", author: "Mindful Journaling", moodCategory: "happy" },
  { id: 46, text: "When you smile from the heart, you invite the universe to smile back.", author: "Warm Saying", moodCategory: "happy" },

  // Excited / Motivated
  { id: 47, text: "The journey of a thousand miles begins with one single step.", author: "Ancient Tao Saying", moodCategory: "excited" },
  { id: 48, text: "Channel your bright spark into focused action. You have magic in your hands.", author: "Encouragement", moodCategory: "excited" },
  { id: 49, text: "Every morning we are born again. What we do today matters most.", author: "Timeless Thought", moodCategory: "excited" },
  { id: 50, text: "Leap forward with wonder; let curiosity guide your decisions today.", author: "Creative Spark", moodCategory: "excited" },
  { id: 51, text: "Energy flows where attention goes. Plant your focus where you wish to grow.", author: "Growth Mindset", moodCategory: "excited" },
  { id: 52, text: "Trust the timing of your life and savor this burst of inspiration.", author: "Uplifting Truth", moodCategory: "excited" },
  { id: 53, text: "New chapters begin quietly, often with a single brave thought.", author: "Inspirational Note", moodCategory: "excited" },

  // Neutral / Daily Grounding
  { id: 54, text: "Small daily improvements over time lead to stunning results.", author: "Everyday Wisdom", moodCategory: "neutral" },
  { id: 55, text: "Ordinary days are the backbone of a peaceful life.", author: "Gentle Truth", moodCategory: "neutral" },
  { id: 56, text: "Not every day needs to be profound; simple consistency is a quiet victory.", author: "Daily Reminder", moodCategory: "neutral" },
  { id: 57, text: "Show up, be kind, do your quiet best, and let the rest unfold.", author: "Plain Living", moodCategory: "neutral" },
  { id: 58, text: "Drink water, stretch your back, and take a steady step forward.", author: "Simple Habit", moodCategory: "neutral" },
  { id: 59, text: "There is beauty in a blank page and a day waiting to be lived.", author: "Journal Note", moodCategory: "neutral" },
  { id: 60, text: "Balance is not something you find, it's something you create.", author: "Classic Maxim", moodCategory: "neutral" },
  { id: 61, text: "Honor the quiet rhythm of an unhurried afternoon.", author: "Calm Mind", moodCategory: "neutral" },
  { id: 62, text: "Every day holds a quiet miracle if you look closely enough.", author: "Mindful Living", moodCategory: "neutral" },
  { id: 63, text: "You are the author of your personal journey; turn the page gently.", author: "Diary Wisdom", moodCategory: "neutral" }
];

export const getRandomQuoteByMood = (mood?: string): QuoteItem => {
  if (!mood) {
    const idx = Math.floor(Math.random() * QUOTES_DATABASE.length);
    return QUOTES_DATABASE[idx];
  }

  const normalized = mood.toLowerCase().trim();
  const matched = QUOTES_DATABASE.filter(q => q.moodCategory === normalized);

  if (matched.length > 0) {
    const idx = Math.floor(Math.random() * matched.length);
    return matched[idx];
  }

  // Fallback to random
  return QUOTES_DATABASE[Math.floor(Math.random() * QUOTES_DATABASE.length)];
};
