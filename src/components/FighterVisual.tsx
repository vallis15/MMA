import React from 'react';
import { motion } from 'framer-motion';

// ─── Types ────────────────────────────────────────────────────────────────────

export type BodyId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface VisualConfig {
  bodyId: BodyId;
  skinToneId?: string;
  hairId?: number;    // 0 = no hair; 1–9 = active style
  hairColor?: string; // id from HAIR_COLORS
  /** @deprecated use hairId + hairColor */
  hairStyle?: string;
}

// ─── Archetypes ───────────────────────────────────────────────────────────────

export const ARCHETYPES: { id: BodyId; name: string; description: string; imagePath: string }[] = [
  { id: 1, name: 'Heavyweight',    description: 'Powerful and imposing frame',     imagePath: '/images/body01.png' },
  { id: 2, name: 'Slim/Technical', description: 'Lean, precise and fast',           imagePath: '/images/body02.png' },
  { id: 3, name: 'Athletic',       description: 'Explosive all-round physique',     imagePath: '/images/body03.png' },
  { id: 4, name: 'Striker',        description: 'Built for stand-up war',           imagePath: '/images/body04.png' },
  { id: 5, name: 'Balanced',       description: 'Versatile all-rounder',            imagePath: '/images/body05.png' },
  { id: 6, name: 'Brawler',        description: 'Raw power and relentless pressure',imagePath: '/images/body06.png' },
  { id: 7, name: 'Grappler',       description: 'Ground-game specialist',           imagePath: '/images/body07.png' },
  { id: 8, name: 'Southpaw',       description: 'Unorthodox stance, unpredictable', imagePath: '/images/body08.png' },
];

// ─── Skin Tones ───────────────────────────────────────────────────────────────

export interface SkinTonePreset {
  id: string;
  label: string;
  filter: string;
  swatch: string;
}

export const SKIN_TONES: SkinTonePreset[] = [
  { id: 'light',  label: 'Light',  filter: 'none',                                                                        swatch: '#FDDCB5' },
  { id: 'fair',   label: 'Fair',   filter: 'sepia(0.1) saturate(1.1) brightness(0.95)',                                   swatch: '#E8C49A' },
  { id: 'medium', label: 'Medium', filter: 'sepia(0.3) saturate(1.2) brightness(0.85)',                                   swatch: '#C68642' },
  { id: 'olive',  label: 'Olive',  filter: 'sepia(0.4) saturate(1.3) brightness(0.75) hue-rotate(-5deg)',                 swatch: '#9E6B3E' },
  { id: 'dark',   label: 'Dark',   filter: 'sepia(0.6) saturate(1.4) brightness(0.55) hue-rotate(-10deg)',                swatch: '#6B3A2A' },
  { id: 'deep',   label: 'Deep',   filter: 'sepia(0.8) saturate(1.6) brightness(0.40) hue-rotate(-15deg)',                swatch: '#3B1A10' },
];

// ─── Hair Styles ──────────────────────────────────────────────────────────────

export interface HairStyle {
  id: number;
  label: string;
  imagePath: string;
}

export const HAIR_STYLES: HairStyle[] = [
  { id: 2, label: 'Medium Wave', imagePath: '/images/hair02.png' },
  { id: 3, label: 'Short Crop',  imagePath: '/images/hair03.png' },
  { id: 4, label: 'Skin Fade',   imagePath: '/images/hair04.png' },
  { id: 5, label: 'Long & Loose',imagePath: '/images/hair05.png' },
  { id: 6, label: 'Close Crop',  imagePath: '/images/hair06.png' },
  { id: 7, label: 'Curly Top',   imagePath: '/images/hair07.png' },
  { id: 8, label: 'Wild Warrior',imagePath: '/images/hair08.png' },
  { id: 9, label: 'Afro',        imagePath: '/images/hair09.png' },
];

// ─── Hair Colors ──────────────────────────────────────────────────────────────

export interface HairColorPreset {
  id: string;
  label: string;
  swatch: string;
  /** CSS filter applied to the grayscale hair image to tint it */
  filter: string;
}

