module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Only POST allowed"
    });
  }

  try {
    var message = req.body.message || "";
    var gender = req.body.gender || "male";

    if (!message.trim()) {
      return res.status(400).json({
        error: "কোনো লেখা পাওয়া যায়নি।"
      });
    }

    var teacherGender = gender === "female" ? "মেয়ে / মহিলা" : "ছেলে / পুরুষ";

    var prompt = `
তুমি একজন আরবি ভাষার শিক্ষক।

তোমার বর্তমান লিঙ্গ: ${teacherGender}

শিক্ষার্থীর লেখা:
${message}

নিয়ম:

1. শিক্ষার্থী বাংলা লিখলে সেটিকে সঠিক ও সহজ আরবিতে অনুবাদ করবে।
2. শিক্ষার্থী আরবি লিখলে তার কথার উত্তর আরবিতে দেবে।
3. সব সময় আরবি উত্তরের বাংলা অর্থ লিখবে।
4. শিক্ষার্থী ভুল আরবি লিখলে শুদ্ধ বাক্য লিখবে।
5. শিক্ষার্থী বাংলা লিখলে তার বাংলা কথা হুবহু repeat করবে না।
6. শিক্ষক ছেলে হলে পুরুষবাচক আরবি ব্যবহার করবে।
7. শিক্ষক মেয়ে হলে স্ত্রীবাচক আরবি ব্যবহার করবে।
8. উত্তর ছোট ও সহজ রাখবে।

শুধু নিচের format-এ উত্তর দাও:

ARABIC: আরবি অনুবাদ বা আরবিতে উত্তর
BANGLA: আরবি বাক্যের বাংলা অর্থ
CORRECTION: ভুল থাকলে সংশোধন, না থাকলে ভালো বলেছেন।
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
        error: result.error ? result.error.message : "Gemini API error"
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

    if (!outputText.trim()) {
      return res.status(500).json({
        error: "Gemini থেকে কোনো লেখা পাওয়া যায়নি।"
      });
    }

    var arabic = "";
    var bangla = "";
    var correction = "";
    var currentSection = "";

    var lines = outputText.split(String.fromCharCode(10));

    for (var k = 0; k < lines.length; k++) {
      var line = lines[k].trim();

      if (line.startsWith("ARABIC:")) {
        currentSection = "arabic";
        arabic = line.replace("ARABIC:", "").trim();
      } else if (line.startsWith("BANGLA:")) {
        currentSection = "bangla";
        bangla = line.replace("BANGLA:", "").trim();
      } else if (line.startsWith("CORRECTION:")) {
        currentSection = "correction";
        correction = line.replace("CORRECTION:", "").trim();
      } else if (line) {
        if (currentSection === "arabic") {
          arabic += " " + line;
        }

        if (currentSection === "bangla") {
          bangla += " " + line;
        }

        if (currentSection === "correction") {
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
      error: error.message || "Server error"
    });
  }
};
