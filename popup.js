const apiKeyInput = document.getElementById("apiKey");
const saveKeyButton = document.getElementById("saveKey");
const togglePageButton = document.getElementById("togglePage");
const durum = document.getElementById("durum");

// SAYFA AÇILINCA API KEY YÜKLE
async function loadKey() {
  const data = await chrome.storage.sync.get(["geminiApiKey"]);

  if (data.geminiApiKey) {
    apiKeyInput.value = data.geminiApiKey;
    durum.textContent = "API anahtarı yüklendi";
  } else {
    durum.textContent = "API anahtarı yok";
  }
}

// API KEY KAYDET
saveKeyButton.addEventListener("click", async () => {
  const key = apiKeyInput.value.trim();

  if (!key) {
    durum.textContent = "Geçerli bir API key gir";
    return;
  }

  await chrome.storage.sync.set({ geminiApiKey: key });

  durum.textContent = "Kaydedildi";
});

// TOGGLE (TÜM SAYFA DISLEKSI MODU)
togglePageButton.addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "toggleFullPageStyle" }, (response) => {

    if (chrome.runtime.lastError) {
      durum.textContent = "Hata: " + chrome.runtime.lastError.message;
      return;
    }

    if (response?.error) {
      durum.textContent = response.error;
      return;
    }

    durum.textContent = "Disleksi modu değiştirildi";
  });
});

// BAŞLANGIÇ
loadKey();