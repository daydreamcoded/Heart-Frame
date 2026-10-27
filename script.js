(() => {
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const photoInput = $("#photoInput");
  const photoPreview = $("#photoPreview");
  const emptyPhoto = $("#emptyPhoto");
  const photoWindow = $("#photoWindow");
  const card = $("#card");
  const uploadZone = $(".upload-zone");
  const uploadStatus = $("#uploadStatus");
  const cardName = $("#cardName");
  const cardNote = $("#cardNote");
  const cardTitle = $("#cardTitle");
  const cardNotePreview = $("#cardNotePreview");
  let uploadedImage = null;
  let selectedFilter = "none";
  let paperColor = "#fff0f6";
  let zoom = 1;
  let extraStickers = [];

  const filterStyles = {
    none: "none",
    pink: "saturate(1.15) sepia(.12) hue-rotate(305deg) brightness(1.04)",
    dreamy: "saturate(.9) hue-rotate(15deg) brightness(1.1) contrast(.92)",
    vintage: "sepia(.42) saturate(.8) contrast(.94) brightness(1.02)",
    mono: "grayscale(1)",
    bright: "brightness(1.12) saturate(1.22) contrast(.96)"
  };

  function applyPhotoStyle() {
    const brightness = Number($("#brightness").value);
    const contrast = Number($("#contrast").value);
    const saturation = Number($("#saturation").value);
    const base = filterStyles[selectedFilter] || "none";
    photoPreview.style.filter = `${base} brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    photoPreview.style.setProperty("--zoom", zoom);
    photoPreview.style.transform = `scale(${zoom})`;
    $("#brightnessOut").textContent = `${brightness}%`;
    $("#contrastOut").textContent = `${contrast}%`;
    $("#saturationOut").textContent = `${saturation}%`;
    $("#zoomOut").textContent = `${Math.round(zoom * 100)}%`;
  }

  function loadPhoto(file) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      uploadStatus.textContent = "Please choose a JPG, PNG, or WebP image.";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      uploadStatus.textContent = "That photo is over 10 MB. Choose a smaller image.";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        uploadedImage = img;
        photoPreview.src = reader.result;
        photoPreview.hidden = false;
        emptyPhoto.hidden = true;
        uploadStatus.textContent = `${file.name} · ready to decorate!`;
        applyPhotoStyle();
      };
      img.onerror = () => uploadStatus.textContent = "That image couldn't be opened. Try another photo.";
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  photoInput.addEventListener("change", (event) => loadPhoto(event.target.files[0]));
  ["dragenter", "dragover"].forEach(type => uploadZone.addEventListener(type, event => {
    event.preventDefault(); uploadZone.classList.add("dragover");
  }));
  ["dragleave", "drop"].forEach(type => uploadZone.addEventListener(type, event => {
    event.preventDefault(); uploadZone.classList.remove("dragover");
  }));
  uploadZone.addEventListener("drop", event => loadPhoto(event.dataTransfer.files[0]));

  $$(".filter-chip").forEach(button => button.addEventListener("click", () => {
    $$(".filter-chip").forEach(b => b.classList.remove("active"));
    button.classList.add("active");
    selectedFilter = button.dataset.filter;
    applyPhotoStyle();
  }));
  ["brightness", "contrast", "saturation"].forEach(id => $(`#${id}`).addEventListener("input", applyPhotoStyle));
  $("#zoom").addEventListener("input", event => {
    zoom = Number(event.target.value) / 100;
    applyPhotoStyle();
  });

  cardName.addEventListener("input", () => cardTitle.textContent = cardName.value || "♡");
  cardNote.addEventListener("input", () => cardNotePreview.textContent = cardNote.value || " ");

  $("#paperColors").addEventListener("click", event => {
    const button = event.target.closest(".color-dot");
    if (!button) return;
    $$(".color-dot").forEach(dot => dot.classList.remove("selected"));
    button.classList.add("selected");
    paperColor = button.dataset.color;
    card.style.backgroundColor = paperColor;
  });

  $$(".shape-btn").forEach(button => button.addEventListener("click", () => {
    $$(".shape-btn").forEach(b => b.classList.remove("selected"));
    button.classList.add("selected");
    card.classList.toggle("square", button.dataset.shape === "square");
  }));

  function addSticker(emoji) {
    const sticker = document.createElement("span");
    sticker.className = "deco extra-sticker";
    sticker.textContent = emoji;
    sticker.setAttribute("aria-label", `Added sticker ${emoji}`);
    sticker.style.left = `${12 + Math.random() * 65}%`;
    sticker.style.top = `${12 + Math.random() * 66}%`;
    sticker.style.fontSize = `${25 + Math.floor(Math.random() * 15)}px`;
    sticker.style.transform = `rotate(${Math.floor(Math.random() * 35) - 17}deg)`;
    card.appendChild(sticker);
    extraStickers.push(sticker);
  }
  $$(".sticker").forEach(button => button.addEventListener("click", () => addSticker(button.dataset.sticker)));
  $("#clearDecorBtn").addEventListener("click", () => {
    $$(".extra-sticker").forEach(sticker => sticker.remove());
    extraStickers = [];
  });

  function roundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function drawCover(ctx, img, x, y, w, h, scale, filter) {
    const ratio = Math.max(w / img.width, h / img.height) * scale;
    const dw = img.width * ratio, dh = img.height * ratio;
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.filter = filter;
    ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
    ctx.restore();
  }
  function canvasFilter() {
    const brightness = Number($("#brightness").value);
    const contrast = Number($("#contrast").value);
    const saturation = Number($("#saturation").value);
    const map = {
      none: "",
      pink: "sepia(12%) saturate(115%) hue-rotate(305deg) brightness(104%) ",
      dreamy: "saturate(90%) hue-rotate(15deg) brightness(110%) contrast(92%) ",
      vintage: "sepia(42%) saturate(80%) contrast(94%) brightness(102%) ",
      mono: "grayscale(100%) ",
      bright: "brightness(112%) saturate(122%) contrast(96%) "
    };
    return `${map[selectedFilter]}brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
  }
  function drawSticker(ctx, emoji, x, y, size, rotation = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rotation);
    ctx.font = `${size}px "Apple Color Emoji","Segoe UI Emoji",sans-serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.shadowColor = "#9b5a7b22"; ctx.shadowBlur = 3;
    ctx.fillText(emoji, 0, 0); ctx.restore();
  }
  async function downloadCard() {
    const scale = 3;
    const width = 700;
    const height = card.classList.contains("square") ? 700 : 1050;
    const canvas = document.createElement("canvas");
    canvas.width = width * scale; canvas.height = height * scale;
    const ctx = canvas.getContext("2d");
    ctx.scale(scale, scale);
    const w = width, h = height;
    ctx.fillStyle = paperColor;
    roundedRect(ctx, 0, 0, w, h, 16); ctx.fill();
    // Subtle scrapbook paper speckles.
    for (let i = 0; i < 260; i++) {
      ctx.fillStyle = "rgba(190,130,165,0.12)";
      const x = (i * 97) % w, y = (i * 173) % h;
      ctx.beginPath(); ctx.arc(x, y, 1.1, 0, Math.PI * 2); ctx.fill();
    }
    // Washi tape strips.
    ctx.save(); ctx.translate(105, 75); ctx.rotate(-0.42);
    ctx.fillStyle = "#f6b2d0"; ctx.fillRect(-85, -14, 170, 28);
    for (let i = -80; i < 90; i += 18) { ctx.fillStyle = "#ffe1ed"; ctx.fillRect(i, -14, 8, 28); }
    ctx.restore();
    const isSquare = card.classList.contains("square");
    const photoX = w * .12, photoY = h * .11;
    const photoW = w * .76, photoH = h * (isSquare ? .57 : .68);
    ctx.fillStyle = "#fffafc";
    ctx.shadowColor = "#8d607522"; ctx.shadowBlur = 8; ctx.fillRect(photoX - 13, photoY - 13, photoW + 26, photoH + 26); ctx.shadowBlur = 0;
    if (uploadedImage) {
      drawCover(ctx, uploadedImage, photoX, photoY, photoW, photoH, zoom, canvasFilter());
    } else {
      ctx.fillStyle = "#f7dce9"; ctx.fillRect(photoX, photoY, photoW, photoH);
      ctx.fillStyle = "#b879a0"; ctx.textAlign = "center";
      ctx.font = "58px sans-serif"; ctx.fillText("♡", w / 2, h * .43);
      ctx.font = "22px sans-serif"; ctx.fillText("Your photo goes here", w / 2, h * .49);
    }
    // Title and note.
    ctx.textAlign = "center"; ctx.fillStyle = "#a64f89";
    ctx.font = "30px cursive";
    ctx.fillText(cardName.value || "♡", w / 2, h * (isSquare ? .78 : .84), w * .82);
    ctx.fillStyle = "#bb78a0"; ctx.font = "bold 17px sans-serif";
    ctx.fillText(cardNote.value || "made with love", w / 2, h * .94, w * .84);
    // Decorative pieces placed around the card.
    drawSticker(ctx, "♡", w * .09, h * .39, 54, -.2);
    drawSticker(ctx, "✦", w * .88, h * .13, 46, .2);
    drawSticker(ctx, "🎀", w * .86, h * .74, 48, .1);
    drawSticker(ctx, "✿", w * .10, h * .78, 43, -.1);
    // Small circular stamp.
    ctx.save(); ctx.translate(w * .84, h * .10); ctx.rotate(.16);
    ctx.strokeStyle = "#d98db5"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 34, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = "#bd6598"; ctx.font = "bold 10px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("MADE", 0, -3); ctx.fillText("WITH ♡", 0, 10); ctx.restore();
    // Added stickers are exported in their approximate preview positions.
    $$(".extra-sticker").forEach(sticker => {
      const x = parseFloat(sticker.style.left) / 100 * w;
      const y = parseFloat(sticker.style.top) / 100 * h;
      const size = parseFloat(sticker.style.fontSize) * 1.7;
      const rotateMatch = sticker.style.transform.match(/rotate\((-?[\d.]+)deg\)/);
      const rotation = rotateMatch ? Number(rotateMatch[1]) * Math.PI / 180 : 0;
      drawSticker(ctx, sticker.textContent, x, y, size, rotation);
    });
    canvas.toBlob(blob => {
      if (!blob) { alert("Sorry, the card couldn't be exported. Please try again."); return; }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url; link.download = "heartframe-photocard.png";
      document.body.appendChild(link); link.click(); link.remove();
      URL.revokeObjectURL(url);
    }, "image/png");
  }

  $("#downloadBtn").addEventListener("click", downloadCard);
  $("#downloadBtnSide").addEventListener("click", downloadCard);
  $("#resetBtn").addEventListener("click", () => {
    photoInput.value = "";
    uploadedImage = null;
    photoPreview.removeAttribute("src");
    photoPreview.hidden = true;
    emptyPhoto.hidden = false;
    uploadStatus.textContent = "Your photo will appear in the frame.";
    selectedFilter = "none"; zoom = 1; paperColor = "#fff0f6";
    $("#brightness").value = 100; $("#contrast").value = 100; $("#saturation").value = 100; $("#zoom").value = 100;
    $$(".filter-chip").forEach(b => b.classList.toggle("active", b.dataset.filter === "none"));
    $$(".color-dot").forEach(b => b.classList.toggle("selected", b.dataset.color === paperColor));
    $$(".shape-btn").forEach(b => b.classList.toggle("selected", b.dataset.shape === "portrait"));
    card.classList.remove("square"); card.style.backgroundColor = paperColor;
    cardName.value = "my favorite ♡"; cardNote.value = "";
    cardTitle.textContent = cardName.value; cardNotePreview.textContent = "made with love";
    $$(".extra-sticker").forEach(sticker => sticker.remove()); extraStickers = [];
    applyPhotoStyle();
  });
  applyPhotoStyle();
})();
