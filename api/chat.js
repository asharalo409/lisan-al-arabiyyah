module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const message = req.body.message;

    const prompt = `
তুমি একজন সহজ আরবি শিক্ষক।

শিক্ষার্থীর কথা:
${message}

এই format-এ উত্তর দাও:

ARABIC: শুদ্ধ ও সহজ আরবি উত্তর
BANGLA: সহজ বাংলায় ব্যাখ্যা
CORRECTION: ভুল থাকলে শুদ্ধ বাক্য ও কারণ। ভুল না থাকলে খালি রাখো।

ছোট উত্তর দেবে এবং শিক্ষার্থীকে আরবিতে আবার উত্তর দিতে বলবে।
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

    const outputs = result.outputs || [];
    const outputText = outputs.length
      ? outputs[outputs.length - 1].text || ""
      : "";

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
      error: error.message
    });
  }
};
