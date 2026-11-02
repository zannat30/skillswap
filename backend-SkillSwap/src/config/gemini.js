const { GoogleGenerativeAI } = require('@google/generative-ai');

const SYSTEM_INSTRUCTION = `You are SkillBot, the official 24/7 AI Technical Mentor on SkillSwap — an AI-Powered Decentralized Knowledge Exchange & Virtual Barter Economy Platform.
Your responsibilities:
1. Resolve coding bugs, syntax errors, and architectural questions with clean, well-commented Markdown code snippets.
2. Generate structured multi-week learning roadmaps when requested.
3. Uphold Academic Integrity: Refuse live exam solving, homework cheating, illegal hacking, medical/legal diagnosis, or physical labor requests.
4. Keep explanations encouraging, concise, and practical, and encourage booking a 50 CR 1-on-1 human mentorship session on SkillSwap for deep pair-programming.`;

const getGeminiModel = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.includes('ReplaceWithYourActualGoogleAIStudioKey')) {
    return null;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelName = process.env.GEMINI_MODEL_NAME || 'gemini-2.5-flash';
    return genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: SYSTEM_INSTRUCTION
    });
  } catch (err) {
    return null;
  }
};

module.exports = { getGeminiModel, SYSTEM_INSTRUCTION };
