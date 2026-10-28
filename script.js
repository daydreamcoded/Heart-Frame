(() => {
  "use strict";
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const card = $("#card"), photoWindow = $("#photoWindow"), photoPreview = $("#photoPreview");
  const photoInput = $("#photoInput"), uploadZone = $("#uploadZone"), uploadStatus = $("#uploadStatus");
  const cardName = $("#cardName"), cardNote = $("#cardNote");
  const state = {
    filter:"none", filterIntensity:100, brightness:100, contrast:100, saturation:100, zoom:1, photoX:0, photoY:0,
    paperColor:"#fff0f6", paperStyle:"hearts", patternColor:"#e7a4c4", patternScale:1, patternSpacing:22, patternOpacity:.22,
    gradientEnabled:false, gradientColor2:"#f7dce9", gradientDirection:"135deg", surfaceFinish:"pearl", finishStrength:.16, frameStyle:"lace", themeId:"coquette",
    shape:"portrait", stickers:[], nextStickerId:1,
    textStyles:{
      title:{font:"Pacifico",size:24,x:50,y:77},
      note:{font:"Quicksand",size:11,x:50,y:90},
      profile:{font:"Quicksand",size:8,x:50,y:82},
      message:{font:"Quicksand",size:8,x:50,y:86}
    },
    tapeStyle:"stripes", holo:false, holoStrength:.45, profile:{idol:"",group:"",birthday:"",era:"",show:false}, message:""
  };
  let uploadedImage = null, selectedStickerId = null, history = [], historyIndex = -1, restoring = false;
  const filterPresets = {
    none:{}, pink:{sepia:12,saturate:115,hue:305,brightness:104},
    dreamy:{saturate:90,hue:15,brightness:110,contrast:92},
    vintage:{sepia:42,saturate:80,contrast:94,brightness:102},
    mono:{grayscale:100}, bright:{brightness:112,saturate:122,contrast:96},
    dreamySoft:{saturate:88,hue:12,brightness:108,contrast:91},
    vintageFilm:{sepia:48,saturate:78,contrast:92,brightness:103},
    y2k:{saturate:145,hue:325,contrast:108,brightness:106},
    cozy:{sepia:28,saturate:88,contrast:94,brightness:104},
    monochrome:{grayscale:100,contrast:112},
    lightLeak:{sepia:24,saturate:112,brightness:105,contrast:94},
    icy:{saturate:112,hue:175,brightness:105,contrast:106},
    glitch:{saturate:138,hue:185,contrast:112}
  };
  function getPhotoFilter(){
    const amount=Math.max(0,Math.min(100,+state.filterIntensity||0))/100;
    const preset=filterPresets[state.filter]||{},parts=[];
    if(preset.sepia)parts.push(`sepia(${preset.sepia*amount}%)`);
    if(preset.grayscale)parts.push(`grayscale(${preset.grayscale*amount}%)`);
    if(preset.saturate!==undefined)parts.push(`saturate(${100+(preset.saturate-100)*amount}%)`);
    if(preset.hue)parts.push(`hue-rotate(${preset.hue*amount}deg)`);
    if(preset.brightness)parts.push(`brightness(${100+(preset.brightness-100)*amount}%)`);
    if(preset.contrast)parts.push(`contrast(${100+(preset.contrast-100)*amount}%)`);
    if(state.filter==="glitch"&&amount>0){parts.push(`drop-shadow(${3*amount}px 0 rgba(255,45,130,.55))`,`drop-shadow(${-3*amount}px 0 rgba(0,210,255,.5))`);}
    parts.push(`brightness(${$("#brightness").value}%)`,`contrast(${$("#contrast").value}%)`,`saturate(${$("#saturation").value}%)`);
    return parts.join(" ");
  }
  function updatePhotoFilterOverlay(){
    const overlay=$("#photoFilterOverlay");if(!overlay)return;
    const amount=Math.max(0,Math.min(100,+state.filterIntensity||0))/100;
    overlay.className="photo-filter-overlay "+(state.filter==="lightLeak"?"light-leak":state.filter==="glitch"?"glitch-overlay":"");
    overlay.style.setProperty("--filter-strength",amount);
    overlay.hidden=amount===0||!["lightLeak","glitch"].includes(state.filter);
  }
  const themePresets = {
    coquette:{paperColor:"#fff0f6",paperStyle:"hearts",patternColor:"#e7a4c4",patternScale:1,patternSpacing:22,patternOpacity:.22,gradientEnabled:false,gradientColor2:"#f7dce9",gradientDirection:"135deg",surfaceFinish:"pearl",finishStrength:.16,frameStyle:"lace",holo:false,holoStrength:.45},
    kpop:{paperColor:"#e8dcff",paperStyle:"stars",patternColor:"#b7a1e5",patternScale:1.05,patternSpacing:24,patternOpacity:.22,gradientEnabled:true,gradientColor2:"#d9f6f3",gradientDirection:"45deg",surfaceFinish:"pearl",finishStrength:.2,frameStyle:"subtle",holo:true,holoStrength:.3},
    kawaii:{paperColor:"#fff0f7",paperStyle:"polka",patternColor:"#f2a9cf",patternScale:1,patternSpacing:20,patternOpacity:.24,gradientEnabled:true,gradientColor2:"#e6f8f0",gradientDirection:"135deg",surfaceFinish:"none",finishStrength:.15,frameStyle:"subtle",holo:false,holoStrength:.45},
    vintage:{paperColor:"#f3e5cc",paperStyle:"torn",patternColor:"#b89b79",patternScale:1,patternSpacing:22,patternOpacity:.18,gradientEnabled:false,gradientColor2:"#e8d7bd",gradientDirection:"180deg",surfaceFinish:"grain",finishStrength:.28,frameStyle:"torn",holo:false,holoStrength:.45},
    strawberry:{paperColor:"#ffe5ee",paperStyle:"gingham",patternColor:"#e79ab9",patternScale:1,patternSpacing:22,patternOpacity:.18,gradientEnabled:true,gradientColor2:"#fff8f2",gradientDirection:"180deg",surfaceFinish:"pearl",finishStrength:.12,frameStyle:"subtle",holo:false,holoStrength:.45},
    lavender:{paperColor:"#eee7ff",paperStyle:"clouds",patternColor:"#b8a5e6",patternScale:1.1,patternSpacing:28,patternOpacity:.2,gradientEnabled:true,gradientColor2:"#f9e8f7",gradientDirection:"135deg",surfaceFinish:"pearl",finishStrength:.2,frameStyle:"lace",holo:false,holoStrength:.45},
    blue:{paperColor:"#dceeff",paperStyle:"clouds",patternColor:"#94c7e9",patternScale:1.15,patternSpacing:28,patternOpacity:.2,gradientEnabled:true,gradientColor2:"#f8fdff",gradientDirection:"180deg",surfaceFinish:"none",finishStrength:.15,frameStyle:"subtle",holo:false,holoStrength:.45},
    mint:{paperColor:"#e9f7f1",paperStyle:"flowers",patternColor:"#8bc7ae",patternScale:1,patternSpacing:24,patternOpacity:.23,gradientEnabled:false,gradientColor2:"#f8fff9",gradientDirection:"135deg",surfaceFinish:"grain",finishStrength:.12,frameStyle:"lace",holo:false,holoStrength:.45},
    buttercream:{paperColor:"#fff0d5",paperStyle:"gingham",patternColor:"#e5c78d",patternScale:1,patternSpacing:24,patternOpacity:.17,gradientEnabled:true,gradientColor2:"#fffaf0",gradientDirection:"135deg",surfaceFinish:"none",finishStrength:.12,frameStyle:"subtle",holo:false,holoStrength:.45},
    holographic:{paperColor:"#f4e9ff",paperStyle:"speckles",patternColor:"#c4a9e6",patternScale:1.1,patternSpacing:20,patternOpacity:.16,gradientEnabled:true,gradientColor2:"#dff8f5",gradientDirection:"45deg",surfaceFinish:"pearl",finishStrength:.35,frameStyle:"subtle",holo:true,holoStrength:.7},
    starlight:{paperColor:"#e8e6ff",paperStyle:"stars",patternColor:"#a69ad8",patternScale:1,patternSpacing:25,patternOpacity:.24,gradientEnabled:true,gradientColor2:"#f5e4f6",gradientDirection:"135deg",surfaceFinish:"pearl",finishStrength:.2,frameStyle:"subtle",holo:false,holoStrength:.45},
    minimal:{paperColor:"#fffdf8",paperStyle:"none",patternColor:"#e7dce4",patternScale:1,patternSpacing:22,patternOpacity:.1,gradientEnabled:false,gradientColor2:"#f4edf2",gradientDirection:"135deg",surfaceFinish:"grain",finishStrength:.08,frameStyle:"subtle",holo:false,holoStrength:.45}
  };
  const paletteStorageKey="heartframeStudioPalettesV1";
  function syncThemeSelection(){$$(".theme-card").forEach(button=>{const selected=button.dataset.theme===state.themeId;button.classList.toggle("selected",selected);button.setAttribute("aria-pressed",String(selected));});}
  function syncStudioControls(){
    const val=(id,value)=>{const el=$("#"+id);if(el)el.value=value;};const txt=(id,value)=>{const el=$("#"+id);if(el)el.textContent=value;};
    val("paperColorPicker",state.paperColor);val("paperColorHex",state.paperColor.toUpperCase());val("patternColor",state.patternColor);val("patternColorHex",state.patternColor.toUpperCase());
    val("patternScale",Math.round(state.patternScale*100));txt("patternScaleOut",Math.round(state.patternScale*100)+"%");val("patternSpacing",state.patternSpacing);txt("patternSpacingOut",String(state.patternSpacing));
    val("patternOpacity",Math.round(state.patternOpacity*100));txt("patternOpacityOut",Math.round(state.patternOpacity*100)+"%");val("gradientColor2",state.gradientColor2);val("gradientColor2Hex",state.gradientColor2.toUpperCase());
    val("gradientDirection",state.gradientDirection);val("surfaceFinish",state.surfaceFinish);val("finishStrength",Math.round(state.finishStrength*100));txt("finishStrengthOut",Math.round(state.finishStrength*100)+"%");
    val("frameStyle",state.frameStyle);$("#gradientToggle").checked=state.gradientEnabled;syncThemeSelection();
  }
  function applyTheme(themeId){const preset=themePresets[themeId];if(!preset)return;Object.assign(state,clone(preset),{themeId});syncControls();renderCard();saveHistory();}
  function paletteSnapshot(){return {paperColor:state.paperColor,paperStyle:state.paperStyle,patternColor:state.patternColor,patternScale:state.patternScale,patternSpacing:state.patternSpacing,patternOpacity:state.patternOpacity,gradientEnabled:state.gradientEnabled,gradientColor2:state.gradientColor2,gradientDirection:state.gradientDirection,surfaceFinish:state.surfaceFinish,finishStrength:state.finishStrength,frameStyle:state.frameStyle,holo:state.holo,holoStrength:state.holoStrength};}
  function getSavedPalettes(){try{const value=JSON.parse(localStorage.getItem(paletteStorageKey)||"[]");return Array.isArray(value)?value:[];}catch{return [];}}
  function renderSavedPalettes(){
    const container=$("#savedPalettes");if(!container)return;const palettes=getSavedPalettes();container.replaceChildren();
    if(!palettes.length){const empty=document.createElement("p");empty.className="helper";empty.textContent="Your favorite combinations will appear here.";container.appendChild(empty);return;}
    palettes.forEach((palette,index)=>{const row=document.createElement("div");row.className="saved-palette";const apply=document.createElement("button");apply.type="button";apply.className="saved-palette-apply";apply.title="Apply "+palette.name;
      const swatch=document.createElement("span");swatch.className="saved-palette-swatch";swatch.style.background=palette.gradientEnabled?"linear-gradient(135deg,"+palette.paperColor+","+palette.gradientColor2+")":palette.paperColor;
      const name=document.createElement("span");name.textContent=palette.name;apply.append(swatch,name);apply.addEventListener("click",()=>{Object.assign(state,clone(palette.settings),{themeId:"custom"});syncControls();renderCard();saveHistory();});
      const remove=document.createElement("button");remove.type="button";remove.className="saved-palette-remove";remove.textContent="×";remove.setAttribute("aria-label","Remove "+palette.name);
      remove.addEventListener("click",()=>{const next=getSavedPalettes();next.splice(index,1);try{localStorage.setItem(paletteStorageKey,JSON.stringify(next));renderSavedPalettes();}catch{alert("Your browser couldn't update saved palettes.");}});row.append(apply,remove);container.appendChild(row);
    });
  }
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
    $("#paperStyle").value=state.paperStyle; $("#tapeStyle").value=state.tapeStyle||"stripes";
    $("#holoToggle").checked=state.holo; $("#holoStrength").value=Math.round(state.holoStrength*100); $("#holoOut").textContent=`${Math.round(state.holoStrength*100)}%`;
    $("#showProfile").checked=state.profile.show;
    if(!state.textStyles)state.textStyles={title:{font:"Pacifico",size:24,x:50,y:77},note:{font:"Quicksand",size:11,x:50,y:90},profile:{font:"Quicksand",size:8,x:50,y:82},message:{font:"Quicksand",size:8,x:50,y:86}};
    ["title","note","profile","message"].forEach(key=>{const t=state.textStyles[key];["font","size","x","y"].forEach(prop=>{const el=$("#"+key+({font:"Font",size:"Size",x:"X",y:"Y"}[prop]));if(el)el.value=t[prop];});["size","x","y"].forEach(prop=>{const out=$("#"+key+({size:"SizeOut",x:"XOut",y:"YOut"}[prop]));if(out)out.textContent=prop==="size"?t.size+" px":t[prop]+"%";});});
    $(".color-dot").forEach(b=>b.classList.toggle("selected",b.dataset.color===state.paperColor));
    $$(".shape-btn").forEach(b=>b.classList.toggle("selected",b.dataset.shape===state.shape));
    $("#brightnessOut").textContent=`${$("#brightness").value}%`;$("#contrastOut").textContent=`${$("#contrast").value}%`;$("#saturationOut").textContent=`${$("#saturation").value}%`;
    const intensity=$("#filterIntensity");if(intensity){intensity.value=state.filterIntensity;$("#filterIntensityOut").textContent=state.filterIntensity+"%";}updatePhotoFilterOverlay();
    syncStudioControls();
  }
  function applyPhotoStyle() {
    const w=photoWindow.clientWidth||240,h=photoWindow.clientHeight||300;
    if(uploadedImage) {
      const ratio=Math.max(w/uploadedImage.width,h/uploadedImage.height)*state.zoom;
      const dw=uploadedImage.width*ratio,dh=uploadedImage.height*ratio;
      photoPreview.style.width=`${dw}px`;photoPreview.style.height=`${dh}px`;
      photoPreview.style.left=`calc(50% - ${dw/2}px + ${state.photoX}px)`;
      photoPreview.style.top=`calc(50% - ${dh/2}px + ${state.photoY}px)`;
      photoPreview.style.filter=getPhotoFilter();
      photoPreview.style.setProperty("--glitch-strength",Math.max(0,Math.min(100,+state.filterIntensity||0))/100);
    }
    $("#brightnessOut").textContent=`${$("#brightness").value}%`;$("#contrastOut").textContent=`${$("#contrast").value}%`;$("#saturationOut").textContent=`${$("#saturation").value}%`;$("#zoomOut").textContent=`${Math.round(state.zoom*100)}%`;
    updatePhotoFilterOverlay();
  }
  function renderCard() {
    card.style.backgroundColor=state.paperColor;
    card.style.backgroundImage=state.gradientEnabled?(state.gradientDirection==="radial"?"radial-gradient(circle,"+state.paperColor+","+state.gradientColor2+")":"linear-gradient("+state.gradientDirection+","+state.paperColor+","+state.gradientColor2+")"):"none";
    card.className=`card ${state.shape}${state.holo?" holo":""}`;
    if(!state.textStyles)state.textStyles={title:{font:"Pacifico",size:24,x:50,y:77},note:{font:"Quicksand",size:11,x:50,y:90},profile:{font:"Quicksand",size:8,x:50,y:82},message:{font:"Quicksand",size:8,x:50,y:86}};
    const styleText=(id,key,color)=>{const el=$("#"+id),t=state.textStyles[key];el.style.left=t.x+"%";el.style.right="auto";el.style.width="84%";el.style.transform="translateX(-"+t.x+"%)";el.style.top=t.y+"%";el.style.fontFamily="'"+t.font+"', sans-serif";el.style.fontSize=t.size+"px";if(color)el.style.color=color;};
    styleText("cardTitle","title","#a64f89");styleText("cardNotePreview","note","#bb78a0");styleText("profilePreview","profile","#a64f89");styleText("messagePreview","message","#a64f89");
    card.style.setProperty("--holo-strength",state.holoStrength);
    const texture=$("#paperTexture");texture.className=`paper-texture ${state.paperStyle} finish-${state.surfaceFinish}`;
    texture.style.setProperty("--pattern-color",state.patternColor);texture.style.setProperty("--pattern-opacity",state.patternOpacity);texture.style.setProperty("--finish-strength",state.finishStrength);
    const frame=$("#backgroundFrame");frame.className="background-frame "+state.frameStyle;frame.style.setProperty("--frame-color",state.patternColor);
    texture.style.backgroundSize=state.paperStyle==="none"?"auto":(state.patternSpacing*state.patternScale)+"px "+(state.patternSpacing*state.patternScale)+"px";
    texture.style.opacity=String(state.patternOpacity);
    texture.style.backgroundImage=({none:"none",speckles:"radial-gradient(var(--pattern-color) 1px,transparent 1.5px)",torn:"linear-gradient(135deg,transparent 10%,#ffffff55 10% 20%,transparent 20% 40%,#ffffff55 40% 48%,transparent 48%)",graph:"linear-gradient(var(--pattern-color) 1px,transparent 1px),linear-gradient(90deg,var(--pattern-color) 1px,transparent 1px)",lace:"radial-gradient(circle at 50% 50%,transparent 40%,var(--pattern-color) 42%,transparent 46%)",glitter:"radial-gradient(#fff 1px,transparent 1.5px),radial-gradient(var(--pattern-color) 1px,transparent 1.5px)",polka:"radial-gradient(var(--pattern-color) 2px,transparent 2.5px)",gingham:"linear-gradient(90deg,var(--pattern-color) 50%,transparent 50%),linear-gradient(var(--pattern-color) 50%,transparent 50%)",stripes:"repeating-linear-gradient(135deg,var(--pattern-color) 0 5px,transparent 5px 12px)",hearts:"radial-gradient(circle at 50% 30%,var(--pattern-color) 0 3px,transparent 3.5px),radial-gradient(circle at 65% 45%,var(--pattern-color) 0 3px,transparent 3.5px)",stars:"radial-gradient(var(--pattern-color) 1.5px,transparent 2px)",flowers:"radial-gradient(circle,var(--pattern-color) 0 2px,transparent 2.5px)",clouds:"radial-gradient(ellipse at 30% 60%,var(--pattern-color) 0 8px,transparent 9px)"})[state.paperStyle]||"none";
    $("#holoOverlay").style.opacity=state.holo?state.holoStrength:0;
    $("#holoOverlay").style.opacity=state.holo?state.holoStrength:0;
    $("#cardTitle").textContent=cardName.value||"♡";$("#cardNotePreview").textContent=cardNote.value||"";
    const p=state.profile; const details=[p.idol,p.group,p.birthday,p.era].filter(Boolean).join(" · ");
    $("#profilePreview").textContent=details;$("#profilePreview").hidden=!(p.show&&details);
    $("#messagePreview").textContent=$("#fanMessage").value;$("#messagePreview").hidden=!$("#fanMessage").value;
    $$(".extra-sticker").forEach(el=>el.remove());
    state.stickers.forEach(s=>{
      const el=document.createElement("span");el.className="deco extra-sticker"+(s.type==="tape"?" washi-tape tape-"+(s.tapeStyle||"stripes"):"")+(s.id===selectedStickerId?" selected-sticker":"");
      el.dataset.stickerId=s.id;el.textContent=s.type==="tape"?"":s.emoji;el.style.left=`${s.x*100}%`;el.style.top=`${s.y*100}%`;
      el.style.fontSize=`${s.size}px`;el.style.width=s.type==="tape"?`${s.size*2}px`:"";el.style.height=s.type==="tape"?`${s.size*.42}px`:"";el.style.transform=`translate(-50%,-50%) rotate(${s.rotation}deg)`;el.style.zIndex=String(s.layer+5);
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
  $("#filterIntensity").addEventListener("input",e=>{state.filterIntensity=+e.target.value;$("#filterIntensityOut").textContent=state.filterIntensity+"%";applyPhotoStyle();});
  $("#filterIntensity").addEventListener("change",saveHistory);
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
  function customBackgroundChanged(){markCustomTheme();syncControls();renderCard();}
  $$(".studio-tab").forEach(tab=>tab.addEventListener("click",()=>{$$(".studio-tab").forEach(item=>{const active=item===tab;item.classList.toggle("active",active);item.setAttribute("aria-selected",String(active));});$$(".studio-panel").forEach(panel=>panel.hidden=panel.id!==tab.getAttribute("aria-controls"));}));
  $$(".theme-card").forEach(button=>button.addEventListener("click",()=>applyTheme(button.dataset.theme)));
  $("#randomThemeBtn").addEventListener("click",()=>{const ids=Object.keys(themePresets).filter(id=>id!==state.themeId);applyTheme(ids[Math.floor(Math.random()*ids.length)]);});
  $("#paperColors").addEventListener("click",e=>{const b=e.target.closest(".color-dot");if(!b)return;state.paperColor=b.dataset.color;markCustomTheme();syncControls();renderCard();saveHistory();});
  $("#paperColorPicker").addEventListener("input",e=>{state.paperColor=e.target.value;customBackgroundChanged();});$("#paperColorPicker").addEventListener("change",saveHistory);
  function bindHexColor(hexId,stateKey,pickerId){
    const input=$("#"+hexId);
    const apply=()=>{const value=input.value.trim();if(!/^#[0-9a-fA-F]{6}$/.test(value)){input.setAttribute("aria-invalid","true");input.value=state[stateKey].toUpperCase();return;}input.removeAttribute("aria-invalid");state[stateKey]=value.toLowerCase();$("#"+pickerId).value=state[stateKey];customBackgroundChanged();saveHistory();};
    input.addEventListener("change",apply);input.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();apply();input.blur();}});
  }
  bindHexColor("paperColorHex","paperColor","paperColorPicker");
  bindHexColor("patternColorHex","patternColor","patternColor");
  bindHexColor("gradientColor2Hex","gradientColor2","gradientColor2");
  $("#paperStyle").addEventListener("change",e=>{state.paperStyle=e.target.value;customBackgroundChanged();saveHistory();});
  $("#patternColor").addEventListener("input",e=>{state.patternColor=e.target.value;customBackgroundChanged();});$("#patternColor").addEventListener("change",saveHistory);
  $("#patternScale").addEventListener("input",e=>{state.patternScale=+e.target.value/100;customBackgroundChanged();});
  $("#patternSpacing").addEventListener("input",e=>{state.patternSpacing=+e.target.value;customBackgroundChanged();});
  $("#patternOpacity").addEventListener("input",e=>{state.patternOpacity=+e.target.value/100;customBackgroundChanged();});
  ["patternScale","patternSpacing","patternOpacity"].forEach(id=>$("#"+id).addEventListener("change",saveHistory));
  $("#gradientToggle").addEventListener("change",e=>{state.gradientEnabled=e.target.checked;customBackgroundChanged();saveHistory();});
  $("#gradientColor2").addEventListener("input",e=>{state.gradientColor2=e.target.value;customBackgroundChanged();});$("#gradientColor2").addEventListener("change",saveHistory);
  $("#gradientDirection").addEventListener("change",e=>{state.gradientDirection=e.target.value;customBackgroundChanged();saveHistory();});
  $("#surfaceFinish").addEventListener("change",e=>{state.surfaceFinish=e.target.value;customBackgroundChanged();saveHistory();});
  $("#finishStrength").addEventListener("input",e=>{state.finishStrength=+e.target.value/100;customBackgroundChanged();});$("#finishStrength").addEventListener("change",saveHistory);
  $("#frameStyle").addEventListener("change",e=>{state.frameStyle=e.target.value;customBackgroundChanged();saveHistory();});
  $("#savePaletteBtn").addEventListener("click",()=>{const palettes=getSavedPalettes();if(palettes.length>=12){alert("You can save up to 12 palettes. Remove one to save another.");return;}const name=prompt("Name this palette:","My palette");if(name===null)return;const cleanName=name.trim().slice(0,32)||"My palette";try{const settings=paletteSnapshot();palettes.push({name:cleanName,settings,...settings});localStorage.setItem(paletteStorageKey,JSON.stringify(palettes));renderSavedPalettes();}catch{alert("Your browser couldn't save this palette. Check that site storage is enabled.");}});
  renderSavedPalettes();
  $("#holoToggle").addEventListener("change",e=>{state.holo=e.target.checked;markCustomTheme();renderCard();saveHistory();});
  $("#holoStrength").addEventListener("input",e=>{state.holoStrength=+e.target.value/100;card.style.setProperty("--holo-strength",state.holoStrength);$("#holoOut").textContent=e.target.value+"%";markCustomTheme();});$("#holoStrength").addEventListener("change",saveHistory);
  $$(".shape-btn").forEach(b=>b.addEventListener("click",()=>{state.shape=b.dataset.shape;syncControls();renderCard();saveHistory();}));
  function applyStickerPack(){
    const pack = $("#stickerPack").value;
    $$("#stickerGrid .sticker").forEach(button => {
      const shouldShow = pack === "all" || button.dataset.pack === pack;
      button.hidden = !shouldShow;
      button.style.display = shouldShow ? "" : "none";
    });
  }
  $("#stickerPack").addEventListener("input", applyStickerPack);
  $("#stickerPack").addEventListener("change", applyStickerPack);
  applyStickerPack();
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
  $("#tapeStyle").addEventListener("change",e=>{state.tapeStyle=e.target.value;saveHistory();});
  $("#addTapeBtn").addEventListener("click",()=>{const s={id:state.nextStickerId++,type:"tape",tapeStyle:$("#tapeStyle").value||"stripes",emoji:"",x:.5,y:.12,size:55,rotation:Math.round(Math.random()*24-12),layer:state.stickers.length};state.stickers.push(s);selectedStickerId=s.id;renderCard();saveHistory();});
  function roundRect(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
  function getDimensions(){if(state.shape==="square")return [900,900];if(state.shape==="polaroid")return [800,980];if(state.shape==="mini")return [600,900];return [700,1050];}
  function drawPattern(ctx,w,h){
    const pattern=state.paperStyle,spacing=Math.max(8,state.patternSpacing*state.patternScale),color=state.patternColor||"#d7b4d0";if(pattern==="none")return;
    ctx.save();ctx.globalAlpha=state.patternOpacity;ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=Math.max(1,spacing*.035);
    if(pattern==="graph"){for(let x=0;x<w;x+=spacing){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}for(let y=0;y<h;y+=spacing){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}}
    else if(pattern==="gingham"){ctx.globalAlpha=state.patternOpacity*.45;for(let x=0;x<w;x+=spacing)for(let y=0;y<h;y+=spacing)ctx.fillRect(x,y,spacing*.5,spacing*.5);ctx.globalAlpha=state.patternOpacity*.25;for(let x=0;x<w;x+=spacing)ctx.fillRect(x,0,spacing*.22,h);}
    else if(pattern==="torn"){ctx.globalAlpha=state.patternOpacity*.45;ctx.fillStyle="#fff";ctx.fillRect(0,0,w,spacing*1.6);ctx.fillRect(0,h-spacing*1.4,w,spacing*1.4);ctx.strokeStyle=color;ctx.beginPath();ctx.moveTo(0,spacing*1.5);for(let x=0;x<=w;x+=spacing*.5)ctx.lineTo(x,spacing*1.5+Math.sin(x/spacing)*spacing*.12);ctx.stroke();}
    else{for(let y=spacing*.5;y<h;y+=spacing)for(let x=spacing*.5;x<w;x+=spacing){const size=Math.max(1.5,spacing*.1);
      if(pattern==="polka"||pattern==="speckles"||pattern==="glitter"){ctx.beginPath();ctx.arc(x,y,pattern==="polka"?size*1.4:size*.65,0,Math.PI*2);ctx.fill();if(pattern==="glitter"){ctx.globalAlpha=state.patternOpacity*.55;ctx.fillRect(x+size*1.5,y-size*1.5,size*.8,size*.8);ctx.globalAlpha=state.patternOpacity;}}
      else if(pattern==="lace"){ctx.beginPath();ctx.arc(x,y,size*2.2,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(x,y,size*1.1,0,Math.PI*2);ctx.stroke();}
      else if(pattern==="stripes"){ctx.save();ctx.translate(x,y);ctx.rotate(-Math.PI/4);ctx.fillRect(-size*2,-spacing*.42,size*1.5,spacing*.84);ctx.restore();}
      else if(pattern==="hearts")drawEmoji(ctx,"♡",x,y,spacing*.32);else if(pattern==="stars")drawEmoji(ctx,"✦",x,y,spacing*.32);else if(pattern==="flowers")drawEmoji(ctx,"✿",x,y,spacing*.28);
      else if(pattern==="clouds"){ctx.beginPath();ctx.arc(x-size*.6,y,size*.8,Math.PI*.5,Math.PI*1.5);ctx.arc(x,y-size*.3,size,Math.PI,Math.PI*2);ctx.arc(x+size*.7,y,size*.75,Math.PI*1.5,Math.PI*.5);ctx.closePath();ctx.fill();}
    }}ctx.restore();
  }
  function drawSurfaceFinish(ctx,w,h){
    const strength=state.finishStrength||0;if(state.surfaceFinish==="none"||strength<=0)return;ctx.save();ctx.globalAlpha=strength;
    if(state.surfaceFinish==="grain"){ctx.fillStyle="#9a806c";for(let y=4;y<h;y+=11)for(let x=4;x<w;x+=13)if(((x*7+y*11)%5)<2)ctx.fillRect(x,y,1.2,1.2);}
    else if(state.surfaceFinish==="glitter"){for(let y=7;y<h;y+=19)for(let x=7;x<w;x+=19){ctx.fillStyle=(x+y)%3===0?"#fff":"#c5a6d7";ctx.fillRect(x,y,2.2,2.2);}}
    else if(state.surfaceFinish==="pearl"){const g=ctx.createLinearGradient(0,0,w,h);g.addColorStop(0,"#ffffff");g.addColorStop(.35,"#f9d7ec");g.addColorStop(.65,"#d8f7f3");g.addColorStop(1,"#e8d8ff");ctx.fillStyle=g;ctx.fillRect(0,0,w,h);}ctx.restore();
  }
  function drawFrame(ctx,w,h){
    if(state.frameStyle==="none")return;ctx.save();ctx.strokeStyle=state.patternColor;ctx.fillStyle=state.patternColor;ctx.globalAlpha=.45;ctx.lineWidth=Math.max(1,w*.002);
    if(state.frameStyle==="subtle")ctx.strokeRect(w*.025,h*.018,w*.95,h*.964);
    else if(state.frameStyle==="torn"){ctx.strokeRect(w*.035,h*.025,w*.93,h*.95);ctx.globalAlpha=.18;ctx.strokeRect(w*.045,h*.035,w*.91,h*.93);}
    else if(state.frameStyle==="lace"){const r=w*.018;[[w*.055,h*.055],[w*.945,h*.055],[w*.055,h*.945],[w*.945,h*.945]].forEach(([x,y])=>{for(let i=0;i<5;i++){ctx.beginPath();ctx.arc(x,y,r*(i+1)*.38,0,Math.PI*2);ctx.stroke();}});}ctx.restore();
  }
  function drawWashiTape(ctx,s,w,h){
    ctx.save();ctx.translate(s.x*w,s.y*h);ctx.rotate(s.rotation*Math.PI/180);const tw=s.size*2,th=s.size*.42;ctx.globalAlpha=.84;
    if(s.tapeStyle==="dots"){ctx.fillStyle="#ffd3e6";ctx.fillRect(-tw/2,-th/2,tw,th);ctx.fillStyle="#fff8fc";for(let x=-tw/2+5;x<tw/2;x+=10)for(let y=-th/2+4;y<th/2;y+=8){ctx.beginPath();ctx.arc(x,y,1.8,0,Math.PI*2);ctx.fill();}}
    else if(s.tapeStyle==="hearts"){ctx.fillStyle="#f6b6d2";ctx.fillRect(-tw/2,-th/2,tw,th);ctx.fillStyle="#fff7fb";ctx.font="12px sans-serif";ctx.textAlign="center";for(let x=-tw/2+8;x<tw/2;x+=17)ctx.fillText("♡",x,4);}
    else if(s.tapeStyle==="gingham"){ctx.fillStyle="#e6d9ff";ctx.fillRect(-tw/2,-th/2,tw,th);ctx.fillStyle="#fff";for(let x=-tw/2;x<tw/2;x+=12)ctx.fillRect(x,-th/2,5,th);ctx.globalAlpha=.5;for(let y=-th/2;y<th/2;y+=7)ctx.fillRect(-tw/2,y,tw,3);}
    else if(s.tapeStyle==="holo"){const g=ctx.createLinearGradient(-tw/2,0,tw/2,0);g.addColorStop(0,"#ffb7df");g.addColorStop(.25,"#b7f4f1");g.addColorStop(.5,"#fff");g.addColorStop(.75,"#d9c0ff");g.addColorStop(1,"#ffe5a8");ctx.fillStyle=g;ctx.fillRect(-tw/2,-th/2,tw,th);ctx.strokeStyle="#fff";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-tw/2,-th/2);ctx.lineTo(tw/2,th/2);ctx.stroke();}
    else{ctx.fillStyle="#f4b5d2";ctx.fillRect(-tw/2,-th/2,tw,th);ctx.fillStyle="#fff0f7";for(let x=-tw/2;x<tw/2;x+=14)ctx.fillRect(x,-th/2,6,th);}ctx.restore();
  }
  function drawCover(ctx,img,x,y,w,h){
    const ratio=Math.max(w/img.width,h/img.height)*state.zoom,dw=img.width*ratio,dh=img.height*ratio;
    const dx=x+(w-dw)/2+state.photoX*(w/(photoWindow.clientWidth||1)),dy=y+(h-dh)/2+state.photoY*(h/(photoWindow.clientHeight||1));
    ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();ctx.filter=getPhotoFilter();
    const amount=Math.max(0,Math.min(100,+state.filterIntensity||0))/100;
    if(state.filter==="glitch"&&amount>0){ctx.save();ctx.globalCompositeOperation="screen";ctx.globalAlpha=.32*amount;ctx.drawImage(img,dx+3*amount,dy,dw,dh);ctx.drawImage(img,dx-3*amount,dy+1.5*amount,dw,dh);ctx.restore();}
    ctx.drawImage(img,dx,dy,dw,dh);
    if(state.filter==="lightLeak"&&amount>0){ctx.save();ctx.globalCompositeOperation="screen";ctx.globalAlpha=.78*amount;const leak=ctx.createRadialGradient(x+w*.08,y+h*.08,0,x+w*.08,y+h*.08,Math.max(w,h)*.9);leak.addColorStop(0,"#ff8b49");leak.addColorStop(.35,"#ffb36b88");leak.addColorStop(1,"#ff8b4900");ctx.fillStyle=leak;ctx.fillRect(x,y,w,h);ctx.restore();}
    ctx.restore();
  }
  function drawEmoji(ctx,emoji,x,y,size,rotation=0){ctx.save();ctx.translate(x,y);ctx.rotate(rotation*Math.PI/180);ctx.font=`${size}px "Apple Color Emoji","Segoe UI Emoji",sans-serif`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(emoji,0,0);ctx.restore();}
  function drawCard(ctx,w,h){
    if(state.gradientEnabled){const gradient=state.gradientDirection==="radial"?ctx.createRadialGradient(w*.5,h*.45,0,w*.5,h*.45,Math.max(w,h)*.72):ctx.createLinearGradient(...(state.gradientDirection==="90deg"?[0,0,w,0]:state.gradientDirection==="180deg"?[0,0,0,h]:state.gradientDirection==="45deg"?[0,h,w,0]:[0,0,w,h]));gradient.addColorStop(0,state.paperColor);gradient.addColorStop(1,state.gradientColor2);ctx.fillStyle=gradient;}else ctx.fillStyle=state.paperColor;
    roundRect(ctx,0,0,w,h,18);ctx.fill();drawPattern(ctx,w,h);drawSurfaceFinish(ctx,w,h);drawFrame(ctx,w,h);
    // paper frame and tape
    ctx.fillStyle="#fffafc";ctx.fillRect(w*.09,h*.09,w*.82,h*(state.shape==="square"?.58:.67));
    const px=w*.12,py=h*.11,pw=w*.76,ph=h*(state.shape==="square"?.54:.63);
    if(uploadedImage)drawCover(ctx,uploadedImage,px,py,pw,ph);else{ctx.fillStyle="#f7dce9";ctx.fillRect(px,py,pw,ph);drawEmoji(ctx,"♡",w/2,h*.38,70);ctx.fillStyle="#b879a0";ctx.font="22px sans-serif";ctx.textAlign="center";ctx.fillText("Your photo goes here",w/2,h*.45);}
    ctx.save();ctx.translate(w*.18,h*.055);ctx.rotate(-12*Math.PI/180);ctx.fillStyle="#f4b5d2bb";ctx.fillRect(-55,-13,110,26);ctx.restore();
    if(state.shape==="polaroid"){ctx.fillStyle="#fffafc";ctx.fillRect(w*.09,h*.73,w*.82,h*.22);}
    const ts=state.textStyles||{title:{font:"Pacifico",size:24,x:50,y:77},note:{font:"Quicksand",size:11,x:50,y:90},profile:{font:"Quicksand",size:8,x:50,y:82},message:{font:"Quicksand",size:8,x:50,y:86}};
    ctx.textAlign="center";ctx.fillStyle="#a64f89";ctx.font=`${ts.title.size*w/700}px "${ts.title.font}", sans-serif`;ctx.fillText(cardName.value||"♡",w*ts.title.x/100,h*ts.title.y/100,w*.84);
    ctx.fillStyle="#bb78a0";ctx.font=`${ts.note.size*w/700}px "${ts.note.font}", sans-serif`;ctx.fillText(cardNote.value||"",w*ts.note.x/100,h*ts.note.y/100,w*.84);
    if(state.profile.show){const p=state.profile,details=[p.idol,p.group,p.birthday,p.era].filter(Boolean).join(" · ");ctx.fillStyle="#a64f89";ctx.font=`${ts.profile.size*w/700}px "${ts.profile.font}", sans-serif`;ctx.fillText(details,w*ts.profile.x/100,h*ts.profile.y/100,w*.84);}
    if($("#fanMessage").value){ctx.fillStyle="#a64f89";ctx.font=`${ts.message.size*w/700}px "${ts.message.font}", sans-serif`;ctx.fillText($("#fanMessage").value,w*ts.message.x/100,h*ts.message.y/100,w*.84);}
    drawEmoji(ctx,"♡",w*.09,h*.39,w*.065,-15);drawEmoji(ctx,"✦",w*.88,h*.13,w*.06,12);drawEmoji(ctx,"🎀",w*.86,h*.74,w*.065,5);drawEmoji(ctx,"✿",w*.10,h*.78,w*.06,-8);
    ctx.save();ctx.translate(w*.84,h*.10);ctx.rotate(10*Math.PI/180);ctx.strokeStyle="#d98db5";ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,w*.045,0,Math.PI*2);ctx.stroke();ctx.fillStyle="#bd6598";ctx.font=`bold ${w*.014}px sans-serif`;ctx.textAlign="center";ctx.fillText("MADE",0,-3);ctx.fillText("WITH ♡",0,10);ctx.restore();
    // extra stickers in layer order
    [...state.stickers].sort((a,b)=>a.layer-b.layer).forEach(s=>{if(s.type==="tape"||s.emoji==="▰"){drawWashiTape(ctx,s,w,h);}else drawEmoji(ctx,s.emoji,s.x*w,s.y*h,s.size*1.7,s.rotation);});
    if(state.holo){ctx.save();ctx.globalAlpha=state.holoStrength;const g=ctx.createLinearGradient(0,0,w,h);g.addColorStop(0,"#ff8ec7");g.addColorStop(.25,"#fff");g.addColorStop(.5,"#9ff6f2");g.addColorStop(.75,"#d5a7ff");g.addColorStop(1,"#ffdb8b");ctx.fillStyle=g;ctx.fillRect(0,0,w,h);ctx.globalCompositeOperation="destination-out";ctx.clearRect(w*.12,h*.11,w*.76,h*(state.shape==="square"?.54:.63));ctx.restore();}
  }
  function renderCanvas(){const [w,h]=getDimensions(),scale=3,canvas=document.createElement("canvas");canvas.width=w*scale;canvas.height=h*scale;const ctx=canvas.getContext("2d");ctx.scale(scale,scale);drawCard(ctx,w,h);return canvas;}
  function downloadCard(){const canvas=renderCanvas();canvas.toBlob(blob=>{if(!blob){alert("Sorry, the card couldn't be exported. Please try again.");return;}const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="heartframe-photocard.png";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);},"image/png");}
  ["title","note","profile","message"].forEach(key=>["font","size","x","y"].forEach(prop=>{const id=key+({font:"Font",size:"Size",x:"X",y:"Y"}[prop]);const el=$("#"+id);if(!el)return;el.addEventListener("input",()=>{const value=prop==="font"?el.value:+el.value;state.textStyles[key][prop]=value;const out=$("#"+key+({size:"SizeOut",x:"XOut",y:"YOut"}[prop]||""));if(out)out.textContent=prop==="size"?value+" px":value+"%";renderCard();});el.addEventListener("change",saveHistory);}));
  $("#downloadBtn").addEventListener("click",downloadCard);$("#downloadBtnSide").addEventListener("click",downloadCard);
  function projectData(){return {format:"heartframe-project-v2",state,cardName:cardName.value,cardNote:cardNote.value,fanMessage:$("#fanMessage").value,brightness:$("#brightness").value,contrast:$("#contrast").value,saturation:$("#saturation").value,photo:uploadedImage?photoPreview.src:null};}
  $("#saveProjectBtn").addEventListener("click",()=>{const blob=new Blob([JSON.stringify(projectData())],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="heartframe-project.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
  $("#loadProjectBtn").addEventListener("click",()=>$("#projectInput").click());
  $("#projectInput").addEventListener("change",e=>{const file=e.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{try{const p=JSON.parse(reader.result);if(!p.state||!p.format?.startsWith("heartframe-project"))throw new Error();Object.assign(state,p.state);if(!Number.isFinite(+p.state.filterIntensity))state.filterIntensity=100;cardName.value=p.cardName||"";cardNote.value=p.cardNote||"";$("#fanMessage").value=p.fanMessage||"";$("#brightness").value=p.brightness||100;$("#contrast").value=p.contrast||100;$("#saturation").value=p.saturation||100;$("#idolName").value=state.profile.idol||"";$("#groupName").value=state.profile.group||"";$("#birthday").value=state.profile.birthday||"";$("#eraName").value=state.profile.era||"";if(p.photo){const im=new Image();im.onload=()=>{uploadedImage=im;photoPreview.src=p.photo;photoPreview.hidden=false;$("#emptyPhoto").hidden=true;renderCard();saveHistory();};im.src=p.photo;}else{uploadedImage=null;renderCard();saveHistory();}selectedStickerId=null;syncControls();renderCard();saveHistory();uploadStatus.textContent="Project loaded!";}catch(err){alert("That file doesn't look like a HeartFrame project.");}};reader.readAsText(file);e.target.value="";});
  $("#undoBtn").addEventListener("click",()=>{if(historyIndex>0){historyIndex--;restoreSnapshot(history[historyIndex]);}});
  $("#redoBtn").addEventListener("click",()=>{if(historyIndex<history.length-1){historyIndex++;restoreSnapshot(history[historyIndex]);}});
  function printSheet(){const canvas=renderCanvas(),img=canvas.toDataURL("image/png"),count=+$("#printCount").value,size=$("#paperSize").value;const dims=size==="a4"?"210mm 297mm":"8.5in 11in";const columns=count<=2?1:2;const doc=`<!doctype html><html><head><title>HeartFrame print sheet</title><style>@page{size:${dims};margin:12mm}*{box-sizing:border-box}body{margin:0;font-family:sans-serif}.sheet{display:grid;grid-template-columns:repeat(${columns},1fr);gap:8mm;align-content:start}.item{position:relative;padding:3mm;border:1px dashed #777;break-inside:avoid}.item img{display:block;width:100%;height:auto;max-height:115mm;object-fit:contain}.hint{font-size:9pt;text-align:center;color:#777;margin:0 0 8mm}@media print{.hint{display:none}}</style></head><body><p class="hint">HeartFrame Studio · Print at 100% / Actual size for best results. Use your printer's paper settings.</p><div class="sheet">${Array.from({length:count},()=>`<div class="item"><img src="${img}" alt="Photocard with cut guide"></div>`).join("")}</div><script>window.onload=()=>setTimeout(()=>window.print(),300)<\/script></body></html>`;const win=window.open("","_blank");if(!win){alert("Please allow pop-ups to open the print sheet.");return;}win.document.write(doc);win.document.close();}
  if($("#printBtn")) $("#printBtn").addEventListener("click",printSheet);
  $("#resetBtn").addEventListener("click",()=>{if(!confirm("Reset your card and remove its current photo and decorations?"))return;photoInput.value="";uploadedImage=null;photoPreview.removeAttribute("src");photoPreview.hidden=true;$("#emptyPhoto").hidden=false;uploadStatus.textContent="Your photo will appear in the frame.";Object.assign(state,{filter:"none",filterIntensity:100,brightness:100,contrast:100,saturation:100,zoom:1,photoX:0,photoY:0,paperColor:"#fff0f6",paperStyle:"speckles",patternColor:"#d7b4d0",patternScale:1,patternSpacing:20,patternOpacity:.28,gradientEnabled:false,gradientColor2:"#f0edff",gradientDirection:"135deg",surfaceFinish:"none",finishStrength:.25,frameStyle:"subtle",themeId:"custom",shape:"portrait",stickers:[],nextStickerId:1,tapeStyle:"stripes",holo:false,holoStrength:.45,profile:{idol:"",group:"",birthday:"",era:"",show:false},message:""});cardName.value="my favorite ♡";cardNote.value="made with love";$("#fanMessage").value="";["brightness","contrast","saturation"].forEach(id=>$("#"+id).value=100);["idolName","groupName","birthday","eraName"].forEach(id=>$("#"+id).value="");selectedStickerId=null;syncControls();renderCard();saveHistory();});
  window.addEventListener("resize",applyPhotoStyle);
  syncControls();renderCard();saveHistory();
})();
