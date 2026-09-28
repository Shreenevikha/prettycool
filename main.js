(() => {
  /* ===================== AUDIO PLACEHOLDER =====================
     The original "Brooklyn Baby" goes in audio/brooklyn-baby.mp3.
     SONG_START = second in that file where this edit begins, i.e.
     1.0s before Lana sings "Yeah, my boyfriend's pretty cool".
     If you trim the mp3 to start exactly there, leave it at 0.
     Quick tuning without editing: open index.html?start=123.4
     ============================================================= */
  const SONG_START = 0;

  const END = 16;

  // [atomic number, name, atomic mass]
  const E = {
    H: [1, "Hydrogen", "1.008"],
    Li: [3, "Lithium", "6.94"],
    B: [5, "Boron", "10.81"],
    C: [6, "Carbon", "12.011"],
    N: [7, "Nitrogen", "14.007"],
    O: [8, "Oxygen", "15.999"],
    P: [15, "Phosphorus", "30.974"],
    S: [16, "Sulfur", "32.06"],
    K: [19, "Potassium", "39.098"],
    Ca: [20, "Calcium", "40.078"],
    Mn: [25, "Manganese", "54.938"],
    Se: [34, "Selenium", "78.971"],
    Br: [35, "Bromine", "79.904"],
    Y: [39, "Yttrium", "88.906"],
    Tc: [43, "Technetium", "(98)"],
    I: [53, "Iodine", "126.90"],
    Ba: [56, "Barium", "137.33"],
    Er: [68, "Erbium", "167.26"],
    Re: [75, "Rhenium", "186.21"],
    At: [85, "Astatine", "(210)"],
    Fr: [87, "Francium", "(223)"],
    U: [92, "Uranium", "238.03"],
    Am: [95, "Americium", "(243)"],
    Db: [105, "Dubnium", "(268)"],
  };

  // each word: tiles, time its first tile starts (s), gap between tiles (s)
  // nudge the `t` values to sit exactly on the vocals once the song is in
  const SCENES = [
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

  const params = new URLSearchParams(location.search);
  const songStart = params.has("start") ? parseFloat(params.get("start")) || 0 : SONG_START;
  const freezeAt = params.has("t") ? parseFloat(params.get("t")) : null;

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const prog = (t, a, b) => clamp((t - a) / (b - a));
  const easeOut = (p) => 1 - Math.pow(1 - p, 3);

  /* ---------- build tiles ---------- */

  const card = document.getElementById("card");
  const atom = document.getElementById("atom");
  const hint = document.getElementById("hint");
  const audio = document.getElementById("song");

  const div = (cls) => {
    const d = document.createElement("div");
    d.className = cls;
    return d;
  };

  const tiles = [];
  const sceneEls = SCENES.map((sc) => {
    const el = div("scene");
    el.style.setProperty("--t", sc.size + "cqw");
    for (const row of sc.rows) {
      const r = div("row");
      for (const word of row) {
        const w = div("word");
        word.els.forEach((sym, i) => {
          const [num, name, mass] = E[sym];
          const tile = div("tile");
          tile.innerHTML =
            `<span class="num">${num}</span><span class="mass">${mass}</span>` +
            `<span class="sym">${sym}</span><span class="name">${name}</span>`;
          w.appendChild(tile);
          tiles.push({ el: tile, t: word.t + i * word.step, seed: tiles.length * 1.7 });
        });
        r.appendChild(w);
      }
      el.appendChild(r);
    }
    card.insertBefore(el, atom);
    return el;
  });

  /* ---------- render a moment of the timeline ---------- */

  let lastTheme = null;

  function render(t) {
    let si = 0;
    SCENES.forEach((s, i) => { if (t >= s.at) si = i; });

    const theme = SCENES[si].theme;
    if (theme !== lastTheme) { card.dataset.theme = theme; lastTheme = theme; }

    sceneEls.forEach((el, i) => {
      const isLast = i + 1 === SCENES.length;
      const next = isLast ? 0 : SCENES[i + 1].at;
      const o = i !== si ? 0 : isLast ? 1 : 1 - prog(t, next - SCENE_OUT, next);
      el.style.opacity = o;
      el.style.visibility = o > 0 ? "visible" : "hidden";
    });

    for (const tile of tiles) {
      const p = easeOut(prog(t, tile.t, tile.t + TILE_IN));
      const settled = prog(t, tile.t + TILE_IN, tile.t + TILE_IN + 0.8);
      const drift = Math.sin(t * 1.4 + tile.seed) * 0.5 * settled;
      tile.el.style.opacity = p;
      tile.el.style.transform = `translateY(${(1 - p) * 16 + drift}%) scale(${0.94 + 0.06 * p})`;
    }
  }

  /* ---------- playback ---------- */

  let state = "idle";
  let t0 = 0;
  let withAudio = false;
  let audioMissing = false;

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
        audio.volume = 1;
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
      if (withAudio && t > END) {
        audio.volume = clamp(1 - (t - END) / 1.5);
        if (t > END + 1.5) audio.pause();
      }
      if (t >= END && state === "playing") {
        state = "done";
        hint.textContent = "tap to replay";
        hint.classList.remove("hidden");
      }
      t = Math.min(t, END);
    }
    render(t);
    requestAnimationFrame(frame);
  }

  function onTap() {
    if (state === "playing") return;
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
