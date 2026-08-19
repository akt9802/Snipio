"use strict";
(() => {
  // extension/content.ts
  var MIN_CSS_PX = 8;
  var TOAST_MS = 2200;
  var HOST_ATTR = "data-snipio";
  var snipHost = null;
  var toastTimer = 0;
  if (!window.__snipioLoaded) {
    window.__snipioLoaded = true;
    chrome.runtime.onMessage.addListener(
      (message, _sender, sendResponse) => {
        if (message.type === "SNIP_PING") {
          sendResponse({ ok: true });
          return false;
        }
        if (message.type === "SNIP_HIDE") {
          teardownSnip();
          sendResponse({ ok: true });
          return false;
        }
        if (message.type === "SNIP_START") {
          startSnip(message.dataUrl);
          sendResponse({ ok: true });
          return false;
        }
        if (message.type === "SNIP_CANCEL") {
          teardownSnip();
          showToast("Cancelled", "info");
          sendResponse({ ok: true });
          return false;
        }
        if (message.type === "SNIP_TOAST") {
          showToast(message.text, message.kind);
          sendResponse({ ok: true });
          return false;
        }
        return false;
      }
    );
  }
  function startSnip(dataUrl) {
    teardownSnip();
    const parent = overlayParent();
    const host = document.createElement("div");
    host.setAttribute(HOST_ATTR, "snip");
    host.style.cssText = [
      "all: initial",
      "display: block",
      "position: fixed",
      "inset: 0",
      "z-index: 2147483646",
      "width: 100%",
      "height: 100%"
    ].join(";");
    const shadow = host.attachShadow({ mode: "closed" });
    shadow.innerHTML = overlayHtml();
    const root = shadow.getElementById("root");
    const freeze = shadow.getElementById("freeze");
    freeze.src = dataUrl;
    const sel = shadow.getElementById("sel");
    const label = shadow.getElementById("label");
    const hint = shadow.getElementById("hint");
    const shade = shadow.getElementById("shade");
    let dragging = false;
    let startX = 0;
    let startY = 0;
    const onMouseDown = (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      dragging = true;
      const point = localPoint(root, event);
      startX = point.x;
      startY = point.y;
      hint.style.display = "none";
      shade.style.display = "none";
      sel.style.display = "block";
      applyRect(sel, label, { left: startX, top: startY, width: 0, height: 0 });
    };
    const onMouseMove = (event) => {
      if (!dragging) return;
      event.preventDefault();
      event.stopPropagation();
      const point = localPoint(root, event);
      applyRect(sel, label, clampRect(root, startX, startY, point.x, point.y));
    };
    const onMouseUp = (event) => {
      if (!dragging) return;
      event.preventDefault();
      event.stopPropagation();
      dragging = false;
      const point = localPoint(root, event);
      const rect = clampRect(root, startX, startY, point.x, point.y);
      if (rect.width < MIN_CSS_PX || rect.height < MIN_CSS_PX) {
        sel.style.display = "none";
        shade.style.display = "block";
        hint.style.display = "flex";
        return;
      }
      void finishSnip(dataUrl, freeze, rect);
    };
    const onKeyDown = (event) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      teardownSnip();
      showToast("Cancelled", "info");
    };
    const onContextMenu = (event) => {
      event.preventDefault();
      event.stopPropagation();
    };
    root.addEventListener("mousedown", onMouseDown, true);
    window.addEventListener("mousemove", onMouseMove, true);
    window.addEventListener("mouseup", onMouseUp, true);
    window.addEventListener("keydown", onKeyDown, true);
    host.addEventListener("contextmenu", onContextMenu, true);
    const onFullscreen = () => {
      const next = overlayParent();
      if (host.parentElement !== next) next.appendChild(host);
    };
    document.addEventListener("fullscreenchange", onFullscreen);
    host.__snipioCleanup = () => {
      root.removeEventListener("mousedown", onMouseDown, true);
      window.removeEventListener("mousemove", onMouseMove, true);
      window.removeEventListener("mouseup", onMouseUp, true);
      window.removeEventListener("keydown", onKeyDown, true);
      host.removeEventListener("contextmenu", onContextMenu, true);
      document.removeEventListener("fullscreenchange", onFullscreen);
    };
    parent.appendChild(host);
    snipHost = host;
  }
  async function finishSnip(dataUrl, freeze, rect) {
    const viewportW = freeze.clientWidth || window.innerWidth;
    const viewportH = freeze.clientHeight || window.innerHeight;
    let bytes;
    try {
      bytes = await cropToPng(dataUrl, rect, viewportW, viewportH);
    } catch {
      teardownSnip();
      showToast("Couldn't crop that selection", "error");
      return;
    }
    teardownSnip();
    const result = await chrome.runtime.sendMessage({
      type: "SNIP_CAPTURED",
      mime: "image/png",
      bytes
    });
    if (result?.ok) {
      showToast("Sent to tablet", "success");
      return;
    }
    showToast(result?.error ?? "Couldn't send \u2014 try again", "error");
  }
  function teardownSnip() {
    if (!snipHost) return;
    const cleanup = snipHost.__snipioCleanup;
    cleanup?.();
    snipHost.remove();
    snipHost = null;
  }
  function overlayParent() {
    return document.fullscreenElement ?? document.documentElement;
  }
  function localPoint(root, event) {
    const box = root.getBoundingClientRect();
    return {
      x: event.clientX - box.left,
      y: event.clientY - box.top
    };
  }
  function clampRect(root, x0, y0, x1, y1) {
    const maxW = root.clientWidth;
    const maxH = root.clientHeight;
    const left = Math.max(0, Math.min(x0, x1));
    const top = Math.max(0, Math.min(y0, y1));
    const right = Math.min(maxW, Math.max(x0, x1));
    const bottom = Math.min(maxH, Math.max(y0, y1));
    return {
      left,
      top,
      width: Math.max(0, right - left),
      height: Math.max(0, bottom - top)
    };
  }
  function applyRect(sel, label, rect) {
    sel.style.left = `${rect.left}px`;
    sel.style.top = `${rect.top}px`;
    sel.style.width = `${rect.width}px`;
    sel.style.height = `${rect.height}px`;
    label.textContent = `${Math.round(rect.width)} \xD7 ${Math.round(rect.height)}`;
    label.style.top = rect.top < 28 ? "8px" : "-24px";
  }
  async function cropToPng(dataUrl, rect, viewportW, viewportH) {
    const image = await loadImage(dataUrl);
    const scaleX = image.naturalWidth / viewportW;
    const scaleY = image.naturalHeight / viewportH;
    let sx = Math.round(rect.left * scaleX);
    let sy = Math.round(rect.top * scaleY);
    let sw = Math.round(rect.width * scaleX);
    let sh = Math.round(rect.height * scaleY);
    sx = Math.max(0, Math.min(sx, image.naturalWidth - 1));
    sy = Math.max(0, Math.min(sy, image.naturalHeight - 1));
    sw = Math.max(1, Math.min(sw, image.naturalWidth - sx));
    sh = Math.max(1, Math.min(sh, image.naturalHeight - sy));
    const canvas = document.createElement("canvas");
    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas");
    ctx.drawImage(image, sx, sy, sw, sh, 0, 0, sw, sh);
    const cropped = canvas.toDataURL("image/png");
    const comma = cropped.indexOf(",");
    if (comma < 0) throw new Error("png");
    return cropped.slice(comma + 1);
  }
  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("image"));
      image.src = src;
    });
  }
  function showToast(text, kind) {
    document.querySelectorAll(`[${HOST_ATTR}="toast"]`).forEach((node) => node.remove());
    const host = document.createElement("div");
    host.setAttribute(HOST_ATTR, "toast");
    host.style.cssText = [
      "all: initial",
      "display: block",
      "position: fixed",
      "left: 50%",
      "bottom: 28px",
      "transform: translateX(-50%)",
      "z-index: 2147483647"
    ].join(";");
    const shadow = host.attachShadow({ mode: "closed" });
    const color = kind === "error" ? "#D94040" : kind === "success" ? "#27A05A" : "#1A1714";
    shadow.innerHTML = `
    <style>
      .toast {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-size: 13px;
        font-weight: 600;
        color: #fff;
        background: ${color};
        padding: 10px 16px;
        border-radius: 999px;
        box-shadow: 0 8px 24px rgba(26, 23, 20, 0.22);
        white-space: nowrap;
        letter-spacing: -0.01em;
      }
    </style>
    <div class="toast">${escapeHtml(text)}</div>
  `;
    overlayParent().appendChild(host);
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => host.remove(), TOAST_MS);
  }
  function escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function overlayHtml() {
    return `
    <style>
      :host { all: initial; }
      #root {
        position: relative;
        width: 100%;
        height: 100%;
        cursor: crosshair;
        user-select: none;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      #freeze {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: fill;
        pointer-events: none;
      }
      #shade {
        position: absolute;
        inset: 0;
        background: rgba(16, 14, 12, 0.38);
        pointer-events: none;
      }
      #hint {
        position: absolute;
        top: 18px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 14px;
        border-radius: 999px;
        background: rgba(26, 23, 20, 0.88);
        color: #FAF8F5;
        font-size: 13px;
        font-weight: 600;
        letter-spacing: -0.01em;
        pointer-events: none;
        box-shadow: 0 8px 24px rgba(26, 23, 20, 0.25);
      }
      #hint span { color: #E8642A; }
      #sel {
        display: none;
        position: absolute;
        box-sizing: border-box;
        border: 2px solid #E8642A;
        box-shadow: 0 0 0 9999px rgba(16, 14, 12, 0.5);
        pointer-events: none;
      }
      #sel::after {
        content: "";
        position: absolute;
        inset: -2px;
        border: 1px dashed #fff;
        animation: ants 0.45s linear infinite;
      }
      #label {
        position: absolute;
        left: 0;
        padding: 2px 7px;
        border-radius: 4px;
        background: #E8642A;
        color: #fff;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.02em;
        white-space: nowrap;
      }
      @keyframes ants {
        to { stroke-dashoffset: 8; }
      }
    </style>
    <div id="root">
      <img id="freeze" alt="" draggable="false" />
      <div id="shade"></div>
      <div id="hint">Drag to select a region \xB7 <span>Esc</span> to cancel</div>
      <div id="sel"><div id="label">0 \xD7 0</div></div>
    </div>
  `;
  }
})();
