import React from 'react';
import { LeagueType, getLeagueColor, getLeagueBgColor } from '../types';

interface LeagueBadgeProps {
  league: LeagueType;
  showText?: boolean;
}

export const LeagueBadge: React.FC<LeagueBadgeProps> = ({ league, showText = true }) => {
  const textColor = getLeagueColor(league);
  const bgColor = getLeagueBgColor(league);

  const getEmoji = (league: LeagueType) => {
    switch (league) {
      case 'Amateur':
        return '🥉'; // Bronze
      case 'Regional Pro':
        return '🥈'; // Silver
      case 'MMA Legend':
        return '🥇'; // Gold
      default:
        return '🏆';
    }
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg ${bgColor}`}>
      <span className="text-lg">{getEmoji(league)}</span>
      {showText && <span className={`text-sm font-semibold ${textColor}`}>{league}</span>}
    </div>
  );
};