export const HAIR_COLORS: HairColorPreset[] = [
  {
    id: 'black',
    label: 'Black',
    swatch: '#1a0a00',
    filter: 'brightness(0.12) contrast(1.1)',
  },
  {
    id: 'darkbrown',
    label: 'Dark Brown',
    swatch: '#3d1c02',
    filter: 'sepia(1) saturate(0.7) brightness(0.38)',
  },
  {
    id: 'brown',
    label: 'Brown',
    swatch: '#6b3a1f',
    filter: 'sepia(1) saturate(1.0) brightness(0.55)',
  },
  {
    id: 'auburn',
    label: 'Auburn',
    swatch: '#8b2500',
    filter: 'sepia(1) saturate(2.0) hue-rotate(-25deg) brightness(0.75)',
  },
  {
    id: 'blond',
    label: 'Blond',
    swatch: '#d4a017',
    filter: 'sepia(1) saturate(2.5) hue-rotate(25deg) brightness(1.05)',
  },
  {
    id: 'gray',
    label: 'Gray',
    swatch: '#8a8a8a',
    filter: 'grayscale(1) brightness(0.75)',
  },
  {
    id: 'white',
    label: 'White / Silver',
    swatch: '#e8e8e8',
    filter: 'grayscale(1) brightness(1.2)',
  },
];

// ─── Hair Alignment Mapping ───────────────────────────────────────────────────
//
// Derived from pixel-level analysis of each body PNG:
//   body01 (396×1068): skull-top=3.84%  cx=49.12%  hw=26.52%
//   body02 (322×1064): skull-top=4.42%  cx=50.47%  hw=32.61%
//   body03 (360×1054): skull-top=5.12%  cx=48.47%  hw=28.61%
//   body04 (318×1068): skull-top=9.64%  cx=48.43%  hw=27.04%
//   body05 (350×1038): skull-top=5.59%  cx=49.00%  hw=30.57%
//   body06 (364×1044): skull-top=4.02%  cx=48.35%  hw=29.67%
//   body07 (332×1028): skull-top=6.52%  cx=49.70%  hw=32.53%
//   body08 (358×1030): skull-top=2.62%  cx=51.82%  hw=29.89%
//
// Each entry: { top, left, width } – all % strings relative to the
// rendered body-image container (top = head-top − style-lift, left = head-cX,
// width = head-hw × per-style scale).
// The hair element is centered with translateX(-50%).
//
// Style scale factors applied to head width:
//   hair02 ×1.14 | hair03 ×1.12 | hair04 ×1.10
//   hair05 ×1.58 | hair06 ×1.06 | hair07 ×1.22
//   hair08 ×1.76 | hair09 ×1.64
//
// Top values are set ~3% ABOVE actual skull-top to ensure full crown coverage.
// Negative values (< 0%) are valid – CSS clips nothing, the img just starts
// above the container top (which is fine – the figure is inside a larger scroll).

export interface HairSlot { top: string; left: string; width: string }
type HairKey = 'hair02'|'hair03'|'hair04'|'hair05'|'hair06'|'hair07'|'hair08'|'hair09';
type BodyKey = 'body01'|'body02'|'body03'|'body04'|'body05'|'body06'|'body07'|'body08';

