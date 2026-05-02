/**
 * Chatbot logic for the international student FAQ. This file handles
 * rendering messages in the chatbox, responding to user input,
 * matching questions to FAQ topics, and providing fallback guidance.
 */

document.addEventListener('DOMContentLoaded', () => {
  const chatbox = document.getElementById('chatbox');
  const userInput = document.getElementById('userInput');
  const sendBtn = document.getElementById('sendBtn');
  const quickButtons = document.getElementById('quick-buttons');

  // Helper to escape HTML characters to prevent injection
  function escapeHtml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function addUserMessage(message) {
    chatbox.innerHTML += `<p class="user-message"><strong>You:</strong> ${escapeHtml(message)}</p>`;
    chatbox.scrollTop = chatbox.scrollHeight;
  }

  function addBotMessage(message) {
    chatbox.innerHTML += `<p class="bot-message"><strong>Bot:</strong> ${message}</p>`;
    chatbox.scrollTop = chatbox.scrollHeight;
  }

  function getReply(message) {
    const lower = message.toLowerCase();
    // Direct match against topic keys
    if (faqData[lower]) {
      return faqData[lower];
    }
    // Partial keyword match using first part of each topic name
    for (const topic of Object.keys(faqData)) {
      const keyword = topic.split('-')[0];
      if (lower.includes(keyword)) {
        return faqData[topic];
      }
    }
    // Fallback response if nothing matched
    return (
      "I'm sorry, I do not have an answer for that question. " +
      "Please contact the International Programs and Services Office (IPSO) for personalised assistance, " +
      "or try asking about arrival, visa/residency, housing, registration, insurance, student ID, email access, emergencies or IPSO contact details."
    );
  }

  function handleQuestion(query) {
    const reply = getReply(query);
    addBotMessage(reply);
  }

  function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;
    addUserMessage(message);
    handleQuestion(message);
    userInput.value = '';
  }

  // Send button handler
  sendBtn.addEventListener('click', sendMessage);
  // Enter key handler
  userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  });
  // Quick buttons handler
  quickButtons.addEventListener('click', (e) => {
    const topic = e.target.getAttribute('data-topic');
    if (topic) {
      addUserMessage(topic.replace(/-/g, ' '));
      handleQuestion(topic);
    }
  });
});
