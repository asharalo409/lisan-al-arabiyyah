module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Only POST allowed"
    });
  }

  try {
    const message = req.body.message || "";

    if (!message) {
      return res.status(400).json({
        error: "কোনো কথা পাওয়া যায়নি।"
      });
    }

    const prompt = `
তুমি "لِسَانُ العَرَبِيَّة" অ্যাপের আরবি শিক্ষক রোবট।

শিক্ষার্থী বাংলা ভাষাভাষী।
সে সহজ থেকে কঠিন আরবি কথোপকথন শিখছে।

শিক্ষার্থীর লেখা বা বলা কথা:
${message}

তুমি অবশ্যই নিচের তিনটি line-এ উত্তর দেবে:

ARABIC: শুদ্ধ, সহজ এবং ছোট আরবি উত্তর।
BANGLA: বাংলায় খুব সহজ অর্থ বা ব্যাখ্যা।
CORRECTION: শিক্ষার্থীর ভুল থাকলে শুদ্ধ বাক্য ও ছোট কারণ। ভুল না থাকলে লিখবে: ভালো বলেছেন।

নিয়ম:
- আরবিতে শিক্ষকের মতো কথা বলবে।
- শিক্ষার্থী ভুল করলে ভদ্রভাবে সংশোধন করবে।
- একবারে ছোট উত্তর দেবে।
- কঠিন আরবি শব্দ কম ব্যবহার করবে।
- শেষে শিক্ষার্থীকে একটি সহজ আরবি প্রশ্ন করবে।
`;

    const response = await fetch(
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

    const result = await response.json();

    if (!response.ok) {
      return res.status(500).json({
        error: result.error?.message || "Gemini AI error"
      });
    }

    const outputSteps = (result.steps || []).filter(function (step) {
      return step.type === "model_output";
    });

    const outputText = outputSteps
      .flatMap(function (step) {
        return step.content || [];
      })
      .map(function (item) {
        return item.text || "";
      })
      .join("
")
      .trim();

    const arabicMatch = outputText.match(
      /ARABIC:s*([sS]*?)(?=
BANGLA:|$)/i
    );

    const banglaMatch = outputText.match(
      /BANGLA:s*([sS]*?)(?=
CORRECTION:|$)/i
    );

    const correctionMatch = outputText.match(
      /CORRECTION:s*([sS]*)/i
    );

    const arabic = arabicMatch
      ? arabicMatch[1].trim()
      : outputText || "أَحْسَنْتَ، تَابِعْ.";

    const bangla = banglaMatch
      ? banglaMatch[1].trim()
      : "AI শিক্ষক আপনার কথার উত্তর দিয়েছে।";

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
      error: error.message || "AI শিক্ষক এখন উত্তর দিতে পারছে না।"
    });
  }
};
