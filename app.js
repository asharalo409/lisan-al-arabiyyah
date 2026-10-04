const STORAGE_KEYS = {
  theme: "lisan_theme",
  totalSeconds: "lisan_total_seconds",
  todayDate: "lisan_today_date",
  todaySeconds: "lisan_today_seconds",
  lastStudyDate: "lisan_last_study_date",
  streak: "lisan_streak",
  notificationEnabled: "lisan_notification_enabled",
  reminderTime: "lisan_reminder_time"
};

let studyTimer = null;
let reminderTimer = null;
let reminderShownToday = false;

function getTodayDate() {
  const today = new Date();
  return today.getFullYear() + "-" +
    String(today.getMonth() + 1).padStart(2, "0") + "-" +
    String(today.getDate()).padStart(2, "0");
}

function getYesterdayDate() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  return yesterday.getFullYear() + "-" +
    String(yesterday.getMonth() + 1).padStart(2, "0") + "-" +
    String(yesterday.getDate()).padStart(2, "0");
}

function getNumber(key) {
  return Number(localStorage.getItem(key) || 0);
}

function formatMinutes(seconds) {
  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return minutes + " মিনিট";
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return hours + " ঘণ্টা " + remainingMinutes + " মিনিট";
}

function applyTheme(theme) {
  document.body.classList.remove("theme-light", "theme-dark", "theme-green");
  document.body.classList.add("theme-" + theme);

  document.documentElement.style.setProperty(
    "--app-primary",
    theme === "dark" ? "#62c98e" : theme === "green" ? "#0b5d3b" : "#087443"
  );

  localStorage.setItem(STORAGE_KEYS.theme, theme);
  updateThemeButtons(theme);
}

function setTheme(theme) {
  applyTheme(theme);
}

function loadTheme() {
  const savedTheme = localStorage.getItem(STORAGE_KEYS.theme) || "light";
  applyTheme(savedTheme);
}

function updateThemeButtons(theme) {
  const lightButton = document.getElementById("lightTheme");
  const darkButton = document.getElementById("darkTheme");
  const greenButton = document.getElementById("greenTheme");

  if (lightButton) {
    lightButton.classList.toggle("selected", theme === "light");
  }

  if (darkButton) {
    darkButton.classList.toggle("selected", theme === "dark");
  }

  if (greenButton) {
    greenButton.classList.toggle("selected", theme === "green");
  }
}

function updateStudyData() {
  const today = getTodayDate();
  const savedToday = localStorage.getItem(STORAGE_KEYS.todayDate);

  if (savedToday !== today) {
    localStorage.setItem(STORAGE_KEYS.todayDate, today);
    localStorage.setItem(STORAGE_KEYS.todaySeconds, "0");
  }

  const totalSeconds = getNumber(STORAGE_KEYS.totalSeconds) + 60;
  const todaySeconds = getNumber(STORAGE_KEYS.todaySeconds) + 60;

  localStorage.setItem(STORAGE_KEYS.totalSeconds, totalSeconds);
  localStorage.setItem(STORAGE_KEYS.todaySeconds, todaySeconds);

  updateStreak();
  updateStudyUI();
}

function updateStreak() {
  const today = getTodayDate();
  const yesterday = getYesterdayDate();
  const lastStudyDate = localStorage.getItem(STORAGE_KEYS.lastStudyDate);
  let streak = getNumber(STORAGE_KEYS.streak);

  if (lastStudyDate === today) {
    return;
  }

  if (lastStudyDate === yesterday) {
    streak += 1;
  } else {
    streak = 1;
  }

  localStorage.setItem(STORAGE_KEYS.lastStudyDate, today);
  localStorage.setItem(STORAGE_KEYS.streak, streak);
}

function updateStudyUI() {
  const todayStudyTime = document.getElementById("todayStudyTime");
  const totalStudyTime = document.getElementById("totalStudyTime");
  const studyStreak = document.getElementById("studyStreak");

  if (todayStudyTime) {
    todayStudyTime.innerText = formatMinutes(
      getNumber(STORAGE_KEYS.todaySeconds)
    );
  }

  if (totalStudyTime) {
    totalStudyTime.innerText = formatMinutes(
      getNumber(STORAGE_KEYS.totalSeconds)
    );
  }

  if (studyStreak) {
    studyStreak.innerText = getNumber(STORAGE_KEYS.streak) + " দিন";
  }
}

function startStudyTimer() {
  const pageName = window.location.pathname.split("/").pop();

  const learningPages = [
    "lessons.html",
    "vocabulary.html",
    "quiz.html",
    "chat.html"
  ];

  if (!learningPages.includes(pageName)) {
    return;
  }

  if (studyTimer) {
    clearInterval(studyTimer);
  }

  studyTimer = setInterval(function () {
    if (!document.hidden) {
      updateStudyData();
    }
  }, 60000);
}

function toggleNotifications() {
  const notificationToggle = document.getElementById("notificationToggle");

  if (!notificationToggle) {
    return;
  }

  if (notificationToggle.checked) {
    if (!("Notification" in window)) {
      alert("আপনার browser-এ Notification সুবিধাটি নেই।");
      notificationToggle.checked = false;
      return;
    }

    Notification.requestPermission().then(function (permission) {
      if (permission === "granted") {
        localStorage.setItem(STORAGE_KEYS.notificationEnabled, "true");
        showReminderTime();

        new Notification("لِسَانُ العَرَبِيَّة", {
          body: "Notification চালু হয়েছে। প্রতিদিন আরবি অনুশীলন করুন।",
          icon: "icon.svg"
        });

        startReminderCheck();
      } else {
        notificationToggle.checked = false;
        localStorage.setItem(STORAGE_KEYS.notificationEnabled, "false");
        hideReminderTime();

        alert("Notification চালু করতে browser-এর অনুমতি দিন।");
      }
    });
  } else {
    localStorage.setItem(STORAGE_KEYS.notificationEnabled, "false");
    hideReminderTime();
  }
}

