const sourceText = document.getElementById('sourceText');
const translatedText = document.getElementById('translatedText');
const sourceLang = document.getElementById('sourceLang');
const targetLang = document.getElementById('targetLang');
const translateBtn = document.getElementById('translateBtn');
const translateAllBtn = document.getElementById('translateAllBtn');
const swapBtn = document.getElementById('swapBtn');
const copyBtn = document.getElementById('copyBtn');
const speakBtn = document.getElementById('speakBtn');
const allTranslationsList = document.getElementById('allTranslationsList');

const API_URL = 'https://api.mymemory.translated.net/get';
const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ru', name: 'Russian' }
];

function populateLanguages() {
  const optionsHtml = LANGUAGES.map((lang) => `<option value="${lang.code}">${lang.name}</option>`).join('');
  sourceLang.innerHTML = optionsHtml;
  targetLang.innerHTML = optionsHtml;
  sourceLang.value = 'en';
  targetLang.value = 'es';
}

async function translateTextTo(targetCode, text = sourceText.value.trim()) {
  if (!text) {
    translatedText.value = 'Please enter some text to translate.';
    return '';
  }

  try {
    const response = await fetch(`${API_URL}?q=${encodeURIComponent(text)}&langpair=${sourceLang.value}|${targetCode}`);
    if (!response.ok) {
      throw new Error('Translation request failed');
    }

    const data = await response.json();
    return data.responseData?.translatedText || 'No translation returned.';
  } catch (error) {
    console.error(error);
    return 'Translation failed. Please check your network connection and try again.';
  }
}

async function translateText() {
  const text = sourceText.value.trim();
  if (!text) {
    translatedText.value = 'Please enter some text to translate.';
    return;
  }

  translateBtn.disabled = true;
  translateBtn.textContent = 'Translating...';
  translatedText.value = 'Translating...';

  try {
    const translated = await translateTextTo(targetLang.value, text);
    translatedText.value = translated;
  } finally {
    translateBtn.disabled = false;
    translateBtn.textContent = 'Translate';
  }
}

function renderAllTranslations(results) {
  if (!results.length) {
    allTranslationsList.innerHTML = '<div class="translation-item">No translations yet.</div>';
    return;
  }

  allTranslationsList.innerHTML = results
    .map((item) => `<div class="translation-item"><strong>${item.name}</strong><div>${item.text}</div></div>`)
    .join('');
}

async function translateToAllLanguages() {
  const text = sourceText.value.trim();
  if (!text) {
    renderAllTranslations([]);
    allTranslationsList.innerHTML = '<div class="translation-item">Please enter some text to translate.</div>';
    return;
  }

  translateAllBtn.disabled = true;
  translateAllBtn.textContent = 'Translating...';
  allTranslationsList.innerHTML = '<div class="translation-item">Translating to all languages...</div>';

  const sourceCode = sourceLang.value;
  const targets = LANGUAGES.filter((lang) => lang.code !== sourceCode);

  const results = await Promise.all(
    targets.map(async (lang) => {
      const translated = await translateTextTo(lang.code, text);
      return { name: lang.name, text: translated };
    })
  );

  renderAllTranslations(results);
  translateAllBtn.disabled = false;
  translateAllBtn.textContent = 'Translate All';
}

function swapLanguages() {
  const currentSource = sourceLang.value;
  const currentTarget = targetLang.value;
  sourceLang.value = currentTarget;
  targetLang.value = currentSource;
}

function copyTranslation() {
  if (!translatedText.value) return;
  navigator.clipboard.writeText(translatedText.value);
  copyBtn.textContent = 'Copied';
  setTimeout(() => {
    copyBtn.textContent = 'Copy';
  }, 1200);
}

let speechVoices = [];

function loadSpeechVoices() {
  if (!window.speechSynthesis) return;
  const updateVoices = () => {
    speechVoices = window.speechSynthesis.getVoices();
  };

  updateVoices();
  window.speechSynthesis.addEventListener('voiceschanged', updateVoices);
}

function getVoiceForLanguage(langCode) {
  if (!speechVoices.length) return null;
  const normalizedCode = langCode.toLowerCase();
  return (
    speechVoices.find((voice) => voice.lang.toLowerCase().startsWith(normalizedCode)) ||
    speechVoices.find((voice) => voice.lang.toLowerCase().includes(normalizedCode)) ||
    speechVoices[0]
  );
}

function speakTranslation() {
  if (!translatedText.value || !window.speechSynthesis) return;

  const utterance = new SpeechSynthesisUtterance(translatedText.value);
  const langCode = targetLang.value || 'en';
  const voice = getVoiceForLanguage(langCode);

  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  } else {
    utterance.lang = 'en-US';
  }

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

if (window.speechSynthesis) {
  loadSpeechVoices();
}

translateBtn.addEventListener('click', translateText);
translateAllBtn.addEventListener('click', translateToAllLanguages);
swapBtn.addEventListener('click', swapLanguages);
copyBtn.addEventListener('click', copyTranslation);
speakBtn.addEventListener('click', speakTranslation);
sourceText.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault();
    translateText();
  }
});

populateLanguages();
