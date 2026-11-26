/**
 * Standard clinical self-check screening questionnaires.
 * These are validated screening tools for personal reflection only, NOT medical diagnoses.
 * 
 * TODO: Replace with clinically validated Hindi version of PHQ-9 and GAD-7 (needs clinical review).
 */

export interface QuestionnaireOption {
  text: string;
  textHi?: string;
  score: number;
}

export interface QuestionnaireQuestion {
  id: number;
  text: string;
  textHi?: string;
  isCrisisItem?: boolean; // e.g. PHQ-9 item 9
}

export interface ScoreBand {
  min: number;
  max: number;
  label: string;
  labelHi?: string;
  color: string;
  description: string;
  descriptionHi?: string;
  recommendation: string;
  recommendationHi?: string;
}

export interface Questionnaire {
  id: 'PHQ-9' | 'GAD-7';
  title: string;
  titleHi?: string;
  shortName: string;
  timeframe: string;
  timeframeHi?: string;
  description: string;
  descriptionHi?: string;
  citation: string;
  options: QuestionnaireOption[];
  questions: QuestionnaireQuestion[];
  scoreBands: ScoreBand[];
}

export const STANDARD_OPTIONS: QuestionnaireOption[] = [
  { text: 'Not at all', textHi: 'बिल्कुल नहीं', score: 0 },
  { text: 'Several days', textHi: 'कुछ दिन', score: 1 },
  { text: 'More than half the days', textHi: 'आधे से अधिक दिन', score: 2 },
  { text: 'Nearly every day', textHi: 'लगभग हर दिन', score: 3 }
];

