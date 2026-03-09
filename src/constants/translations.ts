import { Language } from '../context/LanguageContext';

export const translations: Record<string, Record<Language, string>> = {
  // Navigation & Pages
  dashboard: { en: 'Dashboard', cs: 'Přehled', pl: 'Panel' },
  profile: { en: 'Fighter Profile', cs: 'Profil bojovníka', pl: 'Profil zawodnika' },
  gym: { en: 'Gym', cs: 'Tělocvična', pl: 'Siłownia' },
  arena: { en: 'Arena', cs: 'Aréna', pl: 'Arena' },
  pvp_arena: { en: 'PvP Arena', cs: 'PvP Aréna', pl: 'Arena PvP' },
  rankings: { en: 'Rankings', cs: 'Žebříček', pl: 'Ranking' },
  skills: { en: 'Skill Tree', cs: 'Strom dovedností', pl: 'Drzewo umiejętności' },
  admin: { en: 'Admin', cs: 'Admin', pl: 'Admin' },
  logout: { en: 'Logout', cs: 'Odhlásit', pl: 'Wyloguj' },
  
  // Navigation Descriptions
  dashboard_description: { en: 'Home', cs: 'Domů', pl: 'Główna' },
  profile_description: { en: 'Stats & Skills', cs: 'Statistiky', pl: 'Statystyki' },
  gym_description: { en: 'Training', cs: 'Trénink', pl: 'Trening' },
  arena_description: { en: 'Fights', cs: 'Boje', pl: 'Walki' },
  rankings_description: { en: 'Leaderboards', cs: 'Žebříčky', pl: 'Rankingi' },
  skills_description: { en: 'Abilities', cs: 'Schopnosti', pl: 'Zdolności' },

  // Fighter Stats
  name: { en: 'Name', cs: 'Jméno', pl: 'Imię' },
  nickname: { en: 'Nickname', cs: 'Přezdívka', pl: 'Pseudonim' },
  level: { en: 'Level', cs: 'Úroveň', pl: 'Poziom' },
  energy: { en: 'Energy', cs: 'Energie', pl: 'Energia' },
  health: { en: 'Health', cs: 'Zdraví', pl: 'Zdrowie' },
  reputation: { en: 'Reputation', cs: 'Reputace', pl: 'Reputacja' },
  experience: { en: 'Experience', cs: 'Zkušenost', pl: 'Doświadczenie' },

  // Fighter Attributes
  strength: { en: 'Strength', cs: 'Síla', pl: 'Siła' },
  speed: { en: 'Speed', cs: 'Rychlost', pl: 'Szybkość' },
  cardio: { en: 'Cardio', cs: 'Kondice', pl: 'Wytrzymałość' },
  striking: { en: 'Striking', cs: 'Úderná technika', pl: 'Nokaut' },
  grappling: { en: 'Grappling', cs: 'Zápas', pl: 'Parterówka' },

  // Record
  wins: { en: 'Wins', cs: 'Výhry', pl: 'Wygrane' },
  losses: { en: 'Losses', cs: 'Prohry', pl: 'Przegrane' },
  draws: { en: 'Draws', cs: 'Remízy', pl: 'Remisy' },
  record: { en: 'Record', cs: 'Bilance', pl: 'Bilans' },
  win_rate: { en: 'Win Rate', cs: 'Úspěšnost', pl: 'Współczynnik wygranych' },

  // Leagues
  amateur: { en: 'Amateur', cs: 'Amatér', pl: 'Amator' },
  regional_pro: { en: 'Regional Pro', cs: 'Regionální profesionál', pl: 'Profesjonalista regionalny' },
  mma_legend: { en: 'MMA Legend', cs: 'MMA Legenda', pl: 'Legenda MMA' },

  // Actions
  fight: { en: 'Fight', cs: 'Bojovat', pl: 'Walcz' },
  fight_button: { en: 'Fight', cs: 'Bojuj', pl: 'Walcz' },
  train: { en: 'Train', cs: 'Trénovat', pl: 'Trenuj' },
  challenge: { en: 'Challenge', cs: 'Vyzvat', pl: 'Wyzwij' },
  start_fight: { en: 'Start Fight', cs: 'Začít zápas', pl: 'Rozpocznij walkę' },
  return_to_arena: { en: 'Return to Arena', cs: 'Zpět do arény', pl: 'Wróć do areny' },
  create_fighter: { en: 'Create Fighter', cs: 'Vytvořit bojovníka', pl: 'Stwórz zawodnika' },
  reset_career: { en: 'Reset Career', cs: 'Resetovat kariéru', pl: 'Zresetuj karierę' },

  // Battle
  round: { en: 'Round', cs: 'Kolo', pl: 'Runda' },
  time: { en: 'Time', cs: 'Čas', pl: 'Czas' },
  status: { en: 'Status', cs: 'Stav', pl: 'Status' },
  live: { en: 'Live', cs: 'Živě', pl: 'Na żywo' },
  victory: { en: 'Victory', cs: 'Vítězství', pl: 'Zwycięstwo' },
  defeat: { en: 'Defeat', cs: 'Porážka', pl: 'Porażka' },
  draw: { en: 'Draw', cs: 'Remíza', pl: 'Remis' },
  knockout: { en: 'Knockout', cs: 'Knockout', pl: 'Nokaut' },
  judges_decision: { en: "Judges' Decision", cs: 'Rozhodnutí rozhodčích', pl: 'Decyzja sędziów' },
  your_damage: { en: 'Your Damage', cs: 'Tvoje poškození', pl: 'Twoje obrażenia' },
  opponent_damage: { en: 'Opponent Damage', cs: 'Poškození soupeře', pl: 'Obrażenia przeciwnika' },
  hits: { en: 'hits', cs: 'zásahů', pl: 'trafień' },

  // Training
  train_strength: { en: 'Train Strength', cs: 'Trénovat sílu', pl: 'Trenuj siłę' },
  train_speed: { en: 'Train Speed', cs: 'Trénovat rychlost', pl: 'Trenuj szybkość' },
  train_cardio: { en: 'Train Cardio', cs: 'Trénovat kondici', pl: 'Trenuj wytrzymałość' },
  train_striking: { en: 'Train Striking', cs: 'Trénovat údernou techniku', pl: 'Trenuj nokaut' },
  train_grappling: { en: 'Train Grappling', cs: 'Trénovat zápas', pl: 'Trenuj parterówkę' },
  energy_cost: { en: 'Energy Cost', cs: 'Cena energie', pl: 'Koszt energii' },
  boost: { en: 'Boost', cs: 'Zlepšení', pl: 'Wzmocnienie' },

  // Matchmaking
  choose_opponent: { en: 'Choose Your Opponent', cs: 'Vyber si soupeře', pl: 'Wybierz przeciwnika' },
  your_fighter: { en: 'Your Fighter', cs: 'Tvůj bojovník', pl: 'Twój zawodnik' },
  selected: { en: 'Selected', cs: 'Vybraný', pl: 'Wybrany' },
  choose_below: { en: 'Choose Below', cs: 'Vyber níže', pl: 'Wybierz poniżej' },
  finding_opponents: { en: 'Finding opponents...', cs: 'Hledám soupeře...', pl: 'Szukam przeciwników...' },
  no_opponents: { en: 'No other players available to fight', cs: 'Žádní další hráči k dispozici', pl: 'Brak dostępnych przeciwników' },
  matchmaking_error: { en: 'Matchmaking Error', cs: 'Chyba párování', pl: 'Błąd matchmakingu' },

  // Rankings
  global_leaderboard: { en: 'Global Leaderboard', cs: 'Globální žebříček', pl: 'Globalny ranking' },
  your_rank: { en: 'Your Rank', cs: 'Tvoje pozice', pl: 'Twoja pozycja' },
  rank: { en: 'Rank', cs: 'Pozice', pl: 'Pozycja' },
  fighter: { en: 'Fighter', cs: 'Bojovník', pl: 'Zawodnik' },
  action: { en: 'Action', cs: 'Akce', pl: 'Akcja' },
  you: { en: 'You', cs: 'Ty', pl: 'Ty' },
  
  // Rankings Page
  sort_by_reputation: { en: '💰 Reputation', cs: '💰 Reputace', pl: '💰 Reputacja' },
  sort_by_wins: { en: '🏆 Wins', cs: '🏆 Výhry', pl: '🏆 Wygrane' },
  sort_by_level: { en: '📈 Level', cs: '📈 Úroveň', pl: '📈 Poziom' },
  fewest_losses: { en: 'Fewest Losses', cs: 'Nejméně proher', pl: 'Najmniej przegranych' },
  debut_required: { en: 'Must have at least 1 fight to appear', cs: 'Pro zobrazení je potřeba alespoň 1 zápas', pl: 'Wymagany co najmniej 1 walka' },
  error_loading_leaderboard: { en: '⚠️ Error Loading Leaderboard', cs: '⚠️ Chyba načítání žebříčku', pl: '⚠️ Błąd ładowania rankingu' },
  no_players_found: { en: 'No players found in the database', cs: 'V databázi nebyli nalezeni žádní hráči', pl: 'Nie znaleziono graczy w bazie danych' },
  w_l_d: { en: 'W-L-D', cs: 'V-P-R', pl: 'W-P-R' },
  your_league: { en: 'Your League', cs: 'Tvá liga', pl: 'Twoja liga' },
  total_reputation: { en: 'Total Reputation', cs: 'Celková reputace', pl: 'Całkowita reputacja' },
  are_you_sure: { en: 'Are you sure?', cs: 'Jsi si jistý?', pl: 'Czy jesteś pewien?' },
  yes_reset: { en: 'Yes, Reset', cs: 'Ano, resetovat', pl: 'Tak, zresetuj' },
  create_fighter_to_rank: { en: 'Create a fighter to see your ranking!', cs: 'Vytvoř bojovníka, aby jsi viděl své pořadí!', pl: 'Stwórz zawodnika, aby zobaczyć swój ranking!' },
  climb_to_regional_pro: { en: 'Climb to 500 for Regional Pro', cs: 'Dostaň se na 500 pro Regionálního profesionála', pl: 'Wejdź na 500 dla Profesjonalisty regionalnego' },
  climb_to_legend: { en: 'Climb to 2000 for MMA Legend', cs: 'Dostaň se na 2000 pro MMA Legendu', pl: 'Wejdź na 2000 dla Legendy MMA' },
  you_are_legend: { en: 'You are an MMA Legend!', cs: 'Jsi MMA Legenda!', pl: 'Jesteś Legendą MMA!' },
  need_energy_to_fight: { en: 'You need at least 50 Energy to challenge someone!', cs: 'Potřebuješ alespoň 50 energie, aby jsi někoho vyzval!', pl: 'Potrzebujesz co najmniej 50 energii, aby kogoś wyzwać!' },
  
  // Login & Authentication
  mma_manager: { en: 'MMA MANAGER', cs: 'MMA MANAŽER', pl: 'MENEDŻER MMA' },
  enter_octagon: { en: 'Enter the Octagon', cs: 'Vstup do oktagonu', pl: 'Wejdź do oktagonu' },
  email_address: { en: 'Email Address', cs: 'E-mailová adresa', pl: 'Adres e-mail' },
  password: { en: 'Password', cs: 'Heslo', pl: 'Hasło' },
  placeholder_email: { en: 'fighter@example.com', cs: 'bojovnik@priklad.cz', pl: 'zawodnik@przyklad.pl' },
  placeholder_password: { en: '••••••••', cs: '••••••••', pl: '••••••••' },
  show_password: { en: 'Show password', cs: 'Zobrazit heslo', pl: 'Pokaż hasło' },
  email_password_required: { en: 'Email and password are required', cs: 'E-mail a heslo jsou povinné', pl: 'E-mail i hasło są wymagane' },
  login: { en: 'Login', cs: 'Přihlásit', pl: 'Zaloguj' },
  entering_arena: { en: 'Entering Arena...', cs: 'Vstupuji do arény...', pl: 'Wchodzę do areny...' },
  new_fighter_question: { en: 'New fighter?', cs: 'Nový bojovník?', pl: 'Nowy zawodnik?' },
  create_account: { en: 'Create Account', cs: 'Vytvořit účet', pl: 'Stwórz konto' },
  executive_access: { en: '⚡ Executive Access', cs: '⚡ Výkonný přístup', pl: '⚡ Dostęp wykonawczy' },
  admin_panel: { en: 'Admin Panel', cs: 'Admin panel', pl: 'Panel administratora' },
  championship_system: { en: 'Players Championship Management System', cs: 'Systém správy hráčských šampionátů', pl: 'System zarządzania mistrzostwami graczy' },

  // Registration
  create_fighter_account: { en: 'Create your fighter account', cs: 'Vytvoř si účet bojovníka', pl: 'Stwórz konto zawodnika' },
  email: { en: 'Email', cs: 'E-mail', pl: 'E-mail' },
  placeholder_email_short: { en: 'you@example.com', cs: 'ty@priklad.cz', pl: 'ty@przyklad.pl' },
  placeholder_min_8_chars: { en: 'Minimum 8 characters', cs: 'Minimálně 8 znaků', pl: 'Minimum 8 znaków' },
  confirm_password: { en: 'Confirm Password', cs: 'Potvrdit heslo', pl: 'Potwierdź hasło' },
  placeholder_confirm_password: { en: 'Confirm your password', cs: 'Potvrď své heslo', pl: 'Potwierdź swoje hasło' },
  all_fields_required: { en: 'All fields are required', cs: 'Všechna pole jsou povinná', pl: 'Wszystkie pola są wymagane' },
  invalid_email_format: { en: 'Invalid email format', cs: 'Neplatný formát e-mailu', pl: 'Nieprawidłowy format e-mail' },
  password_min_8: { en: 'Password must be at least 8 characters', cs: 'Heslo musí mít alespoň 8 znaků', pl: 'Hasło musi mieć co najmniej 8 znaków' },
  passwords_no_match: { en: 'Passwords do not match', cs: 'Hesla se neshodují', pl: 'Hasła nie pasują' },
  creating_account: { en: 'Creating account...', cs: 'Vytvářím účet...', pl: 'Tworzę konto...' },
  already_have_account: { en: 'Already have an account?', cs: 'Již máš účet?', pl: 'Masz już konto?' },
  login_here: { en: 'Login here', cs: 'Přihlásit se zde', pl: 'Zaloguj się tutaj' },
  account_created: { en: 'Account Created!', cs: 'Účet vytvořen!', pl: 'Konto stworzone!' },
  check_email_confirm: { en: 'Check your email to confirm your account. Redirecting to login...', cs: 'Zkontroluj svůj e-mail pro potvrzení účtu. Přesměrování na přihlášení...', pl: 'Sprawdź swój e-mail, aby potwierdzić konto. Przekierowanie do logowania...' },
  terms_and_privacy: { en: 'By signing up, you agree to our Terms of Service and Privacy Policy', cs: 'Registrací souhlasíš s našimi Podmínkami služby a Zásadami ochrany osobních údajů', pl: 'Rejestrując się, zgadzasz się z naszymi Warunkami korzystania z usługi i Polityką prywatności' },
  
  // Fighter Card
  win_rate_label: { en: 'Win Rate:', cs: 'Úspěšnost:', pl: 'Współczynnik wygranych:' },
  level_number: { en: 'Level {level}', cs: 'Úroveň {level}', pl: 'Poziom {level}' },
  level_progress_xp: { en: 'Level Progress ({xp}/100 XP)', cs: 'Postup úrovně ({xp}/100 XP)', pl: 'Postęp poziomu ({xp}/100 XP)' },
  fighter_stats: { en: 'Fighter Stats', cs: 'Statistiky bojovníka', pl: 'Statystyki zawodnika' },
  average_stat: { en: 'Average Stat', cs: 'Průměrná statistika', pl: 'Średnia statystyka' },

  // Messages
  welcome_message: { 
    en: 'Welcome! Select your opponent and step into the octagon.',
    cs: 'Vítej! Vyber si soupeře a vstup do oktagonu.',
    pl: 'Witaj! Wybierz przeciwnika i wejdź do oktagonu.'
  },
  welcome_fighter: {
    en: 'Welcome {name}! Challenge real players from around the world.',
    cs: 'Vítej {name}! Vyzvi skutečné hráče z celého světa.',
    pl: 'Witaj {name}! Wyzwij prawdziwych graczy z całego świata.'
  },
  create_fighter_first: {
    en: 'Create a fighter first to enter the Arena!',
    cs: 'Nejprve vytvoř bojovníka pro vstup do arény!',
    pl: 'Najpierw stwórz zawodnika, aby wejść do areny!'
  },
  create_fighter_dashboard: {
    en: 'Create your fighter on the Dashboard!',
    cs: 'Vytvoř si bojovníka na Přehledu!',
    pl: 'Stwórz zawodnika na Panelu!'
  },
  need_energy: {
    en: 'You need 50 Energy to fight. Train to recover!',
    cs: 'Potřebuješ 50 energie k boji. Trénuj pro obnovení!',
    pl: 'Potrzebujesz 50 energii do walki. Trenuj, aby się zregenerować!'
  },
  need_energy_current: {
    en: 'You need 50 Energy. Current: {energy}',
    cs: 'Potřebuješ 50 energie. Aktuální: {energy}',
    pl: 'Potrzebujesz 50 energii. Obecna: {energy}'
  },
  select_opponent: {
    en: 'Select Opponent',
    cs: 'Vyber soupeře',
    pl: 'Wybierz przeciwnika'
  },
  low_energy: { en: 'Low Energy', cs: 'Nízká energie', pl: 'Niska energia' },
  no_fighter: { en: 'No Fighter', cs: 'Žádný bojovník', pl: 'Brak zawodnika' },
  current: { en: 'Current', cs: 'Aktuální', pl: 'Obecna' },

  // Dashboard
  global_announcement: { en: '⚡ Global Announcement', cs: '⚡ Globální oznámení', pl: '⚡ Ogłoszenie globalne' },
  dashboard_subtitle: { 
    en: 'Your Complete MMA Fighter Management System',
    cs: 'Váš kompletní systém správy MMA bojovníka',
    pl: 'Twój kompletny system zarządzania zawodnikiem MMA'
  },
  active_fighter: { en: 'Active Fighter', cs: 'Aktivní bojovník', pl: 'Aktywny zawodnik' },
  no_fighter_yet: { en: 'No Fighter Yet', cs: 'Zatím žádný bojovník', pl: 'Jeszcze brak zawodnika' },
  create_fighter_prompt: { 
    en: 'Create your first fighter to get started!',
    cs: 'Vytvoř svého prvního bojovníka a začni!',
    pl: 'Stwórz swojego pierwszego zawodnika, aby zacząć!'
  },
  create_new_fighter: { en: 'Create New Fighter', cs: 'Vytvořit nového bojovníka', pl: 'Stwórz nowego zawodnika' },
  fighter_name: { en: 'Fighter Name', cs: 'Jméno bojovníka', pl: 'Imię zawodnika' },
  placeholder_name: { en: 'e.g., John Smith', cs: 'např. Jan Novák', pl: 'np. Jan Kowalski' },
  placeholder_nickname: { en: 'e.g., The Champion', cs: 'např. Šampion', pl: 'np. Mistrz' },
  create: { en: 'Create', cs: 'Vytvořit', pl: 'Stwórz' },
  cancel: { en: 'Cancel', cs: 'Zrušit', pl: 'Anuluj' },

  // Gym
  gym_welcome: { 
    en: 'Welcome {name}! Choose a training drill to improve your stats.',
    cs: 'Vítej {name}! Vyber trénink pro zlepšení svých statistik.',
    pl: 'Witaj {name}! Wybierz trening, aby poprawić swoje statystyki.'
  },
  gym_no_fighter: { 
    en: 'Create a fighter first to start training!',
    cs: 'Nejprve vytvoř bojovníka pro začátek tréninku!',
    pl: 'Najpierw stwórz zawodnika, aby zacząć trening!'
  },
  gym_create_prompt: { 
    en: 'Create your first fighter on the Dashboard to start training!',
    cs: 'Vytvoř svého prvního bojovníka na Přehledu pro začátek tréninku!',
    pl: 'Stwórz swojego pierwszego zawodnika na Panelu, aby zacząć trening!'
  },
  fighter_status: { en: 'Fighter Status', cs: 'Stav bojovníka', pl: 'Status zawodnika' },
  avg_stats: { en: 'Avg Stats', cs: 'Průměrné statistiky', pl: 'Średnie statystyki' },
  
  // Training Drills
  drill_heavy_bag: { en: 'Heavy Bag', cs: 'Těžký pytel', pl: 'Worek treningowy' },
  drill_heavy_bag_desc: { 
    en: 'Pound the heavy bag to improve striking technique.',
    cs: 'Mlať do těžkého pytlena pro zlepšení úderné techniky.',
    pl: 'Bij w worek, aby poprawić technikę uderzeń.'
  },
  drill_bjj_rolling: { en: 'BJJ Rolling', cs: 'BJJ Sparring', pl: 'Sparring BJJ' },
  drill_bjj_rolling_desc: { 
    en: 'Practice ground fighting and submissions.',
    cs: 'Procvičuj boj na zemi a submisse.',
    pl: 'Ćwicz walkę w parterze i submisje.'
  },
  drill_sprints: { en: 'Sprints', cs: 'Sprinty', pl: 'Sprinty' },
  drill_sprints_desc: { 
    en: 'High-intensity cardio training.',
    cs: 'Vysokointenzivní kardio trénink.',
    pl: 'Trening cardio o wysokiej intensywności.'
  },
  drill_weightlifting: { en: 'Weightlifting', cs: 'Vzpírání', pl: 'Podnoszenie ciężarów' },
  drill_weightlifting_desc: { 
    en: 'Build raw power and strength.',
    cs: 'Buduj sílu a moc.',
    pl: 'Buduj siłę i moc.'
  },
  drill_sparring: { en: 'Sparring', cs: 'Sparring', pl: 'Sparring' },
  drill_sparring_desc: { 
    en: 'Full-contact training with all techniques.',
    cs: 'Plný kontakt s všemi technikami.',
    pl: 'Trening pełnego kontaktu ze wszystkimi technikami.'
  },
  drill_intense_cardio: { en: 'Intense Cardio', cs: 'Intenzivní kardio', pl: 'Intensywne cardio' },
  drill_intense_cardio_desc: { 
    en: 'Improve overall conditioning and stamina.',
    cs: 'Zlepši celkovou kondici a výdrž.',
    pl: 'Popraw ogólną kondycję i wytrzymałość.'
  },

  // Commentary
  live_commentary: { en: 'Live Commentary', cs: 'Živý komentář', pl: 'Komentarz na żywo' },

  // Battle Results
  round_begins: { en: 'ROUND {round} BEGINS', cs: 'KOLO {round} ZAČÍNÁ', pl: 'RUNDA {round} ROZPOCZYNA SIĘ' },

  // Danger Rating
  danger_rating: { en: 'Danger Rating', cs: 'Úroveň nebezpečí', pl: 'Poziom zagrożenia' },
};

// Helper function to get translation
export const getTranslation = (key: string, language: Language): string => {
  const translation = translations[key];
  if (!translation) {
    console.warn(`Translation missing for key: ${key}`);
    return key;
  }
  return translation[language] || translation.en || key;
};
