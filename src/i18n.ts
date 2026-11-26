/** The page's words, in English and Khmer, copied EXACTLY from the drawings (demo.siliconwat.dev, build-boards.py: the
 *  `t("English", "Khmer")` calls). ⚠️ The Khmer is OUR DRAFT until a native reader approves it; the page says so in a band.
 *
 *  Three kinds of entry, marked where they sit:
 *    · drawn — both languages from the drawings, verbatim;
 *    · KM UNDRAWN (`null`) — the drawings give English only (the desktop boards); the page shows the English, marked lang="en";
 *    · NOT DRAWN — words the drawings do not have at all (toasts, problems, a range's page heading, the no-entry line).
 *      Ours, in both languages, until the drawings or the founder settle them.
 *  ⛔ Barred in the rendered text: sign in, deposit, savings, interest, yield, bank, and a vendor or AI model named as an author. */
import { store, KEYS } from "./ui/prefs";

export type Lang = "en" | "km";

const S = {
  // ── header, footer, band ───────────────────────────────────────────────────────────────────────────────────────────
  share: ["Share", "ចែករំលែក"],
  aboutLink: ["About and credits", "អំពី និងការទទួលស្គាល់"],
  // NOT DRAWN (legal D9, 2026-11-20): our words, our Khmer draft; the page itself stays English
  termsLink: ["Privacy and terms", "ឯកជនភាព និងលក្ខខណ្ឌ"],
  // NOT DRAWN (A709 M2, founder 2026-11-25): the line under Privacy and terms, outside the document, before its link to
  // legal.333.eco; our words, our Khmer draft
  legalVersions: ["Every version of this document, timestamped:", "គ្រប់កំណែនៃឯកសារនេះ បោះត្រាពេលវេលា៖"],
  // Shown in Khmer only, beside Privacy and terms' English notice (founder 2026-11-26, "approve all": the shared clauses' ONE
  // Khmer draft banner and AI line, legal.333.eco §clause-rulings items 2 and 3); our Khmer draft
  draftBanner: ["", "សេចក្តីព្រាង ដែលមិនទាន់ត្រូវបានពិនិត្យដោយមេធាវីនៅឡើយទេ។ វាអាចផ្លាស់ប្តូរមុនកំណែចុងក្រោយ។ អត្ថបទច្បាប់មានតែជាភាសាអង់គ្លេសប៉ុណ្ណោះ។"],
  draftedWith: ["", "រៀបចំជាមួយ Miss Aquarius℠ ដែលជា AI"],
  // NOT DRAWN (founder 2026-11-23: a footer link to the models on Hugging Face): our words, our Khmer draft
  modelsLink: ["Models and data", "ម៉ូដែល និងទិន្នន័យ"],
  visits: ["Visits are counted without cookies.", "ការចូលមើលត្រូវបានរាប់ដោយគ្មានខូគី។"],
  system: ["System", "ប្រព័ន្ធ"],
  light: ["Light", "ភ្លឺ"],
  dark: ["Dark", "ងងឹត"],
  // ── 1 · empty ──────────────────────────────────────────────────────────────────────────────────────────────────────
  title: ["Read a page of the Tipiṭaka", "អានទំព័រមួយនៃព្រះត្រៃបិដក"],
  lede: ["Pāli and Khmer printed in Khmer script, from the Buddhist Institute edition (1927–69). Free, and read on this device.",
    "បាលី និងខ្មែរ ដែលបោះពុម្ពជាអក្សរខ្មែរ ពីព្រះត្រៃបិដកបោះពុម្ពរបស់ពុទ្ធសាសនបណ្ឌិត្យ (១៩២៧–១៩៦៩)។ ឥតគិតថ្លៃ ហើយអាននៅលើឧបករណ៍នេះ។"],
  dropTitle: ["Drop a page here", "ទម្លាក់ទំព័រនៅទីនេះ"],
  dropSub: ["A photo, a scan or a PDF", "រូបថត ស្កេន ឬ PDF"],
  chooseFile: ["Choose a file", "ជ្រើសរើសឯកសារ"],
  takePhoto: ["Take a photo", "ថតរូប"],
  privacy: ["Your page is read on this device. It is never uploaded.",
    "ទំព័ររបស់អ្នកត្រូវបានអាននៅលើឧបករណ៍នេះ។ វាមិនត្រូវបានផ្ញើទៅកន្លែងណាឡើយ។"],
  readerHead: ["Reader", "ម៉ូដែលអាន"],
  accurate: ["Most accurate", "ត្រឹមត្រូវបំផុត"],
  accurateSub: ["The fewest mistakes. Chosen for you.", "កំហុសតិចបំផុត។ បានជ្រើសរើសជូនអ្នក។"],
  public: ["Public domain", "កម្មសិទ្ធិសាធារណៈ"],
  publicSub: ["A few more mistakes. Its file belongs to everyone.", "កំហុសច្រើនជាងបន្តិច។ ឯកសាររបស់វាជាកម្មសិទ្ធិរបស់មនុស្សគ្រប់គ្នា។"],
  // a third reader (founder 2026-11-25: "keep both"); our Khmer, a draft
  publicOther: ["Public domain, other printings", "កម្មសិទ្ធិសាធារណៈ សម្រាប់ការបោះពុម្ពផ្សេងៗ"],
  publicOtherSub: ["Reads the Taiwan re-setting and printed commentaries better than Public domain. Its file belongs to everyone.",
    "អានការបោះពុម្ពដែលវាយអក្សរឡើងវិញនៅតៃវ៉ាន់ និងអដ្ឋកថាដែលបោះពុម្ព បានល្អជាង កម្មសិទ្ធិសាធារណៈ។ ឯកសាររបស់វាជាកម្មសិទ្ធិរបស់មនុស្សគ្រប់គ្នា។"],
  licenseNote: ["The license matters only if you share the model file itself.",
    "អាជ្ញាប័ណ្ណមានន័យ តែនៅពេលអ្នកចែករំលែកឯកសារម៉ូដែលនោះផ្ទាល់ប៉ុណ្ណោះ។"],
  whatReads: ["What it reads", "អ្វីដែលវាអាន"],
  // D1 (desktop, drawn in English only) — KM UNDRAWN
  whatReadsShort: ["Both pages of each opening: the Pāli, and its Khmer translation. It tells which one a page is, and you can switch it.", null],
  // ── 1b · PDF page chooser ──────────────────────────────────────────────────────────────────────────────────────────
  choosePages: ["Choose pages", "ជ្រើសរើសទំព័រ"],
  nPages: ["{n} pages", "{n} ទំព័រ"],
  onePage: ["One page", "មួយទំព័រ"],
  aRange: ["A range", "ចន្លោះទំព័រ"],
  fromPage: ["From page", "ពីទំព័រ"],
  toPage: ["To page", "ដល់ទំព័រ"],
  pagesInFile: ["Pages in this file", "ទំព័រក្នុងឯកសារនេះ"],
  pagesNote: ["Pages are read in order, one at a time, on this device. A whole volume is long, so choose the pages you need.",
    "ទំព័រត្រូវបានអានតាមលំដាប់ ម្តងមួយទំព័រ នៅលើឧបករណ៍នេះ។ សៀវភៅមួយក្បាលវែងណាស់ ដូច្នេះសូមជ្រើសតែទំព័រដែលអ្នកត្រូវការ។"],
  readThese: ["Read these pages", "អានទំព័រទាំងនេះ"],
  chooseAnother: ["Choose another file", "ជ្រើសឯកសារផ្សេង"],
  // NOT DRAWN: the one field of "One page" (the drawings show only "A range"); ទំព័រ is the drawings' own word
  page: ["Page", "ទំព័រ"],
  // NOT DRAWN: the small heading over each page's text when a range is read
  pageN: ["Page {n}", "ទំព័រ {n}"],
  // ── 1c · adjust the page (a photo or a screenshot) ─────────────────────────────────────────────────────────────────
  // NOT DRAWN (state 1c, photos and screenshots, 2026-11-20): our words, our Khmer draft
  adjustTitle: ["Adjust the page", "តម្រឹមទំព័រ"],
  adjustHelp: ["Move the corners to the page's corners.", "រំកិលជ្រុងទាំងបួន ទៅត្រង់ជ្រុងនៃទំព័រ។"],
  adjustKeys: ["Arrow keys move a corner. Hold Shift to move it further.", "គ្រាប់ចុចព្រួញ រំកិលជ្រុងមួយ។ សង្កត់ Shift ដើម្បីរំកិលវាឆ្ងាយជាងនេះ។"],
  cornerTL: ["Top-left corner", "ជ្រុងខាងលើ ខាងឆ្វេង"],
  cornerTR: ["Top-right corner", "ជ្រុងខាងលើ ខាងស្តាំ"],
  cornerBR: ["Bottom-right corner", "ជ្រុងខាងក្រោម ខាងស្តាំ"],
  cornerBL: ["Bottom-left corner", "ជ្រុងខាងក្រោម ខាងឆ្វេង"],
  yourPicture: ["Your picture", "រូបរបស់អ្នក"],
  readThis: ["Read this page", "អានទំព័រនេះ"],
  wholePicture: ["Use the whole picture", "ប្រើរូបទាំងមូល"],
  backToText: ["Back to the text", "ត្រឡប់ទៅអត្ថបទវិញ"],
  // on each page's text, for a photo or a screenshot: opens state 1c for that page and reads it again
  adjustThis: ["Adjust this page", "តម្រឹមទំព័រនេះ"],
  // ── 2 · first use ──────────────────────────────────────────────────────────────────────────────────────────────────
  ready: ["Getting the reader ready", "កំពុងរៀបចំម៉ូដែលអាន"],
  readyLede: ["This happens once. The reader is kept in this browser, so next time it starts straight away.",
    "ការនេះកើតឡើងតែម្តង។ ម៉ូដែលត្រូវបានរក្សាទុកក្នុងកម្មវិធីរុករកនេះ ដូច្នេះលើកក្រោយវាចាប់ផ្តើមភ្លាមៗ។"],
  waiting: ["Your page, waiting to be read", "ទំព័ររបស់អ្នក កំពុងរង់ចាំការអាន"],
  working: ["Working", "កំពុងដំណើរការ"],
  fromSite: ["It comes from this site, not from anywhere else, and your page stays on this device.",
    "វាមកពីគេហទំព័រនេះ មិនមែនពីកន្លែងផ្សេងទេ ហើយទំព័ររបស់អ្នកនៅតែលើឧបករណ៍នេះ។"],
  // ── 3 · reading ────────────────────────────────────────────────────────────────────────────────────────────────────
  reading: ["Reading", "កំពុងអាន"],
  leafIs: ["This page is in", "ទំព័រនេះជា"],
  pali: ["Pāli", "បាលី"],
  khmer: ["Khmer", "ខ្មែរ"],
  leafNote: ["Found by the reader. Tap the other to switch.", "ម៉ូដែលបានរកឃើញ។ ចុចមួយទៀត ដើម្បីប្តូរ។"],
  readSoFar: ["Read so far", "បានអានរួច"],
  stop: ["Stop", "បញ្ឈប់"],
  // D4 (desktop) — "Your page": KM is the drawings' own ទំព័ររបស់អ្នក (from S2's caption); the caption under it is KM UNDRAWN
  yourPage: ["Your page", "ទំព័ររបស់អ្នក"],
  linesOutlined: ["The lines it found are outlined. Check the text against them.", null],
  // ── 4 · result ─────────────────────────────────────────────────────────────────────────────────────────────────────
  theText: ["The text", "អត្ថបទ"],
  roman: ["Show in roman letters", "បង្ហាញជាអក្សរឡាតាំង"],
  copy: ["Copy", "ចម្លង"],
  download: ["Download .txt", "ទាញយក .txt"],
  checkPrint: ["Check it against the print.", "សូមផ្ទៀងផ្ទាត់វាជាមួយសៀវភៅបោះពុម្ព។"],
  tapHint: ["Tap a word for its meaning. Select words to hear them or ask about them.",
    "ចុចលើពាក្យមួយ ដើម្បីមើលន័យ។ ជ្រើសពាក្យ ដើម្បីស្តាប់ ឬសួរអំពីវា។"],
  // D4's computer wording; the Khmer ចុច is both "tap" and "click", so it is the drawn Khmer of tapHint
  clickHint: ["Click a word for its meaning. Select words to hear them or ask about them.",
    "ចុចលើពាក្យមួយ ដើម្បីមើលន័យ។ ជ្រើសពាក្យ ដើម្បីស្តាប់ ឬសួរអំពីវា។"],
  // the hints' first sentence alone, while Listen is not available (a sentence about hearing would promise a missing button)
  tapHintNoListen: ["Tap a word for its meaning.", "ចុចលើពាក្យមួយ ដើម្បីមើលន័យ។"],
  clickHintNoListen: ["Click a word for its meaning.", "ចុចលើពាក្យមួយ ដើម្បីមើលន័យ។"],
  romanNote: ["Roman letters are our own transliteration, for convenience. The Khmer script is the text.",
    "អក្សរឡាតាំងជាការចម្លងអក្សររបស់យើង ដើម្បីភាពងាយស្រួល។ អក្សរខ្មែរគឺជាអត្ថបទ។"],
  readAnother: ["Read another page", "អានទំព័រផ្សេងទៀត"],
  // NOT DRAWN (Edit, 2026-11-20): our words, our Khmer draft
  edit: ["Edit", "កែអត្ថបទ"],
  done: ["Done", "រួចរាល់"],
  editNote: ["Your edits live only in this page. Copy or download them to keep them.",
    "ការកែរបស់អ្នក មាននៅតែក្នុងទំព័រនេះ។ សូមចម្លង ឬទាញយក ដើម្បីរក្សាទុកវា។"],
  // ── 5 · nothing found ──────────────────────────────────────────────────────────────────────────────────────────────
  nothingTitle: ["No lines of text found", "រកមិនឃើញបន្ទាត់អត្ថបទទេ"],
  nothingLede: ["The reader found no printed lines in this picture.", "ម៉ូដែលរកមិនឃើញបន្ទាត់អក្សរបោះពុម្ពក្នុងរូបនេះទេ។"],
  whatHelps: ["What helps", "អ្វីដែលជួយបាន"],
  help1: ["A flat page, well lit, with no shadow across it.", "ទំព័ររាបស្មើ មានពន្លឺល្អ គ្មានស្រមោលពាក់កណ្តាល។"],
  help2: ["The whole page in the picture, taken straight on.", "ទំព័រទាំងមូលនៅក្នុងរូប ថតត្រង់ពីលើ។"],
  help3: ["A page of the Buddhist Institute edition (1927–69).", "ទំព័រនៃព្រះត្រៃបិដកបោះពុម្ពរបស់ពុទ្ធសាសនបណ្ឌិត្យ (១៩២៧–១៩៦៩)។"],
  scanBest: ["A scan reads best. Photos from a phone have not been measured yet.",
    "ស្កេនអានបានល្អបំផុត។ រូបថតពីទូរសព្ទ មិនទាន់ត្រូវបានវាស់វែងនៅឡើយទេ។"],
  tryAnother: ["Try another page", "សាកល្បងទំព័រផ្សេង"],
  // ── 6 · not this print ─────────────────────────────────────────────────────────────────────────────────────────────
  otherTitle: ["This may not be the print it knows", "នេះប្រហែលមិនមែនជាអក្សរបោះពុម្ពដែលវាស្គាល់ទេ"],
  // re-worded 2026-11-25 with pilot 5 (the readers now read other printings, and the flag is a forecast of a bad read); our Khmer, a draft
  otherLede: ["It read this page with low confidence, so what it read is likely to have many mistakes. The readers know the Buddhist Institute's Tipiṭaka (1927–69) best.",
    "វាអានទំព័រនេះដោយទំនុកចិត្តទាប ដូច្នេះអ្វីដែលវាអាន ទំនងជាមានកំហុសច្រើន។ ម៉ូដែលទាំងនេះស្គាល់ព្រះត្រៃបិដករបស់ពុទ្ធសាសនបណ្ឌិត្យ (១៩២៧–១៩៦៩) ច្បាស់ជាងគេ។"],
  showAnyway: ["Show what it read anyway", "បង្ហាញអ្វីដែលវាបានអាន"],
  // ── 7 · about and credits ──────────────────────────────────────────────────────────────────────────────────────────
  aboutTitle: ["About and credits", "អំពី និងការទទួលស្គាល់"],
  whatReadsLong: ["Pāli and Khmer printed in Khmer script: both pages of each opening of the Buddhist Institute edition of the Tipiṭaka (Phnom Penh, 1927–69). It tells which one a page is, and you can switch it.",
    "បាលី និងខ្មែរ ដែលបោះពុម្ពជាអក្សរខ្មែរ៖ ទំព័រទាំងពីរនៃការបើកនីមួយៗ នៃព្រះត្រៃបិដកបោះពុម្ពរបស់ពុទ្ធសាសនបណ្ឌិត្យ (ភ្នំពេញ ១៩២៧–១៩៦៩)។ វាដឹងថាទំព័រនីមួយៗជាភាសាណា ហើយអ្នកអាចប្តូរវាបាន។"],
  howWell: ["How well it reads", "វាអានបានល្អប៉ុណ្ណា"],
  // updated 2026-11-25 to OCR pilot 5's registered figures (median page, characters wrong, the compact models the site loads, pages
  // never used in training; the scorer renders each PDF page itself: SW/tipitaka-khmer pilot/ocr5-2026-11-23/RESULTS.md). Read
  // HERE from a 300-dpi image (scripts/confidence.ts, 80 + 80 edition pages) the edition comes out a little worse, for every model
  // alike: A5 1.9% · 1.0% (pilot 4's A 2.0% · 1.2%), B 2.3% · 2.4%. Our Khmer, a draft
  howWell1: ["In a test written down before training, on pages the models never saw, Most accurate got 1.4% of characters wrong on the edition's Pāli pages and 1.0% on its Khmer pages, 1.1% and 1.3% on a re-setting of it typed in Taiwan (2009–14), 2.3% on printed Pāli commentaries, and 1.2% on a 2009 Khmer printing. Public domain: 2.1% and 2.2% on the edition, 7.4% and 10.1% on the Taiwan re-setting, 9.3% on the commentaries, 5.9% on the 2009 printing. Public domain, other printings: 2.2% and 2.3% on the edition, 3.0% and 3.3% on the Taiwan re-setting, 2.8% on the commentaries, 3.3% on the 2009 printing; it missed three of the bars set before training (3.0%), by less than 0.3 points, and is offered for those printings anyway.",
    "ក្នុងការសាកល្បងដែលបានសរសេរទុកមុនការបង្ហាត់ លើទំព័រដែលម៉ូដែលមិនធ្លាប់ឃើញ ត្រឹមត្រូវបំផុត ខុស ១,៤% នៃតួអក្សរ លើទំព័របាលីនៃការបោះពុម្ព និង ១,០% លើទំព័រខ្មែររបស់វា, ១,១% និង ១,៣% លើការបោះពុម្ពដែលវាយអក្សរឡើងវិញនៅតៃវ៉ាន់ (២០០៩–២០១៤), ២,៣% លើអដ្ឋកថាបាលីដែលបោះពុម្ព និង ១,២% លើការបោះពុម្ពខ្មែរឆ្នាំ ២០០៩។ កម្មសិទ្ធិសាធារណៈ៖ ២,១% និង ២,២% លើការបោះពុម្ព, ៧,៤% និង ១០,១% លើការបោះពុម្ពនៅតៃវ៉ាន់, ៩,៣% លើអដ្ឋកថា និង ៥,៩% លើការបោះពុម្ពឆ្នាំ ២០០៩។ កម្មសិទ្ធិសាធារណៈ សម្រាប់ការបោះពុម្ពផ្សេងៗ៖ ២,២% និង ២,៣% លើការបោះពុម្ព, ៣,០% និង ៣,៣% លើការបោះពុម្ពនៅតៃវ៉ាន់, ២,៨% លើអដ្ឋកថា និង ៣,៣% លើការបោះពុម្ពឆ្នាំ ២០០៩។ វាមិនបានដល់កម្រិតបីដែលបានកំណត់ទុកមុនការបង្ហាត់ (៣,០%) ដោយខ្វះតិចជាង ០,៣ ហើយត្រូវបានផ្តល់ជូនសម្រាប់ការបោះពុម្ពទាំងនោះដដែល។"],
  howWell2: ["Most accurate also learned three other Khmer typefaces, from lines drawn by a computer; Public domain knows only the edition's. Both learned from one transcriber's typing, including some of their habits. The Vinaya volumes read least well, and photos from a phone have not been measured yet.",
    "ត្រឹមត្រូវបំផុត ក៏បានរៀនពុម្ពអក្សរខ្មែរបីផ្សេងទៀតដែរ ពីបន្ទាត់ដែលគូរដោយកុំព្យូទ័រ ឯកម្មសិទ្ធិសាធារណៈ ស្គាល់តែពុម្ពអក្សរនៃការបោះពុម្ពនោះប៉ុណ្ណោះ។ ទាំងពីររៀនពីការវាយអក្សររបស់អ្នកចម្លងម្នាក់ រួមទាំងទម្លាប់ខ្លះរបស់គាត់។ ភាគវិន័យអានបានខ្សោយជាងគេ ហើយរូបថតពីទូរសព្ទមិនទាន់ត្រូវបានវាស់វែងនៅឡើយទេ។"],
  checkWhat: ["Check what it reads against the print.", "សូមផ្ទៀងផ្ទាត់អ្វីដែលវាអាន ជាមួយសៀវភៅបោះពុម្ព។"],
  // shown in Khmer only (the drawing's one Khmer line saying the text below stays English)
  staysEnglish: ["", "សេចក្តីអំពីឯកជនភាព អាជ្ញាប័ណ្ណ និងការទទួលស្គាល់ ខាងក្រោមនេះ នៅជាភាសាអង់គ្លេស រហូតដល់អ្នកអានជនជាតិខ្មែរអនុម័តការបកប្រែ។"],
  privacyHead: ["Your privacy", "ឯកជនភាពរបស់អ្នក"],
  twoReaders: ["The two readers", "ម៉ូដែលអានទាំងពីរ"],
  credits: ["Credits", "ការទទួលស្គាល់"],
  dhp: ["The gift of the Dhamma surpasses every gift. Dhammapada 354", "ធម្មទាន ឈ្នះទានទាំងពួង។ ធម្មបទ ៣៥៤"],
  // ── 8 · a word's entry ─────────────────────────────────────────────────────────────────────────────────────────────
  dictName: ["Samdech Chuon Nath's dictionary", "វចនានុក្រម សម្តេចព្រះសង្ឃរាជ ជួន ណាត"],
  viaEnding: ["You tapped {tapped}. This is {head}, the same word without its Pāli ending.",
    "អ្នកបានចុចលើ {tapped}។ នេះគឺ {head} ពាក្យដដែល ដោយគ្មានចុងពាក្យបាលី។"],
  abbrPali: ["Pāli", "បាលី"],
  abbrNoun: ["noun", "នាម"],
  dictNote: ["A Khmer dictionary: it fits Khmer pages, and Pāli words that entered Khmer. When a word has no entry, it says so and never guesses.",
    "វចនានុក្រមខ្មែរ៖ វាសមនឹងទំព័រខ្មែរ និងពាក្យបាលីដែលចូលមកក្នុងភាសាខ្មែរ។ ពេលពាក្យមួយគ្មានក្នុងវចនានុក្រម វាប្រាប់ដូច្នោះ ហើយមិនទាយឡើយ។"],
  // NOT DRAWN (the drawings have no no-entry state): built from the drawn note's own words
  noEntry: ["This word has no entry.", "ពាក្យនេះគ្មានក្នុងវចនានុក្រម។"],
  close: ["Close", "បិទ"],
  // ── 9 · a passage selected ─────────────────────────────────────────────────────────────────────────────────────────
  listen: ["Listen", "ស្តាប់"],
  askAbout: ["Ask about this", "សួរអំពីនេះ"],
  khmerVoice: ["Khmer voice", "សំឡេងខ្មែរ"],
  woman: ["woman", "ស្ត្រី"],
  man: ["man", "បុរស"],
  listenNote: ["Listen sends only the words you selected to our voice service, which has Azure's Khmer voices read them aloud. Nothing is sent until you press Listen. Your image and the rest of the text stay on this device.",
    "ស្តាប់ ផ្ញើតែពាក្យដែលអ្នកបានជ្រើស ទៅសេវាសំឡេងរបស់យើង ដែលឱ្យសំឡេងខ្មែររបស់ Azure អានឮៗ។ គ្មានអ្វីត្រូវបានផ្ញើទេ រហូតដល់អ្នកចុច ស្តាប់។ រូបភាព និងអត្ថបទផ្សេងទៀតរបស់អ្នក នៅលើឧបករណ៍នេះ។"],
  // ── 10 · ask ───────────────────────────────────────────────────────────────────────────────────────────────────────
  askTitle: ["Ask about this passage", "សួរអំពីអត្ថបទនេះ"],
  yourQuestion: ["Your question", "សំណួររបស់អ្នក"],
  askIn: ["Ask in", "សួរនៅ"],
  justCopy: ["Just copy it", "ចម្លងប៉ុណ្ណោះ"],
  justCopySub: ["The passage and your question, ready to paste anywhere", "អត្ថបទ និងសំណួររបស់អ្នក រួចរាល់សម្រាប់បិទភ្ជាប់គ្រប់ទីកន្លែង"],
  opensNewTab: ["Opens in a new tab", "បើកក្នុងផ្ទាំងថ្មី"],
  // NOT DRAWN (bedok.siliconwat.org's way: copy, then open): our words, our Khmer draft
  copyThenOpen: ["Ask copies the passage and your question, then opens the assistant. Paste them there.", "សួរ ចម្លងអត្ថបទ និងសំណួររបស់អ្នក រួចបើកជំនួយការ។ សូមបិទភ្ជាប់នៅទីនោះ។"],
  fromSiliconWat: ["From Silicon Wat ℠", "ពី Silicon Wat ℠"],
  askCaution: ["AI assistants may assume a different edition's wording. Check what it says against the print.",
    "ជំនួយការ AI អាចសន្មតយកពាក្យពេចន៍នៃការបោះពុម្ពផ្សេង។ សូមផ្ទៀងផ្ទាត់អ្វីដែលវានិយាយ ជាមួយសៀវភៅបោះពុម្ព។"],
  ask: ["Ask", "សួរ"],
  nothingLeaves: ["Nothing leaves this page until you press Ask.", "គ្មានអ្វីចេញពីទំព័រនេះទេ រហូតដល់អ្នកចុច សួរ។"],
  // ── toasts and problems: NOT DRAWN ─────────────────────────────────────────────────────────────────────────────────
  copied: ["Copied", "បានចម្លង"],
  copiedPaste: ["Copied. Paste it into the assistant.", "បានចម្លង។ សូមបិទភ្ជាប់ទៅក្នុងជំនួយការ។"],
  linkCopied: ["Link copied", "បានចម្លងតំណ"],
  notAFile: ["Choose a photo, a scan or a PDF.", "សូមជ្រើស រូបថត ស្កេន ឬ PDF។"],
  cannotOpen: ["This file could not be opened.", "មិនអាចបើកឯកសារនេះបានទេ។"],
  cannotRead: ["The page could not be read. Try again.", "មិនអាចអានទំព័រនេះបានទេ។ សូមសាកល្បងម្តងទៀត។"],
  cannotCopy: ["Could not copy here.", "មិនអាចចម្លងនៅទីនេះបានទេ។"],
  // NOT DRAWN (several pictures at once, 2026-11-20): our words, our Khmer draft
  pdfAlone: ["A PDF is read on its own. Choose it by itself.", "PDF មួយត្រូវអានដាច់ដោយឡែក។ សូមជ្រើសវាតែមួយ។"],
  // NOT DRAWN: the keyboard's way to the dictionary (one selected word); our words, our Khmer draft
  meaning: ["Meaning", "ន័យ"],
  tooLong: ["Select a shorter passage to hear it.", "សូមជ្រើសអត្ថបទខ្លីជាងនេះ ដើម្បីស្តាប់។"],
  didNotWork: ["That did not work. Try again.", "មិនបានសម្រេចទេ។ សូមសាកល្បងម្តងទៀត។"],
  // the Khmer band (both languages at once, by design)
  bandEn: ["Khmer: our draft, not yet reviewed", "Khmer: our draft, not yet reviewed"],
  bandKm: ["ភាសាខ្មែរ៖ សេចក្តីព្រាងរបស់យើង មិនទាន់បានពិនិត្យ", "ភាសាខ្មែរ៖ សេចក្តីព្រាងរបស់យើង មិនទាន់បានពិនិត្យ"],
} satisfies Record<string, readonly [string, string | null]>;

