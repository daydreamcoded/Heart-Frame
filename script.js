(() => {
  "use strict";
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const card = $("#card"), photoWindow = $("#photoWindow"), photoPreview = $("#photoPreview");
  const photoInput = $("#photoInput"), uploadZone = $("#uploadZone"), uploadStatus = $("#uploadStatus");
  const cardName = $("#cardName"), cardNote = $("#cardNote");
  const state = {
    filter:"none", brightness:100, contrast:100, saturation:100, zoom:1, photoX:0, photoY:0,
    paperColor:"#fff0f6", paperStyle:"speckles", shape:"portrait", stickers:[], nextStickerId:1,
    theme:"coquette", holo:false, holoStrength:.45, profile:{idol:"",group:"",birthday:"",era:"",show:false}, message:""
  };
  let uploadedImage = null, selectedStickerId = null, history = [], historyIndex = -1, restoring = false;
  const filterMap = {
    none:"", pink:"sepia(12%) saturate(115%) hue-rotate(305deg) brightness(104%)",
    dreamy:"saturate(90%) hue-rotate(15deg) brightness(110%) contrast(92%)",
    vintage:"sepia(42%) saturate(80%) contrast(94%) brightness(102%)",
    mono:"grayscale(100%)", bright:"brightness(112%) saturate(122%) contrast(96%)"
  };
  const themes = {
    coquette:{color:"#fff0f6",paper:"speckles",stickers:["🎀","💗","୨୧"]},
    dreamy:{color:"#fff8e9",paper:"torn",stickers:["☁","✦","🦋"]},
    celestial:{color:"#f0edff",paper:"graph",stickers:["☾","⭐","✧"]},
    retro:{color:"#fff0d9",paper:"polka",stickers:["⭐","🍓","✦"]},
    elegant:{color:"#eee8f6",paper:"glitter",stickers:["✦","🦋","♡"]},
    mint:{color:"#e9f7f1",paper:"gingham",stickers:["🌷","ꕤ","☁"]}
  };
  const clone = obj => JSON.parse(JSON.stringify(obj));
  function snapshot() {
    return {
      state:clone(state), name:cardName.value, note:cardNote.value, fanMessage:$("#fanMessage").value,
      brightness:+$("#brightness").value, contrast:+$("#contrast").value, saturation:+$("#saturation").value,
      photoSrc:uploadedImage ? photoPreview.src : "", photoName:uploadStatus.textContent
    };
  }
  function saveHistory() {
    if (restoring) return;
    const snap = snapshot(), serialized = JSON.stringify(snap);
    if (historyIndex >= 0 && JSON.stringify(history[historyIndex]) === serialized) return;
    history = history.slice(0, historyIndex + 1); history.push(snap);
    if (history.length > 50) history.shift();
    historyIndex = history.length - 1; updateHistoryButtons();
  }
  function updateHistoryButtons() { $("#undoBtn").disabled = historyIndex <= 0; $("#redoBtn").disabled = historyIndex >= history.length - 1; }
  function restoreSnapshot(snap) {
    if (!snap) return;
    restoring = true; Object.assign(state, clone(snap.state));
    cardName.value=snap.name; cardNote.value=snap.note; $("#fanMessage").value=snap.fanMessage;
    $("#brightness").value=snap.brightness; $("#contrast").value=snap.contrast; $("#saturation").value=snap.saturation;
    if (snap.photoSrc) {
      photoPreview.src=snap.photoSrc; photoPreview.hidden=false; $("#emptyPhoto").hidden=true;
      const im = new Image(); im.onload=()=>{uploadedImage=im; applyPhotoStyle();}; im.src=snap.photoSrc;
    } else { uploadedImage=null; photoPreview.removeAttribute("src"); photoPreview.hidden=true; $("#emptyPhoto").hidden=false; }
    uploadStatus.textContent=snap.photoName;
    syncControls(); renderCard(); restoring=false; updateHistoryButtons();
  }
  function syncControls() {
    $$(".filter-chip").forEach(b=>b.classList.toggle("active",b.dataset.filter===state.filter));
    $("#zoom").value=Math.round(state.zoom*100); $("#zoomOut").textContent=`${Math.round(state.zoom*100)}%`;
    $("#paperStyle").value=state.paperStyle; $("#themeSelect").value=state.theme;
    $("#holoToggle").checked=state.holo; $("#holoStrength").value=Math.round(state.holoStrength*100); $("#holoOut").textContent=`${Math.round(state.holoStrength*100)}%`;
    $("#showProfile").checked=state.profile.show;
    $$(".color-dot").forEach(b=>b.classList.toggle("selected",b.dataset.color===state.paperColor));
    $$(".shape-btn").forEach(b=>b.classList.toggle("selected",b.dataset.shape===state.shape));
    $("#brightnessOut").textContent=`${$("#brightness").value}%`;$("#contrastOut").textContent=`${$("#contrast").value}%`;$("#saturationOut").textContent=`${$("#saturation").value}%`;
  }
  function applyPhotoStyle() {
    const w=photoWindow.clientWidth||240,h=photoWindow.clientHeight||300;
    if(uploadedImage) {
      const ratio=Math.max(w/uploadedImage.width,h/uploadedImage.height)*state.zoom;
      const dw=uploadedImage.width*ratio,dh=uploadedImage.height*ratio;
      photoPreview.style.width=`${dw}px`;photoPreview.style.height=`${dh}px`;
      photoPreview.style.left=`calc(50% - ${dw/2}px + ${state.photoX}px)`;
      photoPreview.style.top=`calc(50% - ${dh/2}px + ${state.photoY}px)`;
      photoPreview.style.filter=`${filterMap[state.filter]} brightness(${$("#brightness").value}%) contrast(${$("#contrast").value}%) saturate(${$("#saturation").value}%)`;
    }
    $("#brightnessOut").textContent=`${$("#brightness").value}%`;$("#contrastOut").textContent=`${$("#contrast").value}%`;$("#saturationOut").textContent=`${$("#saturation").value}%`;$("#zoomOut").textContent=`${Math.round(state.zoom*100)}%`;
  }
  function renderCard() {
    card.style.backgroundColor=state.paperColor;card.className=`card ${state.shape}${state.holo?" holo":""}`;
    card.style.setProperty("--holo-strength",state.holoStrength);
    $("#paperTexture").className=`paper-texture ${state.paperStyle}`;
    $("#holoOverlay").style.opacity=state.holo?state.holoStrength:0;
    $("#cardTitle").textContent=cardName.value||"♡";$("#cardNotePreview").textContent=cardNote.value||"";
    const p=state.profile; const details=[p.idol,p.group,p.birthday,p.era].filter(Boolean).join(" · ");
    $("#profilePreview").textContent=details;$("#profilePreview").hidden=!(p.show&&details);
    $("#messagePreview").textContent=$("#fanMessage").value;$("#messagePreview").hidden=!$("#fanMessage").value;
    $$(".extra-sticker").forEach(el=>el.remove());
    state.stickers.forEach(s=>{
      const el=document.createElement("span");el.className="deco extra-sticker"+(s.id===selectedStickerId?" selected-sticker":"");
      el.dataset.stickerId=s.id;el.textContent=s.emoji;el.style.left=`${s.x*100}%`;el.style.top=`${s.y*100}%`;
      el.style.fontSize=`${s.size}px`;el.style.transform=`translate(-50%,-50%) rotate(${s.rotation}deg)`;el.style.zIndex=String(s.layer+5);
      el.setAttribute("role","button");el.setAttribute("aria-label",`Sticker ${s.emoji}; select to edit`);el.tabIndex=0;
      card.appendChild(el);bindSticker(el,s);
    });
    $("#selectedTools").hidden=!state.stickers.some(s=>s.id===selectedStickerId);
    applyPhotoStyle();
  }
  function loadPhoto(file) {
    if(!file)return;
    if(!/^image\/(png|jpeg|webp)$/.test(file.type)){uploadStatus.textContent="Please choose a JPG, PNG, or WebP image.";return;}
    if(file.size>10*1024*1024){uploadStatus.textContent="That photo is over 10 MB. Choose a smaller image.";return;}
    const reader=new FileReader();
    reader.onload=()=>{const img=new Image();img.onload=()=>{uploadedImage=img;photoPreview.src=reader.result;photoPreview.hidden=false;$("#emptyPhoto").hidden=true;state.photoX=0;state.photoY=0;state.zoom=1;$("#zoom").value=100;uploadStatus.textContent=`${file.name} · ready to decorate!`;applyPhotoStyle();saveHistory();};img.onerror=()=>uploadStatus.textContent="That image couldn't be opened. Try another photo.";img.src=reader.result;};
    reader.readAsDataURL(file);
  }
  photoInput.addEventListener("change",e=>loadPhoto(e.target.files[0]));
  ["dragenter","dragover"].forEach(t=>uploadZone.addEventListener(t,e=>{e.preventDefault();uploadZone.classList.add("dragover");}));
  ["dragleave","drop"].forEach(t=>uploadZone.addEventListener(t,e=>{e.preventDefault();uploadZone.classList.remove("dragover");}));
  uploadZone.addEventListener("drop",e=>loadPhoto(e.dataTransfer.files[0]));
  $$(".filter-chip").forEach(b=>b.addEventListener("click",()=>{state.filter=b.dataset.filter;syncControls();applyPhotoStyle();saveHistory();}));
  ["brightness","contrast","saturation"].forEach(id=>$("#"+id).addEventListener("input",()=>{applyPhotoStyle();}));
  ["brightness","contrast","saturation"].forEach(id=>$("#"+id).addEventListener("change",saveHistory));
  $("#zoom").addEventListener("input",e=>{state.zoom=+e.target.value/100;applyPhotoStyle();});
  $("#zoom").addEventListener("change",saveHistory);
  $("#photoResetBtn").addEventListener("click",()=>{state.photoX=0;state.photoY=0;state.zoom=1;$("#zoom").value=100;applyPhotoStyle();saveHistory();});
  let photoDrag=null;
  photoWindow.addEventListener("pointerdown",e=>{if(!uploadedImage)return;if(e.target.closest(".extra-sticker"))return;photoDrag={x:e.clientX,y:e.clientY,px:state.photoX,py:state.photoY};photoWindow.setPointerCapture(e.pointerId);});
  photoWindow.addEventListener("pointermove",e=>{if(!photoDrag)return;state.photoX=photoDrag.px+(e.clientX-photoDrag.x);state.photoY=photoDrag.py+(e.clientY-photoDrag.y);applyPhotoStyle();});
  ["pointerup","pointercancel"].forEach(t=>photoWindow.addEventListener(t,()=>{if(photoDrag){photoDrag=null;saveHistory();}}));
  cardName.addEventListener("input",()=>{$("#cardTitle").textContent=cardName.value||"♡";});cardName.addEventListener("change",saveHistory);
  cardNote.addEventListener("input",()=>$("#cardNotePreview").textContent=cardNote.value);cardNote.addEventListener("change",saveHistory);
  $("#fanMessage").addEventListener("input",()=>{renderCard();});$("#fanMessage").addEventListener("change",saveHistory);
  [["idolName","idol"],["groupName","group"],["birthday","birthday"],["eraName","era"]].forEach(([id,key])=>{$("#"+id).addEventListener("input",()=>{state.profile[key]=$("#"+id).value;renderCard();});$("#"+id).addEventListener("change",saveHistory);});
  $("#showProfile").addEventListener("change",e=>{state.profile.show=e.target.checked;renderCard();saveHistory();});
  $("#paperColors").addEventListener("click",e=>{const b=e.target.closest(".color-dot");if(!b)return;state.paperColor=b.dataset.color;syncControls();renderCard();saveHistory();});
  $("#paperStyle").addEventListener("change",e=>{state.paperStyle=e.target.value;renderCard();saveHistory();});
  $("#themeSelect").addEventListener("change",e=>{const t=themes[e.target.value];state.theme=e.target.value;state.paperColor=t.color;state.paperStyle=t.paper;state.stickers.push(...t.stickers.map((emoji,i)=>({id:state.nextStickerId++,emoji,x:.2+i*.3,y:.22,size:29,rotation:(i-1)*9,layer:state.stickers.length+i})));syncControls();renderCard();saveHistory();});
  $("#holoToggle").addEventListener("change",e=>{state.holo=e.target.checked;renderCard();saveHistory();});
  $("#holoStrength").addEventListener("input",e=>{state.holoStrength=+e.target.value/100;card.style.setProperty("--holo-strength",state.holoStrength);$("#holoOut").textContent=e.target.value+"%";});$("#holoStrength").addEventListener("change",saveHistory);
  $$(".shape-btn").forEach(b=>b.addEventListener("click",()=>{state.shape=b.dataset.shape;syncControls();renderCard();saveHistory();}));
  $("#stickerPack").addEventListener("change",e=>{$$("#stickerGrid .sticker").forEach(b=>b.hidden=!(e.target.value==="all"||b.dataset.pack===e.target.value));});
  $$("#stickerGrid .sticker").forEach(b=>b.addEventListener("click",()=>{const s={id:state.nextStickerId++,emoji:b.dataset.sticker,x:.22+Math.random()*.56,y:.22+Math.random()*.55,size:31,rotation:Math.round(Math.random()*30-15),layer:state.stickers.length};state.stickers.push(s);selectedStickerId=s.id;renderCard();saveHistory();}));
  
  function bindSticker(el, s) {
    let drag = null;

    el.addEventListener("pointerdown", e => {
      e.stopPropagation();
      e.preventDefault();
      selectedStickerId = s.id;

      $$(".extra-sticker").forEach(node =>
        node.classList.toggle(
          "selected-sticker",
          node.dataset.stickerId === String(s.id)
        )
      );

      $("#selectedTools").hidden = false;
      drag = {
        x: e.clientX,
        y: e.clientY,
        sx: s.x,
        sy: s.y
      };

      el.setPointerCapture(e.pointerId);
    });

    el.addEventListener("pointermove", e => {
      if (!drag) return;

      const r = card.getBoundingClientRect();

      s.x = Math.max(
        0.03,
        Math.min(0.97, drag.sx + (e.clientX - drag.x) / r.width)
      );

      s.y = Math.max(
        0.03,
        Math.min(0.97, drag.sy + (e.clientY - drag.y) / r.height)
      );

      el.style.left = `${s.x * 100}%`;
      el.style.top = `${s.y * 100}%`;
    });

    ["pointerup", "pointercancel"].forEach(t =>
      el.addEventListener(t, () => {
        if (drag) {
          drag = null;
          renderCard();
          saveHistory();
        }
      })
    );

    el.addEventListener("click", e => {
      e.stopPropagation();
      selectedStickerId = s.id;
      renderCard();
    });

    el.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        selectedStickerId = s.id;
        renderCard();
      }
    });
  }

  $("#rotateStickerBtn").addEventListener("click",()=>editSelected(s=>s.rotation+=15));
  $("#smallerStickerBtn").addEventListener("click",()=>editSelected(s=>s.size=Math.max(12,s.size-4)));
  $("#largerStickerBtn").addEventListener("click",()=>editSelected(s=>s.size=Math.min(90,s.size+4)));
  $("#forwardStickerBtn").addEventListener("click",()=>editSelected(s=>s.layer=Math.max(...state.stickers.map(x=>x.layer),0)+1));
  $("#backStickerBtn").addEventListener("click",()=>editSelected(s=>s.layer=Math.min(...state.stickers.map(x=>x.layer),0)-1));
  $("#deleteStickerBtn").addEventListener("click",()=>{state.stickers=state.stickers.filter(s=>s.id!==selectedStickerId);selectedStickerId=null;renderCard();saveHistory();});
  function editSelected(fn){const s=state.stickers.find(s=>s.id===selectedStickerId);if(!s)return;fn(s);renderCard();saveHistory();}
  $("#clearDecorBtn").addEventListener("click",()=>{state.stickers=[];selectedStickerId=null;renderCard();saveHistory();});
  $("#addTapeBtn").addEventListener("click",()=>{const emoji="▰";const s={id:state.nextStickerId++,emoji,x:.5,y:.12,size:55,rotation:Math.round(Math.random()*24-12),layer:state.stickers.length};state.stickers.push(s);selectedStickerId=s.id;renderCard();saveHistory();});
  function roundRect(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
  function getDimensions(){if(state.shape==="square")return [900,900];if(state.shape==="polaroid")return [800,980];if(state.shape==="mini")return [600,900];return [700,1050];}
  function drawPattern(ctx,w,h){ctx.save();ctx.globalAlpha=.28;ctx.strokeStyle="#d7b4d0";ctx.fillStyle="#d7b4d0";if(state.paperStyle==="graph"){for(let x=0;x<w;x+=24){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke()}for(let y=0;y<h;y+=24){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}}else if(["polka","glitter","lace","speckles","gingham"].includes(state.paperStyle)){for(let y=8;y<h;y+=state.paperStyle==="polka"?28:21)for(let x=8;x<w;x+=state.paperStyle==="polka"?28:21){if(state.paperStyle==="gingham"){ctx.globalAlpha=.08;ctx.fillRect(x,y,12,12)}else if(state.paperStyle==="glitter"&&Math.random()<.3){ctx.globalAlpha=.65;ctx.fillRect(x,y,3,3)}else if(state.paperStyle==="lace"){ctx.beginPath();ctx.arc(x,y,5,0,Math.PI*2);ctx.stroke()}else{ctx.beginPath();ctx.arc(x,y,state.paperStyle==="polka"?3:1.3,0,Math.PI*2);ctx.fill()}}}else if(state.paperStyle==="torn"){ctx.globalAlpha=.12;ctx.fillStyle="#fff";ctx.fillRect(0,0,w,40);ctx.fillRect(0,h-35,w,35)}ctx.restore();}
  function drawCover(ctx,img,x,y,w,h){const ratio=Math.max(w/img.width,h/img.height)*state.zoom;const dw=img.width*ratio,dh=img.height*ratio;ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();ctx.filter=`${filterMap[state.filter]} brightness(${$("#brightness").value}%) contrast(${$("#contrast").value}%) saturate(${$("#saturation").value}%)`;ctx.drawImage(img,x+(w-dw)/2+state.photoX*(w/(photoWindow.clientWidth||1)),y+(h-dh)/2+state.photoY*(h/(photoWindow.clientHeight||1)),dw,dh);ctx.restore();}
  function drawEmoji(ctx,emoji,x,y,size,rotation=0){ctx.save();ctx.translate(x,y);ctx.rotate(rotation*Math.PI/180);ctx.font=`${size}px "Apple Color Emoji","Segoe UI Emoji",sans-serif`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(emoji,0,0);ctx.restore();}
  function drawCard(ctx,w,h){ctx.fillStyle=state.paperColor;roundRect(ctx,0,0,w,h,18);ctx.fill();drawPattern(ctx,w,h);
    // paper frame and tape
    ctx.fillStyle="#fffafc";ctx.fillRect(w*.09,h*.09,w*.82,h*(state.shape==="square"?.58:.67));
    const px=w*.12,py=h*.11,pw=w*.76,ph=h*(state.shape==="square"?.54:.63);
    if(uploadedImage)drawCover(ctx,uploadedImage,px,py,pw,ph);else{ctx.fillStyle="#f7dce9";ctx.fillRect(px,py,pw,ph);drawEmoji(ctx,"♡",w/2,h*.38,70);ctx.fillStyle="#b879a0";ctx.font="22px sans-serif";ctx.textAlign="center";ctx.fillText("Your photo goes here",w/2,h*.45);}
    ctx.save();ctx.translate(w*.18,h*.055);ctx.rotate(-12*Math.PI/180);ctx.fillStyle="#f4b5d2bb";ctx.fillRect(-55,-13,110,26);ctx.restore();
    if(state.shape==="polaroid"){ctx.fillStyle="#fffafc";ctx.fillRect(w*.09,h*.73,w*.82,h*.22);}
    ctx.fillStyle="#a64f89";ctx.textAlign="center";ctx.font=`${Math.max(20,w*.043)}px cursive`;ctx.fillText(cardName.value||"♡",w/2,h*(state.shape==="square"?.75:.82),w*.82);
    ctx.fillStyle="#bb78a0";ctx.font=`${Math.max(13,w*.024)}px sans-serif`;ctx.fillText(cardNote.value||"",w/2,h*(state.shape==="polaroid"?.91:.93),w*.84);
    if(state.profile.show){const p=state.profile,details=[p.idol,p.group,p.birthday,p.era].filter(Boolean).join(" · ");ctx.font=`${Math.max(10,w*.016)}px sans-serif`;ctx.fillText(details,w/2,h*.87,w*.86);}
    if($("#fanMessage").value){ctx.font=`${Math.max(10,w*.016)}px sans-serif`;ctx.fillText($("#fanMessage").value,w/2,h*.89,w*.82);}
    drawEmoji(ctx,"♡",w*.09,h*.39,w*.065,-15);drawEmoji(ctx,"✦",w*.88,h*.13,w*.06,12);drawEmoji(ctx,"🎀",w*.86,h*.74,w*.065,5);drawEmoji(ctx,"✿",w*.10,h*.78,w*.06,-8);
    ctx.save();ctx.translate(w*.84,h*.10);ctx.rotate(10*Math.PI/180);ctx.strokeStyle="#d98db5";ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,w*.045,0,Math.PI*2);ctx.stroke();ctx.fillStyle="#bd6598";ctx.font=`bold ${w*.014}px sans-serif`;ctx.textAlign="center";ctx.fillText("MADE",0,-3);ctx.fillText("WITH ♡",0,10);ctx.restore();
    // extra stickers in layer order
    [...state.stickers].sort((a,b)=>a.layer-b.layer).forEach(s=>{if(s.emoji==="▰"){ctx.save();ctx.translate(s.x*w,s.y*h);ctx.rotate(s.rotation*Math.PI/180);ctx.fillStyle="#f4b5d2bb";ctx.fillRect(-s.size,-s.size*.2,s.size*2,s.size*.4);ctx.restore();}else drawEmoji(ctx,s.emoji,s.x*w,s.y*h,s.size*1.7,s.rotation);});
    if(state.holo){ctx.save();ctx.globalAlpha=state.holoStrength;const g=ctx.createLinearGradient(0,0,w,h);g.addColorStop(0,"#ff8ec7");g.addColorStop(.25,"#fff");g.addColorStop(.5,"#9ff6f2");g.addColorStop(.75,"#d5a7ff");g.addColorStop(1,"#ffdb8b");ctx.fillStyle=g;ctx.fillRect(0,0,w,h);ctx.globalCompositeOperation="destination-out";ctx.clearRect(w*.12,h*.11,w*.76,h*(state.shape==="square"?.54:.63));ctx.restore();}
  }
  function renderCanvas(){const [w,h]=getDimensions(),scale=3,canvas=document.createElement("canvas");canvas.width=w*scale;canvas.height=h*scale;const ctx=canvas.getContext("2d");ctx.scale(scale,scale);drawCard(ctx,w,h);return canvas;}
  function downloadCard(){const canvas=renderCanvas();canvas.toBlob(blob=>{if(!blob){alert("Sorry, the card couldn't be exported. Please try again.");return;}const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="heartframe-photocard.png";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);},"image/png");}
  $("#downloadBtn").addEventListener("click",downloadCard);$("#downloadBtnSide").addEventListener("click",downloadCard);
  function projectData(){return {format:"heartframe-project-v2",state,cardName:cardName.value,cardNote:cardNote.value,fanMessage:$("#fanMessage").value,brightness:$("#brightness").value,contrast:$("#contrast").value,saturation:$("#saturation").value,photo:uploadedImage?photoPreview.src:null};}
  $("#saveProjectBtn").addEventListener("click",()=>{const blob=new Blob([JSON.stringify(projectData())],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="heartframe-project.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
  $("#loadProjectBtn").addEventListener("click",()=>$("#projectInput").click());
  $("#projectInput").addEventListener("change",e=>{const file=e.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{try{const p=JSON.parse(reader.result);if(!p.state||!p.format?.startsWith("heartframe-project"))throw new Error();Object.assign(state,p.state);cardName.value=p.cardName||"";cardNote.value=p.cardNote||"";$("#fanMessage").value=p.fanMessage||"";$("#brightness").value=p.brightness||100;$("#contrast").value=p.contrast||100;$("#saturation").value=p.saturation||100;$("#idolName").value=state.profile.idol||"";$("#groupName").value=state.profile.group||"";$("#birthday").value=state.profile.birthday||"";$("#eraName").value=state.profile.era||"";if(p.photo){const im=new Image();im.onload=()=>{uploadedImage=im;photoPreview.src=p.photo;photoPreview.hidden=false;$("#emptyPhoto").hidden=true;renderCard();saveHistory();};im.src=p.photo;}else{uploadedImage=null;renderCard();saveHistory();}selectedStickerId=null;syncControls();renderCard();saveHistory();uploadStatus.textContent="Project loaded!";}catch(err){alert("That file doesn't look like a HeartFrame project.");}};reader.readAsText(file);e.target.value="";});
  $("#undoBtn").addEventListener("click",()=>{if(historyIndex>0){historyIndex--;restoreSnapshot(history[historyIndex]);}});
  $("#redoBtn").addEventListener("click",()=>{if(historyIndex<history.length-1){historyIndex++;restoreSnapshot(history[historyIndex]);}});
  function printSheet(){const canvas=renderCanvas(),img=canvas.toDataURL("image/png"),count=+$("#printCount").value,size=$("#paperSize").value;const dims=size==="a4"?"210mm 297mm":"8.5in 11in";const columns=count<=2?1:2;const doc=`<!doctype html><html><head><title>HeartFrame print sheet</title><style>@page{size:${dims};margin:12mm}*{box-sizing:border-box}body{margin:0;font-family:sans-serif}.sheet{display:grid;grid-template-columns:repeat(${columns},1fr);gap:8mm;align-content:start}.item{position:relative;padding:3mm;border:1px dashed #777;break-inside:avoid}.item img{display:block;width:100%;height:auto;max-height:115mm;object-fit:contain}.hint{font-size:9pt;text-align:center;color:#777;margin:0 0 8mm}@media print{.hint{display:none}}</style></head><body><p class="hint">HeartFrame Studio · Print at 100% / Actual size for best results. Use your printer's paper settings.</p><div class="sheet">${Array.from({length:count},()=>`<div class="item"><img src="${img}" alt="Photocard with cut guide"></div>`).join("")}</div><script>window.onload=()=>setTimeout(()=>window.print(),300)<\/script></body></html>`;const win=window.open("","_blank");if(!win){alert("Please allow pop-ups to open the print sheet.");return;}win.document.write(doc);win.document.close();}
  $("#printBtn").addEventListener("click",printSheet);
  $("#resetBtn").addEventListener("click",()=>{if(!confirm("Reset your card and remove its current photo and decorations?"))return;photoInput.value="";uploadedImage=null;photoPreview.removeAttribute("src");photoPreview.hidden=true;$("#emptyPhoto").hidden=false;uploadStatus.textContent="Your photo will appear in the frame.";Object.assign(state,{filter:"none",brightness:100,contrast:100,saturation:100,zoom:1,photoX:0,photoY:0,paperColor:"#fff0f6",paperStyle:"speckles",shape:"portrait",stickers:[],nextStickerId:1,theme:"coquette",holo:false,holoStrength:.45,profile:{idol:"",group:"",birthday:"",era:"",show:false},message:""});cardName.value="my favorite ♡";cardNote.value="made with love";$("#fanMessage").value="";["brightness","contrast","saturation"].forEach(id=>$("#"+id).value=100);["idolName","groupName","birthday","eraName"].forEach(id=>$("#"+id).value="");selectedStickerId=null;syncControls();renderCard();saveHistory();});
  window.addEventListener("resize",applyPhotoStyle);
  syncControls();renderCard();saveHistory();
})();
