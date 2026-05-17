if (!document.getElementById("dyslexic-fonts")) {

  const link1 = document.createElement("link");
  link1.id = "dyslexic-fonts";
  link1.href =
    "https://cdn.jsdelivr.net/gh/antijingoist/open-dyslexic/web/OpenDyslexic-Regular.css";
  link1.rel = "stylesheet";

  const link2 = document.createElement("link");
  link2.href =
    "https://fonts.googleapis.com/css2?family=Lexend&display=swap";
  link2.rel = "stylesheet";

  document.head.appendChild(link1);
  document.head.appendChild(link2);
}


// ================= VARIABLES =================

let aktif = false;

let currentFont =
  "'OpenDyslexic', Arial";

let currentSize = 20;

let lastRange = null;


// ================= STYLE =================

if (!document.getElementById("dyslexia-style")) {

  const style = document.createElement("style");

  style.id = "dyslexia-style";

  style.innerHTML = `

    body.dyslexia-active {
      background-color: #fdf6e3 !important;
    }

    body.dyslexia-active p,
    body.dyslexia-active li,
    body.dyslexia-active h1,
    body.dyslexia-active h2,
    body.dyslexia-active h3,
    body.dyslexia-active h4,
    body.dyslexia-active h5,
    body.dyslexia-active h6,
    body.dyslexia-active span,
    body.dyslexia-active a {

      font-family:
        var(
          --d-font,
          'OpenDyslexicRegular',
          Arial
        ) !important;

      font-size:
        var(--d-size) !important;

      line-height: 1.8 !important;

      letter-spacing: 0.5px !important;
    }

    .dyslexia-replaced-text {

      background-color:
        #fdf6e3 !important;

      font-family:
        var(
          --d-font,
          'OpenDyslexic',
          Arial
        ) !important;

      font-size:
        var(--d-size, 22px)
        !important;

      line-height: 2 !important;

      letter-spacing: 1px !important;

      padding: 2px 4px !important;

      border-radius: 4px !important;

      white-space: pre-wrap !important;
    }

  `;

  document.head.appendChild(style);
}


// ================= STORAGE =================

chrome.storage.sync.get(
  ["fontFamily", "fontSize", "isDyslexiaActive"],

  (res) => {

    if (res.fontFamily) {

      currentFont =
        res.fontFamily;

    }

    if (res.fontSize) {

      currentSize =
        parseInt(res.fontSize);

    }

    if (res.isDyslexiaActive) {
      aktif = true;
      applyMode();
    }

  }
);


// ================= MODE =================

function applyMode() {

  document.body.classList.add(
    "dyslexia-active"
  );

  document.body.style.setProperty(
    "--d-font",
    currentFont
  );

  document.body.style.setProperty(
    "--d-size",
    currentSize + "px"
  );
}

function removeMode() {

  document.body.classList.remove(
    "dyslexia-active"
  );

  document.querySelectorAll(".dyslexia-replaced-text").forEach(el => {
    const originalHtml = el.dataset.originalHtml;
    if (originalHtml) {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = originalHtml;
      const parent = el.parentNode;
      if (parent) {
        while (tempDiv.firstChild) {
          parent.insertBefore(tempDiv.firstChild, el);
        }
      }
    }
    el.remove();
  });

  // Legacy fallback cleanup
  document.querySelectorAll(".dyslexia-original-text").forEach(el => {
    const parent = el.parentNode;
    if (parent) {
      while (el.firstChild) {
        parent.insertBefore(el.firstChild, el);
      }
      parent.removeChild(el);
    }
  });

}


// ================= SELECTION =================

function saveSelection() {

  const selection =
    window.getSelection();

  if (
    !selection ||
    selection.rangeCount === 0 ||
    selection.isCollapsed
  ) {
    return;
  }

  lastRange =
    selection
      .getRangeAt(0)
      .cloneRange();
}

document.addEventListener(
  "mouseup",
  saveSelection
);

document.addEventListener(
  "keyup",
  saveSelection
);

document.addEventListener(
  "selectionchange",
  saveSelection
);


// ================= REPLACE =================

function replaceSelectedText(simplifiedText) {
  if (!lastRange) {
    alert("Metin seçimi bulunamadı. Lütfen metni tekrar seç.");
    return;
  }

  try {
    const span = document.createElement("span");
    span.className = "dyslexia-replaced-text";
    span.style.setProperty("--d-font", currentFont);
    span.style.setProperty("--d-size", currentSize + "px");

    span.style.fontFamily = currentFont;
    span.style.fontSize = currentSize + "px";
    span.style.lineHeight = "2";
    span.style.letterSpacing = "1px";
    span.style.backgroundColor = "#fdf6e3";
    span.textContent = simplifiedText;

    // Safe HTML backup of original selection
    const container = document.createElement("div");
    container.appendChild(lastRange.cloneContents());
    const originalHtml = container.innerHTML;
    span.dataset.originalHtml = originalHtml;

    // Safe deletion and insertion
    lastRange.deleteContents();
    lastRange.insertNode(span);

  } catch (error) {
    console.error("Metin değiştirme hatası:", error);
    alert("Metin dönüştürülürken bir hata oluştu: " + error.message);
  } finally {
    const selection = window.getSelection();
    selection.removeAllRanges();
    lastRange = null;
  }
}


// ================= MESSAGE =================

chrome.runtime.onMessage.addListener(
  (req, sender, sendResponse) => {

    // PING
    if (req.action === "ping") {

      sendResponse({ ok: true });

      return true;
    }

    // TOGGLE
    if (
      req.action ===
      "toggleFullPageStyle"
    ) {

      aktif = !aktif;

      if (aktif) {
        applyMode();
      } else {
        removeMode();
      }

      chrome.storage.sync.set({ isDyslexiaActive: aktif });

      sendResponse({
        ok: true,
        active: aktif
      });

      return true;
    }

    // UPDATE STYLE
    if (
      req.action ===
      "updateStyle"
    ) {

      if (req.font) {

        currentFont =
          req.font;

      }

      if (req.size) {

        currentSize =
          parseInt(req.size);

      }

      if (aktif) {
        applyMode();
      }

      sendResponse({
        ok: true,
        active: aktif
      });

      return true;
    }

    // REPLACE
    if (
      req.action ===
      "replaceSelectedText"
    ) {

      replaceSelectedText(
        req.simplifiedText
      );

      sendResponse({
        ok: true
      });

      return true;
    }

    // ERROR
    if (
      req.action ===
      "showError"
    ) {

      alert(req.message);

      sendResponse({
        ok: true
      });

      return true;
    }

  }
);