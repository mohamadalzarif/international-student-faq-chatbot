document.addEventListener("DOMContentLoaded", () => {
  const chatbox = document.getElementById("chatbox");
  const userInput = document.getElementById("userInput");
  const chatForm = document.getElementById("chatForm");
  const clearChatBtn = document.getElementById("clearChatBtn");
  const browseTopicsBtn = document.getElementById("browseTopicsBtn");
  const quickButtons = document.querySelectorAll("[data-topic]");

  const STORAGE_KEY = "aucInternationalStudentAssistantChat";

  const STOP_WORDS = new Set([
    "a", "an", "the", "is", "are", "am", "i", "me", "my", "we", "our", "you",
    "your", "it", "this", "that", "to", "for", "of", "in", "on", "at", "and",
    "or", "but", "do", "does", "did", "can", "could", "should", "would",
    "will", "be", "been", "being", "with", "about", "please", "hi", "hello",
    "hey", "what", "when", "where", "who", "why", "how", "tell", "ask"
  ]);

  const SYNONYMS = {
    arrive: ["arrival", "arriving", "coming", "land", "landing", "airport", "orientation"],
    arriving: ["arrival", "arrive", "coming", "land", "landing", "airport", "orientation"],
    coming: ["arrival", "arrive", "arriving", "orientation"],
    land: ["arrival", "arrive", "airport"],
    landing: ["arrival", "arrive", "airport"],

    airport: ["arrival", "pickup", "transportation", "shuttle", "bus"],
    pickup: ["airport", "carpool", "transportation", "driver"],
    shuttle: ["bus", "transportation", "airport"],

    visa: ["residency", "residence", "immigration", "passport", "entry"],
    residency: ["visa", "residence", "immigration", "passport"],
    residence: ["visa", "residency", "housing"],
    passport: ["visa", "residency", "immigration"],

    dorm: ["housing", "residence", "room", "accommodation"],
    dorms: ["housing", "residence", "room", "accommodation"],
    housing: ["residence", "dorm", "accommodation", "room", "starrez"],
    accommodation: ["housing", "residence", "dorm"],
    room: ["housing", "residence", "dorm"],

    register: ["registration", "course", "courses", "classes", "pcp"],
    registration: ["register", "course", "courses", "classes", "pcp"],
    class: ["course", "registration"],
    classes: ["course", "courses", "registration"],
    course: ["class", "registration", "pcp"],
    courses: ["classes", "registration", "pcp"],
    schedule: ["registration", "course", "classes"],

    insurance: ["health", "medical", "doctor", "hospital", "globemed"],
    health: ["insurance", "medical", "doctor", "hospital", "clinic"],
    medical: ["insurance", "health", "doctor", "hospital", "clinic", "emergency"],
    doctor: ["insurance", "health", "medical", "clinic"],

    id: ["student-id", "card", "student card"],
    card: ["student-id", "id"],
    email: ["mail", "account", "login", "webmail"],
    login: ["email", "account", "password"],

    emergency: ["urgent", "unsafe", "danger", "security", "ambulance", "police"],
    unsafe: ["emergency", "security", "danger"],
    danger: ["emergency", "security", "unsafe"],
    hurt: ["emergency", "medical", "ambulance"],
    injured: ["emergency", "medical", "ambulance"],

    contact: ["email", "phone", "office", "ipso", "help"],
    office: ["contact", "ipso", "location"],
    ipso: ["contact", "office", "international"]
  };

  const EMERGENCY_TRIGGERS = [
    "emergency", "unsafe", "danger", "police", "ambulance", "fire", "attack",
    "harassment", "harassed", "threat", "threatened", "hurt", "injured",
    "medical emergency", "i feel unsafe", "help now"
  ];

  let chatHistory = [];

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

  function levenshtein(a, b) {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;

    const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);

    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        const cost = b[i - 1] === a[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }

    return matrix[b.length][a.length];
  }

  function fuzzyMatch(token, candidate) {
    if (token.length < 5 || candidate.length < 5) return false;
    const distance = levenshtein(token, candidate);
    return distance <= 2;
  }

  function escapeHtml(text) {
    return String(text)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function makeEmailLink(template) {
    if (!template || !template.to) return "";
    const subject = encodeURIComponent(template.subject || "International student support request");
    const body = encodeURIComponent(template.body || "");
    return `mailto:${encodeURIComponent(template.to)}?subject=${subject}&body=${body}`;
  }

  function getFaqById(id) {
    return window.FAQ_DATA.find(item => item.id === id);
  }

  function getSearchableText(faq) {
    return [
      faq.id,
      faq.category,
      faq.title,
      faq.shortAnswer,
      faq.details,
      faq.contact,
      faq.note,
      ...(faq.steps || []),
      ...(faq.keywords || []),
      ...(faq.sampleQuestions || [])
    ].join(" ");
  }

  function scoreFaq(message, faq) {
    const normalizedMessage = normalize(message);
    const baseTokens = tokenize(message);
    const expandedTokens = expandTokens(baseTokens);

    const searchableText = normalize(getSearchableText(faq));
    const searchableTokens = tokenize(searchableText);
    const searchableSet = new Set(searchableTokens);

    let score = 0;

    if (normalizedMessage === normalize(faq.id)) score += 100;
    if (normalizedMessage.includes(normalize(faq.title))) score += 35;

    for (const question of faq.sampleQuestions || []) {
      const normalizedQuestion = normalize(question);
      if (normalizedQuestion.includes(normalizedMessage) || normalizedMessage.includes(normalizedQuestion)) {
        score += 40;
      }
    }

    for (const keyword of faq.keywords || []) {
      const normalizedKeyword = normalize(keyword);
      if (!normalizedKeyword) continue;

      if (normalizedMessage.includes(normalizedKeyword)) {
        const wordCount = normalizedKeyword.split(" ").length;
        score += wordCount > 1 ? 28 : 13;
      }
    }

    for (const token of expandedTokens) {
      if (searchableSet.has(token)) score += 5;
      if (faq.id.includes(token)) score += 8;

      for (const candidate of searchableSet) {
        if (fuzzyMatch(token, candidate)) {
          score += 2;
          break;
        }
      }
    }

    for (const token of baseTokens) {
      if (searchableText.includes(token)) score += 2;
    }

    return score;
  }

  function rankFaqs(message) {
    return window.FAQ_DATA
      .map(faq => ({
        faq,
        score: scoreFaq(message, faq)
      }))
      .sort((a, b) => b.score - a.score);
  }

  function isEmergencyMessage(message) {
    const normalized = normalize(message);
    return EMERGENCY_TRIGGERS.some(trigger => normalized.includes(normalize(trigger)));
  }

  function createTextMessage(sender, text, save = true) {
    const row = document.createElement("div");
    row.className = `message-row ${sender}`;

    const bubble = document.createElement("div");
    bubble.className = "message-bubble";

    const label = document.createElement("span");
    label.className = "message-label";
    label.textContent = sender === "user" ? "You" : "Assistant";

    const content = document.createElement("span");
    content.innerHTML = escapeHtml(text).replace(/\n/g, "<br>");

    bubble.appendChild(label);
    bubble.appendChild(content);
    row.appendChild(bubble);
    chatbox.appendChild(row);
    chatbox.scrollTop = chatbox.scrollHeight;

    if (save) {
      chatHistory.push({ type: "text", sender, text });
      saveChatHistory();
    }
  }

  function createAnswerMessage(faq, prefix = "", save = true) {
    const row = document.createElement("div");
    row.className = "message-row bot";

    const bubble = document.createElement("div");
    bubble.className = "message-bubble";

    const label = document.createElement("span");
    label.className = "message-label";
    label.textContent = "Assistant";

    bubble.appendChild(label);

    if (prefix) {
      const prefixEl = document.createElement("p");
      prefixEl.textContent = prefix;
      bubble.appendChild(prefixEl);
    }

    const title = document.createElement("span");
    title.className = "answer-title";
    title.textContent = faq.title;
    bubble.appendChild(title);

    appendSection(bubble, "Short answer", faq.shortAnswer);

    if (faq.steps && faq.steps.length) {
      const stepsTitle = document.createElement("span");
      stepsTitle.className = "answer-section-title";
      stepsTitle.textContent = "What to do";
      bubble.appendChild(stepsTitle);

      const list = document.createElement("ol");
      list.className = "answer-list";
      faq.steps.forEach(step => {
        const li = document.createElement("li");
        li.textContent = step;
        list.appendChild(li);
      });
      bubble.appendChild(list);
    }

    appendSection(bubble, "Details", faq.details);
    appendSection(bubble, "Contact", faq.contact);
    appendSection(bubble, "Important note", faq.note);

    if (faq.emailTemplate) {
      const emailLink = document.createElement("a");
      emailLink.className = "email-action";
      emailLink.href = makeEmailLink(faq.emailTemplate);
      emailLink.textContent = "Email IPSO";
      bubble.appendChild(emailLink);
    }

    if (faq.sources && faq.sources.length) {
      const sourcesTitle = document.createElement("span");
      sourcesTitle.className = "answer-section-title";
      sourcesTitle.textContent = "Official source";
      bubble.appendChild(sourcesTitle);

      const sourceList = document.createElement("div");
      sourceList.className = "source-list";

      faq.sources.forEach(source => {
        const link = document.createElement("a");
        link.href = source.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = source.label;
        sourceList.appendChild(link);
      });

      bubble.appendChild(sourceList);
    }

    if (faq.lastUpdated) {
      const updated = document.createElement("span");
      updated.className = "last-updated";
      updated.textContent = `Last checked: ${faq.lastUpdated}`;
      bubble.appendChild(updated);
    }

    if (faq.related && faq.related.length) {
      const relatedTitle = document.createElement("span");
      relatedTitle.className = "answer-section-title";
      relatedTitle.textContent = "Related questions";
      bubble.appendChild(relatedTitle);

      const relatedActions = document.createElement("div");
      relatedActions.className = "related-actions";

      faq.related.forEach(id => {
        const relatedFaq = getFaqById(id);
        if (!relatedFaq) return;

        const button = document.createElement("button");
        button.type = "button";
        button.textContent = relatedFaq.title;
        button.addEventListener("click", () => {
          createTextMessage("user", relatedFaq.title);
          setTimeout(() => createAnswerMessage(relatedFaq), 120);
        });

        relatedActions.appendChild(button);
      });

      bubble.appendChild(relatedActions);
    }

    row.appendChild(bubble);
    chatbox.appendChild(row);
    chatbox.scrollTop = chatbox.scrollHeight;

    if (save) {
      chatHistory.push({ type: "answer", faqId: faq.id, prefix });
      saveChatHistory();
    }
  }

  function appendSection(parent, title, text) {
    if (!text) return;

    const sectionTitle = document.createElement("span");
    sectionTitle.className = "answer-section-title";
    sectionTitle.textContent = title;
    parent.appendChild(sectionTitle);

    const paragraph = document.createElement("p");
    paragraph.textContent = text;
    parent.appendChild(paragraph);
  }

  function createSuggestionMessage(ranked, save = true) {
    const suggestions = ranked
      .filter(item => item.score > 0)
      .slice(0, 4)
      .map(item => item.faq);

    const row = document.createElement("div");
    row.className = "message-row bot";

    const bubble = document.createElement("div");
    bubble.className = "message-bubble";

    const label = document.createElement("span");
    label.className = "message-label";
    label.textContent = "Assistant";
    bubble.appendChild(label);

    const text = document.createElement("p");
    text.textContent = suggestions.length
      ? "I am not fully sure I understood. Did you mean one of these topics?"
      : "I am not sure I understood yet. Try one of these common topics.";
    bubble.appendChild(text);

    const actions = document.createElement("div");
    actions.className = "suggestion-actions";

    const fallbackIds = ["arrival", "visa-residency", "housing", "course-registration", "contact-ipso"];
    const fallbackFaqs = fallbackIds.map(getFaqById).filter(Boolean);
    const finalSuggestions = suggestions.length ? suggestions : fallbackFaqs;

    finalSuggestions.forEach(faq => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = faq.title;
      button.addEventListener("click", () => {
        createTextMessage("user", faq.title);
        setTimeout(() => createAnswerMessage(faq), 120);
      });
      actions.appendChild(button);
    });

    bubble.appendChild(actions);
    row.appendChild(bubble);
    chatbox.appendChild(row);
    chatbox.scrollTop = chatbox.scrollHeight;

    if (save) {
      chatHistory.push({
        type: "suggestions",
        faqIds: finalSuggestions.map(faq => faq.id)
      });
      saveChatHistory();
    }
  }

  function createTopicBrowser(save = true) {
    const categories = {};

    window.FAQ_DATA.forEach(faq => {
      if (!categories[faq.category]) categories[faq.category] = [];
      categories[faq.category].push(faq);
    });

    const row = document.createElement("div");
    row.className = "message-row bot";

    const bubble = document.createElement("div");
    bubble.className = "message-bubble";

    const label = document.createElement("span");
    label.className = "message-label";
    label.textContent = "Assistant";
    bubble.appendChild(label);

    const title = document.createElement("span");
    title.className = "answer-title";
    title.textContent = "Browse all topics";
    bubble.appendChild(title);

    const browser = document.createElement("div");
    browser.className = "topic-browser";

    Object.entries(categories).forEach(([category, faqs]) => {
      const group = document.createElement("div");
      group.className = "topic-group";

      const groupTitle = document.createElement("p");
      groupTitle.className = "topic-group-title";
      groupTitle.textContent = category;
      group.appendChild(groupTitle);

      faqs.forEach(faq => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = faq.title;
        button.addEventListener("click", () => {
          createTextMessage("user", faq.title);
          setTimeout(() => createAnswerMessage(faq), 120);
        });
        group.appendChild(button);
      });

      browser.appendChild(group);
    });

    bubble.appendChild(browser);
    row.appendChild(bubble);
    chatbox.appendChild(row);
    chatbox.scrollTop = chatbox.scrollHeight;

    if (save) {
      chatHistory.push({ type: "browser" });
      saveChatHistory();
    }
  }

  function getBestReply(message) {
    if (isEmergencyMessage(message)) {
      return {
        type: "answer",
        faq: getFaqById("emergency"),
        prefix: "This sounds urgent. Here is the emergency guidance first."
      };
    }

    const normalized = normalize(message);
    const directMatch = getFaqById(normalized);

    if (directMatch) {
      return { type: "answer", faq: directMatch, prefix: "" };
    }

    const ranked = rankFaqs(message);
    const best = ranked[0];
    const second = ranked[1];

    if (!best || best.score < 9) {
      return { type: "suggestions", ranked };
    }

    if (second && second.score >= best.score - 4 && second.score >= 12) {
      return {
        type: "answer",
        faq: best.faq,
        prefix: `Your question may relate to more than one topic. I am showing the closest match. It may also relate to ${second.faq.title}.`
      };
    }

    return { type: "answer", faq: best.faq, prefix: "" };
  }

  function sendMessage(message) {
    const cleanMessage = String(message || "").trim();
    if (!cleanMessage) return;

    createTextMessage("user", cleanMessage);

    setTimeout(() => {
      const reply = getBestReply(cleanMessage);

      if (reply.type === "answer" && reply.faq) {
        createAnswerMessage(reply.faq, reply.prefix);
      } else {
        createSuggestionMessage(reply.ranked || []);
      }
    }, 120);

    userInput.value = "";
    userInput.focus();
  }

  function saveChatHistory() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chatHistory.slice(-40)));
    } catch (error) {
      console.warn("Could not save chat history:", error);
    }
  }

  function loadChatHistory() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (!Array.isArray(saved) || !saved.length) return false;

      chatHistory = [];

      saved.forEach(item => {
        if (item.type === "text") {
          createTextMessage(item.sender, item.text, false);
          chatHistory.push(item);
        }

        if (item.type === "answer") {
          const faq = getFaqById(item.faqId);
          if (faq) {
            createAnswerMessage(faq, item.prefix || "", false);
            chatHistory.push(item);
          }
        }

        if (item.type === "browser") {
          createTopicBrowser(false);
          chatHistory.push(item);
        }
      });

      return true;
    } catch (error) {
      console.warn("Could not load chat history:", error);
      return false;
    }
  }

  function clearChat() {
    chatbox.innerHTML = "";
    chatHistory = [];
    localStorage.removeItem(STORAGE_KEY);
    showWelcomeMessage();
  }

  function showWelcomeMessage() {
    createTextMessage(
      "bot",
      "Hi! I can help with common international student questions. You can ask things like: “When should I arrive?”, “How do I renew my visa?”, “How do I apply for housing?”, or “Who do I contact in an emergency?”"
    );
  }

  if (chatForm) {
    chatForm.addEventListener("submit", event => {
      event.preventDefault();
      sendMessage(userInput.value);
    });
  }

  quickButtons.forEach(button => {
    button.addEventListener("click", () => {
      const topic = button.getAttribute("data-topic");
      const faq = getFaqById(topic);

      createTextMessage("user", button.textContent);

      setTimeout(() => {
        if (faq) {
          createAnswerMessage(faq);
        } else {
          const reply = getBestReply(topic);
          if (reply.type === "answer" && reply.faq) {
            createAnswerMessage(reply.faq, reply.prefix);
          } else {
            createSuggestionMessage(reply.ranked || []);
          }
        }
      }, 120);
    });
  });

  if (browseTopicsBtn) {
    browseTopicsBtn.addEventListener("click", () => {
      createTextMessage("user", "Browse topics");
      setTimeout(() => createTopicBrowser(), 120);
    });
  }

  if (clearChatBtn) {
    clearChatBtn.addEventListener("click", clearChat);
  }

  if (!loadChatHistory()) {
    showWelcomeMessage();
  }
});
