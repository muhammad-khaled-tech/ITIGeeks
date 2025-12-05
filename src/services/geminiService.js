/**
 * Gemini AI Service
 * Centralized service for all Gemini 1.5 Pro API interactions
 */

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent';

/**
 * Get API Key from Env or LocalStorage
 */
const getApiKey = () => {
    return import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('VITE_GEMINI_API_KEY');
};

/**
 * Make a request to Gemini API
 */
async function callGeminiAPI(prompt, systemInstruction = '') {
    const apiKey = getApiKey();

    if (!apiKey) {
        throw new Error('Gemini API key not configured. Please click the "AI Settings" button in the menu to add your key.');
    }

    const requestBody = {
        contents: [{
            parts: [{
                text: systemInstruction ? `${systemInstruction}\n\n${prompt}` : prompt
            }]
        }],
        generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
        }
    };

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Gemini API request failed');
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            throw new Error('No response from Gemini API');
        }

        return text;
    } catch (error) {
        console.error('Gemini API Error:', error);
        throw error;
    }
}

/**
 * Generate a contextual hint for a problem
 */
export async function generateHint(problem) {
    const systemInstruction = `You are an expert coding mentor helping students solve LeetCode problems. 
Provide a helpful hint without giving away the solution. Focus on:
- Suggesting the right data structure or algorithm approach
- Pointing out key insights about the problem
- Recommending a solving strategy
Keep hints concise (2-3 sentences max) and encouraging.`;

    const prompt = `Generate a helpful hint for this problem:
Title: ${problem.title || problem.name}
Difficulty: ${problem.difficulty || 'Unknown'}
Type/Topics: ${problem.type || 'General'}

Provide a gentle nudge that helps them think in the right direction without revealing the full solution.`;

    return await callGeminiAPI(prompt, systemInstruction);
}

/**
 * Analyze user's progress and provide insights
 */
export async function analyzeProgress(userData) {
    const problems = userData?.problems || [];
    const total = problems.length;
    const done = problems.filter(p => p.status === 'Done').length;

    // Extract topics
    const topicCounts = {};
    problems.forEach(p => {
        if (p.status === 'Done' && p.type) {
            const types = p.type.split(/,|;|\//).map(t => t.trim());
            types.forEach(t => {
                if (t) topicCounts[t] = (topicCounts[t] || 0) + 1;
            });
        }
    });

    const systemInstruction = `You are an expert coding coach analyzing a student's LeetCode progress. 
Provide personalized, actionable insights and motivation. Be encouraging but honest about areas for improvement.
Format your response with clear sections using markdown.`;

    const prompt = `Analyze this student's coding progress and provide detailed insights:

**Statistics:**
- Total Problems: ${total}
- Solved: ${done}
- Completion Rate: ${total > 0 ? ((done / total) * 100).toFixed(1) : 0}%

**Topic Distribution (Solved):**
${Object.entries(topicCounts).map(([topic, count]) => `- ${topic}: ${count} problems`).join('\n') || 'No topics tracked yet'}

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
 * Review code and provide detailed feedback
 */
export async function reviewCode(code, problemName, language) {
    const systemInstruction = `You are an expert code reviewer specializing in algorithm optimization and best practices.
Analyze code submissions for LeetCode problems. Provide:
- Time and space complexity analysis
- Code quality and style feedback
- Potential bugs or edge cases
- Optimization suggestions
- Alternative approaches

Format your response in markdown with clear sections.`;

    const prompt = `Review this ${language} solution for "${problemName}":

\`\`\`${language}
${code}
\`\`\`

Provide a comprehensive review covering:
1. **Complexity Analysis**: Time and space complexity with explanation
2. **Correctness**: Any potential bugs or edge cases to consider
3. **Code Quality**: Style, readability, and best practices
4. **Optimizations**: Suggestions for improvement if any
5. **Alternative Approaches**: Other ways to solve this (if applicable)

Be specific and constructive. Keep the review concise but thorough (max 400 words).`;

    return await callGeminiAPI(prompt, systemInstruction);
}

/**
 * General AI Coach conversation
 */
export async function chatWithCoach(userMessage, conversationHistory = []) {
    const systemInstruction = `You are an expert AI coding coach specializing in data structures and algorithms.
Help students with:
- Understanding algorithm concepts
- Problem-solving strategies
- Study planning and motivation
- Debugging approaches
- Interview preparation

Be friendly, encouraging, and provide practical advice. Use examples when helpful.
Keep responses concise (max 250 words) unless a detailed explanation is explicitly requested.`;

    // Build conversation context
    const contextMessages = conversationHistory.slice(-6).map(msg =>
        `${msg.role === 'user' ? 'Student' : 'Coach'}: ${msg.text}`
    ).join('\n');

    const prompt = conversationHistory.length > 0
        ? `Previous conversation:\n${contextMessages}\n\nStudent: ${userMessage}\n\nProvide a helpful response as their coach.`
        : `Student asks: ${userMessage}\n\nProvide a helpful response as their coach.`;

    return await callGeminiAPI(prompt, systemInstruction);
}
