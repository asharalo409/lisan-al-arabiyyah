module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Only POST allowed"
    });
  }

  try {
    const message = req.body?.message?.trim();

    if (!message) {
      return res.status(400).json({
        error: "আপনার লেখা পাওয়া যায়নি।"
      });
    }

    const prompt = `
তুমি একজন সহায়ক আরবি ভাষার শিক্ষক।

শিক্ষার্থীর লেখা:
"${message}"

শুধু নিচের format-এ উত্তর দাও:

ARABIC: শিক্ষার্থীর কথার প্রাসঙ্গিক আরবি উত্তর
BANGLA: আরবি বাক্যটির সহজ বাংলা অর্থ
CORRECTION: শিক্ষার্থীর ভুল থাকলে শুদ্ধ বাক্য ও কারণ, না থাকলে "ভালো বলেছেন।"

নিয়ম:
- প্রতিবার শিক্ষার্থীর নতুন কথার ভিত্তিতে নতুন উত্তর দেবে।
- সবসময় একই উত্তর দেবে না।
- আরবি সহজ রাখবে।
- উত্তর সংক্ষিপ্ত রাখবে।
`;

    const geminiResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/interactions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY,
          "Api-Revision": "2026-05-20"
        },
        body: JSON.stringify({
          model: "gemini-3.5-flash",
          input: prompt
        })
      }
    );

    const result = await geminiResponse.json();

    if (!geminiResponse.ok) {
      return res.status(500).json({
        error:
          result?.error?.message ||
          "Gemini API থেকে উত্তর পাওয়া যায়নি।"
      });
    }

    let outputText = "";

    for (const step of result.steps || []) {
      if (step.type === "model_output") {
        for (const content of step.content || []) {
          if (content.type === "text" && content.text) {
            outputText += content.text + "
";
          }
        }
      }
    }

    outputText = outputText.trim();

    if (!outputText) {
      return res.status(500).json({
        error:
          "Gemini উত্তর দিয়েছে, কিন্তু লেখা পাওয়া যায়নি। Vercel Function Logs দেখুন।"
      });
    }

    const arabicMatch = outputText.match(
      /ARABIC:s*([sS]*?)(?=
s*BANGLA:|$)/i
    );

    const banglaMatch = outputText.match(
      /BANGLA:s*([sS]*?)(?=
s*CORRECTION:|$)/i
    );

    const correctionMatch = outputText.match(
      /CORRECTION:s*([sS]*)/i
    );

    const arabic = arabicMatch
      ? arabicMatch[1].trim()
      : outputText;

    const bangla = banglaMatch
      ? banglaMatch[1].trim()
      : "AI শিক্ষকের উত্তর উপরে দেওয়া হয়েছে।";

    const correction = correctionMatch
      ? correctionMatch[1].trim()
      : "ভালো চেষ্টা করেছেন।";

    return res.status(200).json({
      arabic: arabic,
      bangla: bangla,
      correction: correction
    });

  } catch (error) {
    return res.status(500).json({
      error: "Server error: " + error.message
    });
  }
};
