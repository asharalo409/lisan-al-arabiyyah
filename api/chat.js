module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Only POST allowed"
    });
  }

  try {
    const message = req.body.message;

    const prompt = `
তুমি বাংলা ভাষাভাষীদের জন্য একজন সহজ আরবি শিক্ষক।

শিক্ষার্থীর লেখা:
${message}

নিচের format-এ উত্তর দাও:

ARABIC: সহজ ও শুদ্ধ আরবি উত্তর
BANGLA: সহজ বাংলায় অর্থ বা ব্যাখ্যা
CORRECTION: ভুল থাকলে শুদ্ধ বাক্য ও কারণ। ভুল না থাকলে খালি রাখো।

নিয়ম:
- খুব সহজ আরবি ব্যবহার করবে।
- ছোট উত্তর দেবে।
- ভুল হলে ভদ্রভাবে ঠিক করবে।
- শিক্ষার্থীকে আবার আরবিতে উত্তর দিতে বলবে।
`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/interactions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY
        },
        body: JSON.stringify({
          model: "gemini-3.8-flash",
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

    const outputText = result.steps
      ?.filter(function (step) {
        return step.type === "model_output";
      })
      .flatMap(function (step) {
        return step.content || [];
      })
      .map(function (item) {
        return item.text || "";
      })
      .join("
") || "";

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

    return res.status(200).json({
      arabic: arabicMatch
        ? arabicMatch[1].trim()
        : "أَحْسَنْتَ، تَابِعْ.",

      bangla: banglaMatch
        ? banglaMatch[1].trim()
        : "ভালো চেষ্টা করেছেন। আরবিতে আবার বলুন।",

      correction: correctionMatch
        ? correctionMatch[1].trim()
        : ""
    });

  } catch (error) {
    return res.status(500).json({
      error: "AI শিক্ষক এখন উত্তর দিতে পারছে না।"
    });
  }
};