export type Key = keyof typeof S;
/** Every entry, in order: [English, our Khmer draft or null]. scripts/review-km.mjs prints them for a native reader's review. */
export const ENTRIES: Readonly<Record<Key, readonly [string, string | null]>> = S;

let lang: Lang = typeof document !== "undefined" && document.documentElement.lang === "km" ? "km" : "en";
const subs = new Set<() => void>();

export const getLang = (): Lang => lang;
export function setLang(l: Lang) {
  if (l === lang) return;
  lang = l;
  document.documentElement.lang = l;
  store.set(KEYS.lang, l);
  subs.forEach((f) => f());
}
export function onLang(f: () => void): () => void {
  subs.add(f);
  return () => subs.delete(f);
}

const KM_DIGITS = "០១២៣៤៥៦៧៨៩";
/** A number in the page's language (Khmer digits in Khmer). */
export const num = (n: number): string =>
  lang === "km" ? String(n).replace(/[0-9]/g, (d) => KM_DIGITS[+d]) : String(n);
/** Reads a number typed in either digit set; NaN if none. */
export function parseNum(s: string): number {
  const latin = s.replace(/[០-៩]/g, (d) => String(KM_DIGITS.indexOf(d))).replace(/[^0-9]/g, "");
  return latin ? parseInt(latin, 10) : NaN;
}

function fill(s: string, vars?: Record<string, string | number>): string {
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (_, k) => {
    const v = vars[k];
    return typeof v === "number" ? num(v) : (v ?? "");
  });
}
/** The words for `key` in the page's language (English where the drawings give no Khmer). */
export function t(key: Key, vars?: Record<string, string | number>): string {
  const [en, km] = S[key] as readonly [string, string | null];
  return fill(lang === "km" && km !== null ? km : en, vars);
}
/** The language the words for `key` are actually in: "en" where the Khmer is undrawn (so the element can say lang="en"). */
export function langOf(key: Key): Lang {
  return lang === "km" && (S[key] as readonly [string, string | null])[1] !== null ? "km" : "en";
}
