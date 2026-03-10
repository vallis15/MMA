import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Flame, Shield, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  FighterVisual,
  ARCHETYPES,
  SKIN_TONES,
  HAIR_STYLES,
  HAIR_COLORS,
  type BodyId,
  type VisualConfig,
} from './FighterVisual';

// ─── Country helpers ──────────────────────────────────────────────────────────

/** Converts a 2-letter ISO code to the corresponding flag emoji (zero-dep). */
const getFlagEmoji = (code: string): string =>
  [...code.toUpperCase()].map(c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)).join('');

interface Country { code: string; name: string }

const COUNTRIES: Country[] = [
  {code:'AF',name:'Afghanistan'},{code:'AL',name:'Albania'},{code:'DZ',name:'Algeria'},
  {code:'AD',name:'Andorra'},{code:'AO',name:'Angola'},{code:'AG',name:'Antigua & Barbuda'},
  {code:'AR',name:'Argentina'},{code:'AM',name:'Armenia'},{code:'AU',name:'Australia'},
  {code:'AT',name:'Austria'},{code:'AZ',name:'Azerbaijan'},{code:'BS',name:'Bahamas'},
  {code:'BH',name:'Bahrain'},{code:'BD',name:'Bangladesh'},{code:'BB',name:'Barbados'},
  {code:'BY',name:'Belarus'},{code:'BE',name:'Belgium'},{code:'BZ',name:'Belize'},
  {code:'BJ',name:'Benin'},{code:'BT',name:'Bhutan'},{code:'BO',name:'Bolivia'},
  {code:'BA',name:'Bosnia & Herzegovina'},{code:'BW',name:'Botswana'},{code:'BR',name:'Brazil'},
  {code:'BN',name:'Brunei'},{code:'BG',name:'Bulgaria'},{code:'BF',name:'Burkina Faso'},
  {code:'BI',name:'Burundi'},{code:'CV',name:'Cabo Verde'},{code:'KH',name:'Cambodia'},
  {code:'CM',name:'Cameroon'},{code:'CA',name:'Canada'},{code:'CF',name:'Central African Republic'},
  {code:'TD',name:'Chad'},{code:'CL',name:'Chile'},{code:'CN',name:'China'},
  {code:'CO',name:'Colombia'},{code:'KM',name:'Comoros'},{code:'CG',name:'Congo'},
  {code:'CD',name:'Congo (DRC)'},{code:'CR',name:'Costa Rica'},{code:'HR',name:'Croatia'},
  {code:'CU',name:'Cuba'},{code:'CY',name:'Cyprus'},{code:'CZ',name:'Czech Republic'},
  {code:'DK',name:'Denmark'},{code:'DJ',name:'Djibouti'},{code:'DM',name:'Dominica'},
  {code:'DO',name:'Dominican Republic'},{code:'EC',name:'Ecuador'},{code:'EG',name:'Egypt'},
  {code:'SV',name:'El Salvador'},{code:'GQ',name:'Equatorial Guinea'},{code:'ER',name:'Eritrea'},
  {code:'EE',name:'Estonia'},{code:'SZ',name:'Eswatini'},{code:'ET',name:'Ethiopia'},
  {code:'FJ',name:'Fiji'},{code:'FI',name:'Finland'},{code:'FR',name:'France'},
  {code:'GA',name:'Gabon'},{code:'GM',name:'Gambia'},{code:'GE',name:'Georgia'},
  {code:'DE',name:'Germany'},{code:'GH',name:'Ghana'},{code:'GR',name:'Greece'},
  {code:'GD',name:'Grenada'},{code:'GT',name:'Guatemala'},{code:'GN',name:'Guinea'},
  {code:'GW',name:'Guinea-Bissau'},{code:'GY',name:'Guyana'},{code:'HT',name:'Haiti'},
  {code:'HN',name:'Honduras'},{code:'HU',name:'Hungary'},{code:'IS',name:'Iceland'},
  {code:'IN',name:'India'},{code:'ID',name:'Indonesia'},{code:'IR',name:'Iran'},
  {code:'IQ',name:'Iraq'},{code:'IE',name:'Ireland'},{code:'IL',name:'Israel'},
  {code:'IT',name:'Italy'},{code:'JM',name:'Jamaica'},{code:'JP',name:'Japan'},
  {code:'JO',name:'Jordan'},{code:'KZ',name:'Kazakhstan'},{code:'KE',name:'Kenya'},
  {code:'KI',name:'Kiribati'},{code:'KW',name:'Kuwait'},{code:'KG',name:'Kyrgyzstan'},
  {code:'LA',name:'Laos'},{code:'LV',name:'Latvia'},{code:'LB',name:'Lebanon'},
  {code:'LS',name:'Lesotho'},{code:'LR',name:'Liberia'},{code:'LY',name:'Libya'},
  {code:'LI',name:'Liechtenstein'},{code:'LT',name:'Lithuania'},{code:'LU',name:'Luxembourg'},
  {code:'MG',name:'Madagascar'},{code:'MW',name:'Malawi'},{code:'MY',name:'Malaysia'},
  {code:'MV',name:'Maldives'},{code:'ML',name:'Mali'},{code:'MT',name:'Malta'},
  {code:'MH',name:'Marshall Islands'},{code:'MR',name:'Mauritania'},{code:'MU',name:'Mauritius'},
  {code:'MX',name:'Mexico'},{code:'FM',name:'Micronesia'},{code:'MD',name:'Moldova'},
  {code:'MC',name:'Monaco'},{code:'MN',name:'Mongolia'},{code:'ME',name:'Montenegro'},
  {code:'MA',name:'Morocco'},{code:'MZ',name:'Mozambique'},{code:'MM',name:'Myanmar'},
  {code:'NA',name:'Namibia'},{code:'NR',name:'Nauru'},{code:'NP',name:'Nepal'},
  {code:'NL',name:'Netherlands'},{code:'NZ',name:'New Zealand'},{code:'NI',name:'Nicaragua'},
  {code:'NE',name:'Niger'},{code:'NG',name:'Nigeria'},{code:'KP',name:'North Korea'},
  {code:'MK',name:'North Macedonia'},{code:'NO',name:'Norway'},{code:'OM',name:'Oman'},
  {code:'PK',name:'Pakistan'},{code:'PW',name:'Palau'},{code:'PA',name:'Panama'},
  {code:'PG',name:'Papua New Guinea'},{code:'PY',name:'Paraguay'},{code:'PE',name:'Peru'},
  {code:'PH',name:'Philippines'},{code:'PL',name:'Poland'},{code:'PT',name:'Portugal'},
  {code:'QA',name:'Qatar'},{code:'RO',name:'Romania'},{code:'RU',name:'Russia'},
  {code:'RW',name:'Rwanda'},{code:'KN',name:'Saint Kitts & Nevis'},{code:'LC',name:'Saint Lucia'},
  {code:'VC',name:'Saint Vincent'},{code:'WS',name:'Samoa'},{code:'SM',name:'San Marino'},
  {code:'ST',name:'São Tomé & Príncipe'},{code:'SA',name:'Saudi Arabia'},{code:'SN',name:'Senegal'},
  {code:'RS',name:'Serbia'},{code:'SC',name:'Seychelles'},{code:'SL',name:'Sierra Leone'},
  {code:'SG',name:'Singapore'},{code:'SK',name:'Slovakia'},{code:'SI',name:'Slovenia'},
  {code:'SB',name:'Solomon Islands'},{code:'SO',name:'Somalia'},{code:'ZA',name:'South Africa'},
  {code:'KR',name:'South Korea'},{code:'SS',name:'South Sudan'},{code:'ES',name:'Spain'},
  {code:'LK',name:'Sri Lanka'},{code:'SD',name:'Sudan'},{code:'SR',name:'Suriname'},
  {code:'SE',name:'Sweden'},{code:'CH',name:'Switzerland'},{code:'SY',name:'Syria'},
  {code:'TW',name:'Taiwan'},{code:'TJ',name:'Tajikistan'},{code:'TZ',name:'Tanzania'},
  {code:'TH',name:'Thailand'},{code:'TL',name:'Timor-Leste'},{code:'TG',name:'Togo'},
  {code:'TO',name:'Tonga'},{code:'TT',name:'Trinidad & Tobago'},{code:'TN',name:'Tunisia'},
  {code:'TR',name:'Turkey'},{code:'TM',name:'Turkmenistan'},{code:'TV',name:'Tuvalu'},
  {code:'UG',name:'Uganda'},{code:'UA',name:'Ukraine'},{code:'AE',name:'United Arab Emirates'},
  {code:'GB',name:'United Kingdom'},{code:'US',name:'United States'},{code:'UY',name:'Uruguay'},
  {code:'UZ',name:'Uzbekistan'},{code:'VU',name:'Vanuatu'},{code:'VE',name:'Venezuela'},
  {code:'VN',name:'Vietnam'},{code:'YE',name:'Yemen'},{code:'ZM',name:'Zambia'},
  {code:'ZW',name:'Zimbabwe'},
];

