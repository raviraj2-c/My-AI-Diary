const { v4: uuidv4 } = require('uuid');

class AIService {
  static async generateStorybook(entries, theme, timeframe) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const protagonist = this.createAdvancedProtagonist(entries);

    const storybook = {
      id: uuidv4(),
      title: this.generateTitle(theme, timeframe),
      theme,
      timeframe,
      entries,
      generatedContent: this.generateAdvancedStoryContent(entries, theme),
      protagonist,
      chapters: this.createLiteraryChapters(entries, theme, protagonist),
      createdAt: new Date()
    };
    
    return storybook;
  }

  static generateTitle(theme, timeframe) {
    const startMonth = timeframe.start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const endMonth = timeframe.end.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    const themes = {
      romantic: [
        'Whispers of the Heart', 'The Language of Love', 'Seasons of Affection', 
        'Dancing with Destiny', 'The Art of Loving', 'Hearts in Harmony',
        'Love\'s Gentle Revolution', 'The Poetry of Connection'
      ],
      dramatic: [
        'The Weight of Dreams', 'Shadows and Illumination', 'The Human Tapestry', 
        'Echoes of Transformation', 'The Crucible of Life', 'Between Light and Dark',
        'The Architecture of Change', 'Fragments of Truth'
      ],
      adventure: [
        'Beyond the Horizon', 'The Cartographer\'s Dream', 'Uncharted Territories', 
        'The Explorer\'s Heart', 'Paths Less Traveled', 'The Great Discovery',
        'Adventures in Living', 'The Journey Within'
      ],
      mystery: [
        'The Enigma of Being', 'Secrets in Plain Sight', 'The Hidden Pattern', 
        'Mysteries of the Ordinary', 'The Puzzle of Existence', 'Veiled Truths',
        'The Detective of Life', 'Clues in the Everyday'
      ],
      comedy: [
        'The Comedy of Errors', 'Life\'s Delightful Chaos', 'The Art of Laughter', 
        'Humor in the Mundane', 'The Lighter Side of Being', 'Joy\'s Little Victories',
        'The Absurdist\'s Guide to Life', 'Laughter as Medicine'
      ]
    };
    
    const titleOptions = themes[theme] || themes.dramatic;
    const randomTitle = titleOptions[Math.floor(Math.random() * titleOptions.length)];
    
    return `${randomTitle}${startMonth !== endMonth ? `: A Story from ${startMonth} to ${endMonth}` : `: A ${startMonth} Story`}`;
  }

  static generateAdvancedStoryContent(entries, theme) {
    if (entries.length === 0) {
      return "The pages remained blank, waiting for a story to unfold...";
    }

    const sortedEntries = [...entries].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const protagonist = this.createAdvancedProtagonist(sortedEntries);
    
    let storyContent = this.createLiteraryOpening(theme, protagonist);
    
    const chapters = this.createLiteraryChapters(sortedEntries, theme, protagonist);
    
    chapters.forEach((chapter, index) => {
      storyContent += `\n\n---\n\n## ${chapter.title}\n\n`;
      storyContent += chapter.content;
    });
    
    storyContent += this.createLiteraryEnding(theme, protagonist, sortedEntries);
    
    return storyContent;
  }

  static createAdvancedProtagonist(entries) {
    const moods = entries.map(e => e.mood);
    const moodCounts = moods.reduce((acc, mood) => {
      acc[mood] = (acc[mood] || 0) + 1;
      return acc;
    }, {});
    
    const dominantMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';
    
    const personalityTraits = this.generatePersonalityTraits(dominantMood, entries);
    
    return {
      name: this.selectProtagonistName(personalityTraits),
      personality: personalityTraits,
      journey: this.identifyJourneyType(dominantMood, entries),
      growth: this.identifyGrowthPattern(moods)
    };
  }

  static generatePersonalityTraits(dominantMood, entries) {
    const traits = [];
    
    const moodTraits = {
      happy: ['optimistic', 'warm-hearted', 'resilient', 'inspiring'],
      sad: ['introspective', 'sensitive', 'empathetic', 'deep-thinking'],
      neutral: ['balanced', 'observant', 'steady', 'pragmatic'],
      excited: ['enthusiastic', 'adventurous', 'energetic', 'spontaneous'],
      anxious: ['caring', 'thoughtful', 'perceptive', 'conscientious'],
      angry: ['passionate', 'determined', 'strong-willed', 'justice-seeking'],
      peaceful: ['serene', 'wise', 'contemplative', 'harmonious']
    };
    
    traits.push(...(moodTraits[dominantMood] || ['thoughtful']));
    
    const allTags = entries.flatMap(e => e.tags || []);
    if (allTags.includes('work')) traits.push('ambitious');
    if (allTags.includes('family')) traits.push('family-oriented');
    if (allTags.includes('travel')) traits.push('adventurous');
    
    return [...new Set(traits)].slice(0, 4);
  }

  static selectProtagonistName(traits) {
    const names = {
      creative: ['Aurora', 'River', 'Sage', 'Phoenix'],
      thoughtful: ['Elena', 'Marcus', 'Sophia', 'Adrian'],
      adventurous: ['Zara', 'Atlas', 'Nova', 'Orion'],
      gentle: ['Luna', 'Gabriel', 'Iris', 'Kai'],
      strong: ['Vera', 'Leo', 'Maya', 'Dante']
    };
    
    let nameCategory = 'thoughtful';
    
    if (traits.includes('creative') || traits.includes('imaginative')) nameCategory = 'creative';
    else if (traits.includes('adventurous') || traits.includes('energetic')) nameCategory = 'adventurous';
    else if (traits.includes('serene') || traits.includes('peaceful')) nameCategory = 'gentle';
    else if (traits.includes('determined') || traits.includes('strong-willed')) nameCategory = 'strong';
    
    const nameOptions = names[nameCategory];
    return nameOptions[Math.floor(Math.random() * nameOptions.length)];
  }

  static identifyJourneyType(dominantMood, entries) {
    const allTags = entries.flatMap(e => e.tags || []);
    
    if (allTags.includes('growth') || allTags.includes('learning')) return 'self-discovery';
    if (allTags.includes('relationship') || allTags.includes('love')) return 'connection and love';
    if (allTags.includes('challenge') || allTags.includes('difficult')) return 'overcoming obstacles';
    if (allTags.includes('creative') || allTags.includes('art')) return 'creative awakening';
    if (dominantMood === 'happy') return 'transformation and growth';
    return 'finding meaning in everyday moments';
  }

  static identifyGrowthPattern(moods) {
    const firstHalf = moods.slice(0, Math.floor(moods.length / 2));
    const secondHalf = moods.slice(Math.floor(moods.length / 2));
    
    const firstPositive = firstHalf.filter(m => ['happy', 'excited', 'peaceful'].includes(m)).length;
    const secondPositive = secondHalf.filter(m => ['happy', 'excited', 'peaceful'].includes(m)).length;
    
    if (secondPositive > firstPositive) return 'learning to embrace joy and possibility';
    if (firstPositive > secondPositive) return 'healing and finding inner strength';
    return 'discovering the beauty in life\'s ordinary moments';
  }

  static createLiteraryOpening(theme, protagonist) {
    const openings = {
      romantic: `In the tapestry of human experience, some stories are woven with threads of gold—stories of connection, tenderness, and the profound courage it takes to open one's heart. This is the story of ${protagonist.name}, a ${protagonist.personality[0]} soul whose journey through ${protagonist.journey} would reveal the many faces of love.`,
      
      dramatic: `Every life contains within it the seeds of great drama—moments of triumph and despair, revelation and mystery, transformation and redemption. ${protagonist.name}'s story is one such tale, marked by their ${protagonist.personality[0]} spirit and ${protagonist.personality[1]} approach to life's inevitable challenges.`,
      
      adventure: `The greatest adventures are not always found in distant lands or exotic locales—sometimes they unfold in the landscape of a single human heart. ${protagonist.name}, with their ${protagonist.personality[0]} nature and ${protagonist.personality[1]} spirit, was about to embark on such an adventure.`,
      
      mystery: `Life's greatest mysteries are often hidden in plain sight, woven into the fabric of our daily existence like secret messages waiting to be decoded. ${protagonist.name}, a ${protagonist.personality[0]} observer of life's subtle patterns, was about to become the detective of their own story.`,
      
      comedy: `Life, ${protagonist.name} had discovered, was far too important to be taken entirely seriously. With their ${protagonist.personality[0]} outlook and ${protagonist.personality[1]} approach to daily chaos, they had learned to find humor in the most unexpected places.`
    };
    
    return openings[theme] || `This is the story of ${protagonist.name}, whose journey through ${protagonist.journey} would change everything.`;
  }

  static createLiteraryChapters(entries, theme, protagonist) {
    const chapters = [];
    
    const chapterSize = Math.max(1, Math.floor(entries.length / 5));
    
    for (let i = 0; i < entries.length; i += chapterSize) {
      const chapterEntries = entries.slice(i, i + chapterSize);
      const chapterTitle = this.generateChapterTitle(chapterEntries, theme, chapters.length + 1);
      const chapterContent = this.createChapterContent(chapterEntries, theme, protagonist);
      
      chapters.push({
        title: chapterTitle,
        content: chapterContent,
        entryIds: chapterEntries.map(e => e._id || e.id)
      });
    }
    
    return chapters;
  }

  static generateChapterTitle(entries, theme, chapterNumber) {
    const firstEntry = entries[0];
    const mood = firstEntry.mood;
    const date = new Date(firstEntry.date);
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    
    const titleTemplates = {
      romantic: ['The Heart\'s Awakening', 'Whispers of Connection', 'Love\'s Gentle Revelation'],
      dramatic: ['The Turning Tide', 'Shadows and Revelations', 'The Weight of Truth'],
      adventure: ['The Call to Adventure', 'Into Uncharted Territory', 'New Horizons'],
      mystery: ['The First Clue', 'Deeper Into the Enigma', 'Hidden Patterns'],
      comedy: ['The Comedy Begins', 'Delightful Chaos', 'Laughter in Unexpected Places']
    };
    
    const templates = titleTemplates[theme] || titleTemplates.dramatic;
    const baseTitle = templates[(chapterNumber - 1) % templates.length];
    
    return `${baseTitle}: ${month} Reflections`;
  }

  static createChapterContent(entries, theme, protagonist) {
    let content = '';
    
    entries.forEach((entry, index) => {
      const narrative = this.transformEntryToNarrative(entry, theme, protagonist);
      content += narrative;
      
      if (index < entries.length - 1) {
        content += '\n\n';
      }
    });
    
    return content;
  }

  static transformEntryToNarrative(entry, theme, protagonist) {
    const cleanContent = this.cleanHtmlContent(entry.content);
    const date = new Date(entry.date);
    const timeContext = this.createTimeContext(date);
    
    let narrative = `${timeContext}, ${protagonist.name} found themselves reflecting on the day's experiences. `;
    
    if (cleanContent && cleanContent.length > 10) {
      const transformedContent = cleanContent
        .replace(/\bI\b/g, protagonist.name)
        .replace(/\bmy\b/g, `${protagonist.name}'s`)
        .replace(/\bme\b/g, protagonist.name);
      
      narrative += transformedContent;
    } else {
      narrative += this.generateFallbackNarrative(entry.mood, theme, protagonist);
    }
    
    narrative += this.addThematicEnhancement(entry, theme);
    
    return narrative;
  }

  static cleanHtmlContent(htmlContent) {
    return htmlContent
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '')
      .replace(/"/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  static createTimeContext(date) {
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
    const timeOfDay = this.getTimeOfDay(date);
    
    const contexts = [
      `On a ${dayOfWeek} ${timeOfDay}`,
      `During the ${timeOfDay} hours of ${dayOfWeek}`,
      `As ${dayOfWeek}'s ${timeOfDay} unfolded`
    ];
    
    return contexts[Math.floor(Math.random() * contexts.length)];
  }

  static getTimeOfDay(date) {
    const hour = date.getHours();
    if (hour < 6) return 'early morning';
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    if (hour < 21) return 'evening';
    return 'night';
  }

  static generateFallbackNarrative(mood, theme, protagonist) {
    const fallbacks = {
      romantic: {
        happy: `${protagonist.name} felt their heart expand with joy, as if love itself had whispered a secret only they could hear.`,
        sad: `A tender melancholy settled over ${protagonist.name}, beautiful in its depth and meaning.`
      },
      dramatic: {
        happy: `Joy erupted in ${protagonist.name}'s soul like the first light of dawn after a storm.`,
        sad: `${protagonist.name} stood face to face with sorrow, recognizing it as a teacher of profound lessons.`
      }
    };
    
    const themeFallbacks = fallbacks[theme] || fallbacks.dramatic;
    return themeFallbacks[mood] || `${protagonist.name} experienced a moment of profound recognition.`;
  }

  static addThematicEnhancement(entry, theme) {
    const enhancements = {
      romantic: ' This moment became another thread in the tapestry of connection they were learning to weave.',
      dramatic: ' The experience carved itself into their understanding, becoming part of their growth.',
      adventure: ' Each experience added another layer to their expanding map of the world.',
      mystery: ' They sensed this moment contained clues to larger questions life was revealing.',
      comedy: ' The absurd beauty of the moment brought a smile, finding joy in life\'s contradictions.'
    };
    
    return enhancements[theme] || '';
  }

  static createLiteraryEnding(theme, protagonist, entries) {
    const timeSpan = entries.length > 1 ? 
      `from ${new Date(entries[0].date).toLocaleDateString()} to ${new Date(entries[entries.length - 1].date).toLocaleDateString()}` :
      `on ${new Date(entries[0].date).toLocaleDateString()}`;
    
    const endings = {
      romantic: `\n\n---\n\n## Epilogue: The Continuing Story\n\nAs we close this chapter of ${protagonist.name}'s journey ${timeSpan}, we see how love had woven itself through every moment. Their story continues, for love stories never truly end—they simply evolve and find new ways to surprise us.`,
      
      dramatic: `\n\n---\n\n## Epilogue: The Transformed Soul\n\nThe curtain falls on this act of ${protagonist.name}'s life ${timeSpan}, but the drama continues. Through their journey, they had been forged in the crucible of experience, emerging not unscathed, but undaunted.`,
      
      adventure: `\n\n---\n\n## Epilogue: The Endless Journey\n\nAs this chapter of ${protagonist.name}'s adventure ${timeSpan} draws to a close, the greatest discovery was not a destination, but a way of being in the world. The adventure continues for those bold enough to take the next step.`,
      
      mystery: `\n\n---\n\n## Epilogue: The Beautiful Enigma\n\nThe mysteries revealed to ${protagonist.name} ${timeSpan} were glimpses into the greater enigma of existence. The mystery deepens and continues, for those wise enough to know that some questions are more beautiful than their answers.`,
      
      comedy: `\n\n---\n\n## Epilogue: The Last Laugh\n\nAs the laughter from ${protagonist.name}'s journey ${timeSpan} echoes into memory, we're reminded that joy is not just an emotion—it's a choice. The comedy continues for those wise enough to find humor in the human condition.`
    };
    
    return endings[theme] || `\n\n---\n\n## Epilogue\n\nAnd so ${protagonist.name}'s story continues, one moment at a time, building the beautiful narrative of a life fully lived.`;
  }
}

module.exports = { generateStorybook: AIService.generateStorybook.bind(AIService) };