export const QUESTIONNAIRES: Record<'PHQ-9' | 'GAD-7', Questionnaire> = {
  'PHQ-9': {
    id: 'PHQ-9',
    title: 'PHQ-9: Depression & Low Mood Check',
    titleHi: 'PHQ-9: अवसाद और मनोदशा जांच',
    shortName: 'PHQ-9',
    timeframe: 'Over the last 2 weeks, how often have you been bothered by any of the following problems?',
    timeframeHi: 'पिछले 2 सप्ताह में, आपको निम्नलिखित समस्याओं ने कितनी बार परेशान किया है?',
    description: 'A standard, validated 9-question instrument used by healthcare providers worldwide to screen for depressive symptoms and emotional weight.',
    descriptionHi: 'अवसाद के लक्षणों और मानसिक तनाव को समझने के लिए दुनिया भर में प्रयुक्त मानक 9-प्रश्नों की प्रश्नावली।',
    citation: 'Kroenke, K., Spitzer, R. L., & Williams, J. B. (2001). The PHQ-9: validity of a brief depression severity measure. Journal of General Internal Medicine, 16(9), 606-613.',
    options: STANDARD_OPTIONS,
    questions: [
      { id: 1, text: 'Little interest or pleasure in doing things', textHi: 'काम करने में बहुत कम रुचि या आनंद आना' },
      { id: 2, text: 'Feeling down, depressed, or hopeless', textHi: 'उदास, निराश या मायूस महसूस करना' },
      { id: 3, text: 'Trouble falling or staying asleep, or sleeping too much', textHi: 'सोने में कठिनाई, बार-बार नींद टूटना या बहुत अधिक सोना' },
      { id: 4, text: 'Feeling tired or having little energy', textHi: 'थकावट महसूस होना या ऊर्जा की कमी' },
      { id: 5, text: 'Poor appetite or overeating', textHi: 'भूख कम लगना या बहुत अधिक खाना' },
      { id: 6, text: 'Feeling bad about yourself — or that you are a failure or have let yourself or your family down', textHi: 'अपने बारे में बुरा महसूस करना — या यह सोचना कि आप असफल हैं अथवा आपने अपने परिवार को निराश किया है' },
      { id: 7, text: 'Trouble concentrating on things, such as reading the newspaper or watching television', textHi: 'किसी बात पर ध्यान केंद्रित करने में कठिनाई (जैसे समाचार पत्र पढ़ना या टीवी देखना)' },
      { id: 8, text: 'Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual', textHi: 'इतना धीरे चलना या बोलना कि दूसरों का ध्यान जाए, या अत्यधिक बेचैनी के कारण स्थिर न बैठ पाना' },
      { id: 9, text: 'Thoughts that you would be better off dead, or of hurting yourself in some way', textHi: 'यह विचार आना कि आपका न होना बेहतर होता, या स्वयं को किसी तरह चोट पहुँचाने की इच्छा', isCrisisItem: true }
    ],
    scoreBands: [
      {
        min: 0,
        max: 4,
        label: 'Minimal or No Depression',
        labelHi: 'नगण्य या कोई अवसाद नहीं',
        color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40',
        description: 'Your responses indicate little or no depressive symptoms over the past two weeks.',
        descriptionHi: 'पिछले दो सप्ताह के दौरान आपके उत्तर बहुत कम या न के बराबर अवसाद के लक्षण दर्शाते हैं।',
        recommendation: 'Continue caring for yourself with healthy sleep, daily reflections, and mindful rest.',
        recommendationHi: 'अच्छी नींद, दैनिक डायरी लेखन और शांतिपूर्ण विश्राम के साथ अपनी देखभाल जारी रखें।'
      },
      {
        min: 5,
        max: 9,
        label: 'Mild Depressive Symptoms',
        labelHi: 'हल्के अवसाद के लक्षण',
        color: 'text-calm-700 bg-calm-50 dark:bg-calm-950/40',
        description: 'You may be feeling somewhat low, tired, or burdened by everyday stresses.',
        descriptionHi: 'आप रोज़मर्रा के तनाव के कारण कुछ उदासी, थकान या भारीपन महसूस कर रहे होंगे।',
        recommendation: 'Give yourself extra gentleness, talk to someone you trust, and monitor how your feelings evolve.',
        recommendationHi: 'खुद के प्रति दयालु रहें, किसी करीबी से बात करें, और देखें कि आपकी भावनाएं कैसे बदलती हैं।'
      },
      {
        min: 10,
        max: 14,
        label: 'Moderate Depressive Symptoms',
        labelHi: 'मध्यम अवसाद के लक्षण',
        color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40',
        description: 'Your responses reflect notable emotional weight that may be interfering with daily life.',
        descriptionHi: 'आपके उत्तर महत्वपूर्ण मानसिक तनाव दर्शाते हैं जो दैनिक जीवन को प्रभावित कर सकता है।',
        recommendation: 'We gently encourage consulting a primary physician, counselor, or mental health professional.',
        recommendationHi: 'हम आपको किसी काउंसलर या मानसिक स्वास्थ्य विशेषज्ञ से परामर्श करने की सलाह देते हैं।'
      },
      {
        min: 15,
        max: 19,
        label: 'Moderately Severe Depression',
        labelHi: 'मध्यम गंभीर अवसाद',
        color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/40',
        description: 'Significant depressive symptoms are currently impacting your energy, sleep, or mood.',
        descriptionHi: 'गंभीर अवसाद के लक्षण आपकी ऊर्जा, नींद और मूड को प्रभावित कर रहे हैं।',
        recommendation: 'Reaching out to a doctor or licensed therapist can provide personalized support and relief.',
        recommendationHi: 'डॉक्टर या थेरेपिस्ट से संपर्क करना आपको सही सहायता और राहत प्रदान कर सकता है।'
      },
      {
        min: 20,
        max: 27,
        label: 'Severe Depressive Symptoms',
        labelHi: 'गंभीर अवसाद के लक्षण',
        color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40',
        description: 'Your scores indicate substantial distress that warrants professional care and support.',
        descriptionHi: 'आपका स्कोर अत्यधिक मानसिक तनाव दर्शाता है जिसके लिए पेशेवर देखभाल आवश्यक है।',
        recommendation: 'Please speak with a healthcare provider or contact a support helpline. You deserve care.',
        recommendationHi: 'कृपया किसी डॉक्टर से संपर्क करें या सहायता हेल्पलाइन पर कॉल करें। आप सहायता के पात्र हैं।'
      }
    ]
  },
  'GAD-7': {
    id: 'GAD-7',
    title: 'GAD-7: Anxiety & Worry Check',
    titleHi: 'GAD-7: चिंता और बेचैनी जांच',
    shortName: 'GAD-7',
    timeframe: 'Over the last 2 weeks, how often have you been bothered by the following problems?',
    timeframeHi: 'पिछले 2 सप्ताह में, आपको निम्नलिखित समस्याओं ने कितनी बार परेशान किया है?',
    description: 'A 7-question clinical screening tool measuring generalized anxiety, nervous tension, and physical restlessness.',
    descriptionHi: 'सामान्य चिंता, घबराहट और शारीरिक बेचैनी को मापने के लिए 7 प्रश्नों की नैदानिक प्रश्नावली।',
    citation: 'Spitzer, R. L., Kroenke, K., Williams, J. B., & Löwe, B. (2006). A brief measure for assessing generalized anxiety disorder: the GAD-7. Archives of Internal Medicine, 166(10), 1092-1097.',
    options: STANDARD_OPTIONS,
    questions: [
      { id: 1, text: 'Feeling nervous, anxious, or on edge', textHi: 'घबराहट, बेचैनी या तनाव महसूस होना' },
      { id: 2, text: 'Not being able to stop or control worrying', textHi: 'चिंता करने से खुद को न रोक पाना या नियंत्रित न कर पाना' },
      { id: 3, text: 'Worrying too much about different things', textHi: 'अलग-अलग बातों के बारे में बहुत अधिक चिंता करना' },
      { id: 4, text: 'Trouble relaxing', textHi: 'शांत या विश्राम करने में कठिनाई' },
      { id: 5, text: 'Being so restless that it is hard to sit still', textHi: 'इतना बेचैन होना कि शांत बैठना मुश्किल लगे' },
      { id: 6, text: 'Becoming easily annoyed or irritable', textHi: 'आसानी से चिढ़ जाना या गुस्सा आना' },
      { id: 7, text: 'Feeling afraid, as if something awful might happen', textHi: 'ऐसा डर लगना जैसे कोई बहुत बुरा हादसा होने वाला है' }
    ],
    scoreBands: [
      {
        min: 0,
        max: 4,
        label: 'Minimal Anxiety',
        labelHi: 'नगण्य चिंता',
        color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40',
        description: 'Your nervous system appears relatively settled with minimal anxiety symptoms.',
        descriptionHi: 'आपकी स्थिति सामान्य प्रतीत होती है और चिंता के लक्षण न के बराबर हैं।',
        recommendation: 'Continue mindful breaks, breathing exercises, and adequate rest.',
        recommendationHi: 'सजग विश्राम, गहरी सांस लेने के अभ्यास और पर्याप्त नींद जारी रखें।'
      },
      {
        min: 5,
        max: 9,
        label: 'Mild Anxiety',
        labelHi: 'हल्की चिंता',
        color: 'text-calm-700 bg-calm-50 dark:bg-calm-950/40',
        description: 'You may be experiencing some nervous tension, restlessness, or frequent worries.',
        descriptionHi: 'आप थोड़ी घबराहट, बेचैनी या बार-बार चिंता का अनुभव कर रहे होंगे।',
        recommendation: 'Deep breathing (4-7-8 or Box breathing) and journaling your worries can help ground your mind.',
        recommendationHi: 'गहरी सांस लेने के व्यायाम और विचारों को डायरी में लिखने से मन शांत होगा।'
      },
      {
        min: 10,
        max: 14,
        label: 'Moderate Anxiety',
        labelHi: 'मध्यम चिंता',
        color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40',
        description: 'Your anxiety levels are noticeable and may be causing fatigue or difficulty unwinding.',
        descriptionHi: 'चिंता का स्तर ध्यान देने योग्य है जिससे थकान या विश्राम करने में परेशानी हो सकती है।',
        recommendation: 'Consider speaking with a doctor, counselor, or cognitive therapist to explore grounding strategies.',
        recommendationHi: 'काउंसलर या थेरेपिस्ट से बात करने पर विचार करें।'
      },
      {
        min: 15,
        max: 21,
        label: 'Severe Anxiety',
        labelHi: 'गंभीर चिंता',
        color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40',
        description: 'Elevated anxiety is significantly affecting your daily comfort, focus, or peace of mind.',
        descriptionHi: 'उच्च स्तर की चिंता आपके दैनिक कार्यों, एकाग्रता और मानसिक शांति को प्रभावित कर रही है।',
        recommendation: 'Please consult a healthcare professional. Structured anxiety treatment is highly effective.',
        recommendationHi: 'कृपया किसी स्वास्थ्य विशेषज्ञ से सलाह लें। चिंता का व्यवस्थित उपचार अत्यंत प्रभावी होता है।'
      }
    ]
  }
};

export function getScoreBand(questionnaireId: 'PHQ-9' | 'GAD-7', score: number): ScoreBand {
  const q = QUESTIONNAIRES[questionnaireId];
  for (const band of q.scoreBands) {
    if (score >= band.min && score <= band.max) {
      return band;
    }
  }
  return q.scoreBands[q.scoreBands.length - 1];
}
