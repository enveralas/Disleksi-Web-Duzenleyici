function createMenus() {

  chrome.contextMenus.removeAll(() => {

    chrome.contextMenus.create({
      id: "root",
      title: "Disleksi Modu",
      contexts: ["all"]
    });

    chrome.contextMenus.create({
      id: "selected",
      parentId: "root",
      title: "Seçili Metni Dönüştür",
      contexts: ["selection"]
    });

    chrome.contextMenus.create({
      id: "read",
      parentId: "root",
      title: "Sesli Oku",
      contexts: ["selection"]
    });

    chrome.contextMenus.create({
      id: "ai",
      parentId: "root",
      title: "AI ile Sadeleştir",
      contexts: ["selection"]
    });

    chrome.contextMenus.create({
      id: "fullPage",
      parentId: "root",
      title: "Tüm Sayfayı Disleksi Moduna Çevir",
      contexts: ["all"]
    });

  });

}

chrome.runtime.onInstalled.addListener(createMenus);
chrome.runtime.onStartup.addListener(createMenus);

createMenus();


// ================= AI =================

async function simplifyTextWithOpenAI(text) {

  const selectedText = (text || "").trim();

  if (!selectedText) {
    throw new Error("Seçili metin bulunamadı.");
  }

  const prompt = `
Aşağıdaki Türkçe metni disleksi bireyler için daha kolay anlaşılır hale getir.

Kurallar:
- Metni kısalt ve özetle.
- Uzun cümleleri kısa cümlelere böl.
- Zor kelimeleri daha basit kelimelerle değiştir.
- Anlamı bozma.
- Gereksiz detayları çıkar.
- Açık, sade ve akıcı Türkçe kullan.
- Sadece düzenlenmiş metni ver, açıklama yazma.

Metin:
${selectedText}
`;

  try {

    const response = await fetch(
      "http://localhost:3000/api/simplify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text: prompt
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Backend hatası"
      );
    }

    return data.result || "Sonuç alınamadı";

  } catch (err) {

    throw new Error(
      err.message || "Bağlantı hatası"
    );

  }

}


// ================= MENU CLICK =================

chrome.contextMenus.onClicked.addListener(
  async (info, tab) => {

    if (!tab?.id) return;

    // SEÇİLİ METİN
    if (info.menuItemId === "selected") {

      chrome.tabs.sendMessage(
        tab.id,
        {
          action: "replaceSelectedText",
          simplifiedText:
            info.selectionText
        },
        () => chrome.runtime.lastError
      );

    }

    // SESLİ OKU
    if (info.menuItemId === "read") {

      chrome.scripting.executeScript({
        target: {
          tabId: tab.id
        },

        func: (text) => {

          const speech =
            new SpeechSynthesisUtterance(
              text
            );

          const pageLang = document.documentElement.lang || "tr-TR";
          speech.lang = pageLang;
          speech.rate = 0.9;

          speechSynthesis.cancel();
          speechSynthesis.speak(speech);

        },

        args: [
          info.selectionText || ""
        ]

      });

    }

    // AI
    if (info.menuItemId === "ai") {

      try {

        const result =
          await simplifyTextWithOpenAI(
            info.selectionText
          );

        await chrome.tabs.sendMessage(
          tab.id,
          {
            action:
              "replaceSelectedText",

            simplifiedText: result
          }
        );

      } catch (err) {

        chrome.tabs.sendMessage(
          tab.id,
          {
            action: "showError",
            message: err.message
          }
        );

      }

    }

    // FULL PAGE
    if (info.menuItemId === "fullPage") {

      chrome.tabs.sendMessage(
        tab.id,
        {
          action:
            "toggleFullPageStyle"
        },
        () => chrome.runtime.lastError
      );

    }

  }
);