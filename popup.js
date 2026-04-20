const apiKeyInput = document.getElementById("apiKey");
const saveKeyButton = document.getElementById("saveKey");
const togglePageButton = document.getElementById("togglePage");
const fontSizeSlider = document.getElementById("fontSize");
const fontSizeText = document.getElementById("fontSizeText");
const fontSelect = document.getElementById("fontSelect");
const durum = document.getElementById("durum");


// LOAD
async function loadSettings() {
  const { geminiApiKey, fontSize, fontFamily } =
    await chrome.storage.sync.get(["geminiApiKey", "fontSize", "fontFamily"]);

  if (geminiApiKey) apiKeyInput.value = geminiApiKey;

  if (fontSize) {
    fontSizeSlider.value = fontSize;
    fontSizeText.textContent = "Boyut: " + fontSize;
  }

  if (fontFamily) {
    fontSelect.value = fontFamily;
  }
}

loadSettings();


// API KEY
saveKeyButton.addEventListener("click", async () => {
  const key = apiKeyInput.value.trim();
  if (!key) {
    durum.textContent = "Geçerli API key gir.";
    return;
  }

  await chrome.storage.sync.set({ geminiApiKey: key });
  durum.textContent = "Kaydedildi.";
});


// SLIDER (ANLIK)
fontSizeSlider.addEventListener("input", async () => {

  const size = parseInt(fontSizeSlider.value);
  const font = fontSelect.value;

  fontSizeText.textContent = "Boyut: " + size;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (size, font) => {
      document.body.classList.add("dyslexia-active");
      document.body.style.setProperty("--d-font", font);
      document.body.style.setProperty("--d-size", size + "px");
    },
    args: [size, font]
  });
});


// FONT CHANGE (ANLIK)
fontSelect.addEventListener("change", async () => {

  const font = fontSelect.value;
  const size = parseInt(fontSizeSlider.value);

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (font, size) => {
      document.body.classList.add("dyslexia-active");
      document.body.style.setProperty("--d-font", font);
      document.body.style.setProperty("--d-size", size + "px");
    },
    args: [font, size]
  });
});


// TOGGLE
togglePageButton.addEventListener("click", async () => {

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab?.id) {
    durum.textContent = "Sekme yok.";
    return;
  }

  chrome.tabs.sendMessage(tab.id, {
    action: "toggleFullPageStyle"
  });

  durum.textContent = "Disleksi modu aç/kapatıldı";
});