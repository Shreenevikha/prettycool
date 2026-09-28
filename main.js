(() => {
  /* ===================== AUDIO PLACEHOLDER =====================
     The original "Brooklyn Baby" goes in audio/brooklyn-baby.mp3.
     SONG_START = second in that file where this edit begins, i.e.
     1.0s before Lana sings "Yeah, my boyfriend's pretty cool".
     If you trim the mp3 to start exactly there, leave it at 0.
     Quick tuning without editing: open index.html?start=123.4
     ============================================================= */
  const SONG_START = 0;

  const E = window.ELEMENTS;

  // hand-placed opening, matching the reference edit
  // each word: tiles, time its first tile starts (s), gap between tiles (s)
  const INTRO = [
    {
      at: 0, theme: "dark", size: 9.6,
      rows: [
        [{ els: ["Y", "Er", "At", "H"], t: 1.0, step: 0.12 }, { els: ["Mn", "Y"], t: 1.6, step: 0.14 }],
        [{ els: ["B", "O", "Y", "Fr", "I", "Er", "N", "Db"], t: 2.0, step: 0.09 }],
      ],
    },
    {
      at: 3.0, theme: "light", size: 14,
      rows: [
        [{ els: ["P", "Re", "Tc", "Tc", "Y"], t: 3.1, step: 0.12 }],
        [{ els: ["C", "O", "O", "Li"], t: 4.5, step: 0.12 }],
      ],
    },
    {
      at: 6.0, theme: "dark", size: 14,
      rows: [
        [{ els: ["B", "U", "Tc"], t: 6.1, step: 0.13 }],
        [{ els: ["H", "Er"], t: 6.75, step: 0.14 }],
      ],
    },
    {
      at: 7.5, theme: "light", size: 14,
      rows: [
        [{ els: ["C", "O", "O", "Li"], t: 7.6, step: 0.12 }],
        [{ els: ["At", "S"], t: 8.2, step: 0.14 }, { els: ["Mn", "Er"], t: 9.05, step: 0.16 }],
      ],
    },
    {
      at: 11.0, theme: "dark", size: 14,
      rows: [
        [{ els: ["Ca", "U", "Se"], t: 11.1, step: 0.13 }],
        [{ els: ["I", "Am"], t: 11.75, step: 0.15 }],
      ],
    },
    {
      at: 12.6, theme: "light", size: 10.8,
      rows: [
        [{ els: ["Br", "O", "O", "K", "Li", "Y", "N"], t: 12.7, step: 0.1 }],
        [{ els: ["Ba", "B", "Y"], t: 13.7, step: 0.18 }],
      ],
    },
  ];

  const TILE_IN = 0.45;
  const SCENE_OUT = 0.22;
  const FINAL_HOLD = 6;

  const params = new URLSearchParams(location.search);
  const songStart = params.has("start") ? parseFloat(params.get("start")) || 0 : SONG_START;
  const freezeAt = params.has("t") ? parseFloat(params.get("t")) : null;

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const prog = (t, a, b) => clamp((t - a) / (b - a));
  const easeOut = (p) => 1 - Math.pow(1 - p, 3);

  function mulberry32(a) {
    return () => {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---------- periodic-table speller ---------- */

  // letters with no one-letter element borrow a close tile, same as the reference (Er for E, Tc for T...)
  const FALLBACK = { A: "At", D: "Db", E: "Er", G: "Ga", J: "I", L: "Li", M: "Mn", Q: "O", R: "Re", T: "Tc", X: "Xe", Z: "Zn" };

  function spell(word) {
    const w = word.replace(/[^a-z]/gi, "").toLowerCase();
    const n = w.length;
    const cost = new Array(n + 1).fill(Infinity);
    const back = new Array(n + 1);
    cost[0] = 0;
    const relax = (from, to, c, sym) => {
      if (cost[from] + c < cost[to]) { cost[to] = cost[from] + c; back[to] = [from, sym]; }
    };
    for (let i = 0; i < n; i++) {
      if (cost[i] === Infinity) continue;
      for (let len = 1; len <= 2 && i + len <= n; len++) {
        const s = w.slice(i, i + len);
        const sym = s[0].toUpperCase() + s.slice(1);
        if (E[sym]) relax(i, i + len, 1, sym);
      }
      const fb = FALLBACK[w[i].toUpperCase()];
      if (fb) relax(i, i + 1, 3, fb);
    }
    const out = [];
    for (let i = n; i > 0; i = back[i][0]) out.unshift(back[i][1]);
    return out;
  }

  /* ---------- scene list ---------- */

  function fitSize(rows, hasCaption) {
    let widest = 0;
    for (const row of rows) {
      let u = 0;
      row.forEach((word, wi) => {
        word.forEach((it, i) => { u += it.kind === "op" ? 0.4 : 1; if (i) u += 0.09; });
        if (wi) u += 0.42;
      });
      widest = Math.max(widest, u);
    }
    const tall = rows.length * 1.16 + (rows.length - 1) * 0.2;
    return Math.min(14, 80 / widest, (hasCaption ? 44 : 52) / tall);
  }

  const scenes = INTRO.map((sc) => ({
    ...sc,
    rows: sc.rows.map((row) =>
      row.map((word) => word.els.map((sym, i) => ({ kind: "tile", sym, t: word.t + i * word.step })))
    ),
  }));

  const lyrics = (window.LYRICS || []).slice().sort((a, b) => a.at - b.at);
  lyrics.forEach((entry, idx) => {
    const nextAt = idx + 1 < lyrics.length ? lyrics[idx + 1].at : entry.at + 4;
    const rows = entry.rows.map((line) =>
      line.trim().split(/\s+/).map((tok) => {
        if (tok === "+" || tok === "=" || tok === "&") return [{ kind: "op", ch: tok }];
        if (tok === "<3") return [{ kind: "heart" }];
        return spell(tok).map((sym) => ({ kind: "tile", sym }));
      })
    );

    const words = rows.flat();
    const count = words.flat().length;
    const span = entry.span || Math.min(1.8, Math.max(0.6, (nextAt - entry.at) * 0.5));
    const step = Math.min(0.14, span / (count + words.length));
    let t = entry.at + 0.12;
    for (const word of words) {
      for (const it of word) { it.t = t; t += step; }
      t += step;
    }

    const prevTheme = scenes[scenes.length - 1].theme;
    scenes.push({
      at: entry.at,
      theme: entry.theme || (prevTheme === "dark" ? "light" : "dark"),
      size: fitSize(rows, !!entry.caption),
      rows,
      caption: entry.caption,
      captionAt: t + 0.25,
      burstAt: entry.effect === "burst" ? t + 0.2 : null,
      float: !!entry.float,
    });
  });

  const lastAt = scenes[scenes.length - 1].at;
  let END = lastAt + FINAL_HOLD;

  /* ---------- build DOM ---------- */

  const card = document.getElementById("card");
  const stage = document.getElementById("stage");
  const hint = document.getElementById("hint");
  const audio = document.getElementById("song");

  const div = (cls) => {
    const d = document.createElement("div");
    d.className = cls;
    return d;
  };
  const heartSvg = (cls) =>
    `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true"><use href="#heart"/></svg>`;

  const floatLayer = div("float-layer");
  card.appendChild(floatLayer);

  const items = [];
  const sceneEls = scenes.map((sc) => {
    const el = div("scene");
    el.style.setProperty("--t", sc.size + "cqw");
    for (const row of sc.rows) {
      const r = div("row");
      for (const word of row) {
        const w = div("word");
        for (const it of word) {
          let node;
          if (it.kind === "op") {
            node = div("op");
            node.textContent = it.ch;
          } else if (it.kind === "heart") {
            node = div("tile heart-tile");
            node.innerHTML =
              `<span class="num">143</span><span class="mass">∞</span>` +
              heartSvg("tile-heart") + `<span class="name">Love</span>`;
          } else {
            const [num, name, mass] = E[it.sym];
            node = div("tile");
            node.innerHTML =
              `<span class="num">${num}</span><span class="mass">${mass}</span>` +
              `<span class="sym">${it.sym}</span><span class="name">${name}</span>`;
          }
          w.appendChild(node);
          items.push({ el: node, t: it.t, seed: items.length * 1.7 });
        }
        r.appendChild(w);
      }
      el.appendChild(r);
    }
    if (sc.caption) {
      const cap = div("caption");
      cap.textContent = sc.caption;
      el.appendChild(cap);
      items.push({ el: cap, t: sc.captionAt, seed: 0, still: true });
    }
    card.appendChild(el);
    return el;
  });

  const bursts = [];
  scenes.forEach((sc) => {
    if (sc.burstAt === null || sc.burstAt === undefined) return;
    const n = 12;
    for (let i = 0; i < n; i++) {
      const el = div("burst-heart");
      el.innerHTML = heartSvg("");
      card.appendChild(el);
      bursts.push({ el, t0: sc.burstAt + (i % 3) * 0.05, angle: (i / n) * Math.PI * 2 + 0.2, reach: 26 + (i % 4) * 4 });
    }
  });

  const floatScene = scenes.find((sc) => sc.float);
  const floaters = [];
  if (floatScene) {
    const rnd = mulberry32(3);
    for (let i = 0; i < 14; i++) {
      const el = div("float-heart");
      el.innerHTML = heartSvg("");
      const size = 2.4 + rnd() * 2.6;
      el.style.width = el.style.height = size + "cqw";
      floatLayer.appendChild(el);
      floaters.push({ el, period: 6 + rnd() * 3.5, phase: rnd(), x: 4 + rnd() * 78, sway: 1.5 + rnd() * 3 });
    }
  }

  /* ---------- render a moment of the timeline ---------- */

  let lastTheme = null;

  function render(t) {
    let si = 0;
    scenes.forEach((s, i) => { if (t >= s.at) si = i; });

    const theme = scenes[si].theme;
    if (theme !== lastTheme) { card.dataset.theme = theme; lastTheme = theme; }

    sceneEls.forEach((el, i) => {
      const isLast = i + 1 === scenes.length;
      const next = isLast ? 0 : scenes[i + 1].at;
      const o = i !== si ? 0 : isLast ? 1 : 1 - prog(t, next - SCENE_OUT, next);
      el.style.opacity = o;
      el.style.visibility = o > 0 ? "visible" : "hidden";
    });

    for (const it of items) {
      const p = easeOut(prog(t, it.t, it.t + TILE_IN));
      const settled = it.still ? 0 : prog(t, it.t + TILE_IN, it.t + TILE_IN + 0.8);
      const drift = Math.sin(t * 1.4 + it.seed) * 0.5 * settled;
      it.el.style.opacity = p;
      it.el.style.transform = `translateY(${(1 - p) * 16 + drift}%) scale(${0.94 + 0.06 * p})`;
    }

    for (const b of bursts) {
      const p = prog(t, b.t0, b.t0 + 1.6);
      if (p <= 0 || p >= 1) { b.el.style.opacity = 0; continue; }
      const r = easeOut(p) * b.reach;
      const x = Math.cos(b.angle) * r;
      const y = Math.sin(b.angle) * r * 0.8 - p * 4;
      b.el.style.opacity = Math.sin(p * Math.PI) * 0.9;
      b.el.style.transform = `translate(${x}cqw, ${y}cqw) scale(${0.5 + 0.7 * easeOut(p)})`;
    }

    if (floatScene) {
      const on = prog(t, floatScene.at, floatScene.at + 1.5);
      floatLayer.style.visibility = on > 0 ? "visible" : "hidden";
      for (const f of floaters) {
        const local = ((t - floatScene.at) / f.period + f.phase) % 1;
        const y = 84 - local * 96;
        const x = f.x + Math.sin(local * 7 + f.phase * 6) * f.sway;
        f.el.style.opacity = on * 0.4 * Math.sin(local * Math.PI);
        f.el.style.transform = `translate(${x}cqw, ${y}cqw)`;
      }
    }
  }

  /* ---------- playback ---------- */

  let state = "idle";
  let t0 = 0;
  let withAudio = false;
  let audioMissing = false;

  audio.addEventListener("loadedmetadata", () => {
    if (isFinite(audio.duration)) END = Math.max(lastAt + FINAL_HOLD, audio.duration - songStart);
  });

  const lastSource = audio.querySelector("source:last-of-type");
  lastSource.addEventListener("error", () => {
    audioMissing = true;
    if (state === "idle") hint.textContent = "tap anywhere to play · add audio/brooklyn-baby.mp3 for sound";
  });

  async function start(fromGesture) {
    if (state === "playing") return;
    withAudio = false;

    if (!audioMissing) {
      try {
        audio.currentTime = songStart;
        await audio.play();
        withAudio = true;
      } catch (_) {
        if (!fromGesture) return;
      }
    } else if (!fromGesture) {
      return;
    }

    t0 = performance.now();
    state = "playing";
    hint.classList.add("hidden");
  }

  function clock() {
    let t = (performance.now() - t0) / 1000;
    if (withAudio && !audio.paused) {
      const at = audio.currentTime - songStart;
      if (Math.abs(at - t) > 0.06) {
        t0 = performance.now() - at * 1000;
        t = at;
      }
    }
    return t;
  }

  function frame() {
    let t = 0;
    if (freezeAt !== null) {
      t = freezeAt;
    } else if (state === "playing" || state === "done") {
      t = clock();
      if (t >= END && state === "playing") {
        state = "done";
        audio.pause();
        hint.textContent = "tap to replay";
        hint.classList.remove("hidden");
      }
      if (state === "done") t = Math.min(t, END);
    }
    render(t);
    requestAnimationFrame(frame);
  }

  function popHeart(x, y) {
    const size = stage.clientWidth * 0.08;
    const el = document.createElement("div");
    el.className = "tap-heart";
    el.innerHTML = heartSvg("");
    el.style.cssText = `left:${x - size / 2}px;top:${y - size / 2}px;width:${size}px;height:${size}px`;
    document.body.appendChild(el);
    el.addEventListener("animationend", () => el.remove());
  }

  function onTap(e) {
    if (state === "playing") {
      if (e && e.clientX !== undefined) popHeart(e.clientX, e.clientY);
      return;
    }
    if (matchMedia("(pointer: coarse)").matches && !document.fullscreenElement) {
      const root = document.documentElement;
      if (root.requestFullscreen) root.requestFullscreen().catch(() => {});
    }
    state = "idle";
    start(true);
  }

  document.addEventListener("pointerup", onTap);
  document.addEventListener("keydown", (e) => {
    if (e.key === " " || e.key === "Enter") { e.preventDefault(); onTap(); }
  });

  render(0);
  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  fontsReady.then(() => {
    requestAnimationFrame(frame);
    if (freezeAt === null) start(false);
  });
})();
