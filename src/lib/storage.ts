import { CARDS, MISSION_DEFS } from '../data/gameData';
import type { DifficultyId } from '../data/gameData';

export interface OwnedCard { cardId: string; quantity: number; level: number; }
export interface PlayRecord { score: number; accuracy: number; rank: string; fullCombo: boolean; allPerfect: boolean; playedAt: string; }
export interface GachaLog { id: string; banner: string; cardIds: string[]; createdAt: string; }
export interface UserSave {
  profile: { nickname: string; title: string; joinedAt: string };
  gems: number;
  shards: number;
  pity: number;
  exchangePoints: number;
  ownedCards: OwnedCard[];
  formation: string[];
  records: Record<string, Partial<Record<DifficultyId, PlayRecord>>>;
  gachaHistory: GachaLog[];
  claimedMissions: string[];
  missionProgress: Record<string, number>;
  clearedStories: string[];
  storyRewardsClaimed: string[];
  achievements: string[];
  settings: { noteSpeed: number; timingOffset: number; volume: number; laneGuide: boolean; }; 
  stats: { plays: number; perfect: number; great: number; good: number; bad: number; miss: number; totalScore: number; loginStreak: number; lastLogin: string; };
}

const STORAGE_KEY = 'moranosa-live-save-v1';
const todayKey = () => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`; };

export function createInitialSave(): UserSave {
  return {
    profile: { nickname: '새싹 라이더', title: '말랑한 입덕러', joinedAt: new Date().toISOString() },
    gems: 6000,
    shards: 0,
    pity: 0,
    exchangePoints: 0,
    ownedCards: [
      { cardId: 'mora_2_sticker', quantity: 1, level: 1 },
      { cardId: 'nono_1_keycap', quantity: 1, level: 1 },
      { cardId: 'alpi_1_rain', quantity: 1, level: 1 },
    ],
    formation: ['mora_2_sticker', 'nono_1_keycap', 'alpi_1_rain'],
    records: {},
    gachaHistory: [],
    claimedMissions: [],
    missionProgress: { login: 1 },
    clearedStories: ['main_01'],
    storyRewardsClaimed: [],
    achievements: [],
    settings: { noteSpeed: 1, timingOffset: 0, volume: 0.7, laneGuide: true },
    stats: { plays: 0, perfect: 0, great: 0, good: 0, bad: 0, miss: 0, totalScore: 0, loginStreak: 1, lastLogin: todayKey() },
  };
}

export function loadSave(): UserSave {
  if (typeof window === 'undefined') return createInitialSave();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialSave();
    const parsed = JSON.parse(raw) as Partial<UserSave>;
    const base = createInitialSave();
    const merged: UserSave = {
      ...base,
      ...parsed,
      profile: { ...base.profile, ...parsed.profile },
      settings: { ...base.settings, ...parsed.settings },
      stats: { ...base.stats, ...parsed.stats },
      missionProgress: { ...base.missionProgress, ...parsed.missionProgress },
      storyRewardsClaimed: parsed.storyRewardsClaimed || [],
    };
    // Keep old or externally edited saves from referencing removed catalog entries.
    merged.ownedCards = (merged.ownedCards || []).filter((item) => CARDS.some((card) => card.id === item.cardId));
    const ownedIds = new Set(merged.ownedCards.map((item) => item.cardId));
    merged.formation = [...new Set((merged.formation || []).filter((id) => ownedIds.has(id)))].slice(0, 5);
    if (merged.formation.length === 0) merged.formation = merged.ownedCards.slice(0, 5).map((item) => item.cardId);
    const today = todayKey();
    if (merged.stats.lastLogin !== today) {
      const yesterdayDate = new Date();
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yesterday = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`;
      merged.stats.loginStreak = merged.stats.lastLogin === yesterday ? merged.stats.loginStreak + 1 : 1;
      merged.stats.lastLogin = today;
      merged.missionProgress = { login: 1 };
      merged.claimedMissions = [];
    }
    return merged;
  } catch {
    return createInitialSave();
  }
}

export function saveToDisk(save: UserSave) {
  if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
}

export function getDailyMissions(save: UserSave) {
  return MISSION_DEFS.map((mission) => ({ ...mission, progress: Math.min(mission.target, save.missionProgress[mission.id] || 0), claimed: save.claimedMissions.includes(mission.id) }));
}

export function addOwnedCard(save: UserSave, cardId: string) {
  const existing = save.ownedCards.find((item) => item.cardId === cardId);
  if (existing) {
    existing.quantity += 1;
    const card = CARDS.find((item) => item.id === cardId);
    save.shards += (card?.rarity || 1) * 12;
    return true;
  }
  save.ownedCards.push({ cardId, quantity: 1, level: 1 });
  return false;
}

export interface TeamEffects { scoreBonus: number; greatScoreBonus: number; perfectScoreBonus: number; lifeShield: number; lifeHeal: number; rewardBonus: number; gradeAssist: boolean; badAssist: boolean; timingAssistMs: number; }

export function getTeamEffects(save: UserSave): TeamEffects {
  const effects: TeamEffects = { scoreBonus: 0, greatScoreBonus: 0, perfectScoreBonus: 0, lifeShield: 0, lifeHeal: 0, rewardBonus: 0, gradeAssist: false, badAssist: false, timingAssistMs: 0 };
  for (const id of save.formation) {
    const card = CARDS.find((item) => item.id === id);
    const owned = save.ownedCards.find((item) => item.cardId === id);
    if (!card || !owned) continue;
    const value = card.skillValue * (1 + Math.max(0, owned.level - 1) * 0.05);
    switch (card.skillKind) {
      case 'score': effects.scoreBonus += value; break;
      case 'greatScore': effects.greatScoreBonus += value; break;
      case 'perfectScore': effects.perfectScoreBonus += value; break;
      case 'lifeShield': effects.lifeShield += value; break;
      case 'lifeHeal': effects.lifeHeal += value; break;
      case 'reward': effects.rewardBonus += value; break;
      case 'gradeAssist': effects.gradeAssist = true; break;
      case 'badAssist': effects.badAssist = true; break;
      case 'timingAssist': effects.timingAssistMs += value; break;
    }
  }
  effects.scoreBonus = Math.min(25, effects.scoreBonus);
  effects.greatScoreBonus = Math.min(20, effects.greatScoreBonus);
  effects.perfectScoreBonus = Math.min(20, effects.perfectScoreBonus);
  effects.lifeShield = Math.min(35, effects.lifeShield);
  effects.lifeHeal = Math.min(20, effects.lifeHeal);
  effects.rewardBonus = Math.min(25, effects.rewardBonus);
  effects.timingAssistMs = Math.min(18, effects.timingAssistMs);
  return effects;
}
