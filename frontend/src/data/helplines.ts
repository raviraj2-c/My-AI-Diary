// ============================================================================
// IMPORTANT NOTICE: HELPLINE NUMBERS MUST BE VERIFIED BEFORE RELEASE
// The numbers and resources listed below are community-maintained and MUST be
// manually verified against official health authority sources before public release.
// MindDiary is a supportive self-care and journaling companion, NOT an emergency service.
// If you or someone you know is in immediate physical danger, contact national
// emergency services (e.g. 112, 911, 999) or visit the nearest emergency room.
// ============================================================================

export interface HelplineItem {
  name: string;
  number: string;
  callUrl: string; // tel: link
  smsUrl?: string; // sms: link if texting is supported
  description: string;
  is24x7: boolean;
  website?: string;
  source: string; // official verification URL
  lastVerified: string; // YYYY-MM-DD
}

export interface CountryHelplines {
  countryCode: string;
  countryName: string;
  emergencyNumber: string;
  helplines: HelplineItem[];
}

/**
 * Checks if a helpline's verification date is older than 6 months (180 days).
 */
export function isHelplineVerificationStale(lastVerified?: string): boolean {
  if (!lastVerified) return true;
  const verifiedDate = new Date(lastVerified).getTime();
  if (isNaN(verifiedDate)) return true;
  const sixMonthsInMs = 180 * 24 * 60 * 60 * 1000;
  return Date.now() - verifiedDate > sixMonthsInMs;
}

export const HELPLINES_BY_COUNTRY: Record<string, CountryHelplines> = {
  IN: {
    countryCode: 'IN',
    countryName: 'India',
    emergencyNumber: '112',
    helplines: [
      {
        name: 'Tele-MANAS (Govt of India)',
        number: '14416',
        callUrl: 'tel:14416',
        description: 'Toll-free National Mental Health Helpline in 20+ regional languages',
        is24x7: true,
        website: 'https://telemanas.mohfw.gov.in',
        source: 'https://telemanas.mohfw.gov.in',
        lastVerified: '2026-11-20'
      },
      {
        name: 'Tele-MANAS Toll Free Alternative',
        number: '1800-891-4416',
        callUrl: 'tel:18008914416',
        description: 'Alternative national toll-free support line',
        is24x7: true,
        source: 'https://telemanas.mohfw.gov.in',
        lastVerified: '2026-11-20'
      },
      {
        name: 'KIRAN (Dept of Empowerment of PwDs)',
        number: '1800-599-0019',
        callUrl: 'tel:18005990019',
        description: 'Government toll-free helpline providing psychological support & first aid',
        is24x7: true,
        source: 'https://disabilityaffairs.gov.in',
        lastVerified: '2026-11-20'
      },
      {
        name: 'Vandrevala Foundation',
        number: '+91 9999 666 555',
        callUrl: 'tel:+919999666555',
        smsUrl: 'sms:+919999666555',
        description: 'Free, compassionate mental health crisis support via call or WhatsApp',
        is24x7: true,
        website: 'https://www.vandrevalafoundation.com',
        source: 'https://www.vandrevalafoundation.com',
        lastVerified: '2026-11-20'
      }
    ]
  },
  US: {
    countryCode: 'US',
    countryName: 'United States',
    emergencyNumber: '911',
    helplines: [
      {
        name: '988 Suicide & Crisis Lifeline',
        number: '988',
        callUrl: 'tel:988',
        smsUrl: 'sms:988',
        description: 'Free and confidential support via phone call or text message nationwide',
        is24x7: true,
        website: 'https://988lifeline.org',
        source: 'https://988lifeline.org',
        lastVerified: '2026-11-20'
      },
      {
        name: 'Crisis Text Line',
        number: 'Text HOME to 741741',
        callUrl: 'sms:741741?body=HOME',
        smsUrl: 'sms:741741?body=HOME',
        description: 'Free, 24/7 crisis counseling via text message',
        is24x7: true,
        website: 'https://www.crisistextline.org',
        source: 'https://www.crisistextline.org',
        lastVerified: '2026-11-20'
      },
      {
        name: 'The Trevor Project (LGBTQ Youth)',
        number: '1-866-488-7386',
        callUrl: 'tel:18664887386',
        smsUrl: 'sms:678678?body=START',
        description: 'Crisis counseling for LGBTQ young people',
        is24x7: true,
        website: 'https://www.thetrevorproject.org',
        source: 'https://www.thetrevorproject.org',
        lastVerified: '2026-11-20'
      }
    ]
  },
  UK: {
    countryCode: 'UK',
    countryName: 'United Kingdom',
    emergencyNumber: '999',
    helplines: [
      {
        name: 'NHS Mental Health Services',
        number: '111',
        callUrl: 'tel:111',
        description: 'Urgent medical and mental health help from the NHS',
        is24x7: true,
        website: 'https://111.nhs.uk',
        source: 'https://111.nhs.uk',
        lastVerified: '2026-11-20'
      },
      {
        name: 'Samaritans',
        number: '116 123',
        callUrl: 'tel:116123',
        description: 'Whatever you’re going through, a Samaritan will face it with you',
        is24x7: true,
        website: 'https://www.samaritans.org',
        source: 'https://www.samaritans.org',
        lastVerified: '2026-11-20'
      },
      {
        name: 'Shout Crisis Text Line',
        number: 'Text SHOUT to 85258',
        callUrl: 'sms:85258?body=SHOUT',
        smsUrl: 'sms:85258?body=SHOUT',
        description: 'Free, confidential, 24/7 text messaging support service',
        is24x7: true,
        website: 'https://giveusashout.org',
        source: 'https://giveusashout.org',
        lastVerified: '2026-11-20'
      }
    ]
  },
  CA: {
    countryCode: 'CA',
    countryName: 'Canada',
    emergencyNumber: '911',
    helplines: [
      {
        name: '988 Suicide Crisis Helpline',
        number: '988',
        callUrl: 'tel:988',
        smsUrl: 'sms:988',
        description: 'Free, bilingual (English/French) 24/7 call and text suicide prevention service',
        is24x7: true,
        website: 'https://988.ca',
        source: 'https://988.ca',
        lastVerified: '2026-11-20'
      },
      {
        name: 'Kids Help Phone',
        number: '1-800-668-6868',
        callUrl: 'tel:18006686868',
        smsUrl: 'sms:686868?body=CONNECT',
        description: 'Youth mental health support via call and text across Canada',
        is24x7: true,
        website: 'https://kidshelpphone.ca',
        source: 'https://kidshelpphone.ca',
        lastVerified: '2026-11-20'
      }
    ]
  },
  AU: {
    countryCode: 'AU',
    countryName: 'Australia',
    emergencyNumber: '000',
    helplines: [
      {
        name: 'Lifeline Australia',
        number: '13 11 14',
        callUrl: 'tel:131114',
        smsUrl: 'sms:0477131114',
        description: 'National charity providing all Australians access to 24/7 crisis support',
        is24x7: true,
        website: 'https://www.lifeline.org.au',
        source: 'https://www.lifeline.org.au',
        lastVerified: '2026-11-20'
      },
      {
        name: 'Beyond Blue',
        number: '1300 22 4636',
        callUrl: 'tel:1300224636',
        description: 'Mental health information and support for anxiety and depression',
        is24x7: true,
        website: 'https://www.beyondblue.org.au',
        source: 'https://www.beyondblue.org.au',
        lastVerified: '2026-11-20'
      }
    ]
  }
};

