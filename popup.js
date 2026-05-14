const togglePageButton = document.getElementById("togglePage");
const fontSizeSlider = document.getElementById("fontSize");
const fontSizeText = document.getElementById("fontSizeText");
const fontSelect = document.getElementById("fontSelect");
const durum = document.getElementById("durum");

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  return tab;
}

async function sendStyleToActiveTab() {
  const font = fontSelect.value;
  const size = parseInt(fontSizeSlider.value);

  await chrome.storage.sync.set({
    fontFamily: font,
    fontSize: size
  });

  const tab = await getActiveTab();

  if (!tab?.id) return;

  chrome.tabs.sendMessage(
    tab.id,
    {
      action: "updateStyle",
      font,
      size
    },
    () => {
      if (chrome.runtime.lastError) {
        durum.textContent = "Sayfayı yenileyip tekrar dene.";
        return;
      }

      durum.textContent = "Stil güncellendi.";
    }
  );
}

async function loadSettings() {
  const { fontSize, fontFamily } =
    await chrome.storage.sync.get([
      "fontSize",
      "fontFamily"
    ]);

  if (fontSize) {
    fontSizeSlider.value = fontSize;
    fontSizeText.textContent = "Boyut: " + fontSize;
  }

  if (fontFamily) {
    fontSelect.value = fontFamily;
  }
}

fontSizeSlider.addEventListener("input", async () => {
  const size = parseInt(fontSizeSlider.value);
  fontSizeText.textContent = "Boyut: " + size;

  await sendStyleToActiveTab();
});

fontSelect.addEventListener("change", sendStyleToActiveTab);

togglePageButton.addEventListener("click", async () => {
  const tab = await getActiveTab();

  if (!tab?.id) {
    durum.textContent = "Aktif sekme bulunamadı.";
    return;
  }

  chrome.tabs.sendMessage(
    tab.id,
    {
      action: "toggleFullPageStyle"
    },
    (result) => {
      if (chrome.runtime.lastError) {
        durum.textContent = "Sayfayı yenileyip tekrar dene.";
        return;
      }

      durum.textContent = result?.active
        ? "Disleksi modu açıldı."
        : "Disleksi modu kapatıldı.";
    }
  );
});

loadSettings();