interface FightingStyle {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  bonusStat: string;
  bonusAmount: number;
  color: string;
  gradient: string;
}

const FIGHTING_STYLES: FightingStyle[] = [
  {
    id: 'striker',
    name: 'Striker',
    description: 'Master of striking techniques and footwork',
    icon: <Flame size={32} />,
    bonusStat: 'striking',
    bonusAmount: 5,
    color: 'border-orange-500',
    gradient: 'from-orange-600/20 to-orange-400/20',
  },
  {
    id: 'wrestler',
    name: 'Wrestler',
    description: 'Expert in takedowns and ground control',
    icon: <Shield size={32} />,
    bonusStat: 'grappling',
    bonusAmount: 5,
    color: 'border-blue-500',
    gradient: 'from-blue-600/20 to-blue-400/20',
  },
  {
    id: 'speedster',
    name: 'Speedster',
    description: 'Lightning-fast movements and reflexes',
    icon: <Zap size={32} />,
    bonusStat: 'speed',
    bonusAmount: 5,
    color: 'border-yellow-500',
    gradient: 'from-yellow-600/20 to-yellow-400/20',
  },
];

interface FighterInitializationProps {
  userId: string;
  onComplete: (fighterName: string, stats: Record<string, number>) => void;
}

// sorted for display
const COUNTRIES_SORTED = [...COUNTRIES].sort((a, b) => a.name.localeCompare(b.name));

