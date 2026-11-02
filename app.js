(function () {
  const VS = window.VERSIONS || {}, C = window.CURATED;
  let ver = null;
  try { ver = localStorage.getItem("ver"); } catch (e) {}
  if (!VS[ver]) ver = VS.nkjv ? "nkjv" : Object.keys(VS)[0];
  const V = VS[ver].chapters, LABEL = VS[ver].label;
  const NOTICES = {
    nkjv: "Scripture text: New King James Version®, copyright © 1982 by Thomas Nelson. For personal study only; do not publish this site with this text.",
    kjv: "Scripture text: King James Version (Authorized Version), public domain outside the United Kingdom."
  };
  // Without source headings, use the curated incidents as scene titles
  V.forEach(c => {
    if (!c.sections.length) c.derived = true, c.sections = C.incidents.filter(i => i.ch === c.n).sort((a, b) => a.v1 - b.v1).map(i => ({ title: i.title, start: i.v1 }));
  });
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const rx = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const clip = (s, n) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
  const refStr = (ch, v1, v2) => `Judges ${ch}:${v1}` + (v2 && v2 > v1 ? `–${v2}` : "");
  const verseText = (ch, v) => (V[ch - 1].verses.find(x => x.v === v) || {}).t || "";
  const ALL = V.flatMap(c => c.verses.map(x => ({ ch: c.n, v: x.v, t: x.t })));

  const CH = {}, INC = {};
  C.characters.forEach(c => { CH[c.id] = c; c.mentions = {}; c.incidents = []; });
  C.incidents.forEach(i => { INC[i.id] = i; i.chars.forEach(id => CH[id].incidents.push(i)); });
  C.characters.forEach(c => {
    if (c.aliases.length) {
      const re = new RegExp("\\b(" + c.aliases.map(rx).join("|") + ")\\b", "gi");
      ALL.forEach(x => { const m = x.t.match(re); if (m) c.mentions[x.ch] = (c.mentions[x.ch] || 0) + m.length; });
    }
    c.incidents.forEach(i => { if (!c.aliases.length) c.mentions[i.ch] = (c.mentions[i.ch] || 0) + 1; });
    c.chapters = Object.keys(c.mentions).map(Number).sort((a, b) => a - b);
    const first = c.incidents[0];
    c.order = first ? first.ch * 1000 + first.v1 : c.chapters.length ? c.chapters[0] * 1000 : 99999;
  });
  const PLACES = C.places.map(p => {
    if (typeof p === "string") p = { name: p };
    const name = p.name, forms = [name].concat(p.alts || []);
    const re = new RegExp(p.re || "\\b(?:" + forms.map(rx).join("|") + ")\\b", "gi"), byCh = {};
    ALL.forEach(x => { const m = x.t.match(re); if (m) byCh[x.ch] = (byCh[x.ch] || 0) + m.length; });
    return { name, byCh, total: Object.values(byCh).reduce((a, b) => a + b, 0) };
  }).filter(p => p.total);

  function charsInChapter(n) {
    return C.characters.filter(c => c.mentions[n]).sort((a, b) => (b.mentions[n] || 0) - (a.mentions[n] || 0));
  }
  function charRefs(c) {
    if (!c.chapters.length) return "";
    const a = c.chapters[0], b = c.chapters[c.chapters.length - 1];
    return a === b ? `Judges ${a}` : `Judges ${a}–${b}`;
  }

  // ---------- tree (mindmap) ----------
  function tree(centerTitle, centerSub, branches) {
    branches = branches.filter(b => b.leaves.length);
    const LH = 46, GAP = 8, LW = 290, BW = 176, CW = 150, X1 = 10, X2 = 215, X3 = 450, W = X3 + LW + 10;
    let y = 14;
    branches.forEach(b => {
      const y0 = y;
      b.leaves.forEach(l => { l.y = y; y += LH + GAP; });
      b.cy = (y0 + y - GAP) / 2;
      y += 10;
    });
    const H = Math.max(y, 80), cy = H / 2;
    let s = `<svg viewBox="0 0 ${W} ${H}" style="min-width:620px;width:100%;max-width:780px;display:block" role="img" aria-label="Mind map: ${esc(centerTitle)}">`;
    branches.forEach(b => {
      const mx = (X1 + CW + X2) / 2;
      s += `<path d="M${X1 + CW},${cy} C${mx},${cy} ${mx},${b.cy} ${X2},${b.cy}" fill="none" stroke="${b.color}" stroke-width="1.5" opacity=".5"/>`;
      b.leaves.forEach(l => {
        const lx = (X2 + BW + X3) / 2;
        s += `<path d="M${X2 + BW},${b.cy} C${lx},${b.cy} ${lx},${l.y + LH / 2} ${X3},${l.y + LH / 2}" fill="none" stroke="${l.color || b.color}" stroke-width="1" opacity=".45"/>`;
      });
    });
    s += `<rect x="${X1}" y="${cy - 26}" width="${CW}" height="52" rx="12" fill="#5b4bb7"/>
      <text x="${X1 + CW / 2}" y="${cy - 3}" text-anchor="middle" fill="#fff" font-size="14" font-weight="600">${esc(clip(centerTitle, 20))}</text>
      <text x="${X1 + CW / 2}" y="${cy + 14}" text-anchor="middle" fill="#e5e2fb" font-size="11.5">${esc(clip(centerSub || "", 24))}</text>`;
    branches.forEach(b => {
      s += `<rect x="${X2}" y="${b.cy - 17}" width="${BW}" height="34" rx="17" fill="${b.color}1a" stroke="${b.color}" stroke-width="1"/>
        <text x="${X2 + BW / 2}" y="${b.cy + 4.5}" text-anchor="middle" font-size="12.5" font-weight="600" fill="${b.color}">${esc(clip(b.label, 24))} (${b.leaves.length})</text>`;
      b.leaves.forEach(l => {
        const col = l.color || b.color;
        s += `<g class="leaf" tabindex="0" role="button" data-act="${l.act}" data-arg="${esc(l.arg)}">
          <rect x="${X3}" y="${l.y}" width="${LW}" height="${LH}" rx="8" fill="#fff" stroke="${col}" stroke-width="1"/>
          <text x="${X3 + 12}" y="${l.y + 19}" font-size="13" font-weight="600" fill="#2b2a27">${esc(clip(l.title, 38))}</text>
          <text x="${X3 + 12}" y="${l.y + 36}" font-size="11.5" fill="#6b6860">${esc(clip(l.sub || "", 48))}</text></g>`;
      });
    });
    // Phones get the same map as an indented outline instead of a wide drawing
    const outline = `<div class="outline phone-only"><div class="o-root">${esc(centerTitle)}<small>${esc(centerSub || "")}</small></div>` +
      branches.map(b => `<div class="o-branch" style="--c:${b.color}"><div class="o-label">${esc(b.label)} (${b.leaves.length})</div><div class="o-leaves">` +
        b.leaves.map(l => `<button class="o-leaf" style="--c:${l.color || b.color}" data-act="${l.act}" data-arg="${esc(l.arg)}">${esc(l.title)}<small>${esc(l.sub || "")}</small></button>`).join("") +
        "</div></div>").join("") + "</div>";
    return `<div class="scroll-x desk-only">${s}</svg></div>${outline}`;
  }

  // Verse references such as 3:10 or 13:3–5 become links to the chapter view
  function refLinks(text) {
    return esc(text).replace(/\b(\d{1,2}):(\d{1,3})(?:–(\d{1,3}))?/g, (m, ch, a, b) =>
      +ch >= 1 && +ch <= 21 ? `<a href="#/chapters/${ch}?v=${a}-${b || a}">${m}</a>` : m);
  }

  function incidentPanel(id) {
    const i = INC[id];
    let vs = "", n = 0;
    for (let v = i.v1; v <= i.v2 && n < 12; v++, n++) vs += `<sup>${v}</sup>${esc(verseText(i.ch, v))} `;
    const more = i.v2 - i.v1 + 1 > 12 ? ` <a href="#/chapters/${i.ch}?v=${i.v1}-${i.v2}">Read on in chapter view</a>` : "";
    return `<div class="card" id="incident">
      <h3 style="margin:0">${esc(i.title)}</h3>
      <p class="muted"><a href="#/chapters/${i.ch}?v=${i.v1}-${i.v2}">${refStr(i.ch, i.v1, i.v2)}</a></p>
      <p>${esc(i.summary)}</p>
      ${i.chars.length ? `<div class="chips">${i.chars.map(c => `<a class="chip" href="#/characters/${c}">${esc(CH[c].name)}</a>`).join("")}</div>` : ""}
      <div class="verses">${vs}${more}</div></div>`;
  }

  // ---------- views ----------
  function viewTimeline() {
    // Stated lengths laid end to end in book order; a period with no stated length takes no space
    let x = 0;
    const lanes = C.timeline.map(j => ({ ...j, segs: j.segs.map(s => { const o = { ...s, start: x }; x += s.years || 0; return o; }) }));
    const maxT = x, W = 980, L = 190, R = 24, TOP = 36, LH = 38;
    const sc = (W - L - R) / maxT, H = TOP + lanes.length * LH + 16;
    const col = { foreign: "#c2410c", rest: "#0f766e", judged: "#185fa5", reign: "#8a877e" };
    let s = `<svg viewBox="0 0 ${W} ${H}" style="min-width:720px;width:100%;display:block" role="img" aria-label="Timeline of stated years">`;
    for (let t = 0; t <= maxT; t += 50) {
      const px = L + t * sc;
      s += `<line x1="${px}" y1="${TOP - 8}" x2="${px}" y2="${H - 10}" stroke="#e4e1d8"/><text x="${px}" y="${TOP - 14}" text-anchor="middle" font-size="11" fill="#6b6860">${t}</text>`;
    }
    lanes.forEach((j, i) => {
      const y = TOP + i * LH;
      s += `<a href="#/characters/${j.id}"><text x="${L - 12}" y="${y + 17}" text-anchor="end" font-size="13" font-weight="600" fill="#2b2a27">${esc(j.name)}</text>
        <text x="${L - 12}" y="${y + 31}" text-anchor="end" font-size="11" fill="#6b6860">Judges ${j.segs[0].ref}</text></a>`;
      j.segs.forEach((g, k) => {
        const bx = L + g.start * sc, bw = (g.years || 0) * sc;
        s += `<g class="tl-bar" tabindex="0" data-i="${i}" data-k="${k}" data-go="${j.id}">` + (g.years
          ? `<rect x="${bx}" y="${y + 6}" width="${bw}" height="24" rx="4" fill="${col[g.type]}"/>
            ${bw > 30 ? `<text x="${bx + bw / 2}" y="${y + 22}" text-anchor="middle" font-size="11.5" fill="#fff">${g.years}y</text>` : ""}`
          : `<line x1="${bx}" y1="${y + 4}" x2="${bx}" y2="${y + 32}" stroke="#8a877e" stroke-width="2"/><text x="${bx + 6}" y="${y + 22}" font-size="12" fill="#6b6860">No length stated (${g.ref})</text>`) + "</g>";
      });
    });
    s += "</svg>";
    $("#view").innerHTML = `<h1>Timeline of the judges</h1>
      <p class="muted">Every period whose length the text states, in book order. Hover or tap a bar for the wording and verse; select a name to open the character.</p>
      <div class="card"><div class="scroll-x desk-only">${s}</div>
      <div class="phone-only">${lanes.map((j, i) => `<div class="tl-row"><a href="#/characters/${j.id}">${esc(j.name)}</a> <span class="muted">Judges ${j.segs[0].ref}</span>
        <div class="tl-track"><span style="width:${(100 * j.segs[0].start / maxT).toFixed(1)}%;flex:none"></span>${j.segs.map((g, k) => g.years
          ? `<button class="tl-seg tl-bar" data-i="${i}" data-k="${k}" style="width:${(100 * g.years / maxT).toFixed(1)}%;background:${col[g.type]}" aria-label="${esc(g.label)}, ${g.years} years">${g.years >= 20 ? g.years + "y" : ""}</button>`
          : `<button class="tl-seg tl-bar tl-none" data-i="${i}" data-k="${k}" aria-label="${esc(g.label)}"></button>`).join("")}</div></div>`).join("")}</div>
      <div class="legend"><span><i style="background:#c2410c"></i>Israel under another nation</span><span><i style="background:#0f766e"></i>The land has rest or is quiet</span><span><i style="background:#185fa5"></i>Judged Israel</span><span><i style="background:#8a877e"></i>Reigned over Israel</span></div>
      <div class="tl-info" id="tlinfo"><span class="muted">Hover or tap a bar for details.</span></div></div>
      <p class="muted">The stated lengths are placed one after another in book order, so the scale counts stated years, not dates. Shamgar takes no space because the text gives no length.</p>`;
    const info = $("#tlinfo");
    const show = el => {
      const j = lanes[+el.dataset.i], g = j.segs[+el.dataset.k];
      info.innerHTML = `<b>${esc(j.name)}</b>: ${esc(g.label)}<br><span class="muted">${g.years ? `${g.years} years · stated years ${g.start}–${g.start + g.years} on this scale` : "No length stated"} · <a href="#/chapters/${g.ref.split(":")[0]}?v=${g.ref.split(":")[1]}">Judges ${g.ref}</a></span>`;
    };
    $("#view").querySelectorAll(".tl-bar").forEach(el => {
      el.addEventListener("mouseenter", () => show(el));
      el.addEventListener("focus", () => show(el));
      // On phones a tap shows the details; the name link opens the character
      el.addEventListener("click", () => { if (el.classList.contains("tl-seg")) show(el); else location.hash = "#/characters/" + el.dataset.go; });
      el.addEventListener("keydown", e => { if (e.key === "Enter") location.hash = "#/characters/" + el.dataset.go; });
    });
  }

  function viewCharacters(id) {
    if (!id || !CH[id]) {
      const list = C.characters.slice().sort((a, b) => a.order - b.order);
      $("#view").innerHTML = `<h1>Characters</h1><p class="muted">${list.length} people. Pick one to see their story, verse references, and a mind map of connected incidents.</p>
        <div class="row"><input class="field" id="cf" placeholder="Filter characters" style="width:260px"></div>
        <div class="grid" id="cgrid"></div>`;
      const draw = f => {
        $("#cgrid").innerHTML = list.filter(c => !f || (c.name + " " + c.role).toLowerCase().includes(f))
          .map(c => `<a class="tile" href="#/characters/${c.id}"><b>${esc(c.name)}</b><span>${esc(c.role)} · ${charRefs(c)}</span></a>`).join("");
      };
      draw("");
      $("#cf").addEventListener("input", e => draw(e.target.value.trim().toLowerCase()));
      return;
    }
    const c = CH[id];
    const max = Math.max(1, ...Object.values(c.mentions));
    let spark = "", sl = "";
    for (let n = 1; n <= 21; n++) {
      const val = c.mentions[n] || 0;
      spark += `<a href="#/chapters/${n}" class="${val ? "" : "zero"}" style="height:${val ? Math.max(6, 54 * val / max) : 3}px" title="Judges ${n}: ${val}"></a>`;
      sl += `<span>${n}</span>`;
    }
    const byCh = {};
    c.incidents.slice().sort((a, b) => a.ch * 1000 + a.v1 - b.ch * 1000 - b.v1).forEach(i => (byCh[i.ch] = byCh[i.ch] || []).push(i));
    const branches = Object.keys(byCh).map(Number).sort((a, b) => a - b).map(n => ({
      label: `Judges ${n}`, color: "#5b4bb7",
      leaves: byCh[n].map(i => ({ title: i.title, sub: refStr(i.ch, i.v1, i.v2), act: "inc", arg: i.id }))
    }));
    const shared = {};
    c.incidents.forEach(i => i.chars.forEach(o => { if (o !== id) shared[o] = (shared[o] || 0) + 1; }));
    branches.push({
      label: "In the same passages", color: "#0f766e",
      leaves: Object.keys(shared).sort((a, b) => shared[b] - shared[a]).map(o => ({
        title: CH[o].name, sub: `${shared[o]} shared passage${shared[o] > 1 ? "s" : ""}`, act: "char", arg: o
      }))
    });
    $("#view").innerHTML = `<p class="muted"><a href="#/characters">All characters</a></p>
      <h1>${esc(c.name)}</h1><p class="muted">${refLinks(c.role)} · ${charRefs(c)}</p>
      <div class="card"><p>${refLinks(c.summary)}</p>
        <div class="stats"><div class="stat"><b>${c.incidents.length}</b><span>incidents</span></div>
        <div class="stat"><b>${c.chapters.length}</b><span>chapters</span></div>
        ${c.aliases.length ? `<div class="stat"><b>${Object.values(c.mentions).reduce((a, b) => a + b, 0)}</b><span>name mentions</span></div>` : ""}</div>
        <h3>Where ${esc(c.name)} appears</h3><div class="spark">${spark}</div><div class="spark-lbl">${sl}</div>
        <h3>References</h3><div class="chips">${c.incidents.map(i => `<a class="chip" href="#/chapters/${i.ch}?v=${i.v1}-${i.v2}">${refStr(i.ch, i.v1, i.v2)}</a>`).join("") || '<span class="muted">No curated incidents</span>'}</div></div>
      <h2>Incident mind map</h2><p class="muted">Passages where ${esc(c.name)} appears, by chapter. Click one to read it.</p>
      <div class="card">${tree(c.name, c.role, branches)}</div><div id="panel"></div>`;
  }

  // word frequency
  const STOP = new Set(("a about after again all also am an and any are as at be because been before being both but by came can could did do does down for from had has have he her here him his how i if in into is it its me more my no nor not now of off on one only or other our out over said she shall so some such than that the their them then there these they this those through to too under unto up upon us was we were what when where which who whom why will with would you your yet thus went come came go thee thou thy thine ye hath hast shalt wilt art doth didst saith").split(/\s+/));
  const wcCache = {};
  function wordCounts(chs, stop, merge) {
    const key = chs.join(",") + (stop ? "s" : "a") + (merge ? "m" : "");
    if (wcCache[key]) return wcCache[key];
    const m = {}; let total = 0;
    chs.forEach(n => V[n - 1].verses.forEach(x => {
      x.t.toLowerCase().replace(/['’]s\b/g, "").replace(/[^a-z'\- ]+/g, " ").split(/\s+/).forEach(w => {
        w = w.replace(/^['\-]+|['\-]+$/g, "");
        if (w.length < 2) return;
        total++;
        if (stop && STOP.has(w)) return;
        m[w] = (m[w] || 0) + 1;
      });
    }));
    if (merge) Object.keys(m).forEach(w => {
      if (w.length < 4 || !w.endsWith("s")) return;
      const base = [w.endsWith("ies") && w.slice(0, -3) + "y", w.endsWith("es") && w.slice(0, -2), w.slice(0, -1)].find(b => b && m[b] !== undefined);
      if (base) { m[base] += m[w]; delete m[w]; }
    });
    const list = Object.entries(m).map(([text, count]) => ({ text, count })).sort((a, b) => b.count - a.count || a.text.localeCompare(b.text));
    return (wcCache[key] = { list, total });
  }
  function cloudSVG(words, W, H) {
    const ctx = document.createElement("canvas").getContext("2d");
    const wt = w => w.weight ?? w.count, max = wt(words[0]), boxes = [], colors = ["#5b4bb7", "#0f766e", "#c2410c", "#b45309", "#185fa5", "#993556"];
    let out = "";
    words.forEach((w, idx) => {
      const size = Math.round(12 + 40 * Math.sqrt(wt(w) / max));
      ctx.font = `600 ${size}px system-ui, sans-serif`;
      const tw = ctx.measureText(w.text).width + 6, th = size * 1.1;
      for (let i = 0; i < 4000; i++) {
        const t = i * 0.12, r = 1.3 * t;
        const cx = W / 2 + r * Math.cos(t) * 1.9, cy = H / 2 + r * Math.sin(t);
        const b = { x0: cx - tw / 2, x1: cx + tw / 2, y0: cy - th / 2, y1: cy + th / 2 };
        if (b.x0 < 2 || b.x1 > W - 2 || b.y0 < 2 || b.y1 > H - 2) continue;
        if (boxes.some(o => b.x0 < o.x1 && b.x1 > o.x0 && b.y0 < o.y1 && b.y1 > o.y0)) continue;
        boxes.push(b);
        out += `<text x="${cx}" y="${cy + size * 0.33}" text-anchor="middle" font-size="${size}" font-weight="600" fill="${colors[idx % colors.length]}" data-act="word" data-arg="${esc(w.text)}"><title>${esc(w.text)}: ${w.count}</title>${esc(w.text)}</text>`;
        break;
      }
    });
    return `<svg class="cloud" viewBox="0 0 ${W} ${H}" role="img" aria-label="Word cloud">${out}</svg>`;
  }
  function viewWords(chap, params) {
    const n = chap && +chap >= 1 && +chap <= 21 ? +chap : 0;
    const stop = params.get("all") !== "1", merge = params.get("merge") === "1", key = !!n && params.get("mode") === "key";
    const url = (ch, o = {}) => {
      const s = { all: !stop, merge, key, ...o }, p = new URLSearchParams();
      if (s.all) p.set("all", "1");
      if (s.merge) p.set("merge", "1");
      if (s.key && ch) p.set("mode", "key");
      return `#/words${ch ? "/" + ch : ""}${p.toString() ? "?" + p : ""}`;
    };
    const chs = n ? [n] : V.map(c => c.n);
    const { list, total } = wordCounts(chs, stop, merge);
    let ranked = list;
    if (key) {
      // Log-likelihood keyness of this chapter against the rest of the book
      const book = wordCounts(V.map(c => c.n), stop, merge).list, bm = {};
      book.forEach(w => { bm[w.text] = w.count; });
      const N1 = list.reduce((a, w) => a + w.count, 0), NB = book.reduce((a, w) => a + w.count, 0), N2 = NB - N1;
      ranked = list.filter(w => w.count >= 2).map(w => {
        const c = w.count, r = (bm[w.text] || c) - c, E1 = N1 * (c + r) / NB, E2 = N2 * (c + r) / NB;
        const g = 2 * (c * Math.log(c / E1) + (r ? r * Math.log(r / E2) : 0));
        return { ...w, weight: g, ratio: (c / N1) / (Math.max(r, 0.5) / N2), over: c / N1 > r / N2 };
      }).filter(w => w.over).sort((a, b) => b.weight - a.weight);
    }
    const top = ranked.slice(0, 70), bars = ranked.slice(0, 25), wt = w => w.weight ?? w.count, max = wt(bars[0]);
    const chips = [`<a class="chip ${n ? "" : "on"}" href="${url(0)}">Whole book</a>`]
      .concat(V.map(c => `<a class="chip ${n === c.n ? "on" : ""}" href="${url(c.n)}">${c.n}</a>`)).join("");
    const modes = n
      ? `<a class="chip ${key ? "" : "on"}" href="${url(n, { key: false })}">Most frequent</a><a class="chip ${key ? "on" : ""}" href="${url(n, { key: true })}">Distinctive to chapter</a>`
      : `<span class="muted">Pick a chapter to see its distinctive words.</span>`;
    $("#view").innerHTML = `<h1>Word frequency: ${n ? "Judges " + n : "whole book"}</h1>
      <p class="muted">Click a word to see its verses.${n ? ` <a href="#/chapters/${n}">Open the chapter map</a>.` : ""}${key ? " Distinctive words appear far more often here than in the rest of the book." : ""}</p>
      <div class="chips picker">${chips}</div>
      <div class="row">${modes}</div>
      <div class="row"><a class="chip ${stop ? "on" : ""}" href="${url(n, { all: false })}">Hide common words</a><a class="chip ${stop ? "" : "on"}" href="${url(n, { all: true })}">Show all words</a><a class="chip ${merge ? "on" : ""}" href="${url(n, { merge: !merge })}">Merge plurals</a></div>
      <div class="stats"><div class="stat"><b>${total.toLocaleString()}</b><span>words</span></div><div class="stat"><b>${list.length.toLocaleString()}</b><span>distinct${stop ? " (without common)" : ""}</span></div><div class="stat"><b>${esc(ranked[0].text)}</b><span>${key ? `most distinctive (${ranked[0].count})` : `most frequent (${ranked[0].count})`}</span></div></div>
      <div class="card">${matchMedia("(max-width: 600px)").matches ? cloudSVG(top.slice(0, 45), 360, 460) : cloudSVG(top, 900, 420)}</div>
      <h2>Top 25${key ? " distinctive" : ""}</h2><div class="card"><div class="bars">${bars.map(w => `<span class="lbl" data-act="word" data-arg="${esc(w.text)}">${esc(w.text)}</span><div><div class="bar" style="width:${(100 * wt(w) / max).toFixed(1)}%"></div></div><span>${w.count}${key ? ` · ${w.ratio >= 99 ? "only here" : "×" + w.ratio.toFixed(1)}` : ""}</span>`).join("")}</div></div>
      <div id="hits"></div>`;
    $("#view").dataset.scope = chs.join(",");
    $("#view").dataset.merge = merge ? "1" : "";
  }
  function wordPattern(w) {
    const forms = [rx(w)];
    if ($("#view").dataset.merge) {
      forms[0] += "(?:s|es)?";
      if (w.endsWith("y")) forms.push(rx(w.slice(0, -1)) + "ies");
    }
    return "\\b(?:" + forms.join("|") + ")(?:['’]s)?\\b";
  }
  function showWord(w) {
    const chs = ($("#view").dataset.scope || "").split(",").map(Number).filter(Boolean);
    const pat = wordPattern(w), re = new RegExp(pat, "i");
    const hits = ALL.filter(x => chs.includes(x.ch) && re.test(x.t));
    $("#hits").innerHTML = `<h2>“${esc(w)}” in ${hits.length} verse${hits.length === 1 ? "" : "s"}</h2><div class="card">` +
      hits.slice(0, 60).map(x => `<div class="hit"><b><a href="#/chapters/${x.ch}?v=${x.v}-${x.v}">${x.ch}:${x.v}</a></b>${esc(x.t).replace(new RegExp("(" + pat + ")", "gi"), "<mark>$1</mark>")}</div>`).join("") +
      (hits.length > 60 ? `<p class="muted">Showing 60 of ${hits.length}.</p>` : "") + "</div>";
    $("#hits").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function viewChapter(chap, params) {
    const n = +chap >= 1 && +chap <= 21 ? +chap : 1, ch = V[n - 1];
    const secs = ch.sections.length ? ch.sections : [{ title: "Whole chapter", start: 1 }];
    const last = ch.verses[ch.verses.length - 1].v;
    const scenes = secs.map((s, i) => {
      const end = i + 1 < secs.length ? secs[i + 1].start - 1 : last;
      return { title: s.title, sub: end > s.start ? `Verses ${s.start}–${end}` : `Verse ${s.start}`, act: "scene", arg: `${s.start}-${end}` };
    });
    const incs = C.incidents.filter(i => i.ch === n);
    const people = charsInChapter(n).map(c => ({ title: c.name, sub: `${c.role} · ${c.mentions[n]} ${c.aliases.length ? "mention" : "incident"}${c.mentions[n] > 1 ? "s" : ""}`, act: "char", arg: c.id }));
    const places = PLACES.filter(p => p.byCh[n]).sort((a, b) => b.byCh[n] - a.byCh[n]).map(p => ({ title: p.name, sub: `${p.byCh[n]} mention${p.byCh[n] > 1 ? "s" : ""} here, ${p.total} in book`, act: "place", arg: p.name }));
    const links = [];
    if (n > 1) links.push({ title: `Previous: Judges ${n - 1}`, sub: C.chapterSummaries[n - 2], act: "chap", arg: String(n - 1) });
    if (n < 21) links.push({ title: `Next: Judges ${n + 1}`, sub: C.chapterSummaries[n], act: "chap", arg: String(n + 1) });
    const map = tree(`Judges ${n}`, `${ch.verses.length} verses`, [
      { label: "Scenes", color: "#5b4bb7", leaves: ch.derived ? [] : scenes },
      { label: "Incidents", color: "#b45309", leaves: incs.map(i => ({ title: i.title, sub: refStr(i.ch, i.v1, i.v2), act: "inc", arg: i.id })) },
      { label: "People", color: "#0f766e", leaves: people },
      { label: "Places", color: "#185fa5", leaves: places },
      { label: "Connections", color: "#6b6860", leaves: links }
    ]);
    let body = "";
    ch.verses.forEach(x => {
      const sec = ch.sections.find(s => s.start === x.v);
      if (sec) body += `<div class="sec">${esc(sec.title)}</div>`;
      body += `<span class="verse" data-v="${x.v}" id="v${x.v}"><sup>${x.v}</sup>${esc(x.t)} </span>`;
    });
    $("#view").innerHTML = `<h1>Judges ${n}</h1><p>${refLinks(C.chapterSummaries[n - 1])}</p>
      <div class="chips picker">${V.map(c => `<a class="chip ${c.n === n ? "on" : ""}" href="#/chapters/${c.n}">${c.n}</a>`).join("")}</div>
      <p class="muted"><a href="#/words/${n}">Word frequency for this chapter</a></p>
      <h2>Chapter map</h2><div class="card">${map}</div><div id="panel"></div>
      <h2>Text (${LABEL})</h2><div class="card verses" id="text">${body}</div>`;
    const v = params.get("v");
    if (v) { const [a, b] = v.split("-").map(Number); highlight(a, b || a); }
  }
  function highlight(a, b) {
    document.querySelectorAll(".verse.hl").forEach(e => e.classList.remove("hl"));
    let first = null;
    document.querySelectorAll(".verse").forEach(e => {
      const v = +e.dataset.v;
      if (v >= a && v <= b) { e.classList.add("hl"); first = first || e; }
    });
    if (first) first.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  // search
  function hiTerms(text, terms) {
    let h = esc(text);
    terms.forEach(t => { h = h.replace(new RegExp("\\b(" + rx(esc(t)) + ")\\b", "gi"), "<mark>$1</mark>"); });
    return h;
  }
  function searchAll(q) {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    const lq = q.toLowerCase();
    const chars = C.characters.filter(c => (c.name + " " + c.aliases.join(" ")).toLowerCase().includes(lq) || (terms.length === 1 && c.role.toLowerCase().includes(lq)));
    const places = PLACES.filter(p => p.name.toLowerCase().includes(lq));
    const res = terms.map(w => new RegExp("\\b" + rx(w) + "\\b", "i"));
    const verses = ALL.filter(x => res.every(r => r.test(x.t)));
    return { terms, chars, places, verses };
  }
  function viewSearch(q) {
    if (!q) { $("#view").innerHTML = "<h1>Search</h1><p class='muted'>Type in the search bar above.</p>"; return; }
    const r = searchAll(q);
    $("#q").value = q;
    $("#view").innerHTML = `<h1>Search: “${esc(q)}”</h1>
      <p class="muted">${r.chars.length} characters · ${r.places.length} places · ${r.verses.length} verses</p>
      ${r.chars.length ? `<h2>Characters</h2><div class="grid">${r.chars.map(c => `<a class="tile" href="#/characters/${c.id}"><b>${esc(c.name)}</b><span>${esc(c.role)} · ${charRefs(c)}</span></a>`).join("")}</div>` : ""}
      ${r.places.length ? `<h2>Places</h2><div class="chips">${r.places.map(p => `<span class="chip" data-act="place" data-arg="${esc(p.name)}">${esc(p.name)} · ${p.total}</span>`).join("")}</div>` : ""}
      <h2>Verses</h2><div class="card">${r.verses.slice(0, 100).map(x => `<div class="hit"><b><a href="#/chapters/${x.ch}?v=${x.v}-${x.v}">${x.ch}:${x.v}</a></b>${hiTerms(x.t, r.terms)}</div>`).join("") || '<span class="muted">No verses match.</span>'}
      ${r.verses.length > 100 ? `<p class="muted">Showing 100 of ${r.verses.length}.</p>` : ""}</div>`;
  }

  // ---------- routing ----------
  function route() {
    const h = location.hash.replace(/^#\/?/, "") || "timeline";
    const [path, qs] = h.split("?");
    const parts = path.split("/").map(decodeURIComponent), params = new URLSearchParams(qs || "");
    document.querySelectorAll("#nav a").forEach(a => a.classList.toggle("on", a.dataset.r === parts[0]));
    if (parts[0] !== "search") $("#q").value = $("#q").value && document.activeElement === $("#q") ? $("#q").value : "";
    window.scrollTo(0, 0);
    switch (parts[0]) {
      case "characters": viewCharacters(parts[1]); break;
      case "words": viewWords(parts[1], params); break;
      case "chapters": viewChapter(parts[1], params); break;
      case "search": viewSearch(decodeURIComponent(parts.slice(1).join("/"))); break;
      default: viewTimeline();
    }
    // keep the selected chapter visible in a sideways-scrolling picker
    document.querySelectorAll(".picker").forEach(p => {
      const on = p.querySelector(".chip.on");
      if (on) p.scrollLeft = on.offsetLeft - p.offsetLeft - p.clientWidth / 2 + on.offsetWidth / 2;
    });
  }
  window.addEventListener("hashchange", route);

  function act(el) {
    const a = el.dataset.act, arg = el.dataset.arg;
    if (a === "inc") {
      const p = $("#panel"); p.innerHTML = incidentPanel(arg);
      p.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } else if (a === "char") location.hash = "#/characters/" + arg;
    else if (a === "chap") location.hash = "#/chapters/" + arg;
    else if (a === "place") location.hash = "#/search/" + encodeURIComponent(arg);
    else if (a === "scene") { const [x, y] = arg.split("-").map(Number); highlight(x, y); }
    else if (a === "word") showWord(arg);
  }
  document.addEventListener("click", e => {
    const el = e.target.closest("[data-act]");
    if (el) act(el);
    if (!e.target.closest(".search")) $("#suggest").hidden = true;
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Enter" && e.target.matches && e.target.matches(".leaf")) act(e.target);
  });

  // search bar
  const q = $("#q"), sg = $("#suggest");
  q.addEventListener("input", () => {
    const v = q.value.trim();
    if (v.length < 2) { sg.hidden = true; return; }
    const r = searchAll(v);
    let h = r.chars.slice(0, 4).map(c => `<a href="#/characters/${c.id}"><small>Character</small>${esc(c.name)}</a>`).join("");
    h += r.places.slice(0, 3).map(p => `<a href="#/search/${encodeURIComponent(p.name)}"><small>Place</small>${esc(p.name)}</a>`).join("");
    h += r.verses.slice(0, 3).map(x => `<a href="#/chapters/${x.ch}?v=${x.v}-${x.v}"><small>${x.ch}:${x.v}</small>${esc(clip(x.t, 70))}</a>`).join("");
    h += `<a href="#/search/${encodeURIComponent(v)}"><small>All</small>See all ${r.verses.length} verse results</a>`;
    sg.innerHTML = h; sg.hidden = false;
  });
  q.addEventListener("keydown", e => {
    if (e.key === "Enter" && q.value.trim()) { location.hash = "#/search/" + encodeURIComponent(q.value.trim()); sg.hidden = true; q.blur(); }
    if (e.key === "Escape") sg.hidden = true;
  });
  sg.addEventListener("click", () => { sg.hidden = true; });

  // translation switch, shown only when more than one is loaded
  const sel = $("#ver"), keys = Object.keys(VS);
  if (keys.length > 1) {
    sel.innerHTML = keys.map(k => `<option value="${k}" ${k === ver ? "selected" : ""}>${VS[k].label}</option>`).join("");
    sel.hidden = false;
    sel.addEventListener("change", () => {
      try { localStorage.setItem("ver", sel.value); } catch (e) {}
      location.reload();
    });
  }
  $("#foot").textContent = NOTICES[ver] || "";

  route();
})();
