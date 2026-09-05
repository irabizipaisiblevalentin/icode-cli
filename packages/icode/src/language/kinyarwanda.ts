/**
 * Kinyarwanda resources: common words, intent verbs, transliteration of technical
 * terms that have natural Kinyarwanda-adjacent forms or standard descriptions.
 */

/** Common Kinyarwanda words used for language detection (appear frequently in rw text). */
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
  "kuri", "ku", "umu", "aba", "iyi", "uyu", "iri", "ari", "bya", "byo", "muri",
  "bwa", "bwo", "uwo", "wabo", "wanjye", "siyo", "sio", "noneho", "nonese", "bishoboka",
  "noshobora", "mukore", "nkore", "dukore", "turashobora", "uzandike", "nakore", "uzakore",
  "uburyo", "buryo", "ukuntu", "ingene", "gute", "kuberaiki", "kugirango",
  "bashobora", "nasobanura", "sobanura", "nsobanurire", "subiza", "yego", "oya", "cyane",
  "neza", "mbere", "hanyuma", "byawe", "nshobora", "iyi code", "iyi dosiye", "uyu mushinga",
  "niba", "mbwira", "bwira", "nyandikire", "andikira", "kugirango", "nari", "hari", "kuko",
  "umwe", "bose", "byose", "akazi", "ikigo", "amakuru", "ibisubizo", "igisubizo", "icyo",
  "cyo", "wirata", "ukuri", "byiza", "bibisha", "yahanze", "guhangana", "hamwe", "imbere",
  "inyuma", "ubu", "ahandi", "aho", "mushishoza", "nshishoza", "urwego", "kurwego", "rwose",
  "byanze", "ntabandi", "nabandi", "ibindi", "bindi", "ukore", "nkore", "dusome", "dusoma",
  "sobanuza", "bitandukanye", "vyose", "byose", "abantu", "umuntu", "gitandukanye", "ntabwo",
  "birakabije", "birahomeye", "birabujije", "byumvikana", "yumvikana", "muhire",
  "mwirwa", "nkunda", "ukunda", "atari", "ntari", "byagenda", "bigenda", "bakora", "akora",
  "abona", "abonwa", "haboneka", "ugira", "ngira", "birahari", "birahaze", "gukomezaho",
  "gukaroro", "uragize", "naragize", "mugende", "genda", "gera", "gushushanya",
  "shushanya", "guhagarara", "hagarara", "kwiga", "heruka", "duheruka", "nabona", "ubona",
  "umusaruro", "gusohora", "sohora", "kwambara", "gusobanukirwa",
  "sobanukirwa", "gusobanurwa", "kubona", "bona", "gufata", "fata", "gutanga", "tanga",
  "gutora", "tora", "gusekura", "sekura", "gukosora", "gusana", "gukoresha",
  "koreshwa", "ngukuri", "byukuri", "umubare", "ibyahujwe", "guhindagurika", "ahagenze",
  "bahurije", "habereye", "bihereye", "uharazi", "nyibaranye", "umutekano", "amakuru",
])

/** Kinyarwanda stop/filler words that strongly indicate Kinyarwanda. */
export const KINYARWANDA_MARKERS = new Set([
  "ni", "ge", "na", "muri", "kuri", "kubera", "impamvu", "icyo", "uko", "ukuntu", "niba", "kugirango",
])

/** Verbs indicating intent, mapped to an English action plus weight. */
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

/** Technical terms with standard translations/descriptions for Kinyarwanda speakers. */
export const TECHNICAL_GLOSSARY: Record<string, string> = {
  API: "API ni uburyo porogaramu ebyiri zivugana.",
  server: "server ni porogaramu ibona ibyifuzo by'abandi (client) maze ibisubiza.",
  database: "database ni urubuga rwabitswe ku buryo bunoze, porogaramu izabona amakuru muri ryo.",
  file: "dosiye ni aho amakuru yuzuye ari mbumbe neza (text, code, cyangwa data).",
  directory: "directory ni dosiyee itandukanye ziba zinjujwe hamwe, kimwe n'igorofa mu rugo.",
  branch: "branch ni umurongo utandukanye w'amenyo y'amakuru muri Git aho ukorera udahindura umurongo mukuru.",
  commit: "commit ni igikorwa cya muri Git cyanditswe kugira ngo habiswe impinduka umukoresha yakoze.",
  variable: "variable ni igabanya ry'amakuru riri mu byanditswe rishobora gufata agaciro k'/akahinda.",
  function: "function ni igice cya code cyanditswe kugira ngo gikore akazi kumwe kenshi, gishobora kohereza (call).",
  class: "class ni gahunda yerekana uburyo ibintu bigezwe (object) bimeze n'uko bikora.",
  object: "object ni igize fungura ry' amakuru hamwe n'ibikorwa byaryo, gushingiye kuri class.",
  array: "array ni urutonde rw'ibintu bishobora kugezwa ku mubare (index).",
  loop: "loop ni uburyo code isubirayo igenzura inshuro nyinshi.",
  error: "error ni ikibazo cyagaragaye ubwo porogaramu yari ikora, gikandikira ku maso.",
  bug: "bug ni ikosa riri muri code rituma porogaramu idakora uko bikwiye.",
  debug: "debug ni umurimo wo gushaka no gukosora amakosa ari muri code.",
  test: "test ni uburyo bwo kugenzura ko porogaramu ikora nk'uko byari biteganyijwe.",
  npm: "npm ni umuyobozi w'amacapa (packages) ya JavaScript.",
  bun: "bun ni umuyobozi w'amanota (runtime) kandi w'amacapa ya JavaScript, yihuta cyane.",
  git: "Git ni porogaramu ikurikirana impinduka muri code, ikoreshwa mu gukorera hamwe.",
  command: "command ni itegeko uhereza muri terminal kugira ngo computer ikore ikintu.",
  terminal: "terminal ni umusekuru (window) aho ukoresha commands kuri computer.",
  dependency: "dependency ni icapa (package) cyangwa module porogaramu ikenera kugira ngo ikore.",
  module: "module ni igice cya code gishobora gukoreshwa ahandi (import).",
  type: "type ni ubwoko bw'amasano data (nko number, string, boolean).",
  return: "return ni itegeko rituma function isubiza agaciro aho yahanabitswe.",
}
