import type { CSSProperties } from 'react';
import type { Character, GameCard } from '../data/gameData';

export function CharacterArt({ character, size = 150, glow = true }: { character: Character; size?: number; glow?: boolean }) {
  const [primary, secondary, dark] = character.colors;
  const id = `art-${character.id}`;
  return (
    <svg width={size} height={size} viewBox="0 0 180 180" role="img" aria-label={`${character.name} 캐릭터 일러스트`} className="character-art">
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={primary} />
          <stop offset="1" stopColor={dark} />
        </linearGradient>
        <linearGradient id={`${id}-skin`} x1="0" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor="#fff0df" />
          <stop offset="1" stopColor="#d7c6dc" />
        </linearGradient>
        <linearGradient id={`${id}-coat`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={secondary} />
          <stop offset="1" stopColor={dark} />
        </linearGradient>
      </defs>
      <circle cx="90" cy="90" r="84" fill={`url(#${id}-bg)`} />
      <circle cx="90" cy="90" r="72" fill="none" stroke="rgba(255,255,255,.38)" strokeWidth="1.5" strokeDasharray="3 6" />
      <path d="M17 139 Q48 116 66 132 T112 128 T166 139 L166 180 L17 180Z" fill="rgba(255,255,255,.12)" />
      <g opacity=".72" fill="none" stroke="#fff" strokeWidth="2">
        <path d="M29 48 L45 32 L59 47" />
        <path d="M125 26 L143 43 L158 29" />
        <path d="M25 104 L36 94 L47 104" />
      </g>
      {character.silhouette === 'wing' && <g fill={secondary} opacity=".88"><path d="M50 87 Q8 43 17 19 Q58 28 75 77Z"/><path d="M130 87 Q172 43 163 19 Q122 28 105 77Z"/></g>}
      {character.silhouette === 'sail' && <path d="M59 72 Q38 20 67 14 Q80 38 91 69 Q111 25 128 23 Q143 52 111 82Z" fill={secondary} stroke="rgba(255,255,255,.5)" strokeWidth="2"/>}
      {character.silhouette === 'spike' && <g fill={secondary}><path d="M61 77 L47 42 L75 65Z"/><path d="M84 68 L82 30 L99 64Z"/><path d="M108 73 L128 40 L122 82Z"/></g>}
      {character.silhouette === 'horn' && <g fill="#f3e5cf" stroke={dark} strokeWidth="2"><path d="M56 78 Q29 44 45 34 Q69 44 72 76Z"/><path d="M117 76 Q132 39 148 40 Q153 65 127 84Z"/></g>}
      {character.silhouette === 'crest' && <g fill={secondary}><path d="M56 76 Q37 42 57 24 Q70 42 78 71Z"/><path d="M75 69 Q69 30 91 17 Q103 39 98 69Z"/><path d="M100 72 Q110 34 130 31 Q131 59 113 81Z"/></g>}
      {character.silhouette === 'frill' && <path d="M41 88 Q22 40 63 31 Q88 7 117 29 Q158 36 139 91 L124 106 Q112 69 90 68 Q64 67 54 106Z" fill={secondary} stroke="rgba(255,255,255,.52)" strokeWidth="3"/>}
      <path d="M49 178 Q48 136 68 127 Q90 116 112 127 Q134 138 134 178Z" fill={`url(#${id}-coat)`} />
      <path d="M75 127 L90 149 L105 127" fill="#fff1e7" opacity=".88" />
      <path d="M66 100 Q54 68 72 52 Q88 38 109 52 Q128 69 116 103 Q109 124 91 126 Q72 123 66 100Z" fill={`url(#${id}-skin)`} stroke={dark} strokeWidth="2.2" />
      <path d="M65 83 Q53 52 80 42 Q105 33 121 57 Q102 53 91 61 Q80 72 65 83Z" fill={dark} />
      <path d="M105 53 Q127 61 122 89 Q116 75 107 71Z" fill={secondary} />
      <ellipse cx="79" cy="88" rx="4.3" ry="5.5" fill="#302d46" />
      <ellipse cx="105" cy="88" rx="4.3" ry="5.5" fill="#302d46" />
      <circle cx="80.5" cy="86" r="1.5" fill="#fff" />
      <circle cx="106.5" cy="86" r="1.5" fill="#fff" />
      <path d="M86 105 Q92 111 99 104" stroke="#9b637c" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <circle cx="68" cy="101" r="6" fill="#f29eaa" opacity=".5" />
      <circle cx="115" cy="101" r="6" fill="#f29eaa" opacity=".5" />
      <path d="M50 142 Q39 153 43 169" stroke="rgba(255,255,255,.7)" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M129 143 Q143 152 137 169" stroke="rgba(255,255,255,.7)" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="143" cy="117" r="4" fill={primary} stroke="#fff" strokeWidth="1.2" />
      <path d="M27 74 l6 -11 l6 11 l-6 11Z" fill="#fff" opacity=".85" />
      {glow && <circle cx="90" cy="90" r="83" fill="none" stroke="rgba(255,255,255,.55)" strokeWidth="2" />}
    </svg>
  );
}

export function CardArtwork({ character, card, compact = false }: { character: Character; card?: GameCard; compact?: boolean }) {
  const rarity = card?.rarity || 2;
  const label = rarity === 4 ? '★ ★ ★ ★' : rarity === 3 ? '★ ★ ★' : rarity === 2 ? '★ ★' : '★';
  return (
    <div className={`card-artwork rarity-${rarity} ${compact ? 'compact' : ''}`} style={{ '--card-a': character.colors[0], '--card-b': character.colors[1], '--card-c': character.colors[2] } as CSSProperties}>
      <div className="card-art-glow" />
      <div className="card-art-star star-one">✦</div>
      <div className="card-art-star star-two">✧</div>
      <div className="card-art-grid" />
      <CharacterArt character={character} size={compact ? 100 : 178} />
      <div className="card-art-footer">
        <span>{label}</span>
        <b>{character.name}</b>
      </div>
      {rarity === 4 && <div className="card-art-ribbon">LIVE EDITION</div>}
    </div>
  );
}