export const HAIR_ALIGNMENT_MAPPING: Record<BodyKey, Record<HairKey, HairSlot>> = {
  // ── body01 – Heavyweight (396×1068) · skull-top 3.84% · hair-top ~0.3% ─────────
  body01: {
    hair02: { top: '-0.2%', left: '51.1%', width: '30.2%' },
    hair03: { top: '0.3%',  left: '50.1%', width: '29.7%' },
    hair04: { top: '0.5%',  left: '49.1%', width: '29.2%' },
    hair05: { top: '0.0%',  left: '49.1%', width: '41.9%' },
    hair06: { top: '0.3%',  left: '49.1%', width: '28.1%' },
    hair07: { top: '0.0%',  left: '49.1%', width: '32.4%' },
    hair08: { top: '-0.7%', left: '49.1%', width: '46.7%' },
    hair09: { top: '-0.7%', left: '49.1%', width: '43.5%' },
  },
  // ── body02 – Slim/Technical (322×1064) · skull-top 4.42% · hair-top ~0.9% ──────
  body02: {
    hair02: { top: '0.4%',  left: '53.5%', width: '37.2%' },
    hair03: { top: '0.9%',  left: '50.5%', width: '36.5%' },
    hair04: { top: '0.9%',  left: '50.5%', width: '35.9%' },
    hair05: { top: '0.6%',  left: '50.5%', width: '51.5%' },
    hair06: { top: '0.9%',  left: '50.5%', width: '34.6%' },
    hair07: { top: '0.6%',  left: '50.5%', width: '39.8%' },
    hair08: { top: '-0.1%', left: '50.5%', width: '57.4%' },
    hair09: { top: '-0.1%', left: '50.5%', width: '53.5%' },
  },
  // ── body03 – Athletic (360×1054) · skull-top 5.12% · hair-top ~1.6% ────────
  body03: {
    hair02: { top: '1.1%',  left: '49.5%', width: '32.6%' },
    hair03: { top: '1.6%',  left: '48.5%', width: '32.0%' },
    hair04: { top: '1.6%',  left: '48.5%', width: '31.5%' },
    hair05: { top: '1.3%',  left: '48.5%', width: '45.2%' },
    hair06: { top: '1.6%',  left: '48.5%', width: '30.3%' },
    hair07: { top: '1.3%',  left: '48.5%', width: '34.9%' },
    hair08: { top: '0.6%',  left: '48.5%', width: '50.3%' },
    hair09: { top: '0.6%',  left: '48.5%', width: '46.9%' },
  },
  // ── body04 – Striker (318×1068) · skull-top 9.64% · hair-top ~6.1% ──────────
  body04: {
    hair02: { top: '5.6%',  left: '48.4%', width: '30.8%' },
    hair03: { top: '6.1%',  left: '48.4%', width: '30.3%' },
    hair04: { top: '6.1%',  left: '48.4%', width: '29.7%' },
    hair05: { top: '5.8%',  left: '48.4%', width: '42.7%' },
    hair06: { top: '6.1%',  left: '48.4%', width: '28.7%' },
    hair07: { top: '6.8%',  left: '49.4%', width: '33.0%' },
    hair08: { top: '5.1%',  left: '48.4%', width: '47.6%' },
    hair09: { top: '5.1%',  left: '48.4%', width: '44.3%' },
  },
  // ── body05 – Balanced (350×1038) · skull-top 5.59% · hair-top ~2.1% ─────────
  body05: {
    hair02: { top: '1.6%',  left: '49.0%', width: '34.9%' },
    hair03: { top: '2.1%',  left: '49.0%', width: '34.2%' },
    hair04: { top: '2.1%',  left: '49.0%', width: '33.6%' },
    hair05: { top: '1.8%',  left: '49.0%', width: '48.3%' },
    hair06: { top: '2.1%',  left: '49.0%', width: '32.4%' },
    hair07: { top: '1.8%',  left: '49.0%', width: '37.3%' },
    hair08: { top: '1.1%',  left: '49.0%', width: '53.8%' },
    hair09: { top: '1.1%',  left: '49.0%', width: '50.1%' },
  },
  // ── body06 – Brawler (364×1044) · skull-top 4.02% · hair-top ~0.5% ──────────
  body06: {
    hair02: { top: '0.0%',  left: '50.4%', width: '33.8%' },
    hair03: { top: '0.5%',  left: '48.4%', width: '33.2%' },
    hair04: { top: '0.2%',  left: '48.4%', width: '32.6%' },
    hair05: { top: '0.2%',  left: '48.4%', width: '46.9%' },
    hair06: { top: '0.5%',  left: '48.4%', width: '31.4%' },
    hair07: { top: '0.2%',  left: '48.4%', width: '36.2%' },
    hair08: { top: '-0.5%', left: '48.4%', width: '52.2%' },
    hair09: { top: '-0.5%', left: '48.4%', width: '48.7%' },
  },
  // ── body07 – Grappler (332×1028) · skull-top 6.52% · hair-top ~3.0% ──────────
  body07: {
    hair02: { top: '2.5%',  left: '49.7%', width: '37.1%' },
    hair03: { top: '3.0%',  left: '49.7%', width: '36.4%' },
    hair04: { top: '3.0%',  left: '49.7%', width: '35.8%' },
    hair05: { top: '2.7%',  left: '49.7%', width: '51.4%' },
    hair06: { top: '3.0%',  left: '49.7%', width: '34.5%' },
    hair07: { top: '2.7%',  left: '49.7%', width: '39.7%' },
    hair08: { top: '2.0%',  left: '49.7%', width: '57.2%' },
    hair09: { top: '2.0%',  left: '49.7%', width: '53.3%' },
  },
  // ── body08 – Southpaw (358×1030) · skull-top 2.62% · hair-top ~-0.9% ────────
  body08: {
    hair02: { top: '-1.4%', left: '51.8%', width: '34.1%' },
    hair03: { top: '-0.9%', left: '51.8%', width: '33.5%' },
    hair04: { top: '-0.9%', left: '51.8%', width: '32.9%' },
    hair05: { top: '-1.2%', left: '51.8%', width: '47.2%' },
    hair06: { top: '-0.9%', left: '51.8%', width: '31.7%' },
    hair07: { top: '-1.2%', left: '51.8%', width: '36.5%' },
    hair08: { top: '-1.9%', left: '51.8%', width: '52.6%' },
    hair09: { top: '-1.9%', left: '51.8%', width: '49.0%' },
  },
};

