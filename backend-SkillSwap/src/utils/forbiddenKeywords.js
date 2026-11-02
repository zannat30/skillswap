const ALLOWED_DOMAINS = [
  'Technology',
  'Creative Arts',
  'Languages',
  'Academics'
];

const FORBIDDEN_KEYWORDS = [
  // 1. Academic Fraud
  'solve my exam',
  'exam paper',
  'final semester exam',
  'solve my final',
  'live exam',
  'exam solving',
  'take-home test',
  'thesis ghostwriting',
  'ghostwrite',
  'homework cheating',
  'do my homework',
  'do my assignment',
  'cheat on exam',

  // 2. Illegal Cyber Activities
  'black-hat',
  'black hat',
  'ddos',
  'credential phishing',
  'phishing',
  'malware',
  'ransomware',
  'keylogger',
  'hack into',

  // 3. Licensed Professional Advice
  'medical diagnosis',
  'prescription advice',
  'prescribe medication',
  'certified legal representation',
  'tax auditing',

  // 4. Physical Offline Services
  'plumbing',
  'electrical wiring',
  'carpentry',
  'home appliance repair',
  'physical courier'
];

const FORBIDDEN_DOMAIN_NAMES = [
  'academic fraud',
  'illegal cyber activities',
  'illegal services',
  'licensed professional advice',
  'physical offline services',
  'physical labor'
];

function checkForbiddenInput(inputs = []) {
  for (const raw of inputs) {
    if (!raw || typeof raw !== 'string') continue;
    const normalized = raw.toLowerCase().trim();

    for (const domainName of FORBIDDEN_DOMAIN_NAMES) {
      if (normalized.includes(domainName)) {
        return { isForbidden: true, flaggedInput: raw };
      }
    }

    for (const keyword of FORBIDDEN_KEYWORDS) {
      if (normalized.includes(keyword)) {
        return { isForbidden: true, flaggedInput: raw };
      }
    }
  }
  return { isForbidden: false, flaggedInput: null };
}

module.exports = {
  ALLOWED_DOMAINS,
  FORBIDDEN_KEYWORDS,
  FORBIDDEN_DOMAIN_NAMES,
  checkForbiddenInput
};
