let lastRange = null;
let aktif = false;

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
    body.dyslexia-active a,
    body.dyslexia-active div {
      font-family: Arial, Verdana, sans-serif !important;
      font-size: 20px !important;
      line-height: 1.8 !important;
      letter-spacing: 0.5px !important;
      background-color: #fdf6e3 !important;
    }
  `;

  document.head.appendChild(style);
}

function applyMode() {
  document.body.classList.add("dyslexia-active");
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

document.addEventListener("selectionchange", () => {
  const selection = window.getSelection();

  if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
    lastRange = selection.getRangeAt(0).cloneRange();
  }
});

function fixParents(element) {
  let parent = element.parentElement;
  let count = 0;

  while (parent && parent !== document.body && count < 8) {
    parent.style.whiteSpace = "normal";
    parent.style.overflow = "visible";
    parent.style.textOverflow = "unset";
    parent.style.height = "auto";
    parent.style.maxHeight = "none";
    parent.style.wordBreak = "break-word";
    parent.style.overflowWrap = "break-word";

    parent = parent.parentElement;
    count++;
  }
}

function replaceSelectedText(simplifiedText) {
  if (!lastRange) {
    alert("Metin seçimi bulunamadı. Lütfen metni tekrar seç.");
    return;
  }

  const span = document.createElement("span");

  span.style.backgroundColor = "#fdf6e3";
  span.style.fontSize = "20px";
  span.style.lineHeight = "1.8";
  span.style.letterSpacing = "0.5px";
  span.style.padding = "2px 4px";
  span.style.borderRadius = "4px";
  span.style.whiteSpace = "normal";
  span.style.wordBreak = "break-word";
  span.style.overflowWrap = "break-word";
  span.style.display = "inline";

  span.textContent = simplifiedText;

  lastRange.deleteContents();
  lastRange.insertNode(span);

  fixParents(span);

  const selection = window.getSelection();
  selection.removeAllRanges();

  lastRange = null;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "ping") {
    sendResponse({ ok: true });
    return true;
  }

  if (request.action === "toggleFullPageStyle") {
    aktif = !aktif;

    if (aktif) {
      applyMode();
    } else {
      removeMode();
    }

    sendResponse({
      ok: true,
      active: aktif
    });

    return true;
  }

  if (request.action === "replaceSelectedText") {
    replaceSelectedText(request.simplifiedText);
    sendResponse({ ok: true });
    return true;
  }

  if (request.action === "showError") {
    alert(request.message);
    sendResponse({ ok: true });
    return true;
  }
});