const UserProfile = require('../models/UserProfile');
const { isMongoConnected } = require('../config/db');
const { getStore } = require('../config/memoryStore');
const { getGeminiModel } = require('../config/gemini');

const matchInternalMentors = async (queryText = '', excludeUserId = null) => {
  const q = String(queryText).toLowerCase();
  const excludedIds = new Set(['664f1a2b3c4d5e6f7a8b9c07']);
  if (excludeUserId) {
    excludedIds.add(String(excludeUserId));
  }

  let profiles = [];
  if (isMongoConnected()) {
    const allProfiles = await UserProfile.find({ 'skillsHave.0': { $exists: true } }).limit(20);
    profiles = allProfiles.filter((p) => !excludedIds.has(String(p.userId)));
  } else {
    profiles = getStore().userProfiles.filter(
      (p) => !excludedIds.has(String(p.userId)) && p.skillsHave?.length > 0
    );
  }

  const matched = profiles.filter((p) =>
    p.skillsHave.some(
      (s) =>
        q.includes(s.skill.toLowerCase()) ||
        s.skill.toLowerCase().includes(q) ||
        q.includes((s.domain || '').toLowerCase())
    )
  );

  const finalList = (matched.length > 0 ? matched : profiles).slice(0, 3);

  return finalList.map((p) => {
    const firstSkill = p.skillsHave[0];
    return {
      userId: String(p.userId),
      displayName: p.displayName,
      rating: p.rating,
      totalSessions: p.totalSessions,
      matchingSkill: firstSkill
        ? `${firstSkill.skill} (${firstSkill.level.charAt(0) + firstSkill.level.slice(1).toLowerCase()})`
        : 'Mentorship (Expert)'
    };
  });
};

const buildSmartFallbackAnswer = (question = '', suggestedMentors = []) => {
  const q = String(question).trim();
  const lower = q.toLowerCase();
  const mentorLabel = suggestedMentors?.[0]?.displayName
    ? `**${suggestedMentors[0].displayName}**`
    : 'a verified peer mentor';

  if (lower.includes('useeffect') || lower.includes('react')) {
    return {
      answer: `In React 18+, \`React.StrictMode\` intentionally double-invokes effects in development to help detect side-effect cleanup bugs.\n\n### 4-Week React Mastery Roadmap\n1. **Week 1:** JSX, Props, Component Lifecycle & StrictMode Cleanup.\n2. **Week 2:** Custom Hooks (\`useEffect\`, \`useMemo\`, \`useCallback\`) & State Architecture.\n3. **Week 3:** Next.js App Router, Server Components & Data Fetching.\n4. **Week 4:** Book a 50 CR 1-on-1 session with ${mentorLabel} on our Marketplace for live code review!`,
      steps: [
        'Understand the core fundamentals & React 18 StrictMode lifecycle.',
        'Build a small practical project with proper useEffect cleanup functions.',
        'Book a session with a mentor on our marketplace to review your code!'
      ]
    };
  }

  return {
    answer: `Based on your question about **${q}**, here is a suggested learning roadmap:\n\n1. Understand the core fundamentals.\n2. Build a small practical project.\n3. Book a session with a mentor on our marketplace to review your code!`,
    steps: [
      'Understand the core fundamentals.',
      'Build a small practical project.',
      'Book a session with a mentor on our marketplace to review your code!'
    ]
  };
};

// Feature #42 & #44: POST /api/ai/ask
const askSkillBot = async (req, res, next) => {
  try {
    const { question, prompt } = req.body || {};
    const queryText = (question || prompt || '').trim();

    if (!queryText) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          httpStatus: 400,
          message: 'A technical question or prompt is required.'
        }
      });
    }

    const suggestedMentors = await matchInternalMentors(queryText, req.user?.userId);
    const model = getGeminiModel();

    if (model) {
      try {
        const result = await model.generateContent(queryText);
        const responseText = result.response.text();
        return res.status(200).json({
          success: true,
          answer: responseText,
          steps: [
            'Understand the core fundamentals.',
            'Build a small practical project.',
            'Book a session with a mentor on our marketplace to review your code!'
          ],
          suggestedMentors
        });
      } catch (aiErr) {
        // Fallback gracefully if quota or API key issue
      }
    }

    const fallback = buildSmartFallbackAnswer(queryText, suggestedMentors);

    return res.status(200).json({
      success: true,
      answer: fallback.answer,
      steps: fallback.steps,
      suggestedMentors
    });
  } catch (err) {
    next(err);
  }
};

// Feature #43: POST /api/ai/roadmap
const generateRoadmap = async (req, res, next) => {
  try {
    const { topic, skill } = req.body || {};
    const targetSkill = (topic || skill || 'Full-Stack Engineering').trim();

    const suggestedMentors = await matchInternalMentors(targetSkill, req.user?.userId);
    const model = getGeminiModel();

    if (model) {
      try {
        const prompt = `Generate a structured 4-week learning roadmap for mastering "${targetSkill}". Include weekly milestones and practical project goals.`;
        const result = await model.generateContent(prompt);
        return res.status(200).json({
          success: true,
          topic: targetSkill,
          roadmapMarkdown: result.response.text(),
          weeks: [
            { week: 1, title: `Core Fundamentals of ${targetSkill}`, tasks: ['Syntax & core concepts', 'Environment setup'] },
            { week: 2, title: 'Intermediate Patterns & Architecture', tasks: ['State & modular design', 'Debugging workflows'] },
            { week: 3, title: 'Capstone Project Implementation', tasks: ['Build a real-world app', 'Write unit tests'] },
            { week: 4, title: '1-on-1 Mentor Code Review on SkillSwap', tasks: ['Book a 50 CR session', 'Production optimization'] }
          ],
          suggestedMentors
        });
      } catch (_) {
        // Use structured fallback below
      }
    }

    return res.status(200).json({
      success: true,
      topic: targetSkill,
      roadmapMarkdown: `### 4-Week ${targetSkill} Mastery Roadmap\n1. **Week 1:** Core Fundamentals & Tooling\n2. **Week 2:** Intermediate Architecture & Best Practices\n3. **Week 3:** Hands-On Project Building\n4. **Week 4:** 1-on-1 Live Mentorship & Code Review on SkillSwap`,
      weeks: [
        { week: 1, title: `Core Fundamentals of ${targetSkill}`, tasks: ['Syntax & core concepts', 'Environment setup'] },
        { week: 2, title: 'Intermediate Patterns & Architecture', tasks: ['State & modular design', 'Debugging workflows'] },
        { week: 3, title: 'Capstone Project Implementation', tasks: ['Build a real-world app', 'Write unit tests'] },
        { week: 4, title: '1-on-1 Mentor Code Review on SkillSwap', tasks: ['Book a 50 CR session', 'Production optimization'] }
      ],
      suggestedMentors
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  askSkillBot,
  generateRoadmap
};
