document.addEventListener("DOMContentLoaded", () => {

  const wordInput = document.getElementById("word-input");
  const speakWordBtn = document.getElementById("speak-word");
  const getDefinitionBtn = document.getElementById("get-definition");
  const definitionBox = document.getElementById("definition-box");
  const speakDefinitionBtn = document.getElementById("speak-definition");

  let currentDefinition = ""; // store latest definition for speech
  let voices = [];

  // ----------------------------
  // Preload voices to avoid double speech
  // ----------------------------
  function loadVoices() {
    voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
      window.speechSynthesis.addEventListener("voiceschanged", () => {
        voices = window.speechSynthesis.getVoices();
      });
    }
  }

  loadVoices();

  // ----------------------------
  // Generic speech function
  // ----------------------------
  function speak(text) {
    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.voice = voices.find(v => v.lang === "en-US") || null;

    // Cancel any ongoing speech to prevent double-speak
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  // ----------------------------
  // Speak the typed word
  // ----------------------------
  speakWordBtn.addEventListener("click", () => {
    const word = wordInput.value.trim();
    if (!word) return;
    speak(word);
  });

  // ----------------------------
  // Fetch definition from dictionaryapi.dev
  // ----------------------------
  async function fetchDefinition(word) {
    const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (Array.isArray(data) && data[0].meanings) {
        const meaning = data[0].meanings[0];
        const definition = meaning.definitions[0].definition;
        return definition;
      }

      return "No definition found.";
    } catch (err) {
      console.error(err);
      return "Error fetching definition.";
    }
  }

  // ----------------------------
  // Get and display definition
  // ----------------------------
  getDefinitionBtn.addEventListener("click", async () => {
    const word = wordInput.value.trim();
    if (!word) return;

    definitionBox.textContent = "Loading definition...";
    currentDefinition = await fetchDefinition(word);
    definitionBox.textContent = currentDefinition;
  });

  // ----------------------------
  // Speak the current definition
  // ----------------------------
  speakDefinitionBtn.addEventListener("click", () => {
    if (!currentDefinition) return;
    speak(currentDefinition);
  });

});