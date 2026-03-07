import { useState, useEffect } from 'react';

const QUOTES = [
  { text: "Surprise, surprise motherfu*ker, the king is back!", author: "Conor McGregor" },
  { text: "I'm not surprised, motherfu*kers!", author: "Nate Diaz" },
  { text: "Send me location.", author: "Khabib Nurmagomedov" },
  { text: "I follow the rules of 'an eye for an eye'.", author: "Jon Jones" },
  { text: "I don't just knock them out, I pick the round.", author: "Conor McGregor" },
  { text: "Go out there and be a warrior.", author: "Dana White" },
  { text: "I am a shark, the ground is my ocean, and most people don't even know how to swim.", author: "Jean Jacques Machado" },
  { text: "My precision is perfection, and my timing is impeccable.", author: "Israel Adesanya" },
  { text: "I'm the best ever. I'm the most brutal and vicious, and most ruthless champion there's ever been.", author: "Mike Tyson" },
  { text: "There is no winning and losing, there is only self-improvement.", author: "Georges St-Pierre" },
];

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  const [quoteVisible, setQuoteVisible] = useState(false);
  const [authorVisible, setAuthorVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setQuoteVisible(true), 700);
    const t2 = setTimeout(() => setAuthorVisible(true), 1900);
    const t3 = setTimeout(() => setFadeOut(true), 9000);
    const t4 = setTimeout(() => onComplete(), 10000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

  return (
    <div className={`splash-screen${fadeOut ? ' splash-fadeout' : ''}`}>
      {/* Corner Spotlights */}
      <div className="splash-spotlight splash-spotlight-tl" />
      <div className="splash-spotlight splash-spotlight-tr" />
      <div className="splash-spotlight splash-spotlight-bl" />
      <div className="splash-spotlight splash-spotlight-br" />

      {/* Ambient center glow */}
      <div className="splash-center-glow" />

      {/* Content */}
      <div className="splash-content">
        <div className="splash-logo">
          <span className="splash-logo-icon">⬡</span>
          <span className="splash-logo-text">MMA MANAGER</span>
          <span className="splash-logo-icon">⬡</span>
        </div>

        <div className="splash-divider" />

        <blockquote className={`splash-quote${quoteVisible ? ' splash-quote-visible' : ''}`}>
          &ldquo;{quote.text}&rdquo;
        </blockquote>

        <cite className={`splash-author${authorVisible ? ' splash-author-visible' : ''}`}>
          — {quote.author}
        </cite>
      </div>
    </div>
  );
}