// ─── Bounding-box Y compensation ────────────────────────────────────────────
//
// ─── Hair file padding/scale fixes ───────────────────────────────────────
//
// hair02–hair04 have different internal canvas padding than hair05–hair09.
// Hard correction layer for hair02–04 which have smaller canvases and less
// content density than hair05–09. Scale enlarges the content to match hair05.
// translateY is NEGATIVE to compensate for the enlarged top-padding that
// scale introduces — pulling the image back up so the hair sits on the crown.
// Values derived from PNG bounding-box analysis (calc_hair.py).
const HAIR_ASSET_OVERRIDES: Record<string, { extraScale: number; extraY: string; extraX: string }> = {
  hair02: { extraScale: 1.60, extraY: '-6.5%', extraX: '2.5%'  }, // Medium Wave – content 7.6% L of center (vs hair03 3.7%) → +2.5% pre-scale correction
  hair03: { extraScale: 1.64, extraY: '-9.1%', extraX: '0%'   }, // Short Crop
  hair04: { extraScale: 1.47, extraY: '-6.8%', extraX: '0%'   }, // Skin Fade
  default: { extraScale: 1.0,  extraY: '0%',   extraX: '0%'   },
};

// ─── FighterVisual Component ──────────────────────────────────────────────────

interface FighterVisualProps {
  /** The resolved visual config. */
  config: VisualConfig;
  /** Height of the rendered fighter. Width scales proportionally. */
  height?: number | string;
  /** Extra Tailwind / CSS classes on the wrapper. */
  className?: string;
  /** Disable the idle float animation (e.g. in selection grid thumbnails). */
  disableAnimation?: boolean;
  /** Show a debug outline around the hair container. */
  debugHair?: boolean;
}

export const FighterVisual: React.FC<FighterVisualProps> = ({
  config,
  height = 320,
  className = '',
  disableAnimation = false,
  debugHair = false,
}) => {
  const { bodyId, skinToneId = 'light', hairId = 0, hairColor = 'brown' } = config;
  // hair01 (Buzz Cut) was deprecated – treat legacy hairId=1 as no hair
  const safeHairId  = hairId === 1 ? 0 : hairId;

  const archetype   = ARCHETYPES.find((a) => a.id === bodyId) ?? ARCHETYPES[0];
  const skinTone    = SKIN_TONES.find((s) => s.id === skinToneId) ?? SKIN_TONES[0];
  const hairStyle   = safeHairId > 0 ? HAIR_STYLES.find((h) => h.id === safeHairId) : null;
  const hairColorP  = HAIR_COLORS.find((c) => c.id === hairColor) ?? HAIR_COLORS[2];

  // Resolve mapping slot
  const bodyKey  = `body0${bodyId}` as BodyKey;
  const hairKey  = hairStyle ? (`hair${String(hairStyle.id).padStart(2, '0')}` as HairKey) : null;
  const hairSlot = hairKey && HAIR_ALIGNMENT_MAPPING[bodyKey]
    ? HAIR_ALIGNMENT_MAPPING[bodyKey][hairKey]
    : null;

  // Resolve hard correction override (applied on the img, not the anchor div)
  const override = hairKey
    ? (HAIR_ASSET_OVERRIDES[hairKey] ?? HAIR_ASSET_OVERRIDES.default)
    : HAIR_ASSET_OVERRIDES.default;

  return (
    <div
      className={`relative select-none ${className}`}
      style={{ height, width: 'auto', display: 'inline-block' }}
    >
      {/* ── Base body layer ── */}
      <motion.div
        animate={disableAnimation ? {} : { y: [0, -6, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        className="relative h-full"
        style={{ isolation: 'isolate' }}
      >
        <img
          src={archetype.imagePath}
          alt={archetype.name}
          className="h-full w-auto object-contain"
          style={{ filter: skinTone.filter }}
          draggable={false}
        />

        {/* ── Hair overlay ─────────────────────────────────────────────────── */}
        {hairStyle && hairSlot && (
          <div
            className="absolute pointer-events-none"
            style={{
              top: hairSlot.top,
              left: hairSlot.left,
              width: hairSlot.width,
              transform: 'translateX(-50%)',
              outline: debugHair ? '1px dashed red' : undefined,
            }}
            data-hair-id={hairStyle.id}
            data-body-key={bodyKey}
          >
            <img
              src={hairStyle.imagePath}
              alt={hairStyle.label}
              className="w-full h-auto block"
              style={{
                filter: hairColorP.filter,
                transform: `scale(${override.extraScale}) translateY(${override.extraY}) translateX(${override.extraX})`,  
                transformOrigin: 'top center',
              }}
              draggable={false}
            />
          </div>
        )}
      </motion.div>
    </div>
  );
};
