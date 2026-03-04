import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Flame, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartCareer = async () => {
    if (!fighterName.trim() || !selectedStyle) {
      setError('Please enter a fighter name and select a fighting style');
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
        className="bg-gradient-to-br from-dark-secondary via-dark-secondary/90 to-dark-tertiary border-2 border-neon-green/50 rounded-2xl p-8 w-full max-w-2xl shadow-2xl shadow-neon-green/20 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-10"
        >
          <div className="text-6xl mb-4">🥋</div>
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-green via-cyan-400 to-neon-green mb-2 tracking-tight">
            Welcome to the Octagon
          </h1>
          <p className="text-gray-300 text-lg">Create your fighter and choose your path to glory</p>
        </motion.div>

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

        {/* Fighting Styles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-10"
        >
          <label className="block text-lg font-bold text-neon-green mb-4">Choose Your Fighting Style</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {FIGHTING_STYLES.map((style) => (
              <motion.button
                key={style.id}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setSelectedStyle(style.id);
                  setError(null);
                }}
                disabled={loading}
                className={`relative rounded-lg p-6 border-2 transition-all ${
                  selectedStyle === style.id
                    ? `${style.color} bg-gradient-to-br ${style.gradient} shadow-lg shadow-current/50`
                    : 'border-gray-600 bg-dark-tertiary/30 hover:border-gray-400'
                } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {/* Selected Check */}
                {selectedStyle === style.id && (
                  <motion.div
                    layoutId="selected-style"
                    className="absolute inset-0 border-2 border-current rounded-lg"
                  />
                )}

                {/* Content */}
                <div className="relative z-10">
                  <div className="text-4xl mb-3 text-center">{style.icon}</div>
                  <h3 className="text-xl font-bold text-white text-center mb-2">{style.name}</h3>
                  <p className="text-sm text-gray-300 text-center mb-3">{style.description}</p>

                  {/* Bonus Stat */}
                  <div className="text-xs font-semibold uppercase tracking-wider text-center">
                    <span className="text-neon-green">+{style.bonusAmount}</span>
                    <span className="text-gray-400"> {style.bonusStat}</span>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-alert-red/20 border border-alert-red/50 rounded-lg text-alert-red text-sm"
          >
            {error}
          </motion.div>
        )}

        {/* Stats Preview */}
        {selectedStyle && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10 p-5 bg-dark-tertiary/50 border border-neon-green/30 rounded-lg"
          >
            <h3 className="text-sm font-bold text-neon-green mb-3 uppercase tracking-wider">Starting Stats</h3>
            <div className="space-y-2">
              {Object.entries({
                striking: 40,
                grappling: 40,
                speed: 40,
                strength: 40,
                cardio: 40,
              }).map(([stat, baseValue]) => {
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
                      {finalValue}
                      {styleBonus > 0 && <span className="text-neon-green">+{styleBonus}</span>}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex gap-4"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStartCareer}
            disabled={loading || !fighterName.trim() || !selectedStyle}
            className="flex-1 bg-gradient-to-r from-neon-green to-cyan-400 text-dark-bg font-bold py-3 rounded-lg hover:shadow-lg hover:shadow-neon-green/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none transition-all text-lg"
          >
            {loading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity }}
                className="inline-block"
              >
                ⏳
              </motion.div>
            ) : (
              '⚡ Start Career'
            )}
          </motion.button>
        </motion.div>

        {/* Info Text */}
        <p className="text-center text-gray-500 text-xs mt-6">
          Don't worry, you can always change your name and retrain your stats later!
        </p>
      </motion.div>
    </motion.div>
  );
};
