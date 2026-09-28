/*
  Everything after "BROOKLYN BABY" (16s) comes from this list.

  Each entry becomes one card:
    at       seconds from the edit's 0.0 (same clock as SONG_START in main.js)
    rows     one string per row; words are auto-spelled with element tiles
             special words:  +   =   &   <3  (a beating "Love" element tile)
    caption  optional small handwritten line under the tiles
    theme    optional "dark" | "light" (otherwise it alternates)
    effect   "burst"  -> little hearts burst out once the tiles land
    float    true     -> soft hearts start drifting up from here to the end

  Add your own lines in time order, e.g.
    { at: 17.2, rows: ["FIRST LINE", "SECOND LINE"] },

  The last card holds (with floating hearts) until the song ends.
*/
window.LYRICS = [
  // ---- add your lyric lines here ----

  // ---- the little love note at the end ----
  { at: 16.5, rows: ["HAPPY", "BOYFRIEND", "DAY"] },
  { at: 20.0, rows: ["YOU ARE MY", "FAVOURITE", "ELEMENT"] },
  { at: 24.0, rows: ["WE HAVE", "CHEMISTRY"], caption: "(obviously)" },
  { at: 28.0, rows: ["YOU + ME", "= <3"], caption: "happy boyfriend day, my love", effect: "burst", float: true },
];
