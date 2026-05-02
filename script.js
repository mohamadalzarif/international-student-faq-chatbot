document.addEventListener("DOMContentLoaded", () => {
  const chatbox = document.getElementById("chatbox");
  const userInput = document.getElementById("userInput");
  const chatForm = document.getElementById("chatForm");
  const clearChatBtn = document.getElementById("clearChatBtn");
  const browseTopicsBtn = document.getElementById("browseTopicsBtn");
  const urgentHelpBtn = document.getElementById("urgentHelpBtn");
  const typingIndicator = document.getElementById("typingIndicator");
  const suggestionBar = document.getElementById("suggestionBar");
  const compactModeToggle = document.getElementById("compactModeToggle");
  const darkModeToggle = document.getElementById("darkModeToggle");
  const contrastModeToggle = document.getElementById("contrastModeToggle");
  const staffModeToggle = document.getElementById("staffModeToggle");
  const emptyState = document.getElementById("emptyState");

  const STORAGE_KEY = "aucInternationalStudentAssistantChatV20";
  const SETTINGS_KEY = "aucInternationalStudentAssistantSettingsV20";
  const FAQ_ITEMS = Array.isArray(window.FAQ_DATA) ? window.FAQ_DATA : [];

  const STOP_WORDS = new Set([
    "a", "an", "the", "is", "are", "am", "i", "me", "my", "we", "our", "you",
    "your", "it", "this", "that", "to", "for", "of", "in", "on", "at", "and",
    "or", "but", "do", "does", "did", "can", "could", "should", "would",
    "will", "be", "been", "being", "with", "about", "please", "hi", "hello",
    "hey", "tell", "ask"
  ]);

  const TOPIC_ICONS = {
    "arrival": "✈️",
    "airport-pickup": "🚗",
    "visa-residency": "🛂",
    "housing": "🏠",
    "course-registration": "📚",
    "health-insurance": "🏥",
    "student-id": "🪪",
    "email-access": "📧",
    "emergency": "🚨",
    "contact-ipso": "☎️",
    "sensitive-documents": "🔒"
  };

  const RISK_MAP = {
    "arrival": "medium",
    "airport-pickup": "medium",
    "visa-residency": "high",
    "housing": "medium",
    "course-registration": "medium",
    "health-insurance": "high",
    "student-id": "low",
    "email-access": "low",
    "emergency": "urgent",
    "contact-ipso": "low",
    "sensitive-documents": "high"
  };

  const QUESTION_TYPE_HINTS = {
    when: ["arrival", "course-registration", "visa-residency"],
    where: ["housing", "contact-ipso", "student-id"],
    who: ["contact-ipso", "emergency", "health-insurance"],
    "how much": ["visa-residency", "health-insurance"],
    "can i": ["visa-residency", "housing", "course-registration", "health-insurance"],
    "what if": ["visa-residency", "emergency", "housing", "email-access"]
  };

  const PHRASE_MAP = [
    { phrase: "when should i arrive", topic: "arrival" },
    { phrase: "when do i come", topic: "arrival" },
    { phrase: "when am i arriving", topic: "arrival" },
    { phrase: "before classes", topic: "arrival" },
    { phrase: "airport pickup", topic: "airport-pickup" },
    { phrase: "pick me up", topic: "airport-pickup" },
    { phrase: "from the airport", topic: "airport-pickup" },
    { phrase: "visa expired", topic: "visa-residency", urgent: true },
    { phrase: "renew my visa", topic: "visa-residency" },
    { phrase: "renew residency", topic: "visa-residency" },
    { phrase: "lost passport", topic: "visa-residency", urgent: true },
    { phrase: "where do i live", topic: "housing" },
    { phrase: "apply for housing", topic: "housing" },
    { phrase: "register for classes", topic: "course-registration" },
    { phrase: "change my courses", topic: "course-registration" },
    { phrase: "health insurance", topic: "health-insurance" },
    { phrase: "medical emergency", topic: "emergency", urgent: true },
    { phrase: "i feel unsafe", topic: "emergency", urgent: true },
    { phrase: "who do i contact", topic: "contact-ipso" },
    { phrase: "contact ipso", topic: "contact-ipso" },
    { phrase: "upload passport", topic: "sensitive-documents", privacy: true },
    { phrase: "send passport", topic: "sensitive-documents", privacy: true },
    { phrase: "visa scan", topic: "sensitive-documents", privacy: true },
    { phrase: "medical record", topic: "sensitive-documents", privacy: true }
  ];

  const SYNONYMS = {
    arrive: ["arrival", "arriving", "coming", "land", "landing", "airport", "orientation"],
    arriving: ["arrival", "arrive", "coming", "land", "landing", "airport", "orientation"],
    coming: ["arrival", "arrive", "arriving", "orientation"],
    land: ["arrival", "arrive", "airport"],
    airport: ["arrival", "pickup", "transportation", "shuttle", "bus"],
    pickup: ["airport", "carpool", "transportation", "driver"],
    visa: ["residency", "residence", "immigration", "passport", "entry"],
    residency: ["visa", "residence", "immigration", "passport"],
    passport: ["visa", "residency", "immigration", "document"],
    dorm: ["housing", "residence", "room", "accommodation"],
    housing: ["residence", "dorm", "accommodation", "room", "starrez"],
    register: ["registration", "course", "courses", "classes", "pcp"],
    registration: ["register", "course", "courses", "classes", "pcp"],
    course: ["class", "registration", "pcp"],
    insurance: ["health", "medical", "doctor", "hospital", "globemed"],
    health: ["insurance", "medical", "doctor", "hospital", "clinic"],
    id: ["student-id", "card", "student card"],
    email: ["mail", "account", "login", "webmail"],
    emergency: ["urgent", "unsafe", "danger", "security", "ambulance", "police"],
    unsafe: ["emergency", "security", "danger"],
    contact: ["email", "phone", "office", "ipso", "help"],
    ipso: ["contact", "office", "international"]
  };

  const EMERGENCY_TRIGGERS = [
    "emergency", "unsafe", "danger", "police", "ambulance", "fire", "attack",
    "harassment", "harassed", "threat", "threatened", "hurt", "injured",
    "medical emergency", "i feel unsafe", "help now", "stolen passport",
    "lost passport", "visa expired"
  ];

  const SENSITIVE_TRIGGERS = [
    "passport number", "passport scan", "visa scan", "medical record",
    "bank statement", "bank details", "upload passport", "send passport",
    "id scan", "private document", "sensitive document"
  ];

  let chatHistory = [];
  let lastTopicId = null;

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
    tokens.forEach(token => {
      if (SYNONYMS[token]) {
        SYNONYMS[token].forEach(word => expanded.add(simpleStem(normalize(word))));
      }
    });
    return Array.from(expanded);
  }

  function escapeHtml(text) {
    return String(text)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function levenshtein(a, b) {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;

    const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

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
    return levenshtein(token, candidate) <= 2;
  }

  function getFaqById(id) {
    return FAQ_ITEMS.find(item => item.id === id);
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

  function detectQuestionType(message) {
    const normalized = normalize(message);
    if (normalized.includes("how much") || normalized.includes("cost") || normalized.includes("fee")) return "how much";
    if (normalized.startsWith("when")) return "when";
    if (normalized.startsWith("where")) return "where";
    if (normalized.startsWith("who")) return "who";
    if (normalized.startsWith("can i")) return "can i";
    if (normalized.startsWith("what if")) return "what if";
    return "";
  }

  function containsNegationNearTopic(message, faq) {
    const normalized = normalize(message);
    const terms = [faq.id, ...(faq.keywords || [])].map(normalize);
    const negations = ["no", "not", "dont", "do not", "doesnt", "does not", "without"];
    return negations.some(neg => terms.some(term => term && normalized.includes(`${neg} ${term}`)));
  }

  function detectPhraseMatch(message) {
    const normalized = normalize(message);
    return PHRASE_MAP.find(item => normalized.includes(normalize(item.phrase)));
  }

  function isEmergencyMessage(message) {
    const normalized = normalize(message);
    return EMERGENCY_TRIGGERS.some(trigger => normalized.includes(normalize(trigger)));
  }

  function isSensitiveMessage(message) {
    const normalized = normalize(message);
    const looksLikeLongNumber = /\b\d{8,}\b/.test(normalized);
    return looksLikeLongNumber || SENSITIVE_TRIGGERS.some(trigger => normalized.includes(normalize(trigger)));
  }

  function scoreFaq(message, faq) {
    const normalizedMessage = normalize(message);
    const baseTokens = tokenize(message);
    const expandedTokens = expandTokens(baseTokens);
    const searchableText = normalize(getSearchableText(faq));
    const searchableTokens = tokenize(searchableText);
    const searchableSet = new Set(searchableTokens);
    const questionType = detectQuestionType(message);

    let score = 0;

    if (containsNegationNearTopic(message, faq)) score -= 20;
    if (normalizedMessage === normalize(faq.id)) score += 100;
    if (normalizedMessage.includes(normalize(faq.title))) score += 35;

    const phrase = detectPhraseMatch(message);
    if (phrase && phrase.topic === faq.id) score += 65;

    if (questionType && QUESTION_TYPE_HINTS[questionType]?.includes(faq.id)) {
      score += 12;
    }

    if (lastTopicId && lastTopicId === faq.id && baseTokens.length <= 4) {
      score += 16;
    }

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
    return FAQ_ITEMS
      .map(faq => ({ faq, score: scoreFaq(message, faq) }))
      .sort((a, b) => b.score - a.score);
  }

  function getConfidence(score) {
    if (score >= 45) return "high";
    if (score >= 18) return "medium";
    return "low";
  }

  function makeEmailLink(template) {
    if (!template || !template.to) return "";
    const subject = encodeURIComponent(template.subject || "International student support request");
    const body = encodeURIComponent(template.body || "");
    return `mailto:${encodeURIComponent(template.to)}?subject=${subject}&body=${body}`;
  }

  function showEmptyStateIfNeeded() {
    if (!emptyState) return;
    emptyState.style.display = chatbox.children.length ? "none" : "grid";
  }

  function showTyping() {
    typingIndicator?.classList.add("active");
  }

  function hideTyping() {
    typingIndicator?.classList.remove("active");
  }

  function saveChatHistory() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chatHistory.slice(-40)));
    } catch (error) {
      console.warn("Could not save chat history:", error);
    }
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

    showEmptyStateIfNeeded();
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

  function createBadge(label, className) {
    const badge = document.createElement("span");
    badge.className = `answer-badge ${className}`;
    badge.textContent = label;
    return badge;
  }

  function getRiskLabel(faq) {
    const risk = RISK_MAP[faq.id] || "low";
    if (risk === "urgent") return { label: "Urgent", className: "badge-urgent" };
    if (risk === "high") return { label: "High-risk topic", className: "badge-high" };
    if (risk === "medium") return { label: "Confirm details", className: "badge-medium" };
    return { label: "General guidance", className: "badge-low" };
  }

  function copyToClipboard(text) {
    navigator.clipboard?.writeText(text).catch(() => {
      const temp = document.createElement("textarea");
      temp.value = text;
      document.body.appendChild(temp);
      temp.select();
      document.execCommand("copy");
      temp.remove();
    });
  }

  function answerToPlainText(faq, mode = "full") {
    if (mode === "short") {
      return `${faq.title}\n\nShort answer:\n${faq.shortAnswer}\n\nContact:\n${faq.contact || ""}`;
    }

    if (mode === "steps") {
      return `${faq.title}\n\nWhat to do:\n${(faq.steps || []).map((step, index) => `${index + 1}. ${step}`).join("\n")}`;
    }

    if (mode === "contact") {
      return `${faq.title}\n\nContact:\n${faq.contact || "No specific contact listed."}`;
    }

    return [
      faq.title,
      "",
      `Short answer:\n${faq.shortAnswer || ""}`,
      "",
      faq.steps?.length ? `What to do:\n${faq.steps.map((step, index) => `${index + 1}. ${step}`).join("\n")}` : "",
      "",
      faq.details ? `Details:\n${faq.details}` : "",
      "",
      faq.contact ? `Contact:\n${faq.contact}` : "",
      "",
      faq.note ? `Important note:\n${faq.note}` : ""
    ].filter(Boolean).join("\n");
  }

  function createAnswerMessage(faq, options = {}, save = true) {
    const mode = options.mode || "full";
    const prefix = options.prefix || "";
    const urgent = options.urgent || RISK_MAP[faq.id] === "urgent";
    const privacy = options.privacy || faq.id === "sensitive-documents";

    lastTopicId = faq.id;

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

    if (urgent) {
      const urgentBox = document.createElement("div");
      urgentBox.className = "urgent-box";
      urgentBox.textContent = "Urgent routing: If anyone is in immediate danger, contact AUC Security or public emergency services now. Do not wait for a chatbot response.";
      bubble.appendChild(urgentBox);
    }

    if (privacy) {
      const privacyBox = document.createElement("div");
      privacyBox.className = "privacy-box";
      privacyBox.textContent = "Privacy warning: Do not submit passports, visa scans, medical records, bank details, IDs, or private documents through this chatbot.";
      bubble.appendChild(privacyBox);
    }

    const badges = document.createElement("div");
    badges.className = "answer-badges";
    const riskBadge = getRiskLabel(faq);
    badges.appendChild(createBadge(riskBadge.label, riskBadge.className));
    badges.appendChild(createBadge(faq.category || "FAQ", "badge-medium"));
    bubble.appendChild(badges);

    const title = document.createElement("span");
    title.className = "answer-title";
    title.textContent = `${TOPIC_ICONS[faq.id] || "💬"} ${faq.title}`;
    bubble.appendChild(title);

    appendSection(bubble, "Short answer", faq.shortAnswer);

    if (mode === "full" || mode === "steps") {
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
    }

    if (mode === "full") {
      appendSection(bubble, "Details", faq.details);
      appendSection(bubble, "Contact", faq.contact);
      appendSection(bubble, "Important note", faq.note);
    }

    if (mode === "contact") {
      appendSection(bubble, "Contact", faq.contact);
    }

    const modeActions = document.createElement("div");
    modeActions.className = "answer-mode-actions";

    [
      ["Short answer", "short"],
      ["Give me steps", "steps"],
      ["Who do I contact?", "contact"],
      ["Show details", "full"]
    ].forEach(([text, nextMode]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = text;
      button.addEventListener("click", () => createAnswerMessage(faq, { mode: nextMode }, true));
      modeActions.appendChild(button);
    });

    bubble.appendChild(modeActions);

    const tools = document.createElement("div");
    tools.className = "answer-tools";

    const copyAnswerBtn = document.createElement("button");
    copyAnswerBtn.type = "button";
    copyAnswerBtn.textContent = "Copy answer";
    copyAnswerBtn.addEventListener("click", () => {
      copyToClipboard(answerToPlainText(faq, mode));
      copyAnswerBtn.textContent = "Copied";
      setTimeout(() => (copyAnswerBtn.textContent = "Copy answer"), 1200);
    });
    tools.appendChild(copyAnswerBtn);

    const copyContactBtn = document.createElement("button");
    copyContactBtn.type = "button";
    copyContactBtn.textContent = "Copy contact";
    copyContactBtn.addEventListener("click", () => {
      copyToClipboard(faq.contact || "No contact listed.");
      copyContactBtn.textContent = "Copied";
      setTimeout(() => (copyContactBtn.textContent = "Copy contact"), 1200);
    });
    tools.appendChild(copyContactBtn);

    const confusedBtn = document.createElement("button");
    confusedBtn.type = "button";
    confusedBtn.textContent = "I’m still confused";
    confusedBtn.addEventListener("click", () => {
      const contactFaq = getFaqById("contact-ipso");
      if (contactFaq) createAnswerMessage(contactFaq, { prefix: "No problem. Here is who to contact for direct support." });
    });
    tools.appendChild(confusedBtn);

    const urgentBtn = document.createElement("button");
    urgentBtn.type = "button";
    urgentBtn.textContent = "This is urgent";
    urgentBtn.addEventListener("click", () => {
      const emergencyFaq = getFaqById("emergency");
      if (emergencyFaq) createAnswerMessage(emergencyFaq, { urgent: true, prefix: "Here is the urgent guidance." });
    });
    tools.appendChild(urgentBtn);

    bubble.appendChild(tools);

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
        button.textContent = `${TOPIC_ICONS[relatedFaq.id] || ""} ${relatedFaq.title}`;
        button.addEventListener("click", () => {
          createTextMessage("user", relatedFaq.title);
          runReply(relatedFaq.title);
        });

        relatedActions.appendChild(button);
      });

      bubble.appendChild(relatedActions);
    }

    row.appendChild(bubble);
    chatbox.appendChild(row);
    chatbox.scrollTop = chatbox.scrollHeight;

    if (save) {
      chatHistory.push({ type: "answer", faqId: faq.id, options: { mode, prefix, urgent, privacy } });
      saveChatHistory();
    }

    showEmptyStateIfNeeded();
  }

  function createSuggestionMessage(ranked, save = true) {
    const suggestions = ranked
      .filter(item => item.score > 0)
      .slice(0, 4)
      .map(item => item.faq);

    const fallbackIds = ["arrival", "visa-residency", "housing", "course-registration", "contact-ipso"];
    const fallbackFaqs = fallbackIds.map(getFaqById).filter(Boolean);
    const finalSuggestions = suggestions.length ? suggestions : fallbackFaqs;

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

    finalSuggestions.forEach(faq => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = `${TOPIC_ICONS[faq.id] || ""} ${faq.title}`;
      button.addEventListener("click", () => {
        createTextMessage("user", faq.title);
        runReply(faq.title);
      });
      actions.appendChild(button);
    });

    bubble.appendChild(actions);
    row.appendChild(bubble);
    chatbox.appendChild(row);
    chatbox.scrollTop = chatbox.scrollHeight;

    if (save) {
      chatHistory.push({ type: "suggestions", faqIds: finalSuggestions.map(faq => faq.id) });
      saveChatHistory();
    }

    showEmptyStateIfNeeded();
  }

  function createTopicBrowser(save = true) {
    const categories = {};

    FAQ_ITEMS.forEach(faq => {
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
        button.textContent = `${TOPIC_ICONS[faq.id] || ""} ${faq.title}`;
        button.addEventListener("click", () => {
          createTextMessage("user", faq.title);
          runReply(faq.title);
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

    showEmptyStateIfNeeded();
  }

  function getBestReply(message) {
    if (!FAQ_ITEMS.length) return { type: "error" };

    if (isSensitiveMessage(message)) {
      return {
        type: "answer",
        faq: getFaqById("sensitive-documents"),
        options: { privacy: true, prefix: "This may involve sensitive information, so here is the privacy guidance first." }
      };
    }

    if (isEmergencyMessage(message)) {
      return {
        type: "answer",
        faq: getFaqById("emergency"),
        options: { urgent: true, prefix: "This sounds urgent. Here is the emergency guidance first." }
      };
    }

    const phrase = detectPhraseMatch(message);
    if (phrase) {
      const faq = getFaqById(phrase.topic);
      if (faq) {
        return {
          type: "answer",
          faq,
          options: {
            urgent: !!phrase.urgent,
            privacy: !!phrase.privacy,
            prefix: phrase.urgent ? "This may be urgent, so I am routing you to the safest answer." : ""
          }
        };
      }
    }

    const normalized = normalize(message);
    const directMatch = getFaqById(normalized);

    if (directMatch) {
      return { type: "answer", faq: directMatch, options: {} };
    }

    const ranked = rankFaqs(message);
    const best = ranked[0];
    const second = ranked[1];

    if (!best || best.score < 9) {
      return { type: "suggestions", ranked };
    }

    const confidence = getConfidence(best.score);

    if (confidence === "medium" || (second && second.score >= best.score - 4 && second.score >= 12)) {
      return {
        type: "answer",
        faq: best.faq,
        options: {
          prefix: second
            ? `Your question may relate to more than one topic. I am showing the closest match. It may also relate to ${second.faq.title}.`
            : "I think this is the closest answer, but you can use the related buttons if it is not what you meant."
        }
      };
    }

    return { type: "answer", faq: best.faq, options: {} };
  }

  function runReply(message) {
    showTyping();

    setTimeout(() => {
      hideTyping();

      const reply = getBestReply(message);

      if (reply.type === "error") {
        createTextMessage(
          "bot",
          "The FAQ content could not be loaded. Make sure content.js starts with window.FAQ_DATA = [ ... ]; and that content.js loads before script.js."
        );
        return;
      }

      if (reply.type === "answer" && reply.faq) {
        createAnswerMessage(reply.faq, reply.options || {});
      } else {
        createSuggestionMessage(reply.ranked || []);
      }
    }, 260);
  }

  function sendMessage(message) {
    const cleanMessage = String(message || "").trim();
    if (!cleanMessage) return;

    createTextMessage("user", cleanMessage);
    runReply(cleanMessage);

    userInput.value = "";
    userInput.focus();
    updateSuggestionBar("");
  }

  function updateSuggestionBar(value) {
    if (!suggestionBar) return;

    const cleanValue = String(value || "").trim();
    suggestionBar.innerHTML = "";

    if (cleanValue.length < 2) {
      suggestionBar.classList.remove("active");
      return;
    }

    const ranked = rankFaqs(cleanValue).slice(0, 4).filter(item => item.score > 0);

    if (!ranked.length) {
      suggestionBar.classList.remove("active");
      return;
    }

    ranked.forEach(item => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = `${TOPIC_ICONS[item.faq.id] || ""} ${item.faq.title}`;
      button.addEventListener("click", () => {
        userInput.value = item.faq.title;
        updateSuggestionBar("");
        sendMessage(item.faq.title);
      });
      suggestionBar.appendChild(button);
    });

    suggestionBar.classList.add("active");
  }

  function showWelcomeMessage() {
    createTextMessage(
      "bot",
      "Hi! I can help with common international student questions. You can ask things like: “When should I arrive?”, “How do I renew my visa?”, “How do I apply for housing?”, or “Who do I contact in an emergency?”"
    );
  }

  function clearChat() {
    chatbox.innerHTML = "";
    chatHistory = [];
    lastTopicId = null;
    localStorage.removeItem(STORAGE_KEY);
    showEmptyStateIfNeeded();
    showWelcomeMessage();
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
            createAnswerMessage(faq, item.options || {}, false);
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

  function createFlow(type) {
    const flows = {
      "new-student": [
        "New students usually start with these steps:",
        "1. Check AUC email.",
        "2. Review arrival and orientation guidance.",
        "3. Confirm visa/residency requirements.",
        "4. Apply for housing if needed.",
        "5. Complete course planning with IPSO."
      ].join("\n"),
      "already-cairo": [
        "If you are already in Cairo:",
        "1. Make sure you can access your AUC email.",
        "2. Attend orientation or ask IPSO what you missed.",
        "3. Follow Business Support Office instructions for visa/residency.",
        "4. Confirm your housing and student ID.",
        "5. Contact IPSO if anything is unclear."
      ].join("\n"),
      "problem": [
        "Let’s route the problem:",
        "Visa or passport issue: students.residency@aucegypt.edu",
        "Housing or move-in issue: reslife@aucegypt.edu",
        "Course registration issue: ipso@aucegypt.edu",
        "Medical or safety emergency: contact emergency services first.",
        "General issue: ipso@aucegypt.edu"
      ].join("\n"),
      "contact": [
        "Main contacts:",
        "IPSO: ipso@aucegypt.edu · +20.2.2615.3612",
        "Visa/residency: students.residency@aucegypt.edu",
        "Airport pickup: carpool@aucegypt.edu",
        "Housing move-in: reslife@aucegypt.edu",
        "AUC Security: +20.2.2615.4444",
        "AUC Hotline: 19282"
      ].join("\n")
    };

    createTextMessage("bot", flows[type] || flows.contact);
  }

  function applySettings(settings) {
    document.body.classList.toggle("compact-mode", !!settings.compact);
    document.body.classList.toggle("dark-mode", !!settings.dark);
    document.body.classList.toggle("high-contrast", !!settings.contrast);
    document.body.classList.toggle("staff-mode", !!settings.staff);

    if (compactModeToggle) compactModeToggle.checked = !!settings.compact;
    if (darkModeToggle) darkModeToggle.checked = !!settings.dark;
    if (contrastModeToggle) contrastModeToggle.checked = !!settings.contrast;
    if (staffModeToggle) staffModeToggle.checked = !!settings.staff;
  }

  function getSettings() {
    try {
      return JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
    } catch {
      return {};
    }
  }

  function updateSetting(key, value) {
    const settings = getSettings();
    settings[key] = value;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    applySettings(settings);
  }

  if (chatForm) {
    chatForm.addEventListener("submit", event => {
      event.preventDefault();
      sendMessage(userInput.value);
    });
  }

  userInput.addEventListener("input", event => {
    updateSuggestionBar(event.target.value);
  });

  document.querySelectorAll("[data-topic]").forEach(button => {
    button.addEventListener("click", () => {
      const topic = button.getAttribute("data-topic");
      const faq = getFaqById(topic);
      createTextMessage("user", button.textContent.trim());

      if (faq) {
        showTyping();
        setTimeout(() => {
          hideTyping();
          createAnswerMessage(faq);
        }, 180);
      } else {
        runReply(topic);
      }
    });
  });

  document.querySelectorAll("[data-flow]").forEach(button => {
    button.addEventListener("click", () => {
      const flow = button.getAttribute("data-flow");
      createTextMessage("user", button.textContent.trim());
      setTimeout(() => createFlow(flow), 120);
    });
  });

  document.querySelectorAll("[data-contact-copy]").forEach(button => {
    button.addEventListener("click", () => {
      copyToClipboard(button.getAttribute("data-contact-copy"));
      button.textContent = "Copied";
      setTimeout(() => {
        button.textContent = button.getAttribute("data-contact-copy").split(":")[0];
      }, 1200);
    });
  });

  document.querySelectorAll(".empty-card").forEach(card => {
    card.addEventListener("click", () => {
      const topic = card.getAttribute("data-topic");
      const faq = getFaqById(topic);
      if (!faq) return;
      createTextMessage("user", faq.title);
      runReply(faq.title);
    });
  });

  browseTopicsBtn?.addEventListener("click", () => {
    createTextMessage("user", "Browse topics");
    setTimeout(() => createTopicBrowser(), 120);
  });

  urgentHelpBtn?.addEventListener("click", () => {
    createTextMessage("user", "Urgent help");
    const emergencyFaq = getFaqById("emergency");
    if (emergencyFaq) createAnswerMessage(emergencyFaq, { urgent: true, prefix: "Here is the urgent guidance." });
  });

  clearChatBtn?.addEventListener("click", clearChat);

  document.getElementById("newStudentFlowBtn")?.addEventListener("click", () => createFlow("new-student"));
  document.getElementById("alreadyInCairoFlowBtn")?.addEventListener("click", () => createFlow("already-cairo"));
  document.getElementById("problemFlowBtn")?.addEventListener("click", () => createFlow("problem"));
  document.getElementById("contactFlowBtn")?.addEventListener("click", () => createFlow("contact"));

  compactModeToggle?.addEventListener("change", event => updateSetting("compact", event.target.checked));
  darkModeToggle?.addEventListener("change", event => updateSetting("dark", event.target.checked));
  contrastModeToggle?.addEventListener("change", event => updateSetting("contrast", event.target.checked));
  staffModeToggle?.addEventListener("change", event => updateSetting("staff", event.target.checked));

  applySettings(getSettings());
  showEmptyStateIfNeeded();

  if (!loadChatHistory()) {
    showWelcomeMessage();
  }
});
