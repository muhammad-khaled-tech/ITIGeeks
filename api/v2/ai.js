import { adminDb } from "../firebaseAdmin";

/**
 * Gemini AI Proxy (v2)
 * Securely communicates with Google Generative AI APIs
 */
export default async function handler(req, res) {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { contents, generationConfig, systemInstruction } = req.body;

    if (!contents || !Array.isArray(contents)) {
      return res.status(400).json({ error: "Invalid request body" });
    }

    // 1. Resolve API Key
    let apiKey = process.env.VITE_GEMINI_API_KEY;

    // 2. Fallback: Fetch from Firestore if not in Env
    if (!apiKey || apiKey === "YOUR_KEY_HERE") {
      try {
        const settingsSnap = await adminDb
          .collection("settings")
          .doc("app")
          .get();
        if (settingsSnap.exists) {
          apiKey = settingsSnap.data().geminiApiKey;
        }
      } catch (dbError) {
        console.error("Failed to fetch Gemini key from Firestore:", dbError);
      }
    }

    if (!apiKey) {
      return res.status(500).json({
        error: "AI service not configured",
        message: "No Gemini API key found in server environment or database.",
      });
    }

    // 3. Prepare Gemini Request
    const model = "gemini-1.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const requestBody = {
      contents,
      generationConfig: generationConfig || {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    };

    // Add system instruction if provided
    if (systemInstruction) {
      requestBody.system_instruction = {
        parts: [{ text: systemInstruction }],
      };
    }

    // 4. Call Gemini
    const geminiResponse = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const data = await geminiResponse.json();

    if (!geminiResponse.ok) {
      console.error("Gemini API Error Response:", data);
      return res.status(geminiResponse.status).json({
        error: "Gemini API Error",
        message:
          data.error?.message || "External AI service returned an error.",
      });
    }

    // 5. Return response to client
    res.status(200).json(data);
  } catch (error) {
    console.error("AI Proxy Internal Error:", error);
    res.status(500).json({
      error: "AI Proxy Error",
      message: error.message,
    });
  }
}
