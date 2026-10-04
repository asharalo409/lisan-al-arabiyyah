module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Only POST allowed"
    });
  }

  try {
    var message = req.body.message;

    var prompt = `
তুমি একজন আরবি শিক্ষক।

শিক্ষার্থীর লেখা: ${message}

এই format-এ উত্তর দাও:

ARABIC: আরবিতে উত্তর
BANGLA: সহজ বাংলা অর্থ
CORRECTION: ভুল থাকলে শুদ্ধ করো, না থাকলে ভালো বলেছেন।
`;

    var response = await fetch(
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

    var result = await response.json();

    if (!response.ok) {
      return res.status(500).json({
        error: result.error.message
      });
    }

    var outputText = "";

    for (var i = 0; i < result.steps.length; i++) {
      var step = result.steps[i];

      if (step.type === "model_output") {
        for (var j = 0; j < step.content.length; j++) {
          if (step.content[j].text) {
            outputText += step.content[j].text;
            outputText += String.fromCharCode(10);
          }
        }
      }
    }

    var arabic = "";
    var bangla = "";
    var correction = "";
    var section = "";

    var lines = outputText.split(String.fromCharCode(10));

    for (var k = 0; k < lines.length; k++) {
      var line = lines[k].trim();

      if (line.startsWith("ARABIC:")) {
        section = "arabic";
        arabic = line.replace("ARABIC:", "").trim();
      } else if (line.startsWith("BANGLA:")) {
        section = "bangla";
        bangla = line.replace("BANGLA:", "").trim();
      } else if (line.startsWith("CORRECTION:")) {
        section = "correction";
        correction = line.replace("CORRECTION:", "").trim();
      } else if (line) {
        if (section === "arabic") {
          arabic += " " + line;
        }

        if (section === "bangla") {
          bangla += " " + line;
        }

        if (section === "correction") {
          correction += " " + line;
        }
      }
    }

    return res.status(200).json({
      arabic: arabic || "أَحْسَنْتَ",
      bangla: bangla || "ভালো চেষ্টা করেছেন।",
      correction: correction || "ভালো বলেছেন।"
    });

  } catch (error) {
    return res.status(500).json({
      error: error.message
    });
  }
};
