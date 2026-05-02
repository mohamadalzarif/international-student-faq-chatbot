# International Student FAQ Chatbot

This repository contains a simple static chatbot designed to help international students find answers to common questions about arrival, visas, housing, registration, insurance, student IDs, email access and more. It uses only HTML, CSS and JavaScript so there is no backend server and no API costs.

## Contents

| File        | Purpose                                                                   |
|------------|---------------------------------------------------------------------------|
| `index.html` | The main webpage that renders the chat interface.                         |
| `styles.css` | Styles for the layout and appearance of the chatbot.                      |
| `content.js` | Contains the FAQ answers. Edit this file to update or add new answers.   |
| `script.js`  | Chatbot logic: handles user input, matches queries to answers and prints replies. |
| `.nojekyll` | Empty file used to disable Jekyll processing on GitHub Pages.             |

## How to host on GitHub Pages

1. Create a new GitHub repository and upload **all** of the files in this folder to the root of that repository.
2. Visit the **Settings** tab of the repository, scroll to **Pages**, and select the branch (usually `main` or `master`) and `/` (root) folder for deployment.
3. Save your settings. After a few moments, GitHub Pages will publish your site at a URL similar to `https://<username>.github.io/<repository-name>`.

## Customizing

The answers and topics are defined in `content.js` in the `faqData` object. Each key represents a topic and the value is the answer shown to the user. To add or edit topics:

```
const faqData = {
  "arrival": "...your answer...",
  "visa": "...your answer...",
  // add more topics here
};
```

Avoid adding personal or sensitive information to this file since it will be visible to anyone who loads the page.

## Usage

Open `index.html` in a web browser or access your GitHub Pages deployment. Users can either click one of the quick topic buttons (Arrival, Visa / Residency, etc.) or type a question into the input field. The chatbot will respond with a matching answer if it finds one, or advise the user to contact the appropriate office if the question cannot be answered.

## License

This project is provided as-is without warranty. You are free to modify and reuse it for educational or non-commercial purposes.