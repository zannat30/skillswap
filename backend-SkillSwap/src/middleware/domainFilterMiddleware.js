const { ALLOWED_DOMAINS, checkForbiddenInput } = require('../utils/forbiddenKeywords');

const domainFilterMiddleware = (req, res, next) => {
  const { skill, skillName, domain, question, topic, description } = req.body || {};

  const candidateStrings = [skill, skillName, domain, question, topic, description].filter(Boolean);
  const { isForbidden, flaggedInput } = checkForbiddenInput(candidateStrings);

  if (isForbidden) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN_DOMAIN',
        httpStatus: 403,
        message: 'Session requests or skill listings involving Academic Fraud, Illegal Services, Licensed Medical/Legal Advice, or Physical Labor are strictly prohibited under SkillSwap Policy.',
        flaggedInput
      }
    });
  }

  if (domain && !ALLOWED_DOMAINS.includes(domain)) {
    // Allow case-insensitive mapping for standard domains before rejecting
    const matchedDomain = ALLOWED_DOMAINS.find(
      (d) => d.toLowerCase() === String(domain).toLowerCase().trim()
    );
    if (matchedDomain) {
      req.body.domain = matchedDomain;
    } else {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN_DOMAIN',
          httpStatus: 403,
          message: 'Session requests or skill listings involving Academic Fraud, Illegal Services, Licensed Medical/Legal Advice, or Physical Labor are strictly prohibited under SkillSwap Policy.',
          flaggedInput: domain
        }
      });
    }
  }

  next();
};

module.exports = domainFilterMiddleware;