function saveReminderTime() {
  const reminderTime = document.getElementById("reminderTime");

  if (!reminderTime) {
    return;
  }

  localStorage.setItem(STORAGE_KEYS.reminderTime, reminderTime.value);
}

function showReminderTime() {
  const reminderTimeRow = document.getElementById("reminderTimeRow");

  if (reminderTimeRow) {
    reminderTimeRow.style.display = "flex";
  }
}

function hideReminderTime() {
  const reminderTimeRow = document.getElementById("reminderTimeRow");

  if (reminderTimeRow) {
    reminderTimeRow.style.display = "none";
  }
}

function loadNotificationSettings() {
  const notificationToggle = document.getElementById("notificationToggle");
  const reminderTime = document.getElementById("reminderTime");

  const enabled =
    localStorage.getItem(STORAGE_KEYS.notificationEnabled) === "true";

  const savedTime =
    localStorage.getItem(STORAGE_KEYS.reminderTime) || "20:00";

  if (notificationToggle) {
    notificationToggle.checked = enabled;
  }

  if (reminderTime) {
    reminderTime.value = savedTime;
  }

  if (enabled) {
    showReminderTime();
    startReminderCheck();
  } else {
    hideReminderTime();
  }
}

function startReminderCheck() {
  if (reminderTimer) {
    clearInterval(reminderTimer);
  }

  reminderTimer = setInterval(function () {
    const enabled =
      localStorage.getItem(STORAGE_KEYS.notificationEnabled) === "true";

    const reminderTime =
      localStorage.getItem(STORAGE_KEYS.reminderTime) || "20:00";

    const currentTime = new Date();
    const now =
      String(currentTime.getHours()).padStart(2, "0") + ":" +
      String(currentTime.getMinutes()).padStart(2, "0");

    if (
      enabled &&
      now === reminderTime &&
      !reminderShownToday &&
      Notification.permission === "granted"
    ) {
      new Notification("আরবি পড়ার সময় হয়েছে", {
        body: "আজ لِسَانُ العَرَبِيَّة-এ কিছু আরবি অনুশীলন করুন।",
        icon: "icon.svg"
      });

      reminderShownToday = true;
    }

    if (now === "00:00") {
      reminderShownToday = false;
    }
  }, 30000);
}

function clearLearningData() {
  const confirmed = confirm(
    "আপনি কি পড়ার সময়, ধারাবাহিক শেখার দিন এবং স্থানীয় তথ্য মুছে ফেলতে চান?"
  );

  if (!confirmed) {
    return;
  }

  localStorage.removeItem(STORAGE_KEYS.totalSeconds);
  localStorage.removeItem(STORAGE_KEYS.todayDate);
  localStorage.removeItem(STORAGE_KEYS.todaySeconds);
  localStorage.removeItem(STORAGE_KEYS.lastStudyDate);
  localStorage.removeItem(STORAGE_KEYS.streak);

  updateStudyUI();

  alert("আপনার স্থানীয় পড়ার তথ্য মুছে দেওয়া হয়েছে।");
}

function addThemeStyles() {
  const style = document.createElement("style");

  style.innerHTML = `
    body.theme-dark {
      background: #15211b !important;
      color: #edf7f1 !important;
    }

    body.theme-dark .app,
    body.theme-dark .setting-card,
    body.theme-dark .word-card,
    body.theme-dark .lesson-card,
    body.theme-dark .question-card,
    body.theme-dark .stat-card,
    body.theme-dark .menu-card,
    body.theme-dark .card {
      background: #1d3026 !important;
      border-color: #395446 !important;
      color: #edf7f1 !important;
    }

    body.theme-dark h1,
    body.theme-dark h2,
    body.theme-dark h3,
    body.theme-dark p,
    body.theme-dark .section-title,
    body.theme-dark .lesson-info h3,
    body.theme-dark .card h3,
    body.theme-dark .menu-text h3 {
      color: inherit !important;
    }

    body.theme-dark .meaning,
    body.theme-dark .lesson-info p,
    body.theme-dark .card p,
    body.theme-dark .menu-text p,
    body.theme-dark .word-bangla,
    body.theme-dark .pronunciation {
      color: #bdd0c3 !important;
    }

    body.theme-dark .option,
    body.theme-dark .chat-input,
    body.theme-dark .time-input {
      background: #21392d !important;
      color: #ffffff !important;
      border-color: #456555 !important;
    }

    body.theme-dark .bottom-nav,
    body.theme-dark .input-area {
      background: #1d3026 !important;
      border-color: #395446 !important;
    }

    body.theme-green {
      background: #eef8f1 !important;
    }

    body.theme-green .app {
      background: #f8fff9 !important;
    }

    body.theme-green .header,
    body.theme-green .hero {
      background: linear-gradient(135deg, #06472c, #0f7548) !important;
    }
  `;

  document.head.appendChild(style);
}

document.addEventListener("DOMContentLoaded", function () {
  addThemeStyles();
  loadTheme();
  updateStudyUI();
  loadNotificationSettings();
  startStudyTimer();
});
