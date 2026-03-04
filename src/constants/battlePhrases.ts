import { Language } from '../context/LanguageContext';

export type BattleCategory = 'MISS' | 'DODGE' | 'LIGHT_HIT' | 'MEDIUM_HIT' | 'HEAVY_HIT' | 'CRITICAL_HIT' | 'FINISHER' | 'TAKEDOWN_ATTEMPT' | 'TAKEDOWN_DEFENSE' | 'GROUND_CONTROL' | 'SUBMISSION_ATTEMPT' | 'SUBMISSION_ESCAPE';

// Body part type (mirrored here for use in log generation)
export type BodyPart = 'head' | 'body' | 'legs';

// ─────────────────────────────────────────────────────────────────────────────
// CLINCH MOVES — used during the standing clinch phase
// ─────────────────────────────────────────────────────────────────────────────
export const CLINCH_MOVES: Record<Language, string[]> = {
  en: [
    'short elbow in the clinch', 'clinch knee to the body', 'dirty boxing right hand',
    'Thai plum knee', 'uppercut from the clinch', 'body shot in the clinch',
    'short left hook in the clinch', 'clinch elbow to the temple',
  ],
  cs: [
    'krátký loket v klinči', 'koleno do těla v klinči', 'dirty boxing pravou',
    'koleno z Thai plumu', 'zvedák z klinče', 'úder do těla v klinči',
    'krátký levý hák v klinči', 'loket na spánek v klinči',
  ],
  pl: [
    'krótki łokieć w klinczu', 'kolano w tułów w klinczu', 'dirty boxing prawą',
    'kolano z Thai plum', 'uppercut z klinczu', 'cios w ciało w klinczu',
    'krótki lewy sierpowy w klinczu', 'łokieć w skroń w klinczu',
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// CONTEXTUAL MOVE TEMPLATES — UFC play-by-play commentary per move type
// ─────────────────────────────────────────────────────────────────────────────
export type MoveContext =
  | 'leg_kick' | 'body_kick' | 'head_kick' | 'jab' | 'cross' | 'hook'
  | 'uppercut' | 'overhand' | 'elbow' | 'knee' | 'double_leg' | 'single_leg'
  | 'clinch_work' | 'ground_and_pound' | 'submission' | 'generic';

export const CONTEXTUAL_TEMPLATES: Record<Language, Record<MoveContext, string[]>> = {
  en: {
    leg_kick: [
      '{attacker} lands a thunderous leg kick, punishing {defender}\'s lead thigh!',
      '{attacker} chops down {defender}\'s lead leg with a vicious low kick!',
      'A sharp leg kick from {attacker} targets the outer thigh of {defender}!',
      '{defender}\'s leg buckles slightly as {attacker} lands another devastating low kick!',
      '{attacker} keeps working the leg kick, conditioning {defender}\'s thigh!',
    ],
    body_kick: [
      '{attacker} drives a body kick square into {defender}\'s ribs!',
      'A well-timed body kick from {attacker} lands clean on {defender}\'s midsection!',
      '{defender} visibly winces as {attacker}\'s body kick sinks in!',
      '{attacker} targets the liver with a savage body kick!',
    ],
    head_kick: [
      '{attacker} launches a head kick — {defender} barely manages to duck under it!',
      'A SPECTACULAR head kick from {attacker} catches {defender} fully!',
      '{attacker} pivots and fires a head kick at {defender}!',
    ],
    jab: [
      '{attacker} flicks out a sharp jab, keeping {defender} honest!',
      'A stiff jab from {attacker} snaps {defender}\'s head back!',
      '{attacker} uses the jab to set up the combination on {defender}!',
      '{attacker} establishes range with a stiff jab to {defender}\'s face!',
    ],
    cross: [
      '{attacker} fires a straight right cross that connects flush on {defender}!',
      'A textbook cross from {attacker} finds the chin of {defender}!',
      '{attacker} loads up and drops a hard cross on {defender}!',
    ],
    hook: [
      '{attacker} catches {defender} with a sharp left hook!',
      'A powerful hook from {attacker} turns {defender}\'s head!',
      '{attacker} digs in with a looping hook to {defender}\'s temple!',
    ],
    uppercut: [
      '{attacker} sneaks a short uppercut up through {defender}\'s guard!',
      'A tight uppercut from {attacker} lifts {defender}\'s chin!',
      '{attacker} times the uppercut perfectly as {defender} circles in!',
    ],
    overhand: [
      '{attacker} slings a wild overhand right that catches {defender}!',
      'The overhand from {attacker} arcs over {defender}\'s guard and lands flush!',
      '{attacker} throws a looping overhand right that finds its mark on {defender}!',
    ],
    elbow: [
      '{attacker} opens a nasty cut with a short elbow in the clinch on {defender}!',
      'A vicious upward elbow from {attacker} slices into {defender}!',
      '{attacker} is working short elbows to the head of {defender}!',
    ],
    knee: [
      '{attacker} drives a powerful knee into the midsection of {defender}!',
      'A devastating knee from {attacker} finds {defender}\'s body!',
      '{attacker} clinches tight and delivers a punishing knee to {defender}!',
    ],
    double_leg: [
      '{attacker} shoots in for a double-leg and successfully slams {defender} to the canvas!',
      '{attacker} changes levels explosively and drives {defender} hard to the mat!',
      'A perfect double-leg takedown — {attacker} puts {defender} down with authority!',
    ],
    single_leg: [
      '{attacker} grabs the single leg and runs the pipe, toppling {defender}!',
      '{attacker} scoops up {defender}\'s lead leg and finishes the single-leg takedown!',
      'A clean single-leg from {attacker} takes {defender} completely off their feet!',
    ],
    clinch_work: [
      '{attacker} ties up {defender} against the fence and works the dirty clinch!',
      '{attacker} is working the clinch, landing short elbows to the head of {defender}!',
      'Dirty boxing in the clinch — {attacker} works the body of {defender}!',
      '{attacker} anchors the Thai plum and fires knees at {defender}!',
    ],
    ground_and_pound: [
      '{attacker} rains down ground and pound from full mount on {defender}!',
      '{attacker} postures up and opens up with hammerfists on {defender}!',
      'Ground and pound from {attacker} — the elbows are landing flush on {defender}!',
      '{attacker} advances to full mount and drops bombs on {defender}!',
    ],
    submission: [
      '{attacker} sinks in the choke — {defender} is going to sleep!',
      '{attacker} locks up the armbar — {defender} has to tap!',
      'Beautiful submission work from {attacker}! {defender} is in deep trouble!',
    ],
    generic: [
      '{attacker} connects with the {move} on {defender}!',
      '{attacker}\'s {move} lands on {defender}!',
    ],
  },
  cs: {
    leg_kick: [
      '{attacker} zasazuje drtivý low kick a trestá přední stehno soupeře {defender}!',
      '{attacker} sekne low kickem do přední nohy {defender}!',
      'Ostrý low kick od {attacker} cílí na vnější stranu stehna {defender}!',
      'Noha {defender} se mírně podlomí po ničivém low kicku od {attacker}!',
      '{attacker} neustále pracuje low kickem a kondicionuje stehno {defender}!',
    ],
    body_kick: [
      '{attacker} posílá kop do těla přímo do žeber soupeře {defender}!',
      'Dobře načasovaný kop do těla od {attacker} přistál čistě do středu {defender}!',
      '{defender} viditelně zaváhá, když kop do těla od {attacker} dopadne!',
      '{attacker} cílí na játra krutým kopem do těla!',
    ],
    head_kick: [
      '{attacker} vymrští kop na hlavu — {defender} se sotva stačí sehnout!',
      'SPEKTAKULÁRNÍ kop na hlavu od {attacker} trefil {defender}!',
      '{attacker} se otočí a spustí kop na hlavu na {defender}!',
    ],
    jab: [
      '{attacker} vystřeluje ostrý jab a udržuje {defender} v ostražitosti!',
      'Tuhý jab od {attacker} škubne hlavou soupeře {defender}!',
      '{attacker} používá jab k nastavení kombinace na {defender}!',
      '{attacker} ustavuje vzdálenost tvrdým jabem do obličeje {defender}!',
    ],
    cross: [
      '{attacker} vypálí přímý cross, který přistane čistě na {defender}!',
      'Učebnicový cross od {attacker} trefí bradu {defender}!',
      '{attacker} se opře a srazí tvrdý cross na {defender}!',
    ],
    hook: [
      '{attacker} trefí {defender} ostrým levým hákem!',
      'Mocný hák od {attacker} otočí hlavu soupeře {defender}!',
      '{attacker} zaboří oblý hák do spánku {defender}!',
    ],
    uppercut: [
      '{attacker} propašuje krátký zvedák nahoru skrz obranu {defender}!',
      'Těsný zvedák od {attacker} nadzvedne bradu {defender}!',
      '{attacker} perfektně načasuje zvedák jak {defender} přichází!',
    ],
    overhand: [
      '{attacker} posílá divoký overhand pravou, který trefí {defender}!',
      'Overhand od {attacker} se oblukuje přes obranu a přistane čistě!',
      '{attacker} hází oblukový overhand pravou, který najde svůj cíl na {defender}!',
    ],
    elbow: [
      '{attacker} otevírá nepěkné řezné ranky krátkým loktem v klinči na {defender}!',
      'Brutální vzestupný loket od {attacker} říznul do {defender}!',
      '{attacker} pracuje krátkými lokty do hlavy {defender}!',
    ],
    knee: [
      '{attacker} vrazí mocné koleno do střední části těla {defender}!',
      'Devastující koleno od {attacker} trefí tělo {defender}!',
      '{attacker} vstoupí do klinče a zasadí trestající koleno na {defender}!',
    ],
    double_leg: [
      '{attacker} střílí double leg a úspěšně sloml {defender} na plátno!',
      '{attacker} výbušně mění výšku a řídí {defender} tvrdě na žíněnku!',
      'Perfektní double leg takedown — {attacker} srazil {defender} s autoritou!',
    ],
    single_leg: [
      '{attacker} chytne single leg a dotahuje ho, čímž shodí {defender}!',
      '{attacker} sebere přední nohu {defender} a dokončí single leg takedown!',
      'Čistý single leg od {attacker} sfukne {defender} z nohou!',
    ],
    clinch_work: [
      '{attacker} svazuje {defender} u pletiva a pracuje v klinči!',
      '{attacker} pracuje v klinči a posílá krátké lokty do hlavy {defender}!',
      'Dirty boxing v klinči — {attacker} opracovává tělo {defender}!',
      '{attacker} kotví Thai plum a střílí kolena na {defender}!',
    ],
    ground_and_pound: [
      '{attacker} zasypává soupeře ground and poundem z full mountu!',
      '{attacker} se vzpřimuje a otevírá kladivovými údery na {defender}!',
      'Ground and pound od {attacker} — lokty dopadají čistě na {defender}!',
      '{attacker} přechází do full mountu a shazuje bomby na {defender}!',
    ],
    submission: [
      '{attacker} nasazuje choke hluboko — {defender} zakrátko usne!',
      '{attacker} zamkl páku na loket — {defender} musí odklepat!',
      'Krásná submisní práce od {attacker}! {defender} je ve velkých potížích!',
    ],
    generic: [
      '{attacker} spojil {move} na {defender}!',
      '{move} od {attacker} přistál na {defender}!',
    ],
  },
  pl: {
    leg_kick: [
      '{attacker} ląduje grzmiącym kopnięciem w nogę, karcąc prowadzące udo {defender}!',
      '{attacker} sieknie low kickiem w przednią nogę {defender}!',
      'Ostry low kick od {attacker} celuje w zewnętrzne udo {defender}!',
      'Noga {defender} lekko ugina się po niszczącym low kicku od {attacker}!',
      '{attacker} pracuje low kickiem, kondycjonując udo {defender}!',
    ],
    body_kick: [
      '{attacker} wbija kopnięcie w ciało prosto w żebra {defender}!',
      'Dobrze wyczuty kopnięcie w tułów od {attacker} ląduje czysto na środku {defender}!',
      '{defender} widocznie wzdryga się gdy kopnięcie w ciało od {attacker} trafia!',
      '{attacker} celuje w wątrobę dzikim kopnięciem w tułów!',
    ],
    head_kick: [
      '{attacker} wystrzeliwuje kopnięcie w głowę — {defender} ledwo się nisko schyla!',
      'SPEKTAKULARNE kopnięcie w głowę od {attacker} trafia {defender}!',
      '{attacker} obraca się i wyprowadza kopnięcie w głowę na {defender}!',
    ],
    jab: [
      '{attacker} strzela ostrym jabem, trzymając {defender} w szachu!',
      'Sztywny prosty cios od {attacker} szarpie głową {defender}!',
      '{attacker} używa jabem do ustawiania kombinacji na {defender}!',
      '{attacker} ustala dystans sztywnym jabem w twarz {defender}!',
    ],
    cross: [
      '{attacker} wyprowadza prosty krzyżowy cios, który trafia czysto na {defender}!',
      'Podręcznikowy krzyżowy cios od {attacker} trafia podbródek {defender}!',
      '{attacker} ładuje się i spuszcza twardy krzyżowy cios na {defender}!',
    ],
    hook: [
      '{attacker} lapie {defender} ostrym sierpowym lewą!',
      'Potężny sierpowy od {attacker} obraca głowę {defender}!',
      '{attacker} wbija wielki sierpowy w skroń {defender}!',
    ],
    uppercut: [
      '{attacker} przemyca krótki uppercut przez gardę {defender}!',
      'Ciasny uppercut od {attacker} unosi szczękę {defender}!',
      '{attacker} doskonale wyczuwa chwilę na uppercut gdy {defender} wchodzi!',
    ],
    overhand: [
      '{attacker} rzuca dziki overhand prawą który trafia {defender}!',
      'Overhand od {attacker} łukiem przechodzi przez gardę i ląduje czysto!',
      '{attacker} rzuca łukowaty overhand prawą który trafia w cel na {defender}!',
    ],
    elbow: [
      '{attacker} otwiera brzydkie nacięcie krótkim łokciem w klinczu na {defender}!',
      'Brutalny górny łokieć od {attacker} roznosi twarz {defender}!',
      '{attacker} pracuje krótkimi łokciami w głowę {defender}!',
    ],
    knee: [
      '{attacker} wbija potężne kolano w środkową część ciała {defender}!',
      'Niszczące kolano od {attacker} trafia ciało {defender}!',
      '{attacker} wchodzi w klinch i zadaje karzące kolano {defender}!',
    ],
    double_leg: [
      '{attacker} strzela obalenie double-leg i skutecznie ciska {defender} na matę!',
      '{attacker} wybuchowo zmienia poziom i kieruje {defender} twardo na tatami!',
      'Idealne obalenie double-leg — {attacker} kładzie {defender} z autorytetem!',
    ],
    single_leg: [
      '{attacker} łapie single-leg i wykańcza obalenie, przewracając {defender}!',
      '{attacker} zbiera przednią nogę {defender} i kończy obalenie single-leg!',
      'Czyste obalenie single-leg od {attacker} zrzuca {defender} z nóg!',
    ],
    clinch_work: [
      '{attacker} przykrywa {defender} przy siatce i pracuje w brudnym klinczu!',
      '{attacker} pracuje w klinczu, lądując krótkie łokcie w głowę {defender}!',
      'Dirty boxing w klinczu — {attacker} pracuje ciało {defender}!',
      '{attacker} zakotwicza Thai plum i strzela kolanami w {defender}!',
    ],
    ground_and_pound: [
      '{attacker} sypie ground and pound z pełnego mountu na {defender}!',
      '{attacker} prostuje się i otwiera uderzeniami z góry na {defender}!',
      'Ground and pound od {attacker} — łokcie lądują czysto na {defender}!',
      '{attacker} przechodzi do pełnego mountu i spuszcza bomby na {defender}!',
    ],
    submission: [
      '{attacker} wbija duszenie głęboko — {defender} zaraz zaśnie!',
      '{attacker} zamknął dźwignię na łokieć — {defender} musi klepnąć!',
      'Piękna praca poddaniowa od {attacker}! {defender} jest w wielkich tarapatach!',
    ],
    generic: [
      '{attacker} łączy się z {move} na {defender}!',
      '{move} od {attacker} ląduje na {defender}!',
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// MOVE CONTEXT DETECTION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Identifies the MoveContext from a raw move string + category.
 * Used to select the correct contextual commentary template.
 */
export const getMoveContext = (move: string, category: BattleCategory): MoveContext => {
  const m = move.toLowerCase();
  if (category === 'SUBMISSION_ATTEMPT' || category === 'SUBMISSION_ESCAPE') return 'submission';
  if (category === 'GROUND_CONTROL') return 'ground_and_pound';
  if (category === 'TAKEDOWN_ATTEMPT') {
    if (m.includes('double') || m.includes('obalenie double')) return 'double_leg';
    if (m.includes('single') || m.includes('obalenie single')) return 'single_leg';
    return 'double_leg'; // default takedown
  }
  if (m.includes('clinch') || m.includes('klinč') || m.includes('klinch') || m.includes('klincz') || m.includes('dirty boxing') || m.includes('thai plum')) return 'clinch_work';
  if (m.includes('leg kick') || m.includes('low kick') || m.includes('kopnięcie w nogę') || m.includes('kopnięcie nogi')) return 'leg_kick';
  if (m.includes('body kick') || m.includes('kop na tělo') || m.includes('kopnięcie w korpus') || m.includes('kopnięcie w ciało')) return 'body_kick';
  if (m.includes('head kick') || m.includes('kop na hlavu') || m.includes('kopnięcie w głowę')) return 'head_kick';
  if (m.includes('jab') || m.includes('prosty cios')) return 'jab';
  if (m.includes('cross') || m.includes('krzyżowy')) return 'cross';
  if (m.includes('hook') || m.includes('hák') || m.includes('sierpowy')) return 'hook';
  if (m.includes('uppercut') || m.includes('zvedák')) return 'uppercut';
  if (m.includes('overhand')) return 'overhand';
  if (m.includes('elbow') || m.includes('loket') || m.includes('łokieć')) return 'elbow';
  if (m.includes('knee') || m.includes('koleno') || m.includes('kolano')) return 'knee';
  if (m.includes('ground and pound') || m.includes('hammerfist') || m.includes('kladivový')) return 'ground_and_pound';
  return 'generic';
};

/**
 * Generates a contextual, play-by-play UFC commentary log entry.
 * Uses move-specific templates when available; falls back to category templates.
 */
export const generateContextualLog = (
  category: BattleCategory,
  attacker: string,
  defender: string,
  move: string,
  targetPart: BodyPart,
  language: Language = 'en',
): string => {
  const lang = language as 'en' | 'cs' | 'pl';

  // Misses and dodges always use generic category phrasing
  if (category === 'MISS' || category === 'DODGE' || category === 'TAKEDOWN_DEFENSE' || category === 'SUBMISSION_ESCAPE') {
    const phrase = BATTLE_DATA[lang][category][Math.floor(Math.random() * BATTLE_DATA[lang][category].length)];
    return phrase.replace(/{attacker}/g, attacker).replace(/{defender}/g, defender).replace(/{move}/g, move);
  }

  const context = getMoveContext(move, category);

  // Use contextual template for meaningful moves
  const useContextual =
    context !== 'generic' ||
    (['TAKEDOWN_ATTEMPT', 'GROUND_CONTROL', 'SUBMISSION_ATTEMPT'] as BattleCategory[]).includes(category);

  if (useContextual) {
    const templates = CONTEXTUAL_TEMPLATES[lang][context];
    const template = templates[Math.floor(Math.random() * templates.length)];
    return template
      .replace(/{attacker}/g, attacker)
      .replace(/{defender}/g, defender)
      .replace(/{move}/g, move);
  }

  // Fallback: generic category template + target part label
  const baseMsg = getBattleMessage(category, attacker, defender, move, language);
  const partSuffix =
    targetPart === 'head' ? ' — targeting the head' :
    targetPart === 'body' ? ' — landing to the body' :
    ' — chopping the legs';
  const isStrike = (['LIGHT_HIT', 'MEDIUM_HIT', 'HEAVY_HIT', 'CRITICAL_HIT', 'FINISHER'] as BattleCategory[]).includes(category);
  return baseMsg + (isStrike ? partSuffix : '');
};

// ─────────────────────────────────────────────────────────────────────────────
// Ground & Pound moves (used ONLY when in GROUND phase — no kicks, no spinning)
export const GROUND_POUND_MOVES: Record<Language, string[]> = {
  en: [
    'short elbow', 'hammerfist', 'ground elbow', 'short right hand',
    'left elbow from mount', 'downward elbow', 'hammerfist to the temple',
    'ground and pound right', 'short uppercut from mount', 'brutal elbow',
  ],
  cs: [
    'krátký loket', 'kladivový úder', 'loket ze země', 'krátká pravačka',
    'loket z mountu', 'loket shora', 'kladivák na spánek',
    'ground and pound pravou', 'krátký zvedák z mountu', 'surový loket',
  ],
  pl: [
    'krótki łokieć', 'uderzenie z góry', 'łokieć z ziemi', 'krótka prawa',
    'łokieć z mountu', 'łokieć z góry', 'uderzenie w skroń',
    'ground and pound prawą', 'krótki uppercut z mountu', 'brutalny łokieć',
  ],
};

// Takedown moves in all languages
export const TAKEDOWN_MOVES: Record<Language, string[]> = {
  en: [
    'double-leg takedown', 'single-leg takedown', 'high-crotch takedown',
    'body lock trip', 'ankle pick', 'outside trip', 'suplex', 'hip toss',
    'arm drag to takedown', 'lateral drop',
  ],
  cs: [
    'double-leg takedown', 'single-leg takedown', 'high-crotch takedown',
    'strh z body locku', 'ankle pick', 'vnější zakopnutí', 'suplex', 'hod přes bok',
    'arm drag takedown', 'boční pád',
  ],
  pl: [
    'obalenie double-leg', 'obalenie single-leg', 'high-crotch',
    'powalenie z body locku', 'zbieranie kostki', 'wycieczka zewnętrzna', 'suplex', 'rzut biodrowy',
    'arm drag do obalenia', 'opad boczny',
  ],
};

// Submission moves in all languages
export const SUBMISSION_MOVES: Record<Language, string[]> = {
  en: [
    'rear-naked choke', 'armbar', 'triangle choke', 'guillotine choke',
    'kimura', 'omoplata', 'heel hook', 'ankle lock', 'darce choke',
    'anaconda choke', 'north-south choke', 'mounted triangle', 'arm triangle',
  ],
  cs: [
    'rear-naked choke', 'páka na loket', 'triangl', 'gilotina',
    'kimura', 'omoplata', 'heel hook', 'páka na kotník', 'darce choke',
    'anaconda choke', 'north-south choke', 'mounted triangl', 'arm triangl',
  ],
  pl: [
    'rear-naked choke', 'dźwignia na łokieć', 'trójkąt', 'gilotyna',
    'kimura', 'omoplata', 'heel hook', 'zamek kostki', 'darce choke',
    'anaconda choke', 'north-south choke', 'mounted trójkąt', 'arm trójkąt',
  ],
};

// MMA Moves in all languages — STANDUP STRIKES ONLY (no takedowns in this list)
export const MMA_MOVES: Record<Language, string[]> = {
  en: [
    'jab', 'cross', 'hook', 'uppercut', 'overhand right',
    'body kick', 'leg kick', 'head kick',
    'elbow strike', 'knee strike',
    'spinning backfist', 'teep kick',
  ],
  cs: [
    'jab', 'cross', 'hák', 'zvedák', 'overhand',
    'kop na tělo', 'low kick', 'kop na hlavu',
    'loket', 'koleno',
    'spinning backfist', 'teep kick',
  ],
  pl: [
    'prosty cios', 'krzyżowy cios', 'sierpowy', 'uppercut', 'overhand prawą',
    'kopnięcie w ciało', 'low kick', 'kopnięcie w głowę',
    'cios łokciem', 'kopnięcie kolanem',
    'obrotowy cios z tyłu', 'kopnięcie czołowe',
  ],
};

// Battle phrases in all languages
export const BATTLE_DATA: Record<Language, Record<BattleCategory, string[]>> = {
  en: {
    MISS: [
      '{attacker}\'s {move} sails high over {defender}\'s head.',
      'No connection! {attacker} whiffs the {move} completely.',
      '{defender} was never in danger. The {move} misses cleanly.',
      '{attacker} commits to the {move}, but {defender} isn\'t there.',
      'Timing is off. {attacker}\'s {move} fails to land.',
      '{attacker}\'s {move} comes up short by a full distance.',
      'The canvas gets hit instead of {defender}.',
      '{attacker} overshoots with the {move}.',
      'Wide! {attacker}\'s {move} doesn\'t find its mark.',
      'A telegraphed {move} from {attacker} finds nothing but air.',
      '{defender} reads the {move} and steps aside.',
      '{attacker}\'s {move} is well-dodged by {defender}.',
      'No effect. The {move} is completely evasible.',
      '{attacker} throws the {move} with insufficient range.',
      'The {move} passes {defender} by inches.',
      '{attacker}\'s attempt at a {move} comes up short.',
      'Well-timed footwork from {defender} avoids the {move}.',
      'The {move} doesn\'t connect. {defender} is untouched.',
      '{attacker} overcommits on the {move}.',
      'Ineffective range management on that {move}.',
    ],
    DODGE: [
      '{defender} slips the {move} with exceptional footwork!',
      'Brilliant head movement from {defender}!',
      '{attacker}\'s {move} is narrowly avoided.',
      '{defender} ducks under the incoming {move}.',
      'Excellent evasion! {defender} reads {attacker}\'s {move}.',
      '{defender} rolls and weaves past the {move}.',
      '{attacker} commits but {defender} is moving.',
      'Quick lateral movement from {defender} avoids the {move}.',
      '{defender} displays defensive awareness, dodging the {move}.',
      'That {move} whistles past {defender}\'s ear!',
      '{defender} slips inside and avoids the {move}.',
      'Explosive footwork from {defender}!',
      '{defender} parries and slips the {move}.',
      '{attacker}\'s {move} is defeated by {defender}\'s movement.',
      '{defender} anticipates the {move} perfectly.',
    ],
    LIGHT_HIT: [
      '{attacker}\'s {move} clips {defender} lightly on the arm.',
      'Light contact from {attacker}\'s {move}.',
      '{attacker}\'s {move} connects, but {defender} absorbs it.',
      'A glancing {move} from {attacker} reaches {defender}.',
      '{defender} feels minimal damage from the {move}.',
      '{attacker}\'s {move} finds the mark lightly.',
      'Partial connection on {attacker}\'s {move}.',
      '{defender} takes a light shot from {attacker}\'s {move}.',
      'Minimal damage from {attacker}\'s {move}.',
      '{attacker}\'s {move} lands but lacks power.',
      'Grazing contact from that {move}.',
      '{defender} shrugs off the light {move}.',
      'Minor damage dealt by {attacker}\'s {move}.',
      'The {move} finds {defender}, barely.',
      '{attacker} lands light on {defender}.',
    ],
    MEDIUM_HIT: [
      '{attacker} connects with a solid {move} on {defender}!',
      'Good contact! {attacker}\'s {move} lands clean.',
      '{defender} feels that {move} from {attacker}!',
      '{attacker}\'s {move} snaps {defender}\'s head back slightly.',
      'Effective striking! The {move} lands squarely on {defender}.',
      '{attacker} times the {move} perfectly.',
      'That {move} has {defender}\'s full attention!',
      '{defender} takes a solid {move} to the body.',
      '{attacker}\'s {move} creates separation.',
      'Clean striking from {attacker}! The {move} connects beautifully.',
      '{attacker} lands the {move} with authority.',
      'Significant damage dealt by {attacker}\'s {move}!',
      '{defender} staggers slightly from the {move}.',
      '{attacker}\'s {move} is perfectly executed.',
      'Real power behind that {move} from {attacker}!',
    ],
    HEAVY_HIT: [
      'A DEVASTATING {move} from {attacker} rocks {defender}!',
      '{defender} is badly hurt! {attacker}\'s {move} lands with serious force!',
      'TREMENDOUS IMPACT! {attacker}\'s {move} staggers {defender}!',
      '{defender} is visibly shaken by the {move}!',
      'That {move} from {attacker} is POWERFUL!',
      '{attacker} unloads the {move} with full force on {defender}!',
      'The {move} from {attacker} is absolutely BRUTAL!',
      '{defender} buckles under the force of the {move}!',
      'MAJOR DAMAGE! {attacker}\'s {move} is a SHOT!',
      '{attacker} connects with a THUNDEROUS {move}!',
      'The {move} lands WITH AUTHORITY!',
      '{defender} is rocked hard by the {move}!',
      'A DESTRUCTIVE {move} from {attacker} lands square!',
      'SIGNIFICANT DAMAGE DEALT! The {move} from {attacker} is VIOLENT!',
      '{defender} is clearly affected—that {move} was HARD!',
    ],
    CRITICAL_HIT: [
      'THAT IS A DEVASTATING BLOW! {attacker}\'s {move} catches {defender} FLUSH!',
      '{defender} IS IN SERIOUS TROUBLE! The {move} from {attacker} is PRECISION!',
      'CRITICAL DAMAGE! A {move} of TREMENDOUS POWER!',
      'THE {move} FROM {attacker} IS ABSOLUTELY LETHAL!',
      '{defender} IS HURT BADLY! {attacker}\'s {move} is CATASTROPHIC!',
      'THE REFEREE MAY NEED TO STEP IN! {attacker}\'s {move} is DEVASTATING!',
      'THAT\'S A POTENTIAL FINISHING BLOW! The {move} from {attacker}!',
      '{defender} IS COMPROMISED AFTER THAT {move}!',
      'CRITICAL CONDITION! {attacker}\'s {move} lands FLUSH!',
      'SPECTACULAR FINISH INCOMING? {attacker}\'s {move}!',
      'THE {move} FROM {attacker} IS CHAMPIONSHIP-LEVEL STRIKING!',
      '{defender} seems to be FADING from {attacker}\'s {move}!',
      'IS THIS THE TURNING POINT? {attacker}\'s {move}!',
      'THE PRECISION! THE POWER! {attacker}\'s {move} lands PERFECTLY!',
      '{defender} IS ON THE BRINK! The {move} was DEVASTATING!',
    ],
    FINISHER: [
      '{attacker} DELIVERS A FINISHING {move}! {defender} IS DOWN!',
      'KNOCKOUT! {attacker}\'s {move} IS ABSOLUTELY DEVASTATING!',
      'IT\'S OVER! THE {move} FROM {attacker} ENDS THIS!',
      '{defender} IS FINISHED! THE {move} FROM {attacker} IS FINAL!',
      'LIGHTS OUT! {attacker}\'s {move} HAS DONE IT!',
      'THE REFEREE STEPS IN! {attacker}\'s {move} HAS ENDED THIS FIGHT!',
      '{defender} IS OUT! {attacker} WINS WITH A BRUTAL {move}!',
      'MATCH OVER! THE {move} FROM {attacker} IS FINAL!',
      '{defender} TAPS OUT! {attacker}\'s {move} HAS SECURED VICTORY!',
      'FORCED TAP! {defender} SURRENDERS TO THE {move}!',
      '{attacker} SECURES VICTORY! THE {move} WAS IMMACULATE!',
      'FIGHT ENDS NOW! {defender} CANNOT CONTINUE!',
      '{attacker} DOMINATED THE FINISH! THE {move} IS PERFECT!',
      'THAT IS ELITE-LEVEL COMBAT TECHNIQUE!',
      '{attacker} IS THE VICTOR! AN OUTSTANDING FINISH!',
    ],
    TAKEDOWN_ATTEMPT: [
      '{attacker} changes levels explosively and shoots for a {move}!',
      'A powerful level change! {attacker} drives into the {move}!',
      '{attacker} penetrates deep with a {move} attempt!',
      'Excellent timing on the level change! The {move} is locked in!',
      '{attacker} loads up and launches a textbook {move}!',
      'The {move} from {attacker} has momentum behind it!',
      '{attacker} explodes forward with a {move}!',
      'Beautiful technique from {attacker}! The {move} attempt is solid!',
      '{attacker} commits fully to the {move}!',
      '{attacker} drops level and drives the {move} home!',
    ],
    TAKEDOWN_DEFENSE: [
      '{defender} sprawls brilliantly and stuffs the {move}!',
      'Excellent sprawl from {defender}! The {move} is completely shut down!',
      '{defender} post and base perfectly, denying the {move}!',
      'That {move} goes nowhere! {defender}\'s defense is textbook!',
      '{defender} hip escapes and gets back to the fence!',
      'Outstanding underhook from {defender}! The {move} is stopped!',
      '{defender} drives the crossface and shuts down the {move}!',
      'Beautiful defensive wrestling from {defender}!',
      'The {move} attempt fails! {defender} maintains position!',
      'The fence becomes {defender}\'s ally! The {move} is denied!',
    ],
    GROUND_CONTROL: [
      '{attacker} advances to full mount and begins raining strikes!',
      'Controlling position from {attacker}! Ground and pound incoming!',
      '{attacker} secures back mount with a dominant grip!',
      'Positional mastery from {attacker}! Controlling {defender} on the mat!',
      '{attacker} transitions to mount position with precision!',
      'Excellent control from {attacker}! {defender} is under immense pressure!',
      '{attacker} sinks the hooks and controls the back!',
      'Dominant positioning from {attacker}! {defender} is in a bad spot!',
      '{attacker} establishes mount and begins the assault!',
      'Dominant position maintained by {attacker}! The pressure is suffocating!',
    ],
    SUBMISSION_ATTEMPT: [
      '{attacker} sets up the {move} with surgical precision!',
      'Locked in tight! {attacker} cranks the {move} on {defender}!',
      '{attacker} secures the {move}! {defender} is in serious danger!',
      'The {move} is locked! {attacker} applies maximum pressure!',
      '{attacker} transitions smoothly into the {move}!',
      'The {move} from {attacker} is perfectly executed!',
      '{attacker} cinches the {move} with championship technique!',
      'That {move} has {defender} in a desperate situation!',
      'The pressure is immense! The {move} from {attacker} is deep!',
      '{attacker} finds the opening and locks the {move}!',
    ],
    SUBMISSION_ESCAPE: [
      '{defender} frantically works to escape the {move}!',
      'Incredible escape! {defender} slips out of the {move}!',
      '{defender} reverses position! The {move} is escaped!',
      'Outstanding textbook escape from {defender}!',
      '{defender} uses leverage and escapes the {move}!',
      '{defender} manages to break {attacker}\'s grip on the {move}!',
      'Champion-level composure! {defender} breaks free from the {move}!',
      '{defender} creates space and defends the {move} attempt!',
      '{defender} stays calm and methodically escapes the {move}!',
      '{defender} finds the gap and slides out of the {move}!',
    ],
  },
  cs: {
    MISS: [
      '{attacker} míří s útokem {move} vysoko nad hlavu soupeře!',
      'Vůbec nic! {attacker} se útokem {move} netrefil!',
      '{defender} nebyl v žádném nebezpečí. {move} minul.',
      '{attacker} vyslal {move}, ale {defender} tam už není.',
      'Špatné načasování. {move} od {attacker} nenašel cíl.',
      '{attacker} zůstal s {move} příliš krátký.',
      '{attacker} trefil jen podlahu oktagonu místo soupeře {defender}.',
      '{attacker} s útokem {move} přestřelil.',
      'Mimo! {move} od {attacker} nenašel svůj cíl.',
      'Telegrafovaný {move} od {attacker} rozrazil jen vzduch.',
      '{defender} přečetl {move} a včas uhnul.',
      '{move} od {attacker} byl skvěle vykryt bojovníkem {defender}.',
      'Bez efektu. {move} byl snadno čitelný.',
      '{attacker} vyslal {move} z příliš velké dálky.',
      '{move} minul soupeře {defender} jen o pár centimetrů.',
      'Pokus o {move} od {attacker} skončil nezdarem.',
      'Dobrá práce nohou od {defender} maří útok {move}.',
      '{move} se vůbec nespojil. {defender} zůstal nedotčen.',
      '{attacker} se do {move} příliš opřel a ztratil rovnováhu.',
      'Špatná kontrola vzdálenosti u {move}.',
    ],
    DODGE: [
      '{defender} unikl {move} díky výjimečné práci nohou!',
      'Brilantní pohyb hlavy od {defender}!',
      '{move} od {attacker} těsně minul cíl.',
      '{defender} se skvěle sehnul pod přilétající {move}.',
      'Výborný únik! {defender} přečetl {move} od {attacker}.',
      '{defender} se vyhnul {move} čistým úskokem.',
      '{attacker} útočí, ale {defender} je v neustálém pohybu.',
      'Rychlý postranní pohyb od {defender} unavil {move}.',
      '{defender} prokazuje skvělý přehled a vyhýbá se {move}.',
      'Ten {move} jen prosvištěl kolem ucha {defender}!',
      '{defender} se proklouzl pod útokem a vyhnul se {move}.',
      'Výbušná práce nohou od {defender} slaví úspěch!',
      '{defender} paríruje a vyhýbá se {move}.',
      '{move} od {attacker} narazil na bezchybný pohyb {defender}.',
      '{defender} předvídal {move} naprosto perfektně.',
    ],
    LIGHT_HIT: [
      '{move} od {attacker} lehce zasáhl paži soupeře {defender}.',
      'Lehký kontakt z útoku {move} bojovníka {attacker}.',
      '{move} od {attacker} se spojil, ale {defender} ho bez potíží pohltil.',
      'Jen letmý {move} od {attacker} zasáhl {defender}.',
      '{defender} pociťuje jen minimální poškození od {move}.',
      '{move} od {attacker} trefil cíl jen zlehka.',
      'Částečný zásah u {move} od {attacker}.',
      '{defender} inkasoval lehký zásah z úderu {move}.',
      'Minimální poškození po {move} od {attacker}.',
      '{move} od {attacker} dopadl, ale chybí mu razance.',
      'Jen lehké škrábnutí u toho {move}.',
      '{defender} bez problémů ustál lehký {move}.',
      'Drobné poškození po {move} od {attacker}.',
      '{move} trefil {defender} jen na hranu.',
      '{attacker} přistál jen lehký zásah na {defender}.',
    ],
    MEDIUM_HIT: [
      '{attacker} trefil solidní {move} přímo na {defender}!',
      'Dobrý kontakt! {move} od {attacker} přistál čistě.',
      '{defender} ten {move} od {attacker} určitě pocítil!',
      '{move} od {attacker} mírně škubl hlavou soupeře {defender}.',
      'Účinný útok! {move} přistál přímo na střed {defender}.',
      '{attacker} načasoval {move} perfektně.',
      'Ten {move} si získal plnou pozornost soupeře {defender}!',
      '{defender} inkasoval solidní {move} do těla.',
      '{move} od {attacker} vytvořil potřebný odstup.',
      'Čistý úder od {attacker}! {move} se spojil krásně.',
      '{attacker} vyslal {move} s velkou autoritou.',
      'Znatelné poškození způsobené útokem {move}!',
      '{defender} po zásahu {move} mírně zavrávoral.',
      '{move} od {attacker} byl proveden učebnicově.',
      'Skutečná síla za tímto {move} od {attacker}!',
    ],
    HEAVY_HIT: [
      'DEVASTUJÍCÍ {move} od {attacker} otřásl soupeřem {defender}!',
      '{defender} je vážně otřesen! {move} od {attacker} dopadl obrovskou silou!',
      'BRUTÁLNÍ DOPAD! {move} od {attacker} podlomil kolena {defender}!',
      '{defender} je po zásahu {move} viditelně mimo!',
      'Ten {move} od {attacker} měl neskutečnou razanci!',
      '{attacker} vypálil {move} plnou silou přímo na {defender}!',
      '{move} od {attacker} byl naprosto nekompromisní!',
      '{defender} se prohýbá pod drtivou silou {move}!',
      'TVRDÁ RÁNA! {move} od {attacker} je čistý zásah!',
      '{attacker} se spojil s mohutným {move}!',
      '{move} přistál s obrovskou autoritou!',
      '{defender} je po zásahu {move} tvrdě otřesen!',
      'Destruktivní {move} od {attacker} přistál přesně na bradu!',
      'Značné poškození! {move} od {attacker} byl velmi bolestivý!',
      '{defender} je jasně otřesen – ten {move} byl neuvěřitelně tvrdý!',
    ],
    CRITICAL_HIT: [
      'TO BYL DEVASTUJÍCÍ ÚDER! {move} od {attacker} trefil {defender} naprosto čistě!',
      '{defender} JE V OBROVSKÝCH POTÍŽÍCH! {move} od {attacker} byl precizní!',
      'KRITICKÝ ZÁSAH! {move} s neuvěřitelnou silou!',
      '{move} OD {attacker} BYL NAPROSTO SMRTELNÝ!',
      '{defender} JE TĚŽCE ZRANĚN! {move} od {attacker} byl katastrofální!',
      'ROZHODČÍ UŽ MOŽNÁ BUDE MUSET ZASÁHNOUT! {move} od {attacker} ničí soupeře!',
      'TO BYL POTENCIÁLNÍ UKONČOVACÍ ÚDER! {move} od {attacker}!',
      '{defender} JE PO TOMTO {move} V KRITICKÉM STAVU!',
      'KRITICKÉ POŠKOZENÍ! {move} od {attacker} dopadl přímo na cíl!',
      'SPEKTAKULÁRNÍ UKONČENÍ NA SPADNUTÍ? {move} od {attacker}!',
      '{move} OD {attacker} JE ÚTOKEM NA ÚROVNI ŠAMPIONŮ!',
      '{defender} po {move} od bojovníka {attacker} viditelně uvadá!',
      'JE TO ZLOMOVÝ BOD ZÁPASU? {move} od {attacker}!',
      'PRECIZNOST A SÍLA! {move} od {attacker} přistál dokonale!',
      '{defender} JE NA HRANĚ KNOCKOUTU! {move} byl devastující!',
    ],
    FINISHER: [
      '{attacker} doručil finální {move}! {defender} jde k zemi!',
      'KNOCKOUT! {move} od {attacker} byl naprosto zdrcující!',
      'JE KONEC! {move} OD {attacker} UKONČUJE TENTO ZÁPAS!',
      '{defender} JE VYŘAZEN! {move} OD {attacker} BYL POSLEDNÍM ÚDEREM!',
      'A JE ZHASNUTO! {move} od {attacker} to dokonal!',
      'ROZHODČÍ SKÁČE MEZI NĚ! {move} od {attacker} ukončil boj!',
      '{defender} JE MIMO! {attacker} VÍTĚZÍ DÍKY BRUTÁLNÍMU {move}!',
      'ZÁPAS KONČÍ! {move} OD {attacker} JE ROZHODUJÍCÍ!',
      '{defender} ODKLEPAL! {move} od {attacker} zajistil vítězství!',
      'VYNUCENÉ ODKLEPÁNÍ! {defender} se vzdává pod tlakem {move}!',
      '{attacker} SLAVÍ VÍTĚZSTVÍ! {move} byl naprosto bezchybný!',
      'BOJ KONČÍ! {defender} UŽ NEMŮŽE DÁL POKRAČOVAT!',
      '{attacker} DOMINOVAL V ZÁVĚRU! {move} BYL PERFEKTNÍ!',
      'TO JE ELITNÍ BOJOVÁ TECHNIKA V PRAXI!',
      '{attacker} SE STÁVÁ VÍTĚZEM! VYNIKAJÍCÍ UKONČENÍ!',
    ],
    TAKEDOWN_ATTEMPT: [
      '{attacker} výbušně mění úroveň a vyráží do pokusu o {move}!',
      'Mocná změna těžiště! {attacker} se řítí do {move}!',
      '{attacker} proniká hluboko pod soupeře s pokusem o {move}!',
      'Skvělé načasování! {move} je téměř dotažený!',
      '{attacker} se odráží a vypouští učebnicový {move}!',
      '{move} od {attacker} má obrovskou dynamiku!',
      '{attacker} exploduje směrem vpřed s pokusem o {move}!',
      'Krásná technika od {attacker}! Pokus o {move} je velmi nadějný!',
      '{attacker} se plně soustředí na dotažení {move}!',
      '{attacker} snižuje postoj a tvrdě nastupuje do {move}!',
    ],
    TAKEDOWN_DEFENSE: [
      '{defender} skvěle sprawluje a zastavuje {move}!',
      'Výtečný sprawl od {defender}! {move} je zcela eliminován!',
      '{defender} drží balanc a rezolutně odmítá {move}!',
      'Ten {move} nikam nepovede! Obrana {defender} je učebnicová!',
      '{defender} uniká boky a tlačí se zpět k pletivu!',
      'Vynikající underhook od {defender}! {move} je zastaven v zárodku!',
      '{defender} používá crossface a blokuje pokus o {move}!',
      'Krásné defenzivní wrestlování v podání {defender}!',
      'Pokus o {move} selhal! {defender} si udržel dominantní postoj!',
      'Pletivo se stává spojencem bojovníka {defender}! {move} je ubráněn!',
    ],
    GROUND_CONTROL: [
      '{attacker} přechází do full mountu a zasypává soupeře údery!',
      'Naprostá kontrola od {attacker}! Ground and pound je tady!',
      '{attacker} si zajistil back mount a dominantně kontroluje soupeře!',
      'Poziční mistrovství od {attacker}! {defender} je na zemi bezmocný!',
      '{attacker} s naprostou přesností přechází do mountu!',
      'Vynikající kontrola od {attacker}! {defender} je pod obrovským tlakem!',
      '{attacker} nasadil háky a plně kontroluje záda!',
      'Dominantní pozice od {attacker}! {defender} je ve velmi těžké situaci!',
      '{attacker} upevnil mount a zahajuje tvrdý útok!',
      'Dominantní kontrola na zemi! Tlak bojovníka {attacker} je dusivý!',
    ],
    SUBMISSION_ATTEMPT: [
      '{attacker} nastavuje {move} s chirurgickou přesností!',
      'Je to tam! {attacker} dotahuje {move} na krku soupeře {defender}!',
      '{attacker} si zajistil {move}! {defender} je ve velkém nebezpečí!',
      '{move} je zamčený! {attacker} vyvíjí maximální tlak!',
      '{attacker} plynule přechází do pokusu o {move}!',
      '{move} od {attacker} je proveden naprosto technicky!',
      '{attacker} utahuje {move} s šampionskou razancí!',
      'Tento {move} dostal soupeře {defender} do bezvýchodné situace!',
      'Tlak je obrovský! {move} od {attacker} je nasazen velmi hluboko!',
      '{attacker} našel skulinu a okamžitě zamyká {move}!',
    ],
    SUBMISSION_ESCAPE: [
      '{defender} zběsile pracuje na úniku z {move}!',
      'Neuvěřitelný únik! {defender} se vysmekl z {move}!',
      '{defender} přetočil pozici! {move} je minulostí!',
      'Vynikající učebnicový únik v podání {defender}!',
      '{defender} využil páku a úspěšně uniká z {move}!',
      '{defender} dokázal rozpojit sevření {attacker} a uniká z {move}!',
      'Klid šampiona! {defender} se dokázal osvobodit z {move}!',
      '{defender} vytvořil prostor a úspěšně brání pokusu o {move}!',
      '{defender} zůstává klidný a metodicky uniká z pasti {move}!',
      '{defender} našel mezeru a doslova vyklouzl z {move}!',
    ],
  },
  pl: {
    MISS: [
      '{move} od {attacker} przelatuje wysoko nad głową {defender}!',
      'Brak kontaktu! {attacker} całkowicie chybił {move}!',
      '{defender} nigdy nie był w niebezpieczeństwie. {move} chybił czysto.',
      '{attacker} wykonuje {move}, ale {defender} tam nie ma.',
      'Zły timing. {move} od {attacker} nie trafia.',
      '{move} od {attacker} jest za krótki o pełny dystans.',
      'Mata dostaje uderzenie zamiast {defender}!',
      '{attacker} przesadza z {move}.',
      'Szeroko! {move} od {attacker} nie znajduje celu.',
      'Telegrafowany {move} od {attacker} znajduje tylko powietrze.',
      '{defender} czyta {move} i odchodzi na bok.',
      '{move} od {attacker} jest dobrze unikany przez {defender}.',
      'Brak efektu. {move} jest całkowicie uniknięty.',
      '{attacker} rzuca {move} z niewystarczającym zasięgiem.',
      '{move} mija {defender} o centymetry.',
      'Próba {move} od {attacker} nie udała się.',
      'Dobrze czasowana praca nóg od {defender} unika {move}.',
      '{move} nie trafia. {defender} jest nietknięty.',
      '{attacker} przesadza na {move}.',
      'Nieskuteczne zarządzanie zasięgiem przy {move}.',
    ],
    DODGE: [
      '{defender} unika {move} z wyjątkową pracą nóg!',
      'Genialny ruch głowy od {defender}!',
      '{move} od {attacker} jest wąsko uniknięty.',
      '{defender} kuca pod nadlatującym {move}.',
      'Doskonałe unikanie! {defender} czyta {move} od {attacker}.',
      '{defender} toczy się i unika {move}.',
      '{attacker} atakuje, ale {defender} się porusza.',
      'Szybki ruch boczny od {defender} unika {move}.',
      '{defender} wykazuje świadomość obronną, unikając {move}.',
      'Ten {move} gwiżdże obok ucha {defender}!',
      '{defender} wślizguje się i unika {move}.',
      'Wybuchowa praca nóg od {defender}!',
      '{defender} paruje i unika {move}.',
      '{move} od {attacker} pokonany ruchem {defender}.',
      '{defender} przewiduje {move} perfekcjnie.',
    ],
    LIGHT_HIT: [
      '{move} od {attacker} lekko trafia ramię {defender}.',
      'Lekki kontakt od {move} {attacker}.',
      '{move} od {attacker} trafia, ale {defender} pochłania.',
      'Dotykowy {move} od {attacker} osiąga {defender}.',
      '{defender} odczuwa minimalne obrażenia od {move}.',
      '{move} od {attacker} znajduje cel lekko.',
      'Częściowe połączenie na {move} od {attacker}.',
      '{defender} dostaje lekki strzał od {move} {attacker}.',
      'Minimalne obrażenia od {move} {attacker}.',
      '{move} od {attacker} ląduje, ale brakuje mocy.',
      'Dotykowy kontakt od tego {move}.',
      '{defender} odrzucił lekki {move}.',
      'Mniejsze obrażenia zadane przez {move} {attacker}.',
      '{move} znalazł {defender}, ledwo.',
      '{attacker} ląduje lekko na {defender}.',
    ],
    MEDIUM_HIT: [
      '{attacker} łączy się z solidnym {move} na {defender}!',
      'Dobry kontakt! {move} od {attacker} wylądował czysto.',
      '{defender} czuje ten {move} od {attacker}!',
      '{move} od {attacker} lekko odrzuca głową {defender}.',
      'Skuteczne uderzanie! {move} wylądował czysto na {defender}.',
      '{attacker} czasował {move} perfekcyjnie.',
      'Ten {move} ma pełną uwagę {defender}!',
      '{defender} dostaje solidny {move} do ciała.',
      '{move} od {attacker} tworzy separację.',
      'Czyste uderzanie od {attacker}! {move} łączy się pięknie.',
      '{attacker} ląduje {move} z autorytetem.',
      'Znaczące obrażenia zadane przez {move} {attacker}!',
      '{defender} lekko zatacza się od {move}.',
      '{move} od {attacker} jest perfekcyjnie wykonany.',
      'Prawdziwa moc za tym {move} od {attacker}!',
    ],
    HEAVY_HIT: [
      'NISZCZĄCY {move} od {attacker} wstrząsa {defender}!',
      '{defender} jest ciężko zraniony! {move} od {attacker} ląduje z poważną siłą!',
      'OGROMNY WPŁYW! {move} od {attacker} zatacza {defender}!',
      '{defender} jest widocznie wstrząśnięty {move}!',
      'Ten {move} od {attacker} jest POTĘŻNY!',
      '{attacker} uwalnia {move} z pełną siłą na {defender}!',
      '{move} od {attacker} jest absolutnie BRUTALNY!',
      '{defender} ugina się pod siłą {move}!',
      'WIĘKSZE OBRAŻENIA! {move} od {attacker} jest STRZAŁEM!',
      '{attacker} łączy się z POTĘŻNYM {move}!',
      '{move} ląduje Z AUTORYTETEM!',
      '{defender} jest mocno wstrząśnięty {move}!',
      'DESTRUKCYJNY {move} od {attacker} ląduje czysto!',
      'ZNACZĄCE OBRAŻENIA ZADANE! {move} od {attacker} jest GWAŁTOWNY!',
      '{defender} jest wyraźnie dotknięty - ten {move} był TWARDY!',
    ],
    CRITICAL_HIT: [
      'TO JEST NISZCZĄCY CIOS! {move} od {attacker} łapie {defender} CZYSTO!',
      '{defender} JEST W POWAŻNYCH KŁOPOTACH! {move} od {attacker} to PRECYZJA!',
      'KRYTYCZNE OBRAŻENIA! {move} O OGROMNEJ MOCY!',
      '{move} OD {attacker} JEST ABSOLUTNIE ŚMIERTELNY!',
      '{defender} JEST CIĘŻKO ZRANIONY! {move} od {attacker} jest KATASTROFICZNY!',
      'SĘDZIA MOŻE MUSIEĆ WKROCZYĆ! {move} od {attacker} jest NISZCZĄCY!',
      'TO MOŻE BYĆ KOŃCZĄCY CIOS! {move} od {attacker}!',
      '{defender} JEST SKOMPROMITOWANY PO TYM {move}!',
      'STAN KRYTYCZNY! {move} od {attacker} ląduje CZYSTO!',
      'SPEKTAKULARNY KONIEC NADCHODZI? {move} od {attacker}!',
      '{move} OD {attacker} TO UDERZENIE NA POZIOMIE MISTRZOWSKIM!',
      '{defender} wydaje się słabnąć po {move} {attacker}!',
      'CZY TO PUNKT ZWROTNY? {move} od {attacker}!',
      'PRECYZJA! MOC! {move} od {attacker} ląduje PERFEKCYJNIE!',
      '{defender} JEST NA SKRAJU NOKAUTU! {move} był NISZCZĄCY!',
    ],
    FINISHER: [
      '{attacker} ZADAJE KOŃCZĄCY {move}! {defender} PADA!',
      'NOKAUT! {move} od {attacker} JEST ABSOLUTNIE NISZCZĄCY!',
      'TO KONIEC! {move} OD {attacker} KOŃCZY WALKĘ!',
      '{defender} JEST SKOŃCZONY! {move} OD {attacker} JEST FINALNY!',
      'ŚWIATŁA ZGASŁY! {move} od {attacker} TO ZROBIŁ!',
      'SĘDZIA WKRACZA! {move} od {attacker} ZAKOŃCZYŁ TĘ WALKĘ!',
      '{defender} JEST WYŁĄCZONY! {attacker} WYGRYWA PRZEZ BRUTALNY {move}!',
      'WALKA SKOŃCZONA! {move} OD {attacker} ROZSTRZYGA!',
      '{defender} PODDAŁ SIĘ! {move} od {attacker} WYMUSIŁ KLEPANIE!',
      'WYMUSZONE PODDANIE! {defender} REZYGNUJE PO {move}!',
      '{attacker} ZAPEWNIA ZWYCIĘSTWO! {move} BYŁ NIESKAZITELNY!',
      'WALKA KOŃCZY SIĘ TERAZ! {defender} NIE MOŻE KONTYNUOWAĆ!',
      '{attacker} ZDOMINOWAŁ KONIEC! {move} JEST PERFEKCYJNY!',
      'TO JEST TECHNIKA WALKI NA POZIOMIE ELITARNYM!',
      '{attacker} ZOSTAJE ZWYCIĘZCĄ! WYBITNE ZAKOŃCZENIE!',
    ],
    TAKEDOWN_ATTEMPT: [
      '{attacker} zmienia poziom wybuchowo i atakuje przez {move}!',
      'Potężna zmiana poziomu! {attacker} wchodzi w {move}!',
      '{attacker} głęboko penetruje z próbą {move}!',
      'Świetny timing zmiany poziomu! {move} jest zapięty!',
      '{attacker} ładuje się i wyprowadza podręcznikowy {move}!',
      '{move} od {attacker} ma za sobą momentum!',
      '{attacker} wybucha do przodu z próbą {move}!',
      'Piękna technika od {attacker}! Próba {move} jest solidna!',
      '{attacker} w pełni angażuje się w {move}!',
      '{attacker} obniża poziom i dopina {move}!',
    ],
    TAKEDOWN_DEFENSE: [
      '{defender} świetnie sprawluje i zatrzymuje {move}!',
      'Doskonały sprawl od {defender}! {move} jest całkowicie zatrzymany!',
      '{defender} stabilizuje bazę i odmawia {move}!',
      'Ten {move} nigdzie nie idzie! Obrona {defender} jest podręcznikowa!',
      '{defender} ucieka biodrami i wraca do siatki!',
      'Wybitny underhook od {defender}! {move} jest zatrzymany!',
      '{defender} napiera crossfacem i blokuje {move}!',
      'Piękny defensywny wrestling od {defender}!',
      'Próba {move} nie powiodła się! {defender} utrzymuje pozycję!',
      'Siatka staje się sojusznikiem {defender}! {move} jest odparty!',
    ],
    GROUND_CONTROL: [
      '{attacker} przechodzi do pełnego mountu i zasypuje rywala ciosami!',
      'Kontrola pozycji od {attacker}! Zbliża się ground and pound!',
      '{attacker} zajmuje plecy z dominującym chwytem!',
      'Mistrzostwo pozycyjne od {attacker}! Kontroluje {defender} na macie!',
      '{attacker} przechodzi do pozycji mountu z precyzją!',
      'Doskonała kontrola od {attacker}! {defender} jest pod ogromną presją!',
      '{attacker} wpina haki i kontroluje plecy!',
      'Dominująca pozycja od {attacker}! {defender} jest w opałach!',
      '{attacker} ustanawia mount i rozpoczyna szturm!',
      'Dominująca pozycja utrzymana przez {attacker}! Presja jest dusząca!',
    ],
    SUBMISSION_ATTEMPT: [
      '{attacker} ustawia {move} z chirurgiczną precyzją!',
      'Zapięte mocno! {attacker} dociąga {move} na {defender}!',
      '{attacker} zabezpiecza {move}! {defender} jest w poważnym niebezpieczeństwie!',
      '{move} jest zapięty! {attacker} wywiera maksymalny nacisk!',
      '{attacker} płynnie przechodzi do próby {move}!',
      '{move} od {attacker} jest perfekcyjnie wykonany!',
      '{attacker} zapina {move} z mistrzowską techniką!',
      'Ten {move} stawia {defender} w desperackiej sytuacji!',
      'Presja jest ogromna! {move} od {attacker} siedzi głęboko!',
      '{attacker} znajduje lukę i zamyka {move}!',
    ],
    SUBMISSION_ESCAPE: [
      '{defender} gorączkowo pracuje nad ucieczką z {move}!',
      'Niesamowita ucieczka! {defender} wyślizguje się z {move}!',
      '{defender} odwraca pozycję! {move} jest pokonany!',
      'Wybitna podręcznikowa ucieczka od {defender}!',
      '{defender} używa dźwigni i ucieka z {move}!',
      '{defender} łamie uchwyt {attacker} na {move}!',
      'Opanowanie mistrza! {defender} uwalnia się z {move}!',
      '{defender} tworzy przestrzeń i broni próbę {move}!',
      '{defender} zachowuje spokój i metodycznie ucieka z {move}!',
      '{defender} znajduje lukę i wysuwa się z {move}!',
    ],
  },
};

/**
 * Get a random phrase from a category for a specific language
 */
export const getRandomPhrase = (category: BattleCategory, language: Language = 'en'): string => {
  const phrases = BATTLE_DATA[language][category];
  return phrases[Math.floor(Math.random() * phrases.length)];
};

/**
 * Replace placeholders in a phrase with actual values
 */
export const formatPhrase = (
  phrase: string,
  attacker: string,
  defender: string,
  move: string
): string => {
  return phrase
    .replace(/{attacker}/g, attacker)
    .replace(/{defender}/g, defender)
    .replace(/{move}/g, move);
};

/**
 * Get a formatted battle message for a specific language
 */
export const getBattleMessage = (
  category: BattleCategory,
  attacker: string,
  defender: string,
  move: string,
  language: Language = 'en'
): string => {
  const phrase = getRandomPhrase(category, language);
  return formatPhrase(phrase, attacker, defender, move);
};