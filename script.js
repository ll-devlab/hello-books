document.addEventListener("DOMContentLoaded", () => {

  // ----------------------------
  // DOM elements
  // ----------------------------
  const toggleButton = document.getElementById("instructions-toggle");
  const instructionsContainer = document.getElementById("instructions-container");
  const recordingButton = document.getElementById("recording-button");
  const displayedWord = document.getElementById("displayed-word");
  const playButton = document.getElementById("play-pronunciation");
  const hearOnlineButton = document.getElementById("hear-online");
  const wordDefinition = document.getElementById("word-definition");
  const wordInput = document.getElementById("word-input");
  const submitButton = document.getElementById("submit-word");

  // ----------------------------
  // Instructions toggle
  // ----------------------------
  toggleButton.addEventListener("click", () => {
    instructionsContainer.classList.toggle("open");
    const expanded = instructionsContainer.classList.contains("open");
    toggleButton.setAttribute("aria-expanded", expanded);
    toggleButton.textContent = expanded ? "Quick Guide ▲" : "Quick Guide ▼";
  });

  // ----------------------------
  // Letter mapping for voice spelling
  // ----------------------------
  const letterMap = {
    "a": "A", "ay": "A",
    "b": "B", "bee": "B",
    "c": "C", "see": "C", "sea": "C",
    "d": "D", "dee": "D",
    "e": "E",
    "f": "F", "eff": "F",
    "g": "G", "gee": "G",
    "h": "H", "aitch": "H",
    "i": "I",
    "j": "J", "jay": "J",
    "k": "K", "kay": "K",
    "l": "L", "ell": "L",
    "m": "M", "em": "M",
    "n": "N", "en": "N",
    "o": "O",
    "p": "P", "pee": "P",
    "q": "Q",
    "r": "R", "are": "R",
    "s": "S", "ess": "S",
    "t": "T", "tee": "T",
    "u": "U", "you": "U",
    "v": "V",
    "w": "W", "double you": "W",
    "x": "X",
    "y": "Y", "why": "Y",
    "z": "Z", "zee": "Z", "zed": "Z"
  };

  // ----------------------------
  // Speech Recognition setup
  // ----------------------------
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();

  recognition.lang = "en-US";
  recognition.continuous = true;
  recognition.interimResults = true;

  let isRecording = false;
  let lastTranscript = "";

  // ----------------------------
  // Start/Stop recording on button click
  // ----------------------------
  recordingButton.addEventListener("click", () => {
    if (!isRecording) {
      isRecording = true;
      recordingButton.classList.add("recording");
      try {
        recognition.start();
        console.log("Recording started…");
      } catch (err) {
        console.warn("Recognition start error:", err);
      }
    } else {
      isRecording = false;
      recordingButton.classList.remove("recording");
      recognition.stop();
      console.log("Recording stopped");
    }
  });

  // ----------------------------
  // Handle recognition results
  // ----------------------------
  recognition.onresult = function(event) {
    const transcript = event.results[event.results.length - 1][0].transcript
      .trim()
      .toLowerCase();

    if (transcript === lastTranscript) return;
    lastTranscript = transcript;

    const parts = transcript.split(/\s+/);
    parts.forEach(part => {
      const letter = letterMap[part];
      if (letter) {
        wordInput.value += letter;
        console.log("Detected letter:", letter, "Current word:", wordInput.value);

        // Speak each letter immediately
        const utterance = new SpeechSynthesisUtterance(letter);
        utterance.lang = "en-US";
        utterance.rate = 1;
        utterance.pitch = 1;
        window.speechSynthesis.speak(utterance);
      } else {
        console.log("Unrecognized input:", part);
      }
    });
  };

  // ----------------------------
  // Handle recognition errors
  // ----------------------------
  recognition.onerror = function(event) {
    console.error("Speech recognition error:", event.error);
    if (event.error === "not-allowed" || event.error === "service-not-allowed") {
      alert("Microphone access is blocked. Please allow it in your browser settings.");
      recordingButton.classList.remove("recording");
      isRecording = false;
    }
  };

  // ----------------------------
  // Handle recognition end
  // ----------------------------
  recognition.onend = function() {
    console.log("Recognition ended");
    if (isRecording) {
      // Restart after a short delay (needed for Safari)
      setTimeout(() => {
        try {
          recognition.start();
          console.log("Recognition restarted for continuous listening…");
        } catch (err) {
          console.warn("Recognition restart error:", err);
        }
      }, 200);
    }
  };

  // ----------------------------
  // Word input handling
  // ----------------------------
  wordInput.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      showWord(wordInput.value);
    }
  });

  submitButton.addEventListener("click", function() {
    showWord(wordInput.value);
  });

  playButton.addEventListener("click", function() {
    const word = displayedWord.textContent;
    if (word) speakWord(word);
  });

  // ----------------------------
  // Core functions
  // ----------------------------
  function showWord(word) {
    if (!word) return;

    const cleanWord = word.toLowerCase().trim();
    displayedWord.textContent = cleanWord.toUpperCase();
    wordInput.value = "";

    speakWord(cleanWord);
    fetchDefinition(cleanWord);

    const merriamUrl = `https://www.merriam-webster.com/dictionary/${encodeURIComponent(cleanWord)}`;
    hearOnlineButton.onclick = () => window.open(merriamUrl, "_blank", "noopener");
  }

  function speakWord(word) {
    if (!word) return;

    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    utterance.voice =
      voices.find(v => v.lang === "en-US" && /Samantha|Tessa|Karen/i.test(v.name)) ||
      voices.find(v => v.lang === "en-US") ||
      voices[0];

    window.speechSynthesis.speak(utterance);
  }

  function fetchDefinition(word) {
    wordDefinition.textContent = "Loading definition…";

    fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`)
      .then(response => response.json())
      .then(data => {
        if (Array.isArray(data) && data[0].meanings) {
          const meaning = data[0].meanings[0];
          const definition = meaning.definitions[0].definition;
          wordDefinition.textContent = definition;
        } else {
          wordDefinition.textContent = "No definition found.";
        }
      })
      .catch(err => {
        console.error(err);
        wordDefinition.textContent = "Error fetching definition.";
      });
  }

});