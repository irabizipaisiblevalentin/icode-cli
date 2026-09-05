/**
 * Kinyarwanda resources used by iCode's language layer: common words for
 * detection, intent verbs, and transliterations of technical terms.
 */

export const KINYARWANDA_WORDS = new Set([
  "muraho", "ubwiriye", "mwaramutse", "nawe", "ndi", "uri", "ari", "turi", "bari", "muri",
  "wahariye", "cyangwa", "na", "nayo", "nibyo", "ntibyo", "ni", "ryari", "kuki", "kuberako",
  "kubera", "impamvu", "nyuma", "mbere", "hasi", "hejuru", "ibikorwa", "ikorwa", "gukorera",
  "gukora", "gukoresha", "koresha", "reka", "reba", "rebere", "jyanya", "jyanye", "menya",
  "sobanura", "sobanurira", "gushaka", "shaka", "shakisha",
  "gusoma", "soma", "kwandika", "andika", "guhindura", "hindura", "kosora", "komeza", "gukomeza",
  "guhagarika", "hagarika", "gutangira", "tangira", "gusoza", "usoze", "arangiye", "byarangiye",
  "mushobora", "ushobora", "ngomba", "ugomba", "nkeneye", "ukeneye", "nshaka", "ushaka",
  "dosiye", "umurimo", "umushinga", "porogaramu", "kode", "code", "amakosa", "ikibazo",
  "kuri", "ku", "umu", "aba", "iyi", "uyu", "iri", "bya", "byo",
  "bwa", "bwo", "uwo", "wabo", "wanjye", "siyo", "sio", "noneho", "nonese", "bishoboka",
  "noshobora", "mukore", "nkore", "dukore", "turashobora", "uzandike", "nakore", "uzakore",
  "uburyo", "buryo", "ukuntu", "ingene", "gute", "kuberaiki", "kugirango",
  "bashobora", "nasobanura", "nsobanurire", "subiza", "yego", "oya", "cyane",
  "neza", "hanyuma", "byawe", "nshobora", "niba", "mbwira", "bwira", "nyandikire", "andikira",
  "nari", "hari", "kuko", "umwe", "bose", "byose", "akazi", "ikigo", "amakuru", "ibisubizo",
  "igisubizo", "icyo", "cyo", "ukuri", "byiza", "bibisha", "hamwe", "imbere",
  "inyuma", "ubu", "ahandi", "aho", "urwego", "kurwego", "rwose",
  "ibindi", "bindi", "ukore", "nkore", "dusome", "dusoma",
  "sobanuza", "bitandukanye", "abantu", "umuntu", "ntabwo",
  "birakabije", "birahomeye", "birabujije", "byumvikana", "yumvikana",
  "mwirwa", "nkunda", "ukunda", "atari", "ntari", "byagenda", "bigenda", "bakora", "akora",
  "abona", "abonwa", "haboneka", "ugira", "ngira", "birahari", "birahaze",
  "gukomezaho", "uragize", "mugende", "genda", "gushushanya",
  "shushanya", "guhagarara", "hagarara", "kwiga", "heruka", "nabona", "ubona",
  "gusohora", "sohora", "gusobanukirwa",
  "sobanukirwa", "gusobanurwa", "kubona", "bona", "gufata", "fata", "gutanga", "tanga",
  "gutora", "tora", "gukosora", "gusana", "koreshwa",
  "byukuri", "umubare", "umutekano",
])

export const KINYARWANDA_MARKERS = new Set([
  "ni", "na", "muri", "kuri", "kubera", "impamvu", "icyo", "uko", "ukuntu", "niba", "kugirango",
])

export interface IntentToken {
  word: string
  action: string
  weight: number
}

export const INTENT_VERBS: IntentToken[] = [
  { word: "sobanura", action: "explain", weight: 4 },
  { word: "sobanurira", action: "explain", weight: 4 },
  { word: "sobanurire", action: "explain", weight: 4 },
  { word: "mbwira", action: "explain", weight: 3 },
  { word: "bwira", action: "tell", weight: 3 },
  { word: "menya", action: "explain", weight: 3 },
  { word: "shaka", action: "find", weight: 3 },
  { word: "shakisha", action: "find", weight: 3 },
  { word: "kosora", action: "fix", weight: 4 },
  { word: "kosa", action: "fix", weight: 3 },
  { word: "gukosora", action: "fix", weight: 4 },
  { word: "sana", action: "fix", weight: 3 },
  { word: "gusana", action: "fix", weight: 3 },
  { word: "reba", action: "inspect", weight: 3 },
  { word: "rebere", action: "inspect", weight: 3 },
  { word: "soma", action: "read", weight: 3 },
  { word: "gusoma", action: "read", weight: 2 },
  { word: "andika", action: "write", weight: 3 },
  { word: "kwandika", action: "write", weight: 3 },
  { word: "gukora", action: "do", weight: 2 },
  { word: "kora", action: "do", weight: 2 },
  { word: "gukoresha", action: "use", weight: 2 },
  { word: "koresha", action: "use", weight: 2 },
  { word: "guhindura", action: "change", weight: 3 },
  { word: "hindura", action: "change", weight: 3 },
  { word: "tangira", action: "start", weight: 3 },
  { word: "gutangira", action: "start", weight: 3 },
  { word: "hagarika", action: "stop", weight: 3 },
  { word: "guhagarika", action: "stop", weight: 3 },
  { word: "hagarara", action: "stop", weight: 2 },
  { word: "komeza", action: "continue", weight: 2 },
  { word: "gukomeza", action: "continue", weight: 2 },
  { word: "sohora", action: "run", weight: 3 },
  { word: "gusohora", action: "run", weight: 3 },
  { word: "gera", action: "run", weight: 2 },
  { word: "subiza", action: "answer", weight: 3 },
  { word: "sobanuza", action: "explain", weight: 3 },
  { word: "shushanya", action: "design", weight: 3 },
  { word: "gushushanya", action: "design", weight: 3 },
]