export const FighterInitialization: React.FC<FighterInitializationProps> = ({
  userId,
  onComplete,
}) => {
  const [fighterName, setFighterName] = useState('');
  const [nickname, setNickname] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [selectedBodyId, setSelectedBodyId] = useState<BodyId>(1);
  const [selectedSkinToneId, setSelectedSkinToneId] = useState<string>('light');
  const [selectedHairId, setSelectedHairId] = useState<number>(0);
  const [selectedHairColor, setSelectedHairColor] = useState<string>('brown');
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContinueToStep2 = () => {
    if (!fighterName.trim()) {
      setError('Please enter a fighter name');
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleStartCareer = async () => {
    if (!selectedStyle) {
      setError('Please select a fighting style');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Find the selected style
      const style = FIGHTING_STYLES.find((s) => s.id === selectedStyle);
      if (!style) {
        setError('Invalid fighting style selected');
        return;
      }

      console.log('🔵 [FIGHTER INIT] Starting career initialization');
      console.log('🔵 [FIGHTER INIT] Fighter name:', fighterName);
      console.log('🔵 [FIGHTER INIT] Fighting style:', style.name);
      console.log('🔵 [FIGHTER INIT] Stat bonus:', style.bonusStat, '+', style.bonusAmount);

      // Calculate new stats with bonus
      const newStats: Record<string, number> = {
        striking: 40,
        grappling: 40,
        speed: 40,
        strength: 40,
        cardio: 40,
      };

      // Apply fighting style bonus
      if (style.bonusStat in newStats) {
        newStats[style.bonusStat] = Math.min(100, newStats[style.bonusStat] + style.bonusAmount);
      }

      console.log('🔵 [FIGHTER INIT] Updated stats:', newStats);

      const visualConfig: VisualConfig = {
        bodyId: selectedBodyId,
        skinToneId: selectedSkinToneId,
        hairId: selectedHairId > 0 ? selectedHairId : undefined,
        hairColor: selectedHairId > 0 ? selectedHairColor : undefined,
      };

      // Update profile in Supabase
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update({
          username: fighterName,
          nickname: nickname.trim() || null,
          country_code: countryCode || null,
          striking: newStats.striking,
          grappling: newStats.grappling,
          speed: newStats.speed,
          strength: newStats.strength,
          cardio: newStats.cardio,
          visual_config: visualConfig,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select();

      if (updateError) {
        console.error('❌ [FIGHTER INIT] Supabase error:', updateError);
        setError(`Failed to initialize fighter: ${updateError.message}`);
        return;
      }

      console.log('✅ [FIGHTER INIT] Career initialized successfully!', data);
      console.log('✅ [FIGHTER INIT] Fighter name:', fighterName);
      console.log('✅ [FIGHTER INIT] Stats updated:', newStats);

      // Call parent callback
      onComplete(fighterName, newStats);
    } catch (err) {
      console.error('❌ [FIGHTER INIT] Exception:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={`bg-gradient-to-br from-dark-secondary via-dark-secondary/90 to-dark-tertiary border-2 border-neon-green/50 rounded-2xl p-8 w-full shadow-2xl shadow-neon-green/20 transition-all duration-300 ${step === 1 ? 'max-w-md max-h-[90vh] overflow-y-auto' : 'max-w-4xl h-[90vh] flex flex-col overflow-hidden'}`}
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-6"
        >
          <div className="text-5xl mb-3">🥋</div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-green via-cyan-400 to-neon-green mb-2 tracking-tight">
            Welcome to the Octagon
          </h1>
          <p className="text-gray-300 text-sm">
            {step === 1 ? 'Step 1 / 2 – Fighter Identity' : 'Step 2 / 2 – Appearance & Fighting Style'}
          </p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <div className={`w-8 h-1.5 rounded-full transition-all ${step === 1 ? 'bg-neon-green' : 'bg-neon-green/40'}`} />
            <div className={`w-8 h-1.5 rounded-full transition-all ${step === 2 ? 'bg-neon-green' : 'bg-gray-700'}`} />
          </div>
        </motion.div>

        {step === 1 ? (<>
        {/* Fighter Name Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <label className="block text-lg font-bold text-neon-green mb-3">Fighter Name <span className="text-alert-red">*</span></label>
          <input
            type="text"
            value={fighterName}
            onChange={(e) => {
              setFighterName(e.target.value);
              setError(null);
            }}
            placeholder="Enter your fighter name..."
            className="w-full bg-dark-tertiary/50 border-2 border-neon-green/30 rounded-lg px-5 py-3 text-white text-lg placeholder-gray-500 focus:border-neon-green focus:outline-none focus:shadow-lg focus:shadow-neon-green/30 transition-all"
            disabled={loading}
          />
        </motion.div>

        {/* Nickname Input (optional) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-6"
        >
          <label className="block text-lg font-bold text-neon-green mb-1">
            Nickname <span className="text-gray-500 text-sm font-normal">(optional)</span>
          </label>
          <p className="text-xs text-gray-500 mb-3">If set, displayed as: Firstname &ldquo;Nickname&rdquo; Lastname</p>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder='e.g. "The Iceman", "Notorious", "Spider"'
            className="w-full bg-dark-tertiary/50 border-2 border-neon-green/20 rounded-lg px-5 py-3 text-white text-lg placeholder-gray-500 focus:border-neon-green/60 focus:outline-none transition-all"
            disabled={loading}
            maxLength={40}
          />
        </motion.div>

        {/* Country Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-10"
        >
          <label className="block text-lg font-bold text-neon-green mb-1">
            Country <span className="text-gray-500 text-sm font-normal">(optional)</span>
          </label>
          <p className="text-xs text-gray-500 mb-3">Displayed next to your name in the octagon</p>
          <div className="relative">
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              disabled={loading}
              className="w-full bg-dark-tertiary/50 border-2 border-neon-green/20 rounded-lg px-5 py-3 text-white text-base focus:border-neon-green/60 focus:outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="">— Select country —</option>
              {COUNTRIES_SORTED.map((c) => (
                <option key={c.code} value={c.code}>
                  {getFlagEmoji(c.code)} {c.name} ({c.code})
                </option>
              ))}
            </select>
            {countryCode && (
              <span className="absolute right-10 top-1/2 -translate-y-1/2 text-2xl pointer-events-none">
                {getFlagEmoji(countryCode)}
              </span>
            )}
          </div>
        </motion.div>
        </>) : (<>
        {/* ── Fighter Summary / Back ─────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-neon-green/20 flex-shrink-0">
          <button
            type="button"
            onClick={() => { setStep(1); setError(null); }}
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-neon-green transition-colors"
          >
            <ChevronLeft size={16} /> Back
          </button>
          <div className="text-center">
            <p className="text-white font-bold">
              {fighterName}{nickname ? ` "${nickname}"` : ''}
            </p>
            {countryCode && (
              <p className="text-xs text-gray-400 mt-0.5">
                {getFlagEmoji(countryCode)} {COUNTRIES_SORTED.find((c) => c.code === countryCode)?.name}
              </p>
            )}
          </div>
          <div className="w-16" />
        </div>

        {/* ── Two-Column Layout ──────────────────────────────────────────── */}
        <div className="flex gap-6 flex-1 min-h-0">

          {/* LEFT: Fighter Preview + Archetype Navigation */}
          <div className="w-52 flex-shrink-0 flex flex-col items-center gap-3">
            <p className="text-sm font-bold text-neon-green self-start">Base Archetype</p>

            {/* Large animated preview */}
            <div className="relative flex items-end justify-center w-full" style={{ height: 320 }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedBodyId}
                  initial={{ opacity: 0, x: 30, scale: 0.92 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -30, scale: 0.92 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                >
                  <FighterVisual
                    config={{
                      bodyId: selectedBodyId,
                      skinToneId: selectedSkinToneId,
                      hairId: selectedHairId,
                      hairColor: selectedHairColor,
                    }}
                    height={300}
                    disableAnimation={false}
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation arrows + dot indicators */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => setSelectedBodyId((prev) => (prev === 1 ? 8 : ((prev - 1) as BodyId)))}
                className="w-8 h-8 rounded-full border-2 border-neon-green/40 hover:border-neon-green flex items-center justify-center text-neon-green hover:bg-neon-green/10 transition-all disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex gap-1.5">
                {ARCHETYPES.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    disabled={loading}
                    onClick={() => setSelectedBodyId(a.id)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      selectedBodyId === a.id ? 'bg-neon-green scale-125' : 'bg-gray-600 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>
              <button
                type="button"
                disabled={loading}
                onClick={() => setSelectedBodyId((prev) => (prev === 8 ? 1 : ((prev + 1) as BodyId)))}
                className="w-8 h-8 rounded-full border-2 border-neon-green/40 hover:border-neon-green flex items-center justify-center text-neon-green hover:bg-neon-green/10 transition-all disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* RIGHT: Scrollable Panels */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-6">

            {/* 1. HAIR STYLE (top priority – most visible) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <label className="block text-lg font-bold text-neon-green mb-1">Hair Style</label>
              <p className="text-xs text-gray-500 mb-3">Choose a hairstyle – it&apos;ll be applied to your fighter</p>
              <div className="grid grid-cols-5 gap-2">
                <button
                  type="button"
                  disabled={loading}
                  title="No Hair"
                  onClick={() => setSelectedHairId(0)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all ${
                    selectedHairId === 0
                      ? 'border-neon-green bg-neon-green/10'
                      : 'border-dark-tertiary hover:border-gray-500 bg-dark-tertiary/30'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full border border-gray-600 flex items-center justify-center text-gray-500 text-lg">✕</div>
                  <span className="text-xs text-gray-400">None</span>
                </button>
                {HAIR_STYLES.map((hair) => (
                  <button
                    key={hair.id}
                    type="button"
                    disabled={loading}
                    title={hair.label}
                    onClick={() => setSelectedHairId(hair.id)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all ${
                      selectedHairId === hair.id
                        ? 'border-neon-green bg-neon-green/10'
                        : 'border-dark-tertiary hover:border-gray-500 bg-dark-tertiary/30'
                    }`}
                  >
                    <img
                      src={hair.imagePath}
                      alt={hair.label}
                      className="w-10 h-10 object-contain"
                      style={{
                        filter: selectedHairId === hair.id
                          ? HAIR_COLORS.find((c) => c.id === selectedHairColor)?.filter ?? 'none'
                          : 'brightness(0.55) contrast(1.1)',
                      }}
                      draggable={false}
                    />
                    <span className="text-xs text-gray-400 truncate w-full text-center leading-tight">{hair.label}</span>
                  </button>
                ))}
              </div>
              {selectedHairId > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4"
                >
                  <p className="text-sm font-semibold text-gray-300 mb-2">Hair Color</p>
                  <div className="flex gap-2 flex-wrap">
                    {HAIR_COLORS.map((hc) => (
                      <button
                        key={hc.id}
                        type="button"
                        disabled={loading}
                        title={hc.label}
                        onClick={() => setSelectedHairColor(hc.id)}
                        className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                          selectedHairColor === hc.id
                            ? 'border-neon-green scale-110 ring-2 ring-neon-green/40'
                            : 'border-transparent hover:border-gray-400'
                        }`}
                        style={{ backgroundColor: hc.swatch }}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {HAIR_COLORS.find((c) => c.id === selectedHairColor)?.label}
                  </p>
                </motion.div>
              )}
            </motion.div>

            {/* 2. SKIN TONE */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <label className="block text-lg font-bold text-neon-green mb-3">Skin Tone</label>
              <div className="flex gap-3 flex-wrap">
                {SKIN_TONES.map((tone) => (
                  <button
                    key={tone.id}
                    type="button"
                    disabled={loading}
                    title={tone.label}
                    onClick={() => setSelectedSkinToneId(tone.id)}
                    className={`w-9 h-9 rounded-full border-2 transition-all hover:scale-110 ${
                      selectedSkinToneId === tone.id
                        ? 'border-neon-green scale-110 ring-2 ring-neon-green/40'
                        : 'border-transparent hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: tone.swatch }}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {SKIN_TONES.find((t) => t.id === selectedSkinToneId)?.label}
              </p>
            </motion.div>

            {/* 3. FIGHTING STYLE */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <label className="block text-lg font-bold text-neon-green mb-4">Choose Your Fighting Style</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {FIGHTING_STYLES.map((style) => (
                  <motion.button
                    key={style.id}
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { setSelectedStyle(style.id); setError(null); }}
                    disabled={loading}
                    className={`relative rounded-lg p-5 border-2 transition-all ${
                      selectedStyle === style.id
                        ? `${style.color} bg-gradient-to-br ${style.gradient} shadow-lg shadow-current/50`
                        : 'border-gray-600 bg-dark-tertiary/30 hover:border-gray-400'
                    } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {selectedStyle === style.id && (
                      <motion.div layoutId="selected-style" className="absolute inset-0 border-2 border-current rounded-lg" />
                    )}
                    <div className="relative z-10">
                      <div className="text-3xl mb-2 text-center">{style.icon}</div>
                      <h3 className="text-lg font-bold text-white text-center mb-1">{style.name}</h3>
                      <p className="text-xs text-gray-300 text-center mb-2">{style.description}</p>
                      <div className="text-xs font-semibold uppercase tracking-wider text-center">
                        <span className="text-neon-green">+{style.bonusAmount}</span>
                        <span className="text-gray-400"> {style.bonusStat}</span>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* 4. STATS PREVIEW */}
            {selectedStyle && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 bg-dark-tertiary/50 border border-neon-green/30 rounded-lg"
              >
                <h3 className="text-sm font-bold text-neon-green mb-3 uppercase tracking-wider">Starting Stats</h3>
                <div className="space-y-2">
                  {Object.entries({ striking: 40, grappling: 40, speed: 40, strength: 40, cardio: 40 }).map(([stat, baseValue]) => {
                    const styleBonus =
                      FIGHTING_STYLES.find((s) => s.id === selectedStyle)?.bonusStat === stat
                        ? FIGHTING_STYLES.find((s) => s.id === selectedStyle)!.bonusAmount
                        : 0;
                    const finalValue = baseValue + styleBonus;
                    return (
                      <div key={stat} className="flex items-center gap-3">
                        <span className="capitalize text-gray-400 w-20 text-sm font-medium">{stat}:</span>
                        <div className="flex-1 bg-dark-bg/50 rounded-full h-2 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(finalValue / 100) * 100}%` }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="h-full bg-gradient-to-r from-neon-green to-cyan-400"
                          />
                        </div>
                        <span className="text-white font-bold w-12 text-right text-sm">
                          {finalValue}{styleBonus > 0 && <span className="text-neon-green">+{styleBonus}</span>}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* 5. Error + Start Career button */}
            <div className="space-y-3 pb-4">
              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-3 bg-alert-red/20 border border-alert-red/50 rounded-lg text-alert-red text-sm"
                >
                  {error}
                </motion.div>
              )}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleStartCareer}
                disabled={loading || !selectedStyle}
                className="w-full bg-gradient-to-r from-neon-green to-cyan-400 text-dark-bg font-bold py-3 rounded-lg hover:shadow-lg hover:shadow-neon-green/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none transition-all text-lg"
              >
                {loading ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }} className="inline-block">⏳</motion.div>
                ) : '⚡ Start Career'}
              </motion.button>
              <p className="text-center text-gray-500 text-xs">Stats can always be retrained later!</p>
            </div>

          </div>
        </div>
        </>)}

        {/* Step 1 – Continue */}
        {step === 1 && (
          <div className="mt-6 space-y-3">
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-3 bg-alert-red/20 border border-alert-red/50 rounded-lg text-alert-red text-sm"
              >
                {error}
              </motion.div>
            )}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleContinueToStep2}
              disabled={!fighterName.trim()}
              className="w-full bg-gradient-to-r from-neon-green to-cyan-400 text-dark-bg font-bold py-3 rounded-lg hover:shadow-lg hover:shadow-neon-green/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-lg"
            >
              Continue →
            </motion.button>
          </div>
        )}



        {/* Info Text */}
        {step === 1 && (
          <p className="text-center text-gray-500 text-xs mt-6">These details can be changed at any time.</p>
        )}
      </motion.div>
    </motion.div>
  );
};
