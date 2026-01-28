/**
 * Gemini AI Service
 * Centralized service for all Gemini 1.5 Pro API interactions
 */

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

/**
 * Get API Key from Env or LocalStorage
 */
const getApiKey = () => {
  // Use environment variable only - managed by admin/deployment
  return import.meta.env.VITE_GEMINI_API_KEY;
};

/**
 * Make a request to Gemini API
 */
async function callGeminiAPI(prompt, systemInstruction = "") {
  const apiKey = getApiKey();

  if (!apiKey) {
    console.warn("Gemini API key is missing in environment variables.");
    // Fail gracefully or return mock response if needed, for now just throw simpler error
    throw new Error(
      "AI service is currently unavailable. Please contact support.",
    );
  }

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: systemInstruction
              ? `${systemInstruction}\n\n${prompt}`
              : prompt,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048,
    },
  };

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Gemini API request failed");
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error("No response from Gemini API");
    }

    return text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}

/**
 * Generate progressive hints for a problem (3 tiers)
 * Returns an array of 3 hints: light nudge → specific direction → almost-answer
 */
export async function generateProgressiveHints(problem) {
  const systemInstruction = `You are an expert coding mentor helping students learn problem-solving.
Generate exactly 3 progressive hints for the given coding problem.

Format your response EXACTLY as JSON (no markdown, no code blocks):
{
  "hint1": "A gentle nudge without revealing the approach",
  "hint2": "More specific direction pointing to the algorithm/pattern",
  "hint3": "Almost the answer - the approach with key steps but no code"
}

Rules:
- Hint 1: Very vague, just make them think (e.g., "Consider the time complexity requirement...")
- Hint 2: Name the technique/pattern (e.g., "This is a classic two-pointer problem...")
- Hint 3: Explain the approach step by step (e.g., "1. Use a hash map to store... 2. Iterate through...")
- Do NOT include actual code in any hint
- Be encouraging and friendly`;

  const prompt = `Generate 3 progressive hints for this problem:

Title: ${problem.title || problem.name}
Difficulty: ${problem.difficulty || "Unknown"}
Topics: ${problem.type || "General"}
${problem.description ? `Description: ${problem.description}` : ""}

Return ONLY the JSON object, no other text.`;

  try {
    const response = await callGeminiAPI(prompt, systemInstruction);

    // Parse JSON response
    const cleanResponse = response
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    const hints = JSON.parse(cleanResponse);

    return {
      hint1:
        hints.hint1 || "Think about what data structure would help here...",
      hint2:
        hints.hint2 ||
        "Consider the time complexity requirements for this problem.",
      hint3: hints.hint3 || "Break down the problem into smaller steps.",
    };
  } catch (error) {
    console.error("Failed to parse hints:", error);
    throw error;
  }
}

/**
 * Legacy single hint function (kept for compatibility)
 */
export async function generateHint(problem) {
  const hints = await generateProgressiveHints(problem);
  return hints.hint1;
}

/**
 * Analyze user's progress and provide insights
 */
export async function analyzeProgress(userData) {
  const problems = userData?.problems || [];
  const total = problems.length;
  const done = problems.filter((p) => p.status === "Done").length;

  // Extract topics
  const topicCounts = {};
  problems.forEach((p) => {
    if (p.status === "Done" && p.type) {
      const types = p.type.split(/,|;|\//).map((t) => t.trim());
      types.forEach((t) => {
        if (t) topicCounts[t] = (topicCounts[t] || 0) + 1;
      });
    }
  });

  const systemInstruction = `You are a supportive coding coach and friend. 
Analyze the student's progress like a real human mentor. 
- Celebrate their wins enthusiastically (use emojis like 🔥, 🚀).
- Be honest but kind about where they need work.
- Speak naturally, avoid robotic lists if possible, or make them feel conversational.`;

  const prompt = `Analyze this student's coding progress and provide detailed insights:

**Statistics:**
- Total Problems: ${total}
- Solved: ${done}
- Completion Rate: ${total > 0 ? ((done / total) * 100).toFixed(1) : 0}%

**Topic Distribution (Solved):**
${
  Object.entries(topicCounts)
    .map(([topic, count]) => `- ${topic}: ${count} problems`)
    .join("\n") || "No topics tracked yet"
}

Provide:
1. **Progress Overview**: Assess their overall progress
2. **Strengths**: Identify topics they excel at
3. **Areas for Growth**: Suggest topics to focus on next
4. **Study Plan**: Recommend 3-5 specific problem types to practice
5. **Motivation**: Encouraging message to keep them going

Keep the analysis practical and motivating (max 300 words).`;

  return await callGeminiAPI(prompt, systemInstruction);
}

/**
 * Review code and provide detailed feedback with correctness verdict
 */
export async function reviewCode(
  code,
  problemName,
  language,
  problemDescription = "",
) {
  const systemInstruction = `You are a senior software engineer with 15+ years of experience reviewing code.
Your job is to provide an HONEST assessment of whether the solution is likely correct, plus detailed feedback.

IMPORTANT: Start your response with the correctness verdict in this exact format:
## ✅ LIKELY CORRECT
or
## ❌ LIKELY INCORRECT
or  
## ⚠️ PARTIALLY CORRECT

Then provide your detailed analysis. Be specific about what works and what doesn't.
Use markdown formatting. Be encouraging but honest.`;

  const prompt = `Review this ${language} solution for the problem "${problemName}":

\`\`\`${language}
${code}
\`\`\`

${problemDescription ? `Problem Description: ${problemDescription}` : ""}

Provide a comprehensive code review:

1. **Correctness Verdict** (MUST start with one of: ✅ LIKELY CORRECT, ❌ LIKELY INCORRECT, ⚠️ PARTIALLY CORRECT)
   - Does this solution appear to solve the problem correctly?
   - What edge cases might fail?

2. **Complexity Analysis**
   - Time Complexity: O(?)
   - Space Complexity: O(?)
   - Is this optimal for the problem?

3. **Bugs & Issues**
   - Any obvious bugs in the logic?
   - Edge cases not handled?
   - Off-by-one errors, null checks, etc.?

4. **Code Quality**
   - Readability and style
   - Best practices followed/violated

5. **Suggestions**
   - How to improve the solution
   - Alternative approaches (if any)

Be specific, cite line numbers or code snippets when relevant. Max 500 words.`;

  return await callGeminiAPI(prompt, systemInstruction);
}

/**
 * General AI Coach conversation
 */
export async function chatWithCoach(userMessage, conversationHistory = []) {
  const systemInstruction = `You are an experienced, friendly coding mentor named "Coach".
- You are REAL, not a bot. Don't say "As an AI...".
- Chat like a friend. be casual, use slang if appropriate (like "LGTM", "edge case", "brute force").
- Keep answers concise and punchy. No long lectures unless asked.
- If they are stuck, give a hint, not the solution.
- Be encouraging! Usage of emojis is allowed but don't overdo it.`;

  // Build conversation context
  const contextMessages = conversationHistory
    .slice(-6)
    .map((msg) => `${msg.role === "user" ? "Student" : "Coach"}: ${msg.text}`)
    .join("\n");

  const prompt =
    conversationHistory.length > 0
      ? `Previous conversation:\n${contextMessages}\n\nStudent: ${userMessage}\n\nProvide a helpful response as their coach.`
      : `Student asks: ${userMessage}\n\nProvide a helpful response as their coach.`;

  return await callGeminiAPI(prompt, systemInstruction);
}
