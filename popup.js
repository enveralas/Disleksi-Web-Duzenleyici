const apiKeyInput = document.getElementById("apiKey");
const saveKeyButton = document.getElementById("saveKey");
const togglePageButton = document.getElementById("togglePage");
const durum = document.getElementById("durum");

async function loadKey() {
  const { geminiApiKey } = await chrome.storage.sync.get(["geminiApiKey"]);
  if (geminiApiKey) {
    apiKeyInput.value = geminiApiKey;
    durum.textContent = "API anahtarı yüklendi.";
  }
}

saveKeyButton.addEventListener("click", async () => {
  const key = apiKeyInput.value.trim();
  if (!key) {
    durum.textContent = "Lütfen geçerli bir API anahtarı gir.";
    return;
  }

  await chrome.storage.sync.set({ geminiApiKey: key });
  durum.textContent = "API anahtarı kaydedildi.";
});

togglePageButton.addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    durum.textContent = "Aktif sekme bulunamadı.";
    return;
  }

  const response = await chrome.tabs.sendMessage(tab.id, { action: "ping" }).catch(() => null);

  chrome.runtime.sendMessage({ action: "toggleFullPageStyle" }, (result) => {
    if (chrome.runtime.lastError) {
      durum.textContent = chrome.runtime.lastError.message;
      return;
    }

    if (result?.error) {
      durum.textContent = result.error;
      return;
    }

    durum.textContent = result?.active ? "Disleksi modu açıldı." : "Disleksi modu kapatıldı.";
  });
});

loadKey();
