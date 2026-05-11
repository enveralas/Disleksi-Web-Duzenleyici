if (!document.getElementById("dyslexic-fonts")) {
  const link1 = document.createElement("link");
  link1.id = "dyslexic-fonts";
  link1.href = "https://cdn.jsdelivr.net/gh/antijingoist/open-dyslexic/web/OpenDyslexic-Regular.css";
  link1.rel = "stylesheet";
  const link2 = document.createElement("link");
  link2.href = "https://fonts.googleapis.com/css2?family=Lexend&display=swap";
  link2.rel = "stylesheet";
  document.head.appendChild(link1);
  document.head.appendChild(link2);
}

let aktif = false;
let currentFont = "OpenDyslexic";
let currentSize = 20;
let lastRange = null;

if (!document.getElementById("dyslexia-style")) {
  const style = document.createElement("style");
  style.id = "dyslexia-style";
  style.innerHTML = `
    body.dyslexia-active { background-color: #fdf6e3 !important; }
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
      font-family: var(--d-font) !important;
      font-size: var(--d-size) !important;
      line-height: 1.8 !important;
      letter-spacing: 0.5px !important;
    }
    .dyslexia-replaced-text {
      background-color: #fdf6e3 !important;
      font-family: var(--d-font, OpenDyslexic) !important;
      font-size: var(--d-size, 22px) !important;
      line-height: 2 !important;
      letter-spacing: 1px !important;
      padding: 2px 4px !important;
      border-radius: 4px !important;
    }
  `;
  document.head.appendChild(style);
}

chrome.storage.sync.get(["fontFamily", "fontSize"], (res) => {
  if (res.fontFamily) currentFont = res.fontFamily;
  if (res.fontSize) currentSize = parseInt(res.fontSize);
});

function applyMode() {
  document.body.classList.add("dyslexia-active");
  document.body.style.setProperty("--d-font", currentFont);
  document.body.style.setProperty("--d-size", currentSize + "px");
}

function removeMode() {
  document.body.classList.remove("dyslexia-active");
}

function saveSelection() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;
  lastRange = selection.getRangeAt(0).cloneRange();
}
document.addEventListener("mouseup", saveSelection);
document.addEventListener("keyup", saveSelection);
document.addEventListener("selectionchange", saveSelection);

function replaceSelectedText(simplifiedText) {
  if (!lastRange) {
    alert("Metin seçimi bulunamadı. Lütfen metni tekrar seç.");
    return;
  }
  const span = document.createElement("span");
  span.className = "dyslexia-replaced-text";
  span.style.setProperty("--d-font", currentFont);
  span.style.setProperty("--d-size", currentSize + "px");
  span.textContent = simplifiedText;
  lastRange.deleteContents();
  lastRange.insertNode(span);
  const selection = window.getSelection();
  selection.removeAllRanges();
  lastRange = null;
}

chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  if (req.action === "ping") {
    sendResponse({ ok: true });
    return true;
  }
  if (req.action === "toggleFullPageStyle") {
    aktif = !aktif;
    if (aktif) applyMode();
    else removeMode();
    sendResponse({ ok: true, active: aktif });
    return true;
  }
  if (req.action === "updateStyle") {
    if (req.font) currentFont = req.font;
    if (req.size) currentSize = parseInt(req.size);
    chrome.storage.sync.set({ fontFamily: currentFont, fontSize: currentSize });
    applyMode();
    aktif = true;
    sendResponse({ ok: true, active: true });
    return true;
  }
  if (req.action === "replaceSelectedText") {
    replaceSelectedText(req.simplifiedText);
    sendResponse({ ok: true });
    return true;
  }
  if (req.action === "showError") {
    alert(req.message);
    sendResponse({ ok: true });
    return true;
  }
});
