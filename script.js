document.addEventListener("DOMContentLoaded", () => {

  const wordInput = document.getElementById("word-input");
  const speakWordBtn = document.getElementById("speak-word");
  const getDefinitionBtn = document.getElementById("get-definition");
  const definitionBox = document.getElementById("definition-box");
  const speakDefinitionBtn = document.getElementById("speak-definition");
  const checkOnlineBtn = document.getElementById("check-online");

  const API_KEY = "9c542b37-09b9-4c28-a951-aed2c6650a9f";

  let currentDefinition = "";
  let audioURL = null;
  let voices = [];
  let lastSearchedWord = "";

  // ----------------------------
  // Load speech synthesis voices
  // ----------------------------

  function loadVoices() {
    voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
      window.speechSynthesis.addEventListener("voiceschanged", () => {
        voices = window.speechSynthesis.getVoices();
      }, { once: true });
    }
  }

  loadVoices();

  // ----------------------------
  // Speech function
  // ----------------------------
function speak(text) {

  if (!text) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);

  utterance.lang = "en-US";
  utterance.rate = 0.9;
  utterance.pitch = 1;

  utterance.voice = voices.find(v => v.lang === "en-US") || null;

  window.speechSynthesis.speak(utterance);

}

  // ----------------------------
  // Speak typed word
  // ----------------------------

 speakWordBtn.addEventListener("click", async () => {

  const word = wordInput.value.trim();
  if (!word) return;

  definitionBox.textContent = "Loading definition...";

  const result = await fetchDefinition(word);

  currentDefinition = result.definition;
  audioURL = result.audio;

  definitionBox.textContent = currentDefinition;

  updateCheckOnlineLink(word);

  // stop any speech already happening
  window.speechSynthesis.cancel();

  // play pronunciation
  if (audioURL) {

    const audio = new Audio(audioURL);
    audio.play();

  } else {

    speak(word);

  }

});

  // ----------------------------
  // Fetch Merriam-Webster definition
  // ----------------------------

  async function fetchDefinition(word) {

    const url = `https://www.dictionaryapi.com/api/v3/references/collegiate/json/${encodeURIComponent(word)}?key=${API_KEY}`;

    try {

      const response = await fetch(url);
      const data = await response.json();

      // If API returns suggestions instead of definitions
      if (typeof data[0] === "string") {

        const suggestion = data[0];

        return {
          definition: `Did you mean: ${suggestion}?`,
          audio: null
        };

      }

      const entry = data[0];

      if (!entry || !entry.shortdef) {

        return {
          definition: "No definition found.",
          audio: null
        };

      }

      const definition = entry.shortdef[0];

      // Extract pronunciation audio
      let audio = null;

      if (entry.hwi && entry.hwi.prs && entry.hwi.prs[0].sound) {

        const audioFile = entry.hwi.prs[0].sound.audio;

        const subdirectory =
          audioFile.startsWith("bix") ? "bix" :
          audioFile.startsWith("gg") ? "gg" :
          /^[0-9]/.test(audioFile) ? "number" :
          audioFile[0];

        audio = `https://media.merriam-webster.com/audio/prons/en/us/mp3/${subdirectory}/${audioFile}.mp3`;

      }

      return {
        definition: definition,
        audio: audio
      };

    } catch (err) {

      console.error(err);

      return {
        definition: "Error fetching definition.",
        audio: null
      };

    }

  }

  // ----------------------------
  // Get definition
  // ----------------------------

  getDefinitionBtn.addEventListener("click", async () => {

  const word = wordInput.value.trim();
  if (!word) return;

  definitionBox.textContent = "Loading definition...";

  const result = await fetchDefinition(word);

  currentDefinition = result.definition;
  audioURL = result.audio;
  lastSearchedWord = word;   // ADD THIS

  definitionBox.textContent = currentDefinition;

  updateCheckOnlineLink(word);

});

  // ----------------------------
  // Speak definition
  // ----------------------------

  speakDefinitionBtn.addEventListener("click", () => {

    if (!currentDefinition) return;

    speak(currentDefinition);

  });

  // ----------------------------
  // Merriam-Webster link
  // ----------------------------

  function updateCheckOnlineLink(word) {

    const url = `https://www.merriam-webster.com/dictionary/${encodeURIComponent(word)}`;

    checkOnlineBtn.onclick = () => window.open(url, "_blank", "noopener");

  }

});