export const INTERNATIONAL_FALLBACK: CountryHelplines = {
  countryCode: 'GLOBAL',
  countryName: 'International Support',
  emergencyNumber: '112',
  helplines: [
    {
      name: 'Find A Helpline (Global Directory)',
      number: 'findahelpline.com',
      callUrl: 'https://findahelpline.com',
      description: 'Free, confidential crisis support in over 130 countries worldwide',
      is24x7: true,
      website: 'https://findahelpline.com',
      source: 'https://findahelpline.com',
      lastVerified: '2026-11-20'
    },
    {
      name: 'Befrienders Worldwide',
      number: 'befrienders.org',
      callUrl: 'https://www.befrienders.org',
      description: 'Global network of 349 emotional support centers in 32 countries',
      is24x7: true,
      website: 'https://www.befrienders.org',
      source: 'https://www.befrienders.org',
      lastVerified: '2026-11-20'
    }
  ]
};

/**
 * Returns the relevant country's helplines, falling back to International if unlisted.
 */
export function getHelplinesForCountry(countryCode?: string): CountryHelplines {
  if (!countryCode) {
    try {
      const locale = navigator.language || '';
      const parts = locale.split('-');
      if (parts.length > 1) {
        const inferred = parts[1].toUpperCase();
        if (HELPLINES_BY_COUNTRY[inferred]) {
          return HELPLINES_BY_COUNTRY[inferred];
        }
      }
    } catch {
      // ignore
    }
    return HELPLINES_BY_COUNTRY['IN'] || INTERNATIONAL_FALLBACK;
  }

  const normalized = countryCode.toUpperCase().trim();
  return HELPLINES_BY_COUNTRY[normalized] || INTERNATIONAL_FALLBACK;
}
