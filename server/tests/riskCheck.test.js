const { checkRisk, normalizeText, stripFalsePositives } = require('../utils/riskCheck');
const AIService = require('../services/aiService');

describe('Crisis Risk Check Engine & Counselor-Reviewed Test Corpus', () => {
  // Labelled test corpus of 150+ test cases:
  // English, Hinglish, Devanagari; with/without apostrophes; typos/stretched; mixed case.
  const CORPUS = [
    // --- TRUE HIGH: English (with and without apostrophes, slang, mixed case) ---
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
    { text: 'I want to go to sleep and never wake up', expected: 'high', label: 'EN High: sleep and never wake up' },
    { text: 'life is not worth living', expected: 'high', label: 'EN High: life is not worth living' },
    { text: 'i feel like ending everything', expected: 'high', label: 'EN High: feel like ending everything' },
    { text: 'I am thinking of overdosing tonight', expected: 'high', label: 'EN High: thinking of overdosing' },
    { text: 'I wish I had never been born', expected: 'high', label: 'EN High: wish never been born' },
    { text: 'I cant do this anymore, I just want it to stop forever', expected: 'high', label: 'EN High: stop forever' },
    { text: 'mujhe lagta hai main mar jaunga to sab theek ho jayega', expected: 'high', label: 'Hinglish High: mar jaunga to sab theek' },
    { text: 'mai apni life khatam karna chahti hu', expected: 'high', label: 'Hinglish High: life khatam karna chahti hu' },
    { text: 'khud ko hurt karna chahta hu', expected: 'high', label: 'Hinglish High: khud ko hurt karna chahta hu' },
    { text: 'काश मैं मर जाऊँ', expected: 'high', label: 'HI High: काश मैं मर जाऊँ' },
    { text: 'मैं पैदा ही नहीं होना चाहिए था', expected: 'high', label: 'HI High: पैदा ही नहीं होना चाहिए था' },
    { text: 'मैं अपने आप को मार लूँगा', expected: 'high', label: 'HI High: अपने आप को मार लूँगा' },
    { text: 'i wanna die', expected: 'high', label: 'EN High: slang wanna die' },
    { text: 'I WANNA DIE RIGHT NOW', expected: 'high', label: 'EN High: mixed case WANNA DIE' },
    { text: 'I dont want to be alive', expected: 'high', label: 'EN High: dont want to be alive' },
    { text: "I don't want to be alive anymore", expected: 'high', label: "EN High: don't want to be alive" },
    { text: 'I want to hurt myself', expected: 'high', label: 'EN High: want to hurt myself' },
    { text: 'I wish to hurt myself tonight', expected: 'high', label: 'EN High: wish to hurt myself' },
    { text: 'I took too many pills on purpose', expected: 'high', label: 'EN High: took too many pills on purpose' },
    { text: 'there is no point in living', expected: 'high', label: 'EN High: no point in living' },
    { text: 'There is no point going on anymore', expected: 'high', label: 'EN High: no point going on' },
    { text: 'nobody would miss me if I was gone', expected: 'high', label: 'EN High: nobody would miss me' },
    { text: 'No one would miss me if I disappeared', expected: 'high', label: 'EN High: no one would miss me' },
    { text: 'I wish to die peacefully', expected: 'high', label: 'EN High: wish to die' },
    { text: 'I just want to be dead', expected: 'high', label: 'EN High: want to be dead' },
    { text: 'Im gonna hurt myself tonight', expected: 'high', label: 'EN High: gonna hurt myself' },
    { text: 'WANNA DISAPPEAR FOREVER', expected: 'high', label: 'EN High: mixed case wanna disappear' },

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
    { text: 'मुझे मरना है', expected: 'high', label: 'HI High: मुझे मरना है' },
    { text: 'मैं खुद को नुकसान पहुँचाना चाहता हूँ', expected: 'high', label: 'HI High: खुद को नुकसान' },
    { text: 'अब मुझे और जीना नहीं है', expected: 'high', label: 'HI High: जीना नहीं है' },
    { text: 'मैं सब खत्म कर देना चाहता हूँ', expected: 'high', label: 'HI High: सब खत्म कर' },
    { text: 'मैं खुद को चोट पहुँचाने जा रही हूँ', expected: 'high', label: 'HI High: खुद को चोट' },

    // --- TRUE HIGH: Hinglish ---
    { text: 'Mujhe ab marne ka man kar raha hai', expected: 'high', label: 'Hinglish High: marne ka man kar raha' },
    { text: 'main khudkushi karne ja raha hu', expected: 'high', label: 'Hinglish High: khudkushi' },
    { text: 'ab aur jeena nahi chahta sab khatam', expected: 'high', label: 'Hinglish High: jeena nahi chahta' },
    { text: 'zeher khaa lunga main', expected: 'high', label: 'Hinglish High: zeher khaa lunga' },
    { text: 'faansi laga lungi main', expected: 'high', label: 'Hinglish High: faansi laga lungi' },
    { text: 'marna chahta hu sab se door', expected: 'high', label: 'Hinglish High: marna chahta hu' },
    { text: 'jeene ka mann nahi kar raha ab', expected: 'high', label: 'Hinglish High: jeene ka mann nahi' },
    { text: 'khud ko khatam karne ka soch raha hu', expected: 'high', label: 'Hinglish High: khud ko khatam' },
    { text: 'mujhe marna hai', expected: 'high', label: 'Hinglish High: mujhe marna hai' },
    { text: 'Mujhe Jeena Nahi Hai Ab', expected: 'high', label: 'Hinglish High: mixed case jeena nahi hai' },
    { text: 'sab khatam kar dena chahta hu', expected: 'high', label: 'Hinglish High: sab khatam kar dena chahta hu' },
    { text: 'main sab khatam kar dunga aaj', expected: 'high', label: 'Hinglish High: sab khatam kar dunga' },
    { text: 'sab khatam kar lungi main', expected: 'high', label: 'Hinglish High: sab khatam kar lungi' },
    { text: 'MUJHE MARNA CHAHTI HU', expected: 'high', label: 'Hinglish High: mixed case marna chahti hu' },

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
    { text: 'She totally killed it in the final exam!', expected: 'none', label: 'NONE Guard: killed it' },
    { text: 'I want to die laughing at this meme', expected: 'none', label: 'NONE Guard: want to die laughing' },
    { text: 'I was dying of embarrassment during that speech', expected: 'none', label: 'NONE Guard: dying of embarrassment' },
    { text: 'My battery is dying, need to find a charger', expected: 'none', label: 'NONE Guard: my battery is dying' },
    { text: 'My phone is dead and my laptop battery is dying', expected: 'none', label: 'NONE: phone dead battery dying' },
    { text: 'Main apna homework khatam kar dunga aaj shaam tak', expected: 'none', label: 'NONE Hinglish: homework khatam kar dunga' },
    { text: 'Main football khelte hue gir gaya aur chot lag gayi', expected: 'none', label: 'NONE Hinglish: sports injury' },
    { text: 'Aaj ka khana bahut tasty tha, maza aa gaya', expected: 'none', label: 'NONE Hinglish: tasty food' },
    { text: 'आज मौसम बहुत अच्छा है, शाम को टहलने गया', expected: 'none', label: 'NONE HI: pleasant weather walk' },
    { text: 'मैंने आज अपनी किताब पढ़ना खत्म कर दिया', expected: 'none', label: 'NONE HI: finished reading book' },
    { text: 'परीक्षा की तैयारी अच्छी चल रही है', expected: 'none', label: 'NONE HI: exam prep going well' },
    { text: 'Wrote five pages in my novel draft today feeling motivated', expected: 'none', label: 'NONE: creative writing' },
    { text: 'Going to sleep early after a good workout', expected: 'none', label: 'NONE: good workout' },
    { text: 'Gonna watch a comedy movie with friends tonight', expected: 'none', label: 'NONE: slang gonna watch movie' },
    { text: 'I wanna try that new coffee shop downtown', expected: 'none', label: 'NONE: slang wanna try coffee' },
    { text: 'Do not forget to water the plants tomorrow', expected: 'none', label: 'NONE: water plants' },
    { text: "Don't worry about the small typos in the draft", expected: 'none', label: "NONE: don't worry about typos" },
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
    { text: 'andar se toot gaya hu koi sahara nahi', expected: 'concern', label: 'Hinglish Concern: andar se toot gaya' },
    { text: "I can't do this anymore, everything feels heavy", expected: 'concern', label: "EN Concern: can't do this anymore" },
    { text: 'I feel like giving up on my goals lately', expected: 'concern', label: 'EN Concern: feel like giving up' },
    { text: 'Completely alone in the world and exhausted', expected: 'concern', label: 'EN Concern: completely alone' },
    { text: 'No reason to go on with this project', expected: 'concern', label: 'EN Concern: no reason to go on' },
    { text: 'मैं हार मान चुका हूँ अब कुछ नहीं हो सकता', expected: 'concern', label: 'HI Concern: हार मान चुका हूँ' },
    { text: 'बहुत अकेली हूँ और कोई उम्मीद नहीं है', expected: 'concern', label: 'HI Concern: कोई उम्मीद नहीं' },
    { text: 'kisi ko meri parwah nahi hai is duniya mein', expected: 'concern', label: 'Hinglish Concern: kisi ko meri parwah nahi' },
    { text: 'seh nahi paa raha hu ye akelapan', expected: 'concern', label: 'Hinglish Concern: seh nahi paa raha' },
    { text: 'I am tired of trying and failing every week', expected: 'concern', label: 'EN Concern: tired of trying' },
    { text: 'Feeling utterly hopeless about tomorrow', expected: 'concern', label: 'EN Concern: utterly hopeless' },
    { text: 'सब खत्म लग रहा है मन बहुत भारी है', expected: 'concern', label: 'HI Concern: सब खत्म लग रहा' },
    { text: 'drowning in darkness with no way out', expected: 'concern', label: 'EN Concern: drowning in darkness' },
    { text: 'I hate existing like this every single day', expected: 'concern', label: 'EN Concern: hate existing' }
  ];

  it('runs the 150+ labeled corpus and outputs precision/recall table with 0 FN on HIGH and 0 FP on NONE', () => {
    expect(CORPUS.length).toBeGreaterThanOrEqual(150);
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

  // Held-out corpus (written AFTER freezing patterns; never tuned on)
  const HELD_OUT_CORPUS = [
    // --- HELD-OUT HIGH: English ---
    { text: "I've decided to end my life tonight", expected: 'high', label: 'HO EN High: decided to end my life' },
    { text: 'planning to take my own life this weekend', expected: 'high', label: 'HO EN High: planning take own life' },
    { text: 'I just want to fall asleep and never wake up again', expected: 'high', label: 'HO EN High: sleep and never wake up' },
    { text: 'wanna kill myself right now', expected: 'high', label: 'HO EN High: wanna kill myself' },
    { text: 'im gonna end it all before morning', expected: 'high', label: 'HO EN High: gonna end it all' },
    { text: 'thinking about ending everything today', expected: 'high', label: 'HO EN High: thinking about ending everything' },
    { text: 'Everyone at home would be better off without me', expected: 'high', label: 'HO EN High: better off without me' },
    { text: 'I dont want to be here anymore, please let it stop forever', expected: 'high', label: 'HO EN High: dont want to be here / stop forever' },
    { text: 'wishing I could just die in my sleep', expected: 'high', label: 'HO EN High: wishing die' },
    { text: 'I am suicidal and scared', expected: 'high', label: 'HO EN High: suicidal' },
    { text: 'thinking of hurting myself? no, I want to hurt myself', expected: 'high', label: 'HO EN High: want to hurt myself' },
    { text: 'i cant go on any longer, i want to die', expected: 'high', label: 'HO EN High: cant go on / want to die' },

    // --- HELD-OUT HIGH: Hinglish ---
    { text: 'mujhe ab mar jana hai is duniya se', expected: 'high', label: 'HO Hinglish High: mujhe mar jana hai' },
    { text: 'main apni zindagi khatam karne ja raha hu', expected: 'high', label: 'HO Hinglish High: zindagi khatam karne' },
    { text: 'apni jaan le lungi aaj main', expected: 'high', label: 'HO Hinglish High: apni jaan le lungi' },
    { text: 'mujhe jeena nhi hai aur', expected: 'high', label: 'HO Hinglish High: jeena nhi hai' },
    { text: 'khud ko nuksan pahunchana chahta hu', expected: 'high', label: 'HO Hinglish High: khud ko nuksan' },
    { text: 'main mar jaunga toh sab khush rahenge', expected: 'high', label: 'HO Hinglish High: main mar jaunga' },

    // --- HELD-OUT HIGH: Devanagari ---
    { text: 'मैं अपनी जान देना चाहता हूँ', expected: 'high', label: 'HO HI High: जान देना' },
    { text: 'काश मैं आज रात मर जाऊं', expected: 'high', label: 'HO HI High: काश मैं मर जाऊं' },
    { text: 'मुझे जीने की इच्छा नहीं रही अब', expected: 'high', label: 'HO HI High: जीने की इच्छा नहीं' },
    { text: 'मैं खुद को खत्म करना चाहती हूँ', expected: 'high', label: 'HO HI High: खुद को खत्म' },
    { text: 'अब जीना नहीं है मुझे इस हाल में', expected: 'high', label: 'HO HI High: जीना नहीं है' },

    // --- HELD-OUT NONE: Harmless / Idioms / Everyday ---
    { text: 'My sister is going to murder me when she sees the mess', expected: 'none', label: 'HO NONE: murder me idiom' },
    { text: 'Booked an appointment to cut my hair tomorrow', expected: 'none', label: 'HO NONE: cut my hair' },
    { text: 'I was dying of laughter at his joke', expected: 'none', label: 'HO NONE: dying of laughter' },
    { text: 'Dead tired after three hours of coding', expected: 'none', label: 'HO NONE: dead tired' },
    { text: 'Dying to try that new biryani place', expected: 'none', label: 'HO NONE: dying to try' },
    { text: 'My laptop is dead so I am using my tablet', expected: 'none', label: 'HO NONE: laptop is dead' },
    { text: 'Overdosed on caffeine during exam week', expected: 'none', label: 'HO NONE: overdosed on caffeine' },
    { text: 'How to diet without starving yourself', expected: 'none', label: 'HO NONE: how to diet' },
    { text: 'I hurt myself running on the wet track', expected: 'none', label: 'HO NONE: hurt myself running' },
    { text: 'You killed it in the debate competition!', expected: 'none', label: 'HO NONE: killed it' },
    { text: 'Giving up junk food for thirty days', expected: 'none', label: 'HO NONE: giving up junk food' },
    { text: 'Aaj ka din bahut shaant aur accha tha', expected: 'none', label: 'HO NONE Hinglish: peaceful day' },
    { text: 'Main apna assignment khatam karunga raat ko', expected: 'none', label: 'HO NONE Hinglish: assignment khatam' },
    { text: 'आज दोस्तों के साथ चाय पी और बहुत हंसी आई', expected: 'none', label: 'HO NONE HI: tea with friends' },
    { text: 'कल सुबह जल्दी उठकर पढ़ाई करनी है', expected: 'none', label: 'HO NONE HI: morning study' },
    { text: 'Watched a documentary about overdose prevention at school', expected: 'none', label: 'HO NONE: overdose prevention' },
    { text: 'The horror movie had a scary death scene', expected: 'none', label: 'HO NONE: third-person movie death' },
    { text: 'He is going to love this birthday surprise', expected: 'none', label: 'HO NONE: third-person going to' },

    // --- HELD-OUT CONCERN: Distress / Fail-Safe ---
    { text: 'I feel completely hopeless about my exams', expected: 'concern', label: 'HO EN Concern: hopeless' },
    { text: 'Nobody cares if I succeed or fail', expected: 'concern', label: 'HO EN Concern: nobody cares' },
    { text: 'I am tired of fighting every single day', expected: 'concern', label: 'HO EN Concern: tired of fighting' },
    { text: 'My mind keeps drifting toward death even when I try to focus on work and chores', expected: 'concern', label: 'HO EN Concern: first-person + death term >6 tokens' },
    { text: 'sab barbaad ho gaya hai kuch samajh nahi aa raha', expected: 'concern', label: 'HO Hinglish Concern: sab barbaad' },
    { text: 'मैं अंदर से टूट गया हूँ कोई सहारा नहीं दिखता', expected: 'concern', label: 'HO HI Concern: अंदर से टूट गया' },
    { text: 'कोई उम्मीद नहीं दिख रही मुझे अभी', expected: 'concern', label: 'HO HI Concern: कोई उम्मीद नहीं' }
  ];

  it('evaluates the held-out corpus without tuning and reports recall with 0 false HIGH on harmless set', () => {
    expect(CORPUS.length + HELD_OUT_CORPUS.length).toBeGreaterThanOrEqual(200);

    let highTP = 0, highFN = 0, falseHighOnNone = 0;
    let noneTotal = 0, noneExact = 0;
    let concernTotal = 0, concernMatched = 0;
    const misses = [];

    for (const item of HELD_OUT_CORPUS) {
      const res = checkRisk(item.text);
      if (item.expected === 'high') {
        if (res.level === 'high') highTP++;
        else {
          highFN++;
          misses.push({ text: item.text, expected: item.expected, got: res.level, label: item.label });
        }
      } else if (item.expected === 'none') {
        noneTotal++;
        if (res.level === 'none') noneExact++;
        if (res.level === 'high') {
          falseHighOnNone++;
          misses.push({ text: item.text, expected: item.expected, got: res.level, label: item.label });
        }
      } else if (item.expected === 'concern') {
        concernTotal++;
        if (res.level === 'concern' || res.level === 'high') concernMatched++;
        else misses.push({ text: item.text, expected: item.expected, got: res.level, label: item.label });
      }
    }

    const highRecall = ((highTP / (highTP + highFN)) * 100).toFixed(1);
    const noneRecall = ((noneExact / noneTotal) * 100).toFixed(1);
    const concernRecall = ((concernMatched / concernTotal) * 100).toFixed(1);

    console.log('\n========================================================================================');
    console.log(`HELD-OUT CORPUS EVALUATION (${HELD_OUT_CORPUS.length} unseen cases; total corpus: ${CORPUS.length + HELD_OUT_CORPUS.length})`);
    console.table([
      { Class: 'HIGH (Held-Out)', Total: highTP + highFN, TP: highTP, FN: highFN, 'Recall (%)': highRecall },
      { Class: 'NONE (Held-Out)', Total: noneTotal, Exact: noneExact, 'False HIGH': falseHighOnNone, 'Specificity (%)': noneRecall },
      { Class: 'CONCERN (Held-Out)', Total: concernTotal, Matched: concernMatched, 'Recall (%)': concernRecall }
    ]);
    if (misses.length > 0) console.log('Held-out misses:', misses);
    console.log('========================================================================================\n');

    expect(falseHighOnNone).toBe(0);
    expect(noneExact).toBe(noneTotal);
  });

  it('fails safe to CONCERN (never NONE) when first-person marker + death/self-harm term appear without HIGH match', () => {
    const res = checkRisk('I keep reading old notes about death while sitting quietly in my room');
    expect(res.level).toBe('concern');
    expect(res.matched).toBe(true);
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

    it('removes ASCII and Unicode apostrophes and expands slang forms', () => {
      // ASCII apostrophe
      expect(normalizeText("can't")).toBe('cannot');
      expect(normalizeText("don't")).toBe('do not');

      // Unicode curly apostrophes
      expect(normalizeText('can’t')).toBe('cannot');
      expect(normalizeText('don’t')).toBe('do not');
      expect(normalizeText('can`t')).toBe('cannot');

      // Slang normalization
      expect(normalizeText('I wanna sleep')).toBe('i want to sleep');
      expect(normalizeText('I gonna run')).toBe('i going to run');
      expect(normalizeText('I dont know')).toBe('i do not know');
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

  describe('Idiom & Context Guards', () => {
    it.each([
      ['I want to die laughing at this meme'],
      ['dying of laughter watching standup'],
      ['dying of embarrassment at the party'],
      ['dead tired after finals'],
      ['dying to see the new movie'],
      ['she killed it on stage'],
      ['killing it at the gym'],
      ['my battery is dying'],
      ['overdosed on coffee this morning'],
      ['overdosed on caffeine before the exam'],
      ['how to diet safely'],
      ['cut myself shaving today'],
      ['I need to cut my hair this weekend'],
      ['my mom is going to murder me if I am late'],
      ['I hurt myself playing football yesterday'],
      ['took a pain killer'],
      ['giving up sugar for a month']
    ])('returns none for benign idiom: %s', (phrase) => {
      expect(checkRisk(phrase).level).toBe('none');
    });
  });
});
