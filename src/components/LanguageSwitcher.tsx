import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage, Language } from '../context/LanguageContext';
import { Globe } from 'lucide-react';

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  console.log('🔄 [SWITCHER] Rendering with language:', language);

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'cs', label: 'Čeština', flag: '🇨🇿' },
    { code: 'pl', label: 'Polski', flag: '🇵🇱' },
  ];

  return (
    <div className="flex items-center gap-2">
      <Globe className="w-4 h-4 text-gray-400" />
      <div className="flex gap-1 glass-card rounded-lg p-1">
        {languages.map((lang) => (
          <motion.button
            key={lang.code}
            type="button"
            onClick={() => {
              console.log('🖱️ [SWITCHER] Button clicked:', lang.code);
              setLanguage(lang.code);
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-3 py-1.5 rounded-md font-semibold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              language === lang.code
                ? 'bg-forge-gold text-iron-dark shadow-lg'
                : 'text-gray-400 hover:text-gray-200 hover:bg-iron-light'
            }`}
          >
            <span className="text-base">{lang.flag}</span>
            <span>{lang.code.toUpperCase()}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};
