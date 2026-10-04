module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "শুধু POST request গ্রহণ করা হয়।"
    });
  }

  try {
    const message = req.body.message;

    if (!message) {
      return res.status(400).json({
        error: "কোনো আরবি বাক্য পাওয়া যায়নি।"
      });
    }

    const teacherPrompt = `
তুমি একজন ধৈর্যশীল আরবি ভাষার শিক্ষক।
শিক্ষার্থী বাংলা ভাষাভাষী এবং সহজ আরবি কথোপকথন শিখছে।

শিক্ষার্থীর আরবি বাক্য:
${message}

তুমি অবশ্যই নিচের format-এ উত্তর দেবে:

ARABIC: এখানে সহজ, শুদ্ধ আরবি উত্তর লিখবে।
BANGLA: এখানে খুব সহজ বাংলায় অর্থ বা ব্যাখ্যা লিখবে।
CORRECTION: ভুল থাকলে শুদ্ধ বাক্য ও ছোট কারণ লিখবে। ভুল না থাকলে খালি রাখবে।

নিয়ম:
- খুব সহজ আরবি ব্যবহার করবে।
- একবারে ছোট উত্তর দেবে।
- শিক্ষার্থী ভুল করলে ভদ্রভাবে সংশোধন করবে।
- কঠিন শব্দ ব্যবহার করবে না।
- উত্তরটি শিক্ষক ও শিক্ষার্থীর কথোপকথনের মতো হবে।
`;

    const aiResponse = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-6-astra",
          input: teacherPrompt
        })
      }
    );

    const result = await aiResponse.json();

    if (!aiResponse.ok) {
      throw new Error("AI API error");
    }

    let outputText = "";

    if (result.output_text) {
      outputText = result.output_text;
    } else if (result.output && result.output[0]) {
      const content = result.output[0].content || [];

      outputText = content
        .map(function (item) {
          return item.text || "";
        })
        .join("
");
    }

    const arabicMatch = outputText.match(/ARABIC:s*([sS]*?)(?=
BANGLA:|$)/i);
    const banglaMatch = outputText.match(/BANGLA:s*([sS]*?)(?=
CORRECTION:|$)/i);
    const correctionMatch = outputText.match(/CORRECTION:s*([sS]*)/i);

    const arabic = arabicMatch
      ? arabicMatch[1].trim()
      : "أَحْسَنْتَ، تَابِعْ.";

    const bangla = banglaMatch
      ? banglaMatch[1].trim()
      : "ভালো চেষ্টা করেছেন। আরবিতে আরও একটি ছোট বাক্য বলুন।";

    const correction = correctionMatch
      ? correctionMatch[1].trim()
      : "";

    return res.status(200).json({
      arabic,
      bangla,
      correction
    });
  } catch (error) {
    return res.status(500).json({
      error: "AI শিক্ষক এখন উত্তর দিতে পারছে না।"
    });
  }
};
