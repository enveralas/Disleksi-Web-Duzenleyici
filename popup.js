const togglePageButton =
  document.getElementById("togglePage");

const fontSizeSlider =
  document.getElementById("fontSize");

const fontSizeText =
  document.getElementById("fontSizeText");

const fontSelect =
  document.getElementById("fontSelect");

const durum =
  document.getElementById("durum");


// ================= ACTIVE TAB =================

async function getActiveTab() {

  const [tab] =
    await chrome.tabs.query({
      active: true,
      currentWindow: true
    });

  return tab;

}


// ================= STYLE =================

async function sendStyleToActiveTab(shouldSave = true) {

  const font =
    fontSelect.value;

  const size =
    parseInt(
      fontSizeSlider.value
    );

  if (shouldSave) {
    await chrome.storage.sync.set({
      fontFamily: font,
      fontSize: size
    });
  }

  const tab =
    await getActiveTab();

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

        durum.textContent =
          "Sayfayı yenileyip tekrar dene.";

        return;

      }

      durum.textContent =
        "Stil güncellendi.";

    }
  );

}


// ================= LOAD =================

async function loadSettings() {

  const {
    fontSize,
    fontFamily,
    isDyslexiaActive
  } =
    await chrome.storage.sync.get([
      "fontSize",
      "fontFamily",
      "isDyslexiaActive"
    ]);

  if (fontSize) {

    fontSizeSlider.value =
      fontSize;

    fontSizeText.textContent =
      "Boyut: " + fontSize;

  }

  if (fontFamily) {

    fontSelect.value =
      fontFamily;

  }

  if (isDyslexiaActive !== undefined) {
    durum.textContent = isDyslexiaActive ? "Şu an: Açık" : "Şu an: Kapalı";
  }

}


let updateTimeout = null;

fontSizeSlider.addEventListener(
  "input",

  () => {

    const size =
      parseInt(
        fontSizeSlider.value
      );

    fontSizeText.textContent =
      "Boyut: " + size;

    if (updateTimeout) {
      clearTimeout(updateTimeout);
    }

    updateTimeout = setTimeout(async () => {
      await sendStyleToActiveTab(false);
    }, 50);

  }
);

fontSizeSlider.addEventListener(
  "change",

  async () => {
    const font = fontSelect.value;
    const size = parseInt(fontSizeSlider.value);
    await chrome.storage.sync.set({
      fontFamily: font,
      fontSize: size
    });
  }
);


// ================= FONT =================

fontSelect.addEventListener(
  "change",
  sendStyleToActiveTab
);


// ================= TOGGLE =================

togglePageButton.addEventListener(
  "click",

  async () => {

    const tab =
      await getActiveTab();

    if (!tab?.id) {

      durum.textContent =
        "Aktif sekme bulunamadı.";

      return;

    }

    chrome.tabs.sendMessage(
      tab.id,
      {
        action:
          "toggleFullPageStyle"
      },

      (result) => {

        if (chrome.runtime.lastError) {

          durum.textContent =
            "Sayfayı yenileyip tekrar dene.";

          return;

        }

        durum.textContent =
          result?.active
            ? "Şu an: Açık"
            : "Şu an: Kapalı";

      }
    );

  }
);


// ================= INIT =================

loadSettings();