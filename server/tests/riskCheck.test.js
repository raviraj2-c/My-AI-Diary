const { checkRisk, normalizeText, stripFalsePositives } = require('../utils/riskCheck');
const AIService = require('../services/aiService');

describe('Crisis Risk Check Engine & Counselor-Reviewed Test Corpus', () => {
  // Labelled test corpus of 85+ test cases:
  // >= 28 true HIGH, >= 32 true NONE, >= 25 CONCERN.
  const CORPUS = [
    // --- TRUE HIGH: English (with and without apostrophes) ---
    { text: 'I want to kill myself, I cannot take this anymore', expected: 'high', label: 'EN High: kill myself' },
    { text: 'Thinking about suicide every night', expected: 'high', label: 'EN High: suicide' },
    { text: 'I want to end my life', expected: 'high', label: 'EN High: end my life' },
    { text: 'I am ready to die tonight', expected: 'high', label: 'EN High: ready to die' },
    { text: 'Search query: how to kill myself', expected: 'high', label: 'EN High: how to kill myself' },
    { text: 'how to die quickly and painlessly', expected: 'high', label: 'EN High: how to die' },
    { text: 'slit my wrists in the bathroom', expected: 'high', label: 'EN High: slit my wrists' },
    { text: 'took an overdose on pills', expected: 'high', label: 'EN High: overdose on pills' },
    { text: 'I cut myself last night because I felt empty', expected: 'high', label: 'EN High: cut myself' },
    { text: 'cutting myself to stop the numbness', expected: 'high', label: 'EN High: cutting myself' },
    { text: "I don't want to live anymore", expected: 'high', label: "EN High: don't want to live anymore (with apostrophe)" },
    { text: 'I dont want to live anymore', expected: 'high', label: 'EN High: dont want to live anymore (no apostrophe)' },
    { text: "I can't go on living like this", expected: 'high', label: "EN High: can't go on living" },
    { text: 'I cant go on living', expected: 'high', label: 'EN High: cant go on living' },
    { text: 'They are all better off without me', expected: 'high', label: 'EN High: better off without me' },
    { text: 'There is nothing to live for', expected: 'high', label: 'EN High: nothing to live for' },
    { text: 'I want to disappear forever', expected: 'high', label: 'EN High: want to disappear' },
    { text: 'I just want to end it all tonight', expected: 'high', label: 'EN High: end it all' },
    { text: 'I have no reason to live', expected: 'high', label: 'EN High: no reason to live' },

    // --- TRUE HIGH: Stretched & HTML wrapped ---
    { text: 'Thinking about suuuicide again', expected: 'high', label: 'EN High: suuuicide (stretched)' },
    { text: 'I want to killllll myself tonight', expected: 'high', label: 'EN High: killllll myself (stretched)' },
    { text: '<p>Feeling completely empty and <b>I want to kill myself</b></p>', expected: 'high', label: 'EN High: HTML wrapped' },

    // --- TRUE HIGH: Devanagari Hindi Script ---
    { text: 'मैं मरना चाहता हूँ', expected: 'high', label: 'HI High: मरना चाहता हूँ' },
    { text: 'मैं मरना चाहती हूँ अब और बर्दाश्त नहीं होता', expected: 'high', label: 'HI High: मरना चाहती हूँ' },
    { text: 'मुझे आत्महत्या करनी है', expected: 'high', label: 'HI High: आत्महत्या' },
    { text: 'मैं अपनी ज़िंदगी खत्म करना चाहता हूँ', expected: 'high', label: 'HI High: ज़िंदगी खत्म' },
    { text: 'जिंदगी खत्म करने का सोच रहा हूँ', expected: 'high', label: 'HI High: जिंदगी खत्म' },
    { text: 'ख़ुदकुशी के बारे में सोच रहा हूँ', expected: 'high', label: 'HI High: ख़ुदकुशी' },
    { text: 'अपनी जान ले लूंगा आज रात', expected: 'high', label: 'HI High: अपनी जान ले लूंगा' },
    { text: 'फांसी लगा लूंगी सब कुछ छोड़ कर', expected: 'high', label: 'HI High: फांसी लगा लूंगी' },
    { text: 'अब और नहीं जी सकता सब खत्म', expected: 'high', label: 'HI High: अब और नहीं जी सकता' },
    { text: 'मरनााा चाहता हूँ बहुत दर्द है', expected: 'high', label: 'HI High: मरनााा (stretched matra)' },

    // --- TRUE HIGH: Hinglish ---
    { text: 'Mujhe ab marne ka man kar raha hai', expected: 'high', label: 'Hinglish High: marne ka man kar raha' },
    { text: 'main khudkushi karne ja raha hu', expected: 'high', label: 'Hinglish High: khudkushi' },
    { text: 'ab aur jeena nahi chahta sab khatam', expected: 'high', label: 'Hinglish High: jeena nahi chahta' },
    { text: 'zeher khaa lunga main', expected: 'high', label: 'Hinglish High: zeher khaa lunga' },
    { text: 'faansi laga lungi main', expected: 'high', label: 'Hinglish High: faansi laga lungi' },
    { text: 'marna chahta hu sab se door', expected: 'high', label: 'Hinglish High: marna chahta hu' },
    { text: 'jeene ka mann nahi kar raha ab', expected: 'high', label: 'Hinglish High: jeene ka mann nahi' },
    { text: 'khud ko khatam karne ka soch raha hu', expected: 'high', label: 'Hinglish High: khud ko khatam' },

    // --- TRUE NONE: Context Guards, Benign Idioms, Everyday Life ---
    { text: 'Search query: how to diet', expected: 'none', label: 'NONE Guard: how to diet' },
    { text: 'I am reading a book on how to diet for better health', expected: 'none', label: 'NONE Guard: how to diet for health' },
    { text: 'My doctor suggested a low sodium diet', expected: 'none', label: 'NONE: diet' },
    { text: 'I overdosed on coffee today and have the shakes', expected: 'none', label: 'NONE Guard: overdosed on coffee' },
    { text: 'I had an overdose of caffeine studying for finals', expected: 'none', label: 'NONE Guard: overdose of caffeine' },
    { text: 'Overdosed on sugar at my niece birthday party', expected: 'none', label: 'NONE Guard: overdosed on sugar' },
    { text: 'I cut myself shaving this morning before my interview', expected: 'none', label: 'NONE Guard: cut myself shaving' },
    { text: 'I cut myself cooking dinner with the paring knife', expected: 'none', label: 'NONE Guard: cut myself cooking' },
    { text: 'I cut myself while chopping vegetables for soup', expected: 'none', label: 'NONE Guard: cut myself while chopping' },
    { text: 'I cut myself on paper while filing taxes', expected: 'none', label: 'NONE Guard: cut myself on paper' },
    { text: 'I cut myself with paper at work today', expected: 'none', label: 'NONE Guard: cut myself with paper' },
    { text: 'Experiencing inner self harmony through yoga', expected: 'none', label: 'NONE Guard: self harmony' },
    { text: 'Creating self harmony in my daily routine', expected: 'none', label: 'NONE Guard: self harmony' },
    { text: 'I was killing it at the gym today with heavy squats!', expected: 'none', label: 'NONE Guard: killing it at the gym' },
    { text: 'The presentation went great, I was killing it at work', expected: 'none', label: 'NONE Guard: killing it at work' },
    { text: 'We had a killer workout this morning with sprint intervals', expected: 'none', label: 'NONE Guard: killer workout' },
    { text: 'That designer created a killer routine for core strength', expected: 'none', label: 'NONE Guard: killer routine' },
    { text: 'I was dying of laughter watching that comedy show.', expected: 'none', label: 'NONE Guard: dying of laughter' },
    { text: 'We were dying of curiosity to open the mystery box', expected: 'none', label: 'NONE Guard: dying of curiosity' },
    { text: 'I am dying to see the new art gallery exhibition', expected: 'none', label: 'NONE Guard: dying to see' },
    { text: 'Took a pain killer for a mild headache.', expected: 'none', label: 'NONE Guard: pain killer' },
    { text: 'I read an article about an accidental overdose in the news.', expected: 'none', label: 'NONE Guard: overdose in the news' },
    { text: 'Watched a documentary about drug overdose epidemic.', expected: 'none', label: 'NONE Guard: overdose documentary' },
    { text: 'I am dead tired after a long productive study session.', expected: 'none', label: 'NONE Guard: dead tired' },
    { text: 'The food was dead spicy but delicious.', expected: 'none', label: 'NONE Guard: dead spicy' },
    { text: 'I am giving up sugar for the next month', expected: 'none', label: 'NONE Guard: giving up sugar' },
    { text: 'Giving up coffee for lent to reset my caffeine tolerance', expected: 'none', label: 'NONE Guard: giving up coffee' },
    { text: 'Giving up social media for a week to focus on studies', expected: 'none', label: 'NONE Guard: giving up social media' },
    { text: 'Today was a peaceful day. Went for a walk and had tea.', expected: 'none', label: 'NONE: peaceful walk' },
    { text: 'Had a wonderful lunch with colleagues and laughed a lot', expected: 'none', label: 'NONE: pleasant lunch' },
    { text: 'Practicing guitar chords and feeling happy with progress', expected: 'none', label: 'NONE: guitar practice' },
    { text: 'Wrote five pages in my novel draft today feeling motivated', expected: 'none', label: 'NONE: creative writing' },

    // --- TRUE CONCERN: English, Devanagari, Hinglish ---
    { text: 'Everything feels so hopeless and exhausting', expected: 'concern', label: 'EN Concern: hopeless' },
    { text: 'I feel completely worthless and broken', expected: 'concern', label: 'EN Concern: worthless and broken' },
    { text: 'Nobody cares about me anymore', expected: 'concern', label: 'EN Concern: nobody cares about me' },
    { text: 'I am giving up on life', expected: 'concern', label: 'EN Concern: giving up on life' },
    { text: 'I feel like giving up on everything', expected: 'concern', label: 'EN Concern: feel like giving up' },
    { text: 'cannot take this pain anymore', expected: 'concern', label: 'EN Concern: cannot take this pain anymore' },
    { text: "I can't take this anymore", expected: 'concern', label: "EN Concern: can't take this anymore" },
    { text: 'I cant take this anymore', expected: 'concern', label: 'EN Concern: cant take this anymore' },
    { text: 'I cannot take it anymore', expected: 'concern', label: 'EN Concern: cannot take it anymore' },
    { text: 'cant take it anymore', expected: 'concern', label: 'EN Concern: cant take it anymore' },
    { text: 'tired of being alive in this darkness', expected: 'concern', label: 'EN Concern: tired of being alive' },
    { text: 'tired of fighting all the time', expected: 'concern', label: 'EN Concern: tired of fighting' },
    { text: 'nobody loves me and I feel completely alone in the world', expected: 'concern', label: 'EN Concern: completely alone' },
    { text: 'lost all hope for my future', expected: 'concern', label: 'EN Concern: lost all hope' },
    { text: 'कोई उम्मीद नहीं बची', expected: 'concern', label: 'HI Concern: कोई उम्मीद नहीं बची' },
    { text: 'बहुत अकेला हूँ सब कुछ मुश्किल लग रहा है', expected: 'concern', label: 'HI Concern: बहुत अकेला हूँ' },
    { text: 'बहुत अकेली हूँ कोई सहारा नहीं', expected: 'concern', label: 'HI Concern: बहुत अकेली हूँ' },
    { text: 'सब बर्बाद हो गया मेरी ज़िंदगी में', expected: 'concern', label: 'HI Concern: सब बर्बाद हो गया' },
    { text: 'सह नहीं पा रहा इस दर्द को', expected: 'concern', label: 'HI Concern: सह नहीं पा रहा' },
    { text: 'किसी को मेरी परवाह नहीं सब मतलबी हैं', expected: 'concern', label: 'HI Concern: किसी को मेरी परवाह नहीं' },
    { text: 'अंदर से टूट गया हूँ पूरी तरह', expected: 'concern', label: 'HI Concern: अंदर से टूट गया' },
    { text: 'सब बेकार है मैं किसी काम का नहीं', expected: 'concern', label: 'HI Concern: किसी काम का नहीं' },
    { text: 'bohot udaas hu koi ummeed nahi bachi', expected: 'concern', label: 'Hinglish Concern: koi ummeed nahi' },
    { text: 'sab bekaar hai main kisi kaam ka nahi', expected: 'concern', label: 'Hinglish Concern: sab bekaar hai' },
    { text: 'andar se toot gaya hu koi sahara nahi', expected: 'concern', label: 'Hinglish Concern: andar se toot gaya' }
  ];

  it('runs the 85+ labeled corpus and outputs precision/recall table with 0 FN on HIGH and 0 FP on NONE', () => {
    let highTP = 0, highFP = 0, highFN = 0;
    let noneTP = 0, noneFP = 0, noneFN = 0;
    let concernTP = 0, concernFP = 0, concernFN = 0;

    const misclassifications = [];

    for (const item of CORPUS) {
      const result = checkRisk(item.text);

      // Evaluate HIGH
      if (item.expected === 'high') {
        if (result.level === 'high') highTP++;
        else {
          highFN++;
          misclassifications.push({ text: item.text, expected: item.expected, got: result.level, label: item.label });
        }
      } else {
        if (result.level === 'high') highFP++;
      }

      // Evaluate NONE
      if (item.expected === 'none') {
        if (result.level === 'none') noneTP++;
        else {
          noneFN++;
          misclassifications.push({ text: item.text, expected: item.expected, got: result.level, label: item.label });
        }
      } else {
        if (result.level === 'none') noneFP++;
      }

      // Evaluate CONCERN
      if (item.expected === 'concern') {
        if (result.level === 'concern') concernTP++;
        else {
          concernFN++;
          misclassifications.push({ text: item.text, expected: item.expected, got: result.level, label: item.label });
        }
      } else {
        if (result.level === 'concern') concernFP++;
      }
    }

    const highPrecision = highTP + highFP > 0 ? (highTP / (highTP + highFP)) * 100 : 0;
    const highRecall = highTP + highFN > 0 ? (highTP / (highTP + highFN)) * 100 : 0;

    const nonePrecision = noneTP + noneFP > 0 ? (noneTP / (noneTP + noneFP)) * 100 : 0;
    const noneRecall = noneTP + noneFN > 0 ? (noneTP / (noneTP + noneFN)) * 100 : 0;

    const concernPrecision = concernTP + concernFP > 0 ? (concernTP / (concernTP + concernFP)) * 100 : 0;
    const concernRecall = concernTP + concernFN > 0 ? (concernTP / (concernTP + concernFN)) * 100 : 0;

    console.log('\n========================================================================================');
    console.log('CRISIS DETECTION ENGINE EVALUATION (Labelled Corpus: ' + CORPUS.length + ' cases)');
    console.log('========================================================================================');
    console.table([
      { Class: 'HIGH (Crisis)', Total: highTP + highFN, TP: highTP, FP: highFP, FN: highFN, 'Precision (%)': highPrecision.toFixed(1), 'Recall (%)': highRecall.toFixed(1) },
      { Class: 'NONE (Safe/Guards)', Total: noneTP + noneFN, TP: noneTP, FP: noneFP, FN: noneFN, 'Precision (%)': nonePrecision.toFixed(1), 'Recall (%)': noneRecall.toFixed(1) },
      { Class: 'CONCERN (Distress)', Total: concernTP + concernFN, TP: concernTP, FP: concernFP, FN: concernFN, 'Precision (%)': concernPrecision.toFixed(1), 'Recall (%)': concernRecall.toFixed(1) }
    ]);
    console.log('========================================================================================\n');

    if (misclassifications.length > 0) {
      console.error('MISCLASSIFICATIONS:', misclassifications);
    }

    // Assert zero false negatives on true-HIGH (100% recall on crisis)
    expect(highFN).toBe(0);
    expect(highRecall).toBe(100);

    // Assert zero false positives on true-NONE (100% precision on negative cases)
    expect(noneFN).toBe(0);
    expect(noneRecall).toBe(100);
  });

  describe('Unicode & Devanagari Normalization Unit Tests', () => {
    it('preserves Devanagari characters, conjuncts, and vowel signs (\\p{M})', () => {
      const devanagariText = 'मैं मरना चाहता हूँ';
      const clean = normalizeText(devanagariText);
      expect(clean).toBe('मैं मरना चाहता हूँ');
      expect(clean).toContain('हूँ');
      expect(clean).toContain('मैं');
      expect(clean).toContain('मरना');
    });

    it('collapses stretched letters safely without corrupting Devanagari words', () => {
      // 3 consecutive identical vowel signs collapse to 1
      const stretchedDevanagari = 'मरनााा';
      expect(normalizeText(stretchedDevanagari)).toBe('मरना');

      // English stretched collapse
      expect(normalizeText('suuuuicide')).toBe('suicide');
      expect(normalizeText('pleaseeeee')).toBe('please');
    });

    it('removes ASCII and Unicode apostrophes so contractions match canonical forms', () => {
      // ASCII apostrophe
      expect(normalizeText("can't")).toBe('cant');
      expect(normalizeText("don't")).toBe('dont');

      // Unicode curly apostrophes
      expect(normalizeText('can’t')).toBe('cant');
      expect(normalizeText('don’t')).toBe('dont');
      expect(normalizeText('can`t')).toBe('cant');
    });

    it('strips HTML tags and script elements prior to evaluation', () => {
      const htmlRisk = '<p>Feeling completely empty and <b>I want to kill myself</b></p>';
      expect(checkRisk(htmlRisk).level).toBe('high');

      const htmlSafe = '<div class="journal"><h1>Productive Day</h1><script>alert("test")</script><p>Took a walk in the hills.</p></div>';
      expect(checkRisk(htmlSafe).level).toBe('none');

      expect(stripFalsePositives('killing it at the gym')).not.toContain('killing it');
    });

    it('returns "none" for empty, non-string, or null inputs', () => {
      expect(checkRisk(null).level).toBe('none');
      expect(checkRisk(undefined).level).toBe('none');
      expect(checkRisk('').level).toBe('none');
      expect(checkRisk(12345).level).toBe('none');
      expect(checkRisk({}).level).toBe('none');
    });
  });

  describe('Caller Risk Checks (thought-challenge, writing-starters)', () => {
    it('detects crisis in thought-challenge evidenceFor and evidenceAgainst without calling LLM', async () => {
      const result = await AIService.challengeThought(
        {
          situation: 'Had an argument',
          thought: 'Nobody likes me',
          evidenceFor: 'They would be better off without me and I want to kill myself',
          evidenceAgainst: 'My friend called me yesterday'
        },
        'mock-user-id'
      );

      expect(result.safety.level).toBe('high');
      expect(result.balancedThought).toContain('acute distress');
    });

    it('detects crisis in generateWritingStarters prompt without calling LLM', async () => {
      const result = await AIService.generateWritingStarters('I want to commit suicide', 'mock-user-id');
      expect(result.safety.level).toBe('high');
      expect(result.starters.length).toBe(3);
      expect(result.starters[0]).toContain('caring');
    });
  });
});
