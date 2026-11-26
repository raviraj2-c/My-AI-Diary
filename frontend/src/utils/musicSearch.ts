export interface MoodMusicQuery {
  mood: string;
  label: string;
  description: string;
  keywords: string;
}

export const MOOD_MUSIC_MAP: Record<string, MoodMusicQuery> = {
  anxious: {
    mood: 'anxious',
    label: 'Deep Calming & Ambient',
    description: 'Slow 432Hz ambient soundscapes and gentle rain to quiet an overactive mind.',
    keywords: 'calming ambient rain soundscape 432hz'
  },
  sad: {
    mood: 'sad',
    label: 'Gentle Acoustic & Solace',
    description: 'Soft piano and mellow acoustic strings that hold compassionate space.',
    keywords: 'gentle acoustic piano melancholy comforting'
  },
  angry: {
    mood: 'angry',
    label: 'Binaural Release & Grounding',
    description: 'Low-frequency grounding drones and nature thunderstorms to release tension.',
    keywords: 'deep grounding binaural beats thunderstorm'
  },
  happy: {
    mood: 'happy',
    label: 'Uplifting Acoustic & Indie',
    description: 'Warm, sunny melodies and breezy rhythms celebrating life.',
    keywords: 'uplifting sunny indie folk feel good morning'
  },
  excited: {
    mood: 'excited',
    label: 'Energetic Beats & Groove',
    description: 'Upbeat tempo, funk and motivating rhythm to ride the creative wave.',
    keywords: 'upbeat electro swing motivating flow groove'
  },
  peaceful: {
    mood: 'peaceful',
    label: 'Lo-Fi Chill & Zen Garden',
    description: 'Quiet lo-fi beats, bird songs, and soft wind chimes for mindful presence.',
    keywords: 'lofi hip hop chill beats zen meditation'
  },
  neutral: {
    mood: 'neutral',
    label: 'Focus Study Flow',
    description: 'Subtle instrumental focus tracks that help you stay present and grounded.',
    keywords: 'ambient study beats instrumental flow focus'
  }
};

export const getMoodMusicLinks = (mood?: string) => {
  const key = (mood || 'peaceful').toLowerCase().trim();
  const config = MOOD_MUSIC_MAP[key] || MOOD_MUSIC_MAP.neutral;

  const encodedKeywords = encodeURIComponent(config.keywords);

  return {
    ...config,
    youtubeUrl: `https://www.youtube.com/results?search_query=${encodedKeywords}`,
    spotifyUrl: `https://open.spotify.com/search/${encodedKeywords}`
  };
};
