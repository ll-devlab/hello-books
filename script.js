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
  let currentAudio = null;

  // Detect Safari reliably
const isSafari = /Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor);

if (isSafari) {
  console.log("Safari detected");
} else {
  console.log("Not Safari");
}

  // ----------------------------
  // Load voices
  // ----------------------------

  function loadVoices() {
    voices = speechSynthesis.getVoices();
    if (!voices.length) {
      speechSynthesis.addEventListener("voiceschanged", () => {
        voices = speechSynthesis.getVoices();
      }, { once: true });
    }
  }

  loadVoices();

  // ----------------------------
  // Stop all audio
  // ----------------------------

  function stopAllAudio() {
    // Stop speechSynthesis only if we're going to use it
    speechSynthesis.cancel();

    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio = null;
    }
  }

  // ----------------------------
  // Text-to-speech
  // ----------------------------

  function speak(text) {
    if (!text) return;

    stopAllAudio();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.voice = voices.find(v => v.lang.startsWith("en")) || voices[0];

    speechSynthesis.speak(utterance);
  }

  // ----------------------------
  // Play word (Safari-safe)
  // ----------------------------

  function playWord(word) {
    stopAllAudio();

    if (audioURL) {
      // Play dictionary pronunciation only, no speechSynthesis
      currentAudio = new Audio(audioURL);
      currentAudio.play();
    } else {
      // No audio, use speechSynthesis fallback
      speak(word);
    }
  }

  // ----------------------------
  // Fetch definition
  // ----------------------------

  async function fetchDefinition(word) {
    const url = `https://www.dictionaryapi.com/api/v3/references/collegiate/json/${encodeURIComponent(word)}?key=${API_KEY}`;
    try {
      const response = await fetch(url);
      const data = await response.json();

      if (!data.length) {
        return { definition: "No definition found.", audio: null };
      }

      // Suggestions
      if (typeof data[0] === "string") {
        const suggestions = data.slice(0, 3).join(", ");
        return { definition: `Did you mean: ${suggestions}?`, audio: null };
      }

      const entry = data[0];
      if (!entry.shortdef) {
        return { definition: "No definition found.", audio: null };
      }

      const definition = entry.shortdef[0];

      // pronunciation audio
      let audio = null;
      if (entry.hwi?.prs?.[0]?.sound?.audio) {
        const audioFile = entry.hwi.prs[0].sound.audio;
        const subdirectory =
          audioFile.startsWith("bix") ? "bix" :
          audioFile.startsWith("gg") ? "gg" :
          /^[0-9]/.test(audioFile) ? "number" :
          audioFile[0];
        audio = `https://media.merriam-webster.com/audio/prons/en/us/mp3/${subdirectory}/${audioFile}.mp3`;
      }

      return { definition, audio };

    } catch (err) {
      console.error(err);
      return { definition: "Could not connect to dictionary service.", audio: null };
    }
  }

  // ----------------------------
  // Speak word button
  // ----------------------------

  speakWordBtn.addEventListener("click", async () => {
    const word = wordInput.value.trim();
    if (!word) return;

    definitionBox.textContent = "Loading definition...";

    const result = await fetchDefinition(word);

    currentDefinition = result.definition;
    audioURL = result.audio;
    lastSearchedWord = word;

    definitionBox.textContent = currentDefinition;

    updateCheckOnlineLink(word);

    // Safari-safe play
    playWord(word);
  });

  // ----------------------------
  // Get definition button
  // ----------------------------

  getDefinitionBtn.addEventListener("click", async () => {
    const word = wordInput.value.trim();
    if (!word) return;

    // prevent repeat calls
    if (word === lastSearchedWord && currentDefinition) return;

    definitionBox.textContent = "Loading definition...";

    const result = await fetchDefinition(word);

    currentDefinition = result.definition;
    audioURL = result.audio;
    lastSearchedWord = word;

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
  // Enter key support
  // ----------------------------

  wordInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      getDefinitionBtn.click();
    }
  });

  // ----------------------------
  // Merriam-Webster link
  // ----------------------------

  function updateCheckOnlineLink(word) {
    const url = `https://www.merriam-webster.com/dictionary/${encodeURIComponent(word)}`;
    checkOnlineBtn.onclick = () => window.open(url, "_blank", "noopener");
  }

});