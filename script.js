document.addEventListener("DOMContentLoaded", () => {
  const chatbox = document.getElementById("chatbox");
  const userInput = document.getElementById("userInput");
  const chatForm = document.getElementById("chatForm");
  const sendBtn = document.getElementById("sendBtn");
  const quickButtons = document.querySelectorAll("[data-topic]");

  if (!chatbox || !userInput) {
    console.error("Chatbot setup error: missing chatbox or userInput element.");
    return;
  }

  const STOP_WORDS = new Set([
    "a", "an", "the", "is", "are", "am", "i", "me", "my", "we", "our", "you",
    "your", "it", "this", "that", "to", "for", "of", "in", "on", "at", "and",
    "or", "but", "do", "does", "did", "can", "could", "should", "would",
    "will", "be", "been", "being", "with", "about", "please", "hi", "hello",
    "hey", "what", "when", "where", "who", "why", "how"
  ]);

  const SYNONYMS = {
    arrive: ["arrival", "arriving", "coming", "land", "landing", "airport"],
    arriving: ["arrival", "arrive", "coming", "land", "landing", "airport"],
    coming: ["arrival", "arrive", "arriving"],
    land: ["arrival", "arrive", "airport"],
    landing: ["arrival", "arrive", "airport"],

    visa: ["residency", "residence", "immigration", "passport", "entry"],
    residency: ["visa", "residence", "immigration", "passport"],
    residence: ["visa", "residency", "housing"],
    passport: ["visa", "residency", "immigration"],

    dorm: ["housing", "residence", "room", "accommodation"],
    dorms: ["housing", "residence", "room", "accommodation"],
    housing: ["residence", "dorm", "accommodation", "room", "starrez"],
    accommodation: ["housing", "residence", "dorm"],

    register: ["registration", "course", "courses", "classes", "pcp"],
    registration: ["register", "course", "courses", "classes", "pcp"],
    class: ["course", "registration"],
    classes: ["course", "courses", "registration"],
    course: ["class", "registration"],
    courses: ["classes", "registration"],

    insurance: ["health", "medical", "doctor", "hospital", "globemed"],
    health: ["insurance", "medical", "doctor", "hospital", "clinic"],
    medical: ["insurance", "health", "doctor", "hospital", "clinic"],
    doctor: ["insurance", "health", "medical", "clinic"],

    id: ["student-id", "card", "student card"],
    card: ["student-id", "id"],
    email: ["mail", "account", "login", "webmail"],
    login: ["email", "account", "password"],

    emergency: ["urgent", "unsafe", "danger", "security", "ambulance", "police"],
    unsafe: ["emergency", "security", "danger"],
    danger: ["emergency", "security", "unsafe"],

    contact: ["email", "phone", "office", "ipso", "help"],
    office: ["contact", "ipso", "location"],
    ipso: ["contact", "office", "international"]
  };

  function getData() {
    if (Array.isArray(window.FAQ_DATA)) return window.FAQ_DATA;

    if (window.faqData && typeof window.faqData === "object") {
      return Object.entries(window.faqData).map(([id, answer]) => ({
        id,
        title: id.replace(/-/g, " "),
        keywords: [id.replace(/-/g, " ")],
        answer
      }));
    }

    return [];
  }

  const FAQ_DATA_SAFE = getData();

  function escapeHtml(text) {
    return String(text)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function normalize(text) {
    return String(text)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function simpleStem(word) {
    if (word.length > 6 && word.endsWith("ing")) return word.slice(0, -3);
    if (word.length > 5 && word.endsWith("ed")) return word.slice(0, -2);
    if (word.length > 4 && word.endsWith("es")) return word.slice(0, -2);
    if (word.length > 4 && word.endsWith("s")) return word.slice(0, -1);
    return word;
  }

  function tokenize(text) {
    return normalize(text)
      .split(" ")
      .map(simpleStem)
      .filter(token => token && !STOP_WORDS.has(token));
  }

  function expandTokens(tokens) {
    const expanded = new Set(tokens);

    for (const token of tokens) {
      if (SYNONYMS[token]) {
        SYNONYMS[token].forEach(word => expanded.add(simpleStem(normalize(word))));
      }
    }

    return Array.from(expanded);
  }

  function addMessage(sender, message) {
    const row = document.createElement("div");
    row.className = `message-row ${sender}`;

    const bubble = document.createElement("div");
    bubble.className = "message-bubble";

    const label = document.createElement("span");
    label.className = "message-label";
    label.textContent = sender === "user" ? "You" : "Assistant";

    const text = document.createElement("span");
    text.innerHTML = escapeHtml(message).replace(/\n/g, "<br>");

    bubble.appendChild(label);
    bubble.appendChild(text);
    row.appendChild(bubble);
    chatbox.appendChild(row);
    chatbox.scrollTop = chatbox.scrollHeight;
  }

  function getFaqById(id) {
    return FAQ_DATA_SAFE.find(item => item.id === id);
  }

  function scoreFaq(message, faq) {
    const normalizedMessage = normalize(message);
    const baseTokens = tokenize(message);
    const expandedTokens = expandTokens(baseTokens);

    const searchableText = normalize([
      faq.id,
      faq.title,
      ...(faq.keywords || []),
      faq.answer
    ].join(" "));

    const searchableTokens = tokenize(searchableText);
    const searchableSet = new Set(searchableTokens);

    let score = 0;

    if (normalizedMessage === normalize(faq.id)) {
      score += 100;
    }

    if (faq.title && normalizedMessage.includes(normalize(faq.title))) {
      score += 35;
    }

    for (const keyword of faq.keywords || []) {
      const normalizedKeyword = normalize(keyword);
      if (!normalizedKeyword) continue;

      if (normalizedMessage.includes(normalizedKeyword)) {
        const wordCount = normalizedKeyword.split(" ").length;
        score += wordCount > 1 ? 25 : 12;
      }
    }

    for (const token of expandedTokens) {
      if (searchableSet.has(token)) {
        score += 5;
      }

      if (faq.id.includes(token)) {
        score += 8;
      }
    }

    for (const token of baseTokens) {
      if (searchableText.includes(token)) {
        score += 2;
      }
    }

    return score;
  }

  function rankFaqs(message) {
    return FAQ_DATA_SAFE
      .map(faq => ({
        faq,
        score: scoreFaq(message, faq)
      }))
      .sort((a, b) => b.score - a.score);
  }

  function buildSuggestionMessage(ranked) {
    const suggestions = ranked
      .filter(item => item.score > 0)
      .slice(0, 3)
      .map(item => `• ${item.faq.title}`)
      .join("\n");

    if (!suggestions) {
      return "I am not sure I understood the question yet. Try asking about arrival, airport pickup, visa, housing, registration, insurance, student ID, email access, emergencies, or contacting IPSO.";
    }

    return (
      "I am not fully sure I understood the question. Did you mean one of these topics?\n\n" +
      suggestions +
      "\n\nYou can click a topic button or rephrase your question."
    );
  }

  function getReply(message) {
    if (!FAQ_DATA_SAFE.length) {
      return "The FAQ content could not be loaded. Please check that content.js is connected correctly.";
    }

    const normalizedMessage = normalize(message);
    const directFaq = getFaqById(normalizedMessage);

    if (directFaq) {
      return directFaq.answer;
    }

    const ranked = rankFaqs(message);
    const best = ranked[0];
    const second = ranked[1];

    if (!best || best.score < 8) {
      return buildSuggestionMessage(ranked);
    }

    if (second && second.score >= best.score - 4 && second.score >= 10) {
      return (
        "Your question may relate to more than one topic. Here is the closest answer:\n\n" +
        best.faq.answer +
        "\n\nThis may also relate to: " +
        second.faq.title +
        "."
      );
    }

    return best.faq.answer;
  }

  function sendMessage(message) {
    const cleanMessage = String(message || "").trim();
    if (!cleanMessage) return;

    addMessage("user", cleanMessage);

    setTimeout(() => {
      addMessage("bot", getReply(cleanMessage));
    }, 120);

    userInput.value = "";
    userInput.focus();
  }

  if (chatForm) {
    chatForm.addEventListener("submit", event => {
      event.preventDefault();
      sendMessage(userInput.value);
    });
  }

  if (sendBtn && !chatForm) {
    sendBtn.addEventListener("click", () => {
      sendMessage(userInput.value);
    });
  }

  userInput.addEventListener("keydown", event => {
    if (event.key === "Enter" && !chatForm) {
      event.preventDefault();
      sendMessage(userInput.value);
    }
  });

  quickButtons.forEach(button => {
    button.addEventListener("click", () => {
      const topic = button.getAttribute("data-topic");
      const faq = getFaqById(topic);

      addMessage("user", button.textContent);

      setTimeout(() => {
        addMessage("bot", faq ? faq.answer : getReply(topic));
      }, 120);
    });
  });

  addMessage(
    "bot",
    "Hi! I can help with common international student questions. You can ask things like: “When should I arrive?”, “How do I renew my visa?”, “How do I apply for housing?”, or “Who do I contact in an emergency?”"
  );
});
