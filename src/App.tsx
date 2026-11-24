import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, FormEvent, ReactNode } from 'react';
import {
  ArrowRight, AudioLines, BookOpen, CalendarCheck, Check, ChevronDown, ChevronRight,
  CircleHelp, Clock3, Crown, Disc3, Gem, Gift, Headphones, Home, Keyboard,
  LogIn, LogOut, Maximize2, Menu, Music2, Pause, Play, Plus, RefreshCw, RotateCcw, Settings,
  ShieldCheck, ShoppingBag, Sparkles, Ticket, Trophy, UserCircle2,
  Users, Volume2, X, Zap,
} from 'lucide-react';
import {
  ALBUMS, CARDS, CHARACTERS, DIFFICULTIES, GROUPS, SONGS, STORIES,
  getAlbum, getCharacter, getGroup, getSong,
} from './data/gameData';
import type { DifficultyId } from './data/gameData';
import { CharacterArt, CardArtwork } from './components/CharacterArt';
import { RhythmSession } from './engine/RhythmSession';
import type { LiveResult, LiveStats } from './engine/RhythmSession';
import { addOwnedCard, getDailyMissions, getTeamEffects, loadSave, saveToDisk } from './lib/storage';
import type { GachaLog, OwnedCard, UserSave } from './lib/storage';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import type { Session } from '@supabase/supabase-js';

 type Screen = 'home' | 'live' | 'albums' | 'characters' | 'gacha' | 'cards' | 'stories' | 'missions' | 'account' | 'settings';
 type GachaBanner = 'pickup' | 'standard' | 'event';

const NAV_ITEMS: { id: Screen; label: string; icon: typeof Home }[] = [
  { id: 'home', label: '홈', icon: Home },
  { id: 'live', label: '라이브', icon: AudioLines },
  { id: 'albums', label: '앨범', icon: Disc3 },
  { id: 'characters', label: '캐릭터', icon: Users },
  { id: 'gacha', label: '뽑기', icon: Sparkles },
  { id: 'cards', label: '카드', icon: Ticket },
  { id: 'stories', label: '스토리', icon: BookOpen },
  { id: 'missions', label: '미션', icon: CalendarCheck },
];

const PICKUP_BY_BANNER: Record<GachaBanner, string> = { pickup: 'mora_4_spark', standard: 'hwarok_4_core', event: 'alpi_4_silence' };
const BANNER_LABEL: Record<GachaBanner, string> = { pickup: '말풍선 픽업', standard: '상시 모집', event: '별빛 우편 이벤트' };
const RARITY_RATE = '4성 3% · 3성 17% · 2성 35% · 1성 45%';

function cx(...values: (string | false | undefined)[]) { return values.filter(Boolean).join(' '); }

function PanelTitle({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="panel-title-row"><div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h2>{title}</h2>{description && <p>{description}</p>}</div>{action}</div>;
}

function Tag({ children, tone = 'soft' }: { children: ReactNode; tone?: 'soft' | 'pink' | 'mint' | 'gold' | 'dark' }) {
  return <span className={`tag tag-${tone}`}>{children}</span>;
}

function Button({ children, onClick, variant = 'primary', size = 'md', disabled = false, className = '', type = 'button' }: { children: ReactNode; onClick?: () => void; variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold'; size?: 'sm' | 'md' | 'lg'; disabled?: boolean; className?: string; type?: 'button' | 'submit' }) {
  return <button type={type} onClick={onClick} disabled={disabled} className={cx('btn', `btn-${variant}`, `btn-${size}`, className)}>{children}</button>;
}

function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [save, setSave] = useState<UserSave>(() => loadSave());
  const [selectedAlbumId, setSelectedAlbumId] = useState(ALBUMS[0].id);
  const [selectedCharacterId, setSelectedCharacterId] = useState(CHARACTERS[0].id);
  const [selectedSongId, setSelectedSongId] = useState(SONGS[0].id);
  const [difficulty, setDifficulty] = useState<DifficultyId>('grow');
  const [liveResult, setLiveResult] = useState<LiveResult | null>(null);
  const [liveKey, setLiveKey] = useState(0);
  const [lastPulls, setLastPulls] = useState<string[]>([]);
  const [gachaBanner, setGachaBanner] = useState<GachaBanner>('pickup');
  const [selectedStoryId, setSelectedStoryId] = useState('main_01');
  const [storyLine, setStoryLine] = useState(0);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [cloudReady, setCloudReady] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nicknameDraft, setNicknameDraft] = useState(save.profile.nickname);
  const [pullBusy, setPullBusy] = useState(false);

  const notify = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2400);
  }, []);

  useEffect(() => { saveToDisk(save); }, [save]);

  useEffect(() => {
    const client = supabase;
    if (!client) { setAuthReady(true); setCloudReady(true); return; }
    let alive = true;
    client.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setSession(data.session);
      setAuthReady(true);
      if (!data.session) setCloudReady(true);
    });
    const { data: listener } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) setCloudReady(true);
    });
    return () => { alive = false; listener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    const client = supabase;
    if (!client || !session) { setCloudReady(true); return; }
    let alive = true;
    setCloudReady(false);
    const loadCloudState = async () => {
      const [{ data: cloud }, { data: wallet }, { data: serverCards, error: cardsError }, { data: serverHistory, error: historyError }, { data: serverStoryClaims, error: storyClaimsError }] = await Promise.all([
        client.from('player_saves').select('save_data').eq('user_id', session.user.id).maybeSingle(),
        client.rpc('get_player_wallet'),
        client.from('player_cards').select('card_id, quantity, level').eq('user_id', session.user.id),
        client.from('gacha_history').select('id, banner, pulls, created_at').eq('user_id', session.user.id).order('created_at', { ascending: false }).limit(60),
        client.from('story_claims').select('story_id').eq('user_id', session.user.id),
      ]);
      if (!alive) return;
      const ownedCards: OwnedCard[] = (serverCards || []).filter((item: { card_id: string }) => CARDS.some((card) => card.id === item.card_id)).map((item: { card_id: string; quantity: number; level: number }) => ({ cardId: item.card_id, quantity: item.quantity, level: item.level }));
      const gachaHistory: GachaLog[] = (serverHistory || []).map((item: { id: string; banner: string; pulls: unknown; created_at: string }) => ({ id: item.id, banner: item.banner, cardIds: Array.isArray(item.pulls) ? item.pulls.map((pull: string | { cardId?: string }) => typeof pull === 'string' ? pull : pull.cardId || '').filter(Boolean) : [], createdAt: item.created_at }));
      const storyRewardsClaimed = (serverStoryClaims || []).map((item: { story_id: string }) => item.story_id);
      if (cardsError) notify(`서버 카드 목록을 불러오지 못했습니다: ${cardsError.message}`);
      if (historyError) notify(`서버 뽑기 기록을 불러오지 못했습니다: ${historyError.message}`);
      if (storyClaimsError) notify(`서버 스토리 보상을 불러오지 못했습니다: ${storyClaimsError.message}`);
      if (cloud?.save_data) {
        const cloudSave = cloud.save_data as UserSave;
        setSave((current) => ({ ...current, ...cloudSave, ownedCards, gachaHistory, storyRewardsClaimed, formation: (cloudSave.formation || current.formation).filter((id) => ownedCards.some((item) => item.cardId === id)).slice(0, 5), profile: { ...current.profile, ...(cloudSave.profile || {}) }, settings: { ...current.settings, ...(cloudSave.settings || {}) }, stats: { ...current.stats, ...(cloudSave.stats || {}) }, missionProgress: { ...current.missionProgress, ...(cloudSave.missionProgress || {}) } }));
      } else {
        setSave((current) => ({ ...current, ownedCards, gachaHistory, storyRewardsClaimed, formation: current.formation.filter((id) => ownedCards.some((item) => item.cardId === id)).slice(0, 5) }));
      }
      if (wallet && typeof wallet === 'object') {
        const state = wallet as { gems?: number; shards?: number; pity?: number; exchange_points?: number };
        setSave((current) => ({ ...current, gems: Number(state.gems ?? current.gems), shards: Number(state.shards ?? current.shards), pity: Number(state.pity ?? current.pity), exchangePoints: Number(state.exchange_points ?? current.exchangePoints) }));
      }
      if (!cloud?.save_data) {
        const { data: currentUser } = await client.auth.getUser();
        if (currentUser.user && alive) await client.from('player_saves').upsert({ user_id: currentUser.user.id, save_data: save });
      }
      if (alive) setCloudReady(true);
    };
    void loadCloudState();
    return () => { alive = false; };
  }, [session?.user.id]);

  useEffect(() => {
    const client = supabase;
    if (!client || !session || !cloudReady) return;
    const timeout = window.setTimeout(() => {
      void client.from('player_saves').upsert({ user_id: session.user.id, save_data: save, updated_at: new Date().toISOString() });
    }, 650);
    return () => window.clearTimeout(timeout);
  }, [save, session, cloudReady]);

  const ownedCardIds = useMemo(() => new Set(save.ownedCards.map((item) => item.cardId)), [save.ownedCards]);
  const selectedSong = getSong(selectedSongId);
  const dailyMissions = getDailyMissions(save);
  const selectedOwnedCard = selectedCardId ? save.ownedCards.find((item) => item.cardId === selectedCardId) : undefined;
  const selectedCard = selectedCardId ? CARDS.find((card) => card.id === selectedCardId) : undefined;

  const changeScreen = (next: Screen) => {
    if (next === 'stories' && !document.fullscreenElement) {
      const root = document.documentElement as HTMLElement & { requestFullscreen?: () => Promise<void> };
      if (root.requestFullscreen) void root.requestFullscreen().catch(() => undefined);
    }
    if (screen === 'stories' && next !== 'stories' && document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    setScreen(next);
    setLiveResult(null);
  };

  const handleLiveFinish = (result: LiveResult) => {
    setLiveResult(result);
    if (supabase && session) {
      void supabase.rpc('record_live_finish', {
        p_song_id: result.songId,
        p_difficulty: result.difficulty,
        p_score: result.score,
        p_accuracy: Number(result.accuracy.toFixed(3)),
        p_judgements: { perfect: result.perfect, great: result.great, good: result.good, bad: result.bad, miss: result.miss, maxCombo: result.maxCombo },
      }).then(({ data, error }) => {
        if (error) { notify(`서버 기록 저장 실패: ${error.message}`); return; }
        const wallet = data as { gems?: number };
        if (typeof wallet?.gems === 'number') setSave((previous) => ({ ...previous, gems: wallet.gems! }));
      });
    }
    setSave((previous) => {
      const next: UserSave = structuredClone(previous);
      const recordGroup = next.records[result.songId] || {};
      const oldRecord = recordGroup[result.difficulty];
      if (!oldRecord || result.score > oldRecord.score) {
        recordGroup[result.difficulty] = { score: result.score, accuracy: result.accuracy, rank: result.rank, fullCombo: result.fullCombo, allPerfect: result.allPerfect, playedAt: new Date().toISOString() };
      }
      next.records[result.songId] = recordGroup;
      next.stats.plays += 1;
      next.stats.perfect += result.perfect;
      next.stats.great += result.great;
      next.stats.good += result.good;
      next.stats.bad += result.bad;
      next.stats.miss += result.miss;
      next.stats.totalScore += result.score;
      if (!(supabase && session)) {
        const baseReward = result.score > 0 ? 15 + Math.floor(result.score / 100000) * 5 : 0;
        next.gems += Math.round(baseReward * (1 + getTeamEffects(previous).rewardBonus / 100));
      }
      next.missionProgress.play1 = (next.missionProgress.play1 || 0) + 1;
      next.missionProgress.play3 = (next.missionProgress.play3 || 0) + 1;
      next.missionProgress.score = Math.max(next.missionProgress.score || 0, result.score);
      const storyBySong: Record<string, string> = { rage_01: 'rage_01', alppa_01: 'alppa_01', post_01: 'post_01', fern_01: 'fern_01' };
      const unlockedStory = storyBySong[result.songId];
      if (unlockedStory && !next.clearedStories.includes(unlockedStory)) next.clearedStories.push(unlockedStory);
      if (!next.achievements.includes('first_live')) next.achievements.push('first_live');
      if (result.fullCombo && !next.achievements.includes('full_combo')) next.achievements.push('full_combo');
      if (result.allPerfect && !next.achievements.includes('all_perfect')) next.achievements.push('all_perfect');
      if (result.score >= 1000000 && !next.achievements.includes('million')) next.achievements.push('million');
      return next;
    });
  };

  const claimMission = async (id: string, reward: number) => {
    if (supabase && session) {
      const { data, error } = await supabase.rpc('claim_mission_reward', { p_mission_id: id });
      if (error) { notify(`보상 수령 실패: ${error.message}`); return; }
      setSave((previous) => ({ ...previous, gems: Number((data as { gems?: number })?.gems ?? previous.gems + reward), claimedMissions: [...previous.claimedMissions, id] }));
      notify('미션 보상을 수령했어요.');
      return;
    }
    setSave((previous) => ({ ...previous, gems: previous.gems + reward, claimedMissions: [...previous.claimedMissions, id] }));
    notify(`크리스탈 ${reward}개를 받았어요!`);
  };

  const drawLocal = (count: number) => {
    const cost = count === 10 ? 3000 : 300;
    if (save.gems < cost) { notify('크리스탈이 부족해요. 미션 보상을 확인해 주세요.'); return; }
    const pulls: string[] = [];
    let pity = save.pity;
    let exchangePoints = save.exchangePoints;
    const hasHighBefore = { value: false };
    const isPickup = gachaBanner !== 'standard';
    const featured = PICKUP_BY_BANNER[gachaBanner];
    for (let index = 0; index < count; index += 1) {
      const roll = Math.random() * 100;
      let rarity = pity >= 99 ? 4 : roll < 3 ? 4 : roll < 20 ? 3 : roll < 55 ? 2 : 1;
      if (count === 10 && index === 9 && !hasHighBefore.value && rarity < 3) rarity = 3;
      let pool = CARDS.filter((card) => card.rarity === rarity);
      if (rarity === 4 && isPickup && Math.random() < 0.5) pool = CARDS.filter((card) => card.id === featured);
      const card = pool[Math.floor(Math.random() * pool.length)] || CARDS[0];
      pulls.push(card.id);
      if (rarity >= 3) hasHighBefore.value = true;
      pity = rarity === 4 ? 0 : pity + 1;
      exchangePoints += 1;
    }
    setSave((previous) => {
      const next = structuredClone(previous);
      next.gems -= cost;
      next.pity = pity;
      next.exchangePoints = exchangePoints;
      pulls.forEach((cardId) => addOwnedCard(next, cardId));
      next.gachaHistory.unshift({ id: crypto.randomUUID(), banner: gachaBanner, cardIds: pulls, createdAt: new Date().toISOString() });
      next.gachaHistory = next.gachaHistory.slice(0, 60);
      return next;
    });
    setLastPulls(pulls);
  };

  const drawGacha = async (count: number) => {
    if (pullBusy) return;
    setPullBusy(true);
    setLastPulls([]);
    try {
      if (supabase && session) {
        const { data, error } = await supabase.functions.invoke('draw-gacha', { body: { banner: gachaBanner, count } });
        if (error) throw error;
        const payload = data as { pulls: { cardId: string; duplicate?: boolean }[]; gems: number; pity: number; exchangePoints: number; shards?: number };
        const ids = payload.pulls.map((item) => item.cardId);
        setSave((previous) => {
          const next = structuredClone(previous);
          next.gems = payload.gems;
          next.pity = payload.pity;
          next.exchangePoints = payload.exchangePoints;
          ids.forEach((cardId) => addOwnedCard(next, cardId));
          if (typeof payload.shards === 'number') next.shards = payload.shards;
          next.gachaHistory.unshift({ id: crypto.randomUUID(), banner: gachaBanner, cardIds: ids, createdAt: new Date().toISOString() });
          next.gachaHistory = next.gachaHistory.slice(0, 60);
          return next;
        });
        setLastPulls(ids);
      } else {
        drawLocal(count);
      }
    } catch (error) {
      notify(`뽑기 실패: ${error instanceof Error ? error.message : '서버 응답을 확인해 주세요.'}`);
    } finally {
      setPullBusy(false);
    }
  };

  const exchangeFeatured = async () => {
    const cardId = PICKUP_BY_BANNER[gachaBanner];
    if (supabase && session) {
      const { data, error } = await supabase.rpc('exchange_featured_card', { p_card_id: cardId });
      if (error) { notify(`교환 실패: ${error.message}`); return; }
      const payload = data as { exchange_points: number; shards: number };
      setSave((previous) => {
        const next = structuredClone(previous);
        next.exchangePoints = payload.exchange_points;
        addOwnedCard(next, cardId);
        next.shards = payload.shards;
        return next;
      });
    } else {
      if (save.exchangePoints < 200) { notify('교환 포인트가 200개 필요해요.'); return; }
      setSave((previous) => {
        const next = structuredClone(previous);
        next.exchangePoints -= 200;
        addOwnedCard(next, cardId);
        return next;
      });
    }
    setLastPulls([cardId]);
    notify('픽업 카드를 교환했어요!');
  };

  const claimStory = async (storyId: string, reward: number) => {
    if (save.storyRewardsClaimed.includes(storyId)) return;
    if (supabase && session) {
      const { data, error } = await supabase.rpc('claim_story_reward', { p_story_id: storyId });
      if (error) { notify(`스토리 보상 수령 실패: ${error.message}`); return; }
      const payload = data as { gems: number; reward: number };
      setSave((previous) => ({ ...previous, gems: payload.gems, storyRewardsClaimed: [...previous.storyRewardsClaimed, storyId] }));
      notify(`서버에서 크리스탈 ${payload.reward}개를 받았어요.`);
      return;
    }
    setSave((previous) => ({ ...previous, storyRewardsClaimed: [...previous.storyRewardsClaimed, storyId], gems: previous.gems + reward }));
    notify(`스토리 보상 크리스탈 ${reward}개 획득!`);
  };

  const levelUpCard = async (cardId: string) => {
    const card = CARDS.find((item) => item.id === cardId);
    const owned = save.ownedCards.find((item) => item.cardId === cardId);
    if (!card || !owned) return;
    if (owned.level >= 10) { notify('이 카드는 최대 레벨입니다.'); return; }
    const cost = owned.level * 10;
    if (save.shards < cost) { notify(`레벨업에 조각 ${cost}개가 필요해요.`); return; }
    if (supabase && session) {
      const { data, error } = await supabase.rpc('level_up_card', { p_card_id: cardId });
      if (error) { notify(`레벨업 실패: ${error.message}`); return; }
      const result = data as { level: number; shards: number };
      setSave((previous) => {
        const next = structuredClone(previous);
        next.shards = result.shards;
        const item = next.ownedCards.find((ownedItem) => ownedItem.cardId === cardId);
        if (item) item.level = result.level;
        return next;
      });
      notify('서버에 카드 레벨을 저장했어요!');
      return;
    }
    setSave((previous) => {
      const next = structuredClone(previous);
      next.shards -= cost;
      const item = next.ownedCards.find((ownedItem) => ownedItem.cardId === cardId);
      if (item) item.level = Math.min(10, item.level + 1);
      return next;
    });
    notify('카드 레벨이 올랐어요!');
  };

  const toggleFormation = (cardId: string) => {
    const isEquipped = save.formation.includes(cardId);
    if (!isEquipped && save.formation.length >= 5) { notify('편성 슬롯은 최대 5장까지 사용할 수 있어요.'); return; }
    setSave((previous) => {
      const next = structuredClone(previous);
      next.formation = isEquipped ? next.formation.filter((id) => id !== cardId) : [...next.formation, cardId];
      return next;
    });
  };

  const register = async () => {
    if (!email.trim() || password.length < 6) { setAuthMessage('이메일과 6자 이상의 비밀번호를 입력해 주세요.'); return; }
    if (!supabase) { setAuthMessage('Supabase 설정이 없어 게스트 모드로 실행 중입니다.'); return; }
    setAuthBusy(true); setAuthMessage('');
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { nickname: nicknameDraft || '새싹 라이더' } } });
    setAuthBusy(false);
    setAuthMessage(error ? error.message : '가입 요청을 보냈습니다. 이메일 인증이 설정되어 있다면 메일을 확인해 주세요.');
  };

  const login = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) { setAuthMessage('Supabase URL과 공개 anon key를 .env.local에 설정해 주세요.'); return; }
    setAuthBusy(true); setAuthMessage('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setAuthBusy(false);
    setAuthMessage(error ? error.message : '로그인되었습니다.');
  };

  const logout = async () => {
    if (supabase) await supabase.auth.signOut();
    setSession(null);
    setCloudReady(true);
    notify('로그아웃했습니다. 게스트 저장 데이터는 이 기기에 남아 있어요.');
  };

  const saveNickname = () => {
    const name = nicknameDraft.trim().slice(0, 16);
    if (!name) { notify('닉네임을 입력해 주세요.'); return; }
    setSave((previous) => ({ ...previous, profile: { ...previous.profile, nickname: name } }));
    notify('프로필을 저장했어요.');
  };

  const resetLive = () => { setLiveResult(null); setLiveKey((value) => value + 1); };

  return (
    <div className={cx('app-shell', screen === 'stories' && 'story-app-shell')}>
      <aside className="sidebar">
        <button className="brand-lockup" onClick={() => changeScreen('home')} aria-label="홈으로">
          <span className="brand-mark">M!</span>
          <span><b>MORANOSAURUS</b><small>LIVE · rhythm crew</small></span>
        </button>
        <div className="nav-caption">MAIN STAGE</div>
        <nav className="side-nav">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return <button key={item.id} onClick={() => changeScreen(item.id)} className={cx('nav-item', screen === item.id && 'active')}><Icon size={18} strokeWidth={2.1} /><span>{item.label}</span>{item.id === 'gacha' && <i className="nav-dot" />}</button>;
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-event"><div className="event-glow"><Sparkles size={18} /></div><b>별빛 배달 이벤트</b><span>별의 항로를 열어 봐!</span><button onClick={() => { setGachaBanner('event'); changeScreen('gacha'); }}>이벤트 보기 <ArrowRight size={13} /></button></div>
          <button className={cx('nav-item', screen === 'account' && 'active')} onClick={() => changeScreen('account')}><UserCircle2 size={18} /><span>계정 / 프로필</span></button>
          <button className={cx('nav-item', screen === 'settings' && 'active')} onClick={() => changeScreen('settings')}><Settings size={18} /><span>설정</span></button>
        </div>
        <div className="sidebar-version">v0.2.0 · THREE DINO EDITION</div>
      </aside>

      <main className="main-column">
        <header className="topbar">
          <div className="topbar-mobile-brand"><span className="brand-mark small">M!</span><b>MORANOSAURUS LIVE</b></div>
          <div className="breadcrumb"><span>STUDIO</span><ChevronRight size={13} /><b>{NAV_ITEMS.find((item) => item.id === screen)?.label || (screen === 'account' ? '계정' : '설정')}</b></div>
          <div className="topbar-actions">
            <div className="currency-pill"><Gem size={15} fill="currentColor" /><b>{save.gems.toLocaleString('ko-KR')}</b><span>CRYSTAL</span></div>
            <div className="currency-pill shard-pill"><Sparkles size={14} /><b>{save.shards.toLocaleString('ko-KR')}</b><span>SHARD</span></div>
            <button className="profile-chip" onClick={() => changeScreen('account')}><span className="profile-avatar">{save.profile.nickname.slice(0, 1)}</span><span>{save.profile.nickname}</span><ChevronDown size={14} /></button>
          </div>
        </header>

        <div className="page-content">
          {screen === 'home' && <HomeScreen save={save} onNavigate={changeScreen} onSelectSong={(id) => { setSelectedSongId(id); changeScreen('live'); }} />}
          {screen === 'live' && <LiveScreen key={`${liveKey}-${liveResult ? 'result' : 'play'}`} song={selectedSong} selectedSongId={selectedSongId} onSongChange={setSelectedSongId} difficulty={difficulty} onDifficultyChange={setDifficulty} save={save} teamSkills={getTeamEffects(save)} rewardBonus={supabase && session ? 0 : getTeamEffects(save).rewardBonus} onFinish={handleLiveFinish} result={liveResult} onRestart={resetLive} onExit={() => setLiveResult(null)} onNotify={notify} />}
          {screen === 'albums' && <AlbumsScreen selectedAlbumId={selectedAlbumId} onSelectAlbum={setSelectedAlbumId} onSelectSong={(id) => { setSelectedSongId(id); changeScreen('live'); }} save={save} />}
          {screen === 'characters' && <CharactersScreen selectedCharacterId={selectedCharacterId} onSelectCharacter={setSelectedCharacterId} />}
          {screen === 'gacha' && <GachaScreen banner={gachaBanner} onBannerChange={setGachaBanner} save={save} pulls={lastPulls} onDraw={drawGacha} onExchange={exchangeFeatured} ownedCardIds={ownedCardIds} busy={pullBusy} />}
          {screen === 'cards' && <CardsScreen save={save} onSelectCard={setSelectedCardId} onToggleFormation={toggleFormation} />}
          {screen === 'stories' && <StoriesScreen save={save} selectedStoryId={selectedStoryId} onSelectStory={(id) => { setSelectedStoryId(id); setStoryLine(0); }} line={storyLine} onNextLine={setStoryLine} onClaim={claimStory} onExit={() => changeScreen('home')} />}
          {screen === 'missions' && <MissionsScreen missions={dailyMissions} save={save} onClaim={claimMission} />}
          {screen === 'account' && <AccountScreen save={save} session={session} ready={authReady} configured={isSupabaseConfigured} email={email} password={password} nickname={nicknameDraft} message={authMessage} busy={authBusy} onEmail={setEmail} onPassword={setPassword} onNickname={setNicknameDraft} onSaveNickname={saveNickname} onRegister={register} onLogin={login} onLogout={logout} />}
          {screen === 'settings' && <SettingsScreen save={save} onChange={(settings) => setSave((previous) => ({ ...previous, settings: { ...previous.settings, ...settings } }))} onNotify={notify} />}
        </div>
        <footer className="page-footer"><span>© MORANOSAURUS LIVE · ORIGINAL DINOSAUR IDOL PROJECT</span><span>오리지널 합성 음원 · 게스트 저장 지원</span></footer>
      </main>

      <nav className="mobile-nav">
        {NAV_ITEMS.slice(0, 5).map((item) => { const Icon = item.icon; return <button key={item.id} onClick={() => changeScreen(item.id)} className={cx(screen === item.id && 'active')}><Icon size={20} /><span>{item.label}</span></button>; })}
        <button onClick={() => changeScreen('account')} className={cx((screen === 'account' || screen === 'settings') && 'active')}><Menu size={20} /><span>더보기</span></button>
      </nav>
      {toast && <div className="toast"><Check size={16} />{toast}</div>}
      {selectedCard && selectedOwnedCard && <div className="modal-scrim" onClick={() => setSelectedCardId(null)}><div className="card-detail-modal" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setSelectedCardId(null)}><X size={18} /></button><CardArtwork character={getCharacter(selectedCard.characterId)} card={selectedCard} /><div className="card-detail-copy"><Tag tone="gold">{selectedCard.rarity} STAR · LV.{selectedOwnedCard.level}</Tag><h2>{selectedCard.name}</h2><p className="muted">{getCharacter(selectedCard.characterId).name} · {getGroup(getCharacter(selectedCard.characterId).groupId).name}</p><h4>{selectedCard.skillName}</h4><p>{selectedCard.skillDescription}</p><div className="story-quote">“{selectedCard.story}”</div><Button variant={save.formation.includes(selectedCard.id) ? 'secondary' : 'gold'} onClick={() => toggleFormation(selectedCard.id)}>{save.formation.includes(selectedCard.id) ? '편성 해제' : '라이브 팀에 편성'}</Button><Button onClick={() => levelUpCard(selectedCard.id)}><Plus size={16} /> 카드 레벨업 · 조각 {selectedOwnedCard.level * 10}</Button></div></div></div>}
    </div>
  );
}

function HomeScreen({ save, onNavigate, onSelectSong }: { save: UserSave; onNavigate: (screen: Screen) => void; onSelectSong: (id: string) => void }) {
  const featuredSong = SONGS[0];
  const topCharacters = ['mora', 'hwarok', 'alpi'].map((id) => getCharacter(id));
  const recordCount = Object.values(save.records).reduce((count, record) => count + Object.keys(record).length, 0);
  return <div className="screen-stack home-screen">
    <section className="hero-banner">
      <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" /><div className="hero-spark spark-a">✦</div><div className="hero-spark spark-b">✧</div>
      <div className="hero-copy"><Tag tone="gold">SEASON 01 · LIVE NOW</Tag><div className="hero-kicker">A DINO IDOL RHYTHM GAME</div><h1>말이 좀 꼬여도,<br /><em>박자는 맞잖아!</em></h1><p>공룡 아이돌의 엉뚱한 하루와 오리지널 리듬을 만나 봐.<br />오늘의 무대는 네 손끝에서 시작돼.</p><div className="hero-actions"><Button size="lg" onClick={() => onNavigate('live')}><Play size={17} fill="currentColor" /> 라이브 시작</Button><Button variant="secondary" size="lg" onClick={() => onNavigate('stories')}><BookOpen size={17} /> 스토리 보기</Button></div><div className="hero-microcopy"><span><i className="live-dot" /> ALWAYS ON BEAT</span><span>3 ORIGINAL DINOSAURS</span><span>5 ORIGINAL ALBUMS</span></div></div>
      <div className="hero-art-area"><div className="hero-disc disc-back" /><div className="hero-disc disc-front"><span>??!</span><small>논점공룡</small></div><div className="hero-character-main"><CharacterArt character={topCharacters[0]} size={250} /></div><div className="hero-character-left"><CharacterArt character={topCharacters[1]} size={142} /></div><div className="hero-character-right"><CharacterArt character={topCharacters[2]} size={154} /></div><div className="hero-floating-note note-one">♪</div><div className="hero-floating-note note-two">!</div></div>
      <div className="hero-number">01 <span>/ 05</span></div>
    </section>

    <section className="welcome-row"><div><div className="eyebrow">WELCOME BACK, RIDER</div><h2>{save.profile.nickname} 님, 오늘도 박자에 올라타 볼까요?</h2><p>첫 무대의 긴장감도, 완벽한 콤보의 짜릿함도 여기서 시작돼요.</p></div><div className="welcome-stats"><div><b>{save.stats.plays}</b><span>LIVE PLAY</span></div><div><b>{recordCount}</b><span>RECORDS</span></div><div><b>{save.stats.loginStreak}<small>일</small></b><span>STREAK</span></div></div></section>

    <section className="home-feature-grid">
      <div className="feature-panel today-panel"><div className="feature-head"><div><div className="eyebrow">TODAY'S TRACK</div><h3>오늘의 추천곡</h3></div><Tag tone="mint">NEW TRACK</Tag></div><button className="today-song" onClick={() => onSelectSong(featuredSong.id)}><div className="song-cover cover-yellow"><span>??!</span><small>논점공룡</small></div><div className="today-song-copy"><b>{featuredSong.title}</b><span>{featuredSong.artist} · {featuredSong.genre}</span><div className="song-meta"><span><AudioLines size={13} /> {featuredSong.bpm} BPM</span><span><Clock3 size={13} /> {featuredSong.duration}s</span></div></div><span className="round-play"><Play size={17} fill="currentColor" /></span></button><div className="feature-foot"><span>추천 난이도 <b>성장 8</b></span><button onClick={() => onSelectSong(featuredSong.id)}>선곡하기 <ChevronRight size={14} /></button></div></div>
      <div className="feature-panel daily-panel"><div className="feature-head"><div><div className="eyebrow">DAILY CHECK-IN</div><h3>오늘의 리듬 루틴</h3></div><CalendarCheck size={21} /></div><div className="mission-progress"><div className="mission-progress-top"><b>라이브 1회 플레이</b><span>{Math.min(1, save.missionProgress.play1 || 0)} / 1</span></div><div className="progress-track"><i style={{ width: `${Math.min(100, (save.missionProgress.play1 || 0) * 100)}%` }} /></div></div><div className="daily-reward"><div className="reward-icon"><Gem size={18} /></div><div><b>크리스탈 80개</b><span>첫 라이브 미션 보상</span></div><Button variant="secondary" size="sm" onClick={() => onNavigate('missions')}>미션 보기</Button></div></div>
    </section>

    <section className="home-section"><PanelTitle eyebrow="MEET THE CREW" title="오늘의 주인공" description="뭐라노사우르스, 개빡치노사우르스, 알빠노사우르스. 세 공룡이 무대를 책임집니다." action={<Button variant="ghost" size="sm" onClick={() => onNavigate('characters')}>캐릭터 도감 <ArrowRight size={14} /></Button>} /><div className="home-character-row">{topCharacters.map((character) => <button key={character.id} className="home-character-card" onClick={() => onNavigate('characters')}><CharacterArt character={character} size={104} /><b>{character.name}</b><span>{character.alias}</span><i>{getGroup(character.groupId).name}</i></button>)}</div></section>
  </div>;
}

function AlbumsScreen({ selectedAlbumId, onSelectAlbum, onSelectSong, save }: { selectedAlbumId: string; onSelectAlbum: (id: string) => void; onSelectSong: (id: string) => void; save: UserSave }) {
  const selected = getAlbum(selectedAlbumId);
  const albumSongs = SONGS.filter((song) => song.albumId === selectedAlbumId);
  return <div className="screen-stack"><PanelTitle eyebrow="DISCOGRAPHY" title="앨범 & 디스코그래피" description="세 공룡의 사운드가 세 공룡의 사운드가 다섯 개의 오리지널 앨범으로 확장됩니다." />
    <div className="album-shelf">{ALBUMS.map((album, index) => { const group = getGroup(album.groupId); return <button key={album.id} onClick={() => onSelectAlbum(album.id)} className={cx('album-tile', selectedAlbumId === album.id && 'selected')} style={{ '--album-a': album.colors[0], '--album-b': album.colors[1], '--album-c': album.colors[2] } as CSSProperties}><div className="album-tile-art"><div className="album-art-disc">{group.logo}</div><span className="album-number">0{index + 1}</span><b>{album.title.split(' : ')[0].replace('의 ', '\n')}</b><small>{group.name}</small><div className="album-art-stars">✦　✧　✦</div></div><span className="album-tile-bottom"><b>{album.subtitle}</b><small>{album.genre}</small></span></button>; })}</div>
    <section className="album-detail-panel"><div className="album-detail-cover" style={{ '--album-a': selected.colors[0], '--album-b': selected.colors[1], '--album-c': selected.colors[2] } as CSSProperties}><div className="album-cover-symbol">{getGroup(selected.groupId).logo}</div><div className="album-cover-title"><span>ORIGINAL ALBUM</span><b>{selected.title}</b><small>{getGroup(selected.groupId).name}</small></div></div><div className="album-detail-copy"><Tag tone="mint">{selected.genre}</Tag><h3>{selected.title}</h3><p className="album-subtitle">{selected.subtitle}</p><p>{selected.world}</p><div className="album-group-row"><div className="album-group-mark" style={{ background: selected.colors[0] }}>{getGroup(selected.groupId).logo}</div><div><b>{getGroup(selected.groupId).name}</b><span>{getGroup(selected.groupId).concept}</span></div><Tag>{getGroup(selected.groupId).genre}</Tag></div><div className="album-story-box"><b>ALBUM STORY</b><p>{selected.story}</p></div></div></section>
    <section><PanelTitle eyebrow="TRACK LIST" title="수록곡" description={`${albumSongs.length} tracks · 곡을 선택하면 라이브 선곡 화면으로 이동합니다.`} /><div className="track-list">{albumSongs.map((song, index) => { const best = save.records[song.id] ? Math.max(...Object.values(save.records[song.id]!).map((record) => record?.score || 0)) : 0; return <button key={song.id} onClick={() => onSelectSong(song.id)} className="track-row"><span className="track-index">{String(index + 1).padStart(2, '0')}</span><div className="track-name"><b>{song.title}</b><small>{song.description}</small></div><span className="track-bpm">{song.bpm} <small>BPM</small></span><span className="track-length">{song.duration}s</span><span className="track-best">{best ? `${best.toLocaleString()} PTS` : 'NO RECORD'}</span><span className="track-action"><Play size={15} fill="currentColor" /></span></button>; })}</div></section>
  </div>;
}

function CharactersScreen({ selectedCharacterId, onSelectCharacter }: { selectedCharacterId: string; onSelectCharacter: (id: string) => void }) {
  const [groupFilter, setGroupFilter] = useState('all');
  const selected = getCharacter(selectedCharacterId);
  const filtered = CHARACTERS.filter((character) => groupFilter === 'all' || character.groupId === groupFilter);
  const group = getGroup(selected.groupId);
  return <div className="screen-stack"><PanelTitle eyebrow="CHARACTER ARCHIVE" title="캐릭터 도감" description="세 공룡의 프로필과 무대 콘셉트를 확인하세요." />
    <div className="filter-pills">{[{ id: 'all', name: 'ALL MEMBERS' }, ...GROUPS.map((item) => ({ id: item.id, name: item.name }))].map((item) => <button key={item.id} onClick={() => setGroupFilter(item.id)} className={cx(groupFilter === item.id && 'active')}>{item.name}</button>)}</div>
    <div className="character-layout"><div className="character-grid">{filtered.map((character) => <button key={character.id} onClick={() => onSelectCharacter(character.id)} className={cx('character-tile', selectedCharacterId === character.id && 'selected')}><div className="character-tile-art" style={{ background: `linear-gradient(145deg, ${character.colors[0]}, ${character.colors[2]})` }}><CharacterArt character={character} size={114} /></div><div className="character-tile-info"><b>{character.name}</b><span>{character.role}</span><small>{getGroup(character.groupId).name}</small></div></button>)}</div>
      <aside className="character-profile"><div className="character-profile-banner" style={{ background: `linear-gradient(130deg, ${selected.colors[0]}, ${selected.colors[2]})` }}><div className="profile-banner-rings" /><CharacterArt character={selected} size={214} /></div><div className="character-profile-copy"><div className="profile-name-line"><div><Tag tone="mint">{group.name}</Tag><h2>{selected.name}</h2><span>{selected.alias}</span></div><div className="profile-number">NO.{String(CHARACTERS.findIndex((character) => character.id === selected.id) + 1).padStart(2, '0')}</div></div><div className="profile-role">{selected.species} · {selected.age}세 · {selected.role}</div><p>{selected.personality}</p><div className="profile-detail-grid"><div><small>말투</small><b>{selected.speech}</b></div><div><small>취미</small><b>{selected.hobby}</b></div><div><small>무대 의상</small><b>{selected.outfit}</b></div><div><small>팀 관계</small><b>{selected.relation}</b></div></div><div className="profile-traits">{selected.traits.map((trait) => <Tag key={trait}>{trait}</Tag>)}</div><div className="character-story"><b>GROWTH STORY</b><p>{selected.story}</p></div><div className="character-quote">“{selected.quote}”</div></div></aside></div>
  </div>;
}

function GachaScreen({ banner, onBannerChange, save, pulls, onDraw, onExchange, ownedCardIds, busy }: { banner: GachaBanner; onBannerChange: (banner: GachaBanner) => void; save: UserSave; pulls: string[]; onDraw: (count: number) => void; onExchange: () => void; ownedCardIds: Set<string>; busy: boolean }) {
  const featured = CARDS.find((card) => card.id === PICKUP_BY_BANNER[banner])!;
  const character = getCharacter(featured.characterId);
  const [showOdds, setShowOdds] = useState(false);
  const history = save.gachaHistory.slice(0, 8);
  return <div className="screen-stack"><PanelTitle eyebrow="DINO CAPSULE STATION" title="멤버 모집" description="가상 재화로만 이용하는 확률 공개형 카드 모집입니다. 실제 결제는 제공하지 않습니다." action={<div className="pity-pill"><Crown size={15} /> 천장 <b>{save.pity}</b><span>/ 100</span></div>} />
    <div className="gacha-tabs">{(['pickup', 'standard', 'event'] as GachaBanner[]).map((id) => <button key={id} className={cx(banner === id && 'active')} onClick={() => { onBannerChange(id); }}><span>{id === 'pickup' ? 'PICK UP' : id === 'standard' ? 'STANDARD' : 'EVENT'}</span><b>{BANNER_LABEL[id]}</b></button>)}</div>
    <div className={`gacha-stage gacha-${banner}`}><div className="gacha-stage-pattern" /><div className="gacha-copy"><Tag tone="gold">{banner === 'event' ? 'LIMITED STORY' : banner === 'pickup' ? 'FEATURED MEMBER' : 'ALWAYS AVAILABLE'}</Tag><div className="gacha-kicker">{banner === 'event' ? 'A LETTER FROM THE STARS' : banner === 'pickup' ? 'NEW MEMBER SPOTLIGHT' : 'EVERYDAY RHYTHM'}</div><h2>{featured.name}</h2><p>{character.name} · {getGroup(character.groupId).name}</p><div className="gacha-skill"><Sparkles size={15} /><span>{featured.skillName}</span><b>{featured.skillDescription}</b></div><div className="gacha-stage-actions"><Button variant="gold" size="lg" disabled={busy || save.gems < 300} onClick={() => onDraw(1)}><Gem size={16} /> 1회 모집 · 300</Button><Button variant="secondary" size="lg" disabled={busy || save.gems < 3000} onClick={() => onDraw(10)}><Sparkles size={16} /> 10회 모집 · 3,000</Button></div><small>10회 모집은 최소 3성 카드 1장 확정 · 중복은 조각으로 변환</small></div><div className="gacha-feature-art"><div className="gacha-light-ring" /><div className="gacha-card-tilt"><CardArtwork character={character} card={featured} /></div><div className="gacha-feature-label"><b>{character.name}</b><span>★★★★★ PICKUP</span></div></div></div>
    <div className="gacha-info-row"><div className="gacha-info-card"><div className="gacha-info-icon"><ShieldCheck size={19} /></div><div><b>확률과 천장 공개</b><span>{RARITY_RATE} · 100회 내 4성 확정</span></div><button onClick={() => setShowOdds((value) => !value)}>{showOdds ? '닫기' : '확률 보기'} <ChevronDown size={14} /></button></div><div className="gacha-info-card"><div className="gacha-info-icon exchange"><RefreshCw size={19} /></div><div><b>교환 포인트 {save.exchangePoints}P</b><span>200P로 현재 픽업 4성 카드 교환</span></div><Button variant="secondary" size="sm" disabled={save.exchangePoints < 200} onClick={onExchange}>교환하기</Button></div></div>
    {showOdds && <div className="odds-panel"><div><span className="rarity-dot four" />4성 <b>3.00%</b><small>픽업 대상은 4성 확률 내 50%</small></div><div><span className="rarity-dot three" />3성 <b>17.00%</b></div><div><span className="rarity-dot two" />2성 <b>35.00%</b></div><div><span className="rarity-dot one" />1성 <b>45.00%</b></div><p>천장: 4성 카드가 나오지 않은 모집 99회 이후 다음 1회는 4성 확정. 4성 획득 시 천장 카운트 초기화.</p></div>}
    {pulls.length > 0 && <section className="pull-results"><PanelTitle eyebrow="RECRUIT RESULT" title="새로운 인연이 도착했어요" description={`${pulls.length}장의 카드가 모집되었습니다.`} /><div className="pull-card-grid">{pulls.map((id, index) => { const card = CARDS.find((item) => item.id === id)!; return <div className="pull-result-card" key={`${id}-${index}`}><CardArtwork character={getCharacter(card.characterId)} card={card} compact /><b>{card.name}</b><span>{card.rarity}성 · {getCharacter(card.characterId).name}</span>{ownedCardIds.has(id) && <Tag tone="gold">보유 중</Tag>}</div>; })}</div></section>}
    <div className="gacha-lower-grid"><section className="sub-panel"><PanelTitle eyebrow="AVAILABLE POOL" title="모집 가능 카드" /><div className="pool-grid">{CARDS.filter((card) => card.rarity >= 3).map((card) => <div key={card.id} className="pool-item"><span className={`rarity-label rarity-${card.rarity}`}>{card.rarity}★</span><div><b>{card.name}</b><small>{getCharacter(card.characterId).name}</small></div></div>)}</div></section><section className="sub-panel"><PanelTitle eyebrow="RECENT HISTORY" title="최근 모집 기록" />{history.length ? <div className="history-list">{history.map((log) => <div className="history-row" key={log.id}><div><b>{BANNER_LABEL[log.banner as GachaBanner] || '모집'}</b><small>{new Date(log.createdAt).toLocaleString('ko-KR')}</small></div><span>{log.cardIds.length}회</span><small>{log.cardIds.slice(0, 2).map((id) => CARDS.find((card) => card.id === id)?.name).join(', ')}{log.cardIds.length > 2 ? ' 외' : ''}</small></div>)}</div> : <div className="empty-state"><Gift size={24} /><b>아직 모집 기록이 없어요.</b><span>첫 번째 멤버 모집을 시작해 보세요.</span></div>}</section></div>
  </div>;
}

function CardsScreen({ save, onSelectCard, onToggleFormation }: { save: UserSave; onSelectCard: (id: string | null) => void; onToggleFormation: (id: string) => void }) {
  const [filter, setFilter] = useState('all');
  const cards = save.ownedCards.map((owned) => ({ owned, card: CARDS.find((card) => card.id === owned.cardId)! })).filter(({ card }) => filter === 'all' || String(card.rarity) === filter).sort((a, b) => b.card.rarity - a.card.rarity);
  const effects = getTeamEffects(save);
  const equipped = save.formation.map((id) => ({ owned: save.ownedCards.find((item) => item.cardId === id), card: CARDS.find((item) => item.id === id)! })).filter((item) => item.owned);
  const effectLabels = [
    effects.scoreBonus > 0 && `기본 점수 +${effects.scoreBonus.toFixed(0)}%`,
    effects.perfectScoreBonus > 0 && `PERFECT +${effects.perfectScoreBonus.toFixed(0)}%`,
    effects.greatScoreBonus > 0 && `GREAT +${effects.greatScoreBonus.toFixed(0)}%`,
    effects.lifeShield > 0 && `라이프 손실 -${effects.lifeShield.toFixed(0)}%`,
    effects.lifeHeal > 0 && `PERFECT 회복 +${effects.lifeHeal.toFixed(0)}%`,
    effects.gradeAssist && 'GOOD 4회 중 1회 GREAT 보정',
    effects.badAssist && 'BAD 3회 중 1회 GOOD 보정',
    effects.timingAssistMs > 0 && `판정 범위 +${effects.timingAssistMs.toFixed(0)}ms`,
    effects.rewardBonus > 0 && `게스트 보상 +${effects.rewardBonus.toFixed(0)}%`,
  ].filter(Boolean) as string[];
  return <div className="screen-stack"><PanelTitle eyebrow="MY COLLECTION" title="카드 & 편성" description={`${save.ownedCards.length}종의 카드를 보유 중입니다. 직접 5장까지 편성하고 스킬 효과를 라이브에 적용하세요.`} action={<div className="pity-pill"><Sparkles size={14} /> 조각 <b>{save.shards}</b></div>} />
    <div className="collection-summary"><div><b>{save.ownedCards.reduce((sum, item) => sum + item.quantity, 0)}</b><span>보유 카드 수량</span></div><div><b>{save.ownedCards.length}</b><span>카드 종류</span></div><div><b>{save.ownedCards.filter((item) => CARDS.find((card) => card.id === item.cardId)?.rarity === 4).length}</b><span>4성 카드</span></div><div><b>{save.ownedCards.reduce((sum, item) => sum + item.level, 0)}</b><span>총 레벨</span></div></div>
    <div className="filter-pills rarity-filter">{[{ id: 'all', label: 'ALL' }, { id: '4', label: '4 STAR' }, { id: '3', label: '3 STAR' }, { id: '2', label: '2 STAR' }, { id: '1', label: '1 STAR' }].map((item) => <button key={item.id} className={cx(filter === item.id && 'active')} onClick={() => setFilter(item.id)}>{item.label}</button>)}</div>
    {cards.length ? <div className="owned-card-grid">{cards.map(({ owned, card }) => { const equippedNow = save.formation.includes(card.id); return <div key={card.id} className={cx('owned-card', equippedNow && 'equipped')}><button className="owned-card-open" onClick={() => onSelectCard(card.id)}><CardArtwork character={getCharacter(card.characterId)} card={card} compact /><div className="owned-card-copy"><b>{card.name}</b><span>{getCharacter(card.characterId).name}</span><small>LEVEL {owned.level} · 보유 {owned.quantity}</small></div></button><button className={cx('formation-toggle', equippedNow && 'active')} onClick={() => onToggleFormation(card.id)}>{equippedNow ? '편성 중 ✓' : '편성 +'}</button></div>; })}</div> : <div className="empty-state large"><ShoppingBag size={32} /><b>해당 등급의 카드가 없어요.</b><span>멤버 모집에서 새로운 카드를 만나 보세요.</span></div>}
    <section className="sub-panel formation-panel"><PanelTitle eyebrow="TEAM FORMATION" title={`라이브 편성 · ${equipped.length}/5`} description="편성 카드의 스킬이 실제 라이브 점수·판정·라이프에 적용됩니다." /><div className="formation-row">{equipped.map(({ owned, card }, index) => { const character = getCharacter(card.characterId); return <div className="formation-slot" key={card.id}><span className="formation-index">0{index + 1}</span><CharacterArt character={character} size={70} /><b>{character.name}</b><small>LV.{owned!.level} · {card.rarity}★</small></div>; })}{Array.from({ length: 5 - equipped.length }).map((_, index) => <div className="formation-slot empty" key={`empty-${index}`}><Plus size={22} /><span>빈 슬롯</span></div>)}</div><div className="team-effect-tags">{effectLabels.length ? effectLabels.map((label) => <Tag key={label} tone="mint">{label}</Tag>) : <span className="muted">현재 적용 중인 스킬 효과가 없습니다.</span>}</div></section>
  </div>;
}
function StoriesScreen({ save, selectedStoryId, onSelectStory, line, onNextLine, onClaim, onExit }: { save: UserSave; selectedStoryId: string; onSelectStory: (id: string) => void; line: number; onNextLine: (value: number) => void; onClaim: (id: string, reward: number) => void; onExit: () => void }) {
  const story = STORIES.find((item) => item.id === selectedStoryId) || STORIES[0];
  const claimed = save.storyRewardsClaimed.includes(story.id);
  const current = story.lines[Math.min(line, story.lines.length - 1)];
  const done = line >= story.lines.length;
  return <div className="story-immersive-screen">
    <div className="story-immersive-backdrop" />
    <header className="story-immersive-top">
      <div className="story-brand"><span className="story-brand-mark">M!</span><div><b>DINO THEATER</b><small>STORY MODE · FULL SCREEN</small></div></div>
      <div className="story-episode-tabs">{STORIES.map((item, index) => <button key={item.id} disabled={!save.clearedStories.includes(item.id) && index > 0} className={cx(story.id === item.id && 'active', !save.clearedStories.includes(item.id) && index > 0 && 'locked')} onClick={() => onSelectStory(item.id)}><span>0{index + 1}</span>{item.title}</button>)}</div>
      <button className="story-exit-button" onClick={onExit}><X size={17}/><span>나가기</span></button>
    </header>
    <section className="story-immersive-scene">
      <div className="story-scene-label">{story.category.toUpperCase()} · EPISODE {String(STORIES.findIndex((item) => item.id === story.id) + 1).padStart(2, '0')}</div>
      <div className="story-scene-orb" />
      <div className="story-stage-dust"><i/><i/><i/><i/><i/><i/><i/></div>
      <div className="story-hero-dinos">{(['mora', 'hwarok', 'alpi'] as const).map((id, index) => <div className={`story-dino story-dino-${index + 1}`} key={id}><CharacterArt character={getCharacter(id)} size={index === 1 ? 300 : 265} /><b>{getCharacter(id).name}</b></div>)}</div>
    </section>
    <section className="story-cinematic-dialogue">
      <div className="story-dialogue-meta"><Tag tone="mint">{story.category}</Tag><span>{done ? 'EPISODE CLEAR' : `${Math.min(line + 1, story.lines.length)} / ${story.lines.length}`}</span></div>
      {done ? <div className="story-end cinematic-end"><Sparkles size={31}/><h3>에피소드 완료</h3><p>이야기가 기록되었습니다. 보상을 받고 다음 에피소드로 넘어가세요.</p>{!claimed && <Button onClick={() => onClaim(story.id, story.reward)}><Gem size={16}/> 보상 받기 · {story.reward}</Button>}</div> : <div className="story-dialogue-content" onClick={() => onNextLine(line + 1)} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onNextLine(line + 1); }}><div className="cinematic-speaker">{current.speaker}</div><p className="cinematic-line">{current.text}</p><div className="cinematic-next">화면을 누르거나 다음 대사 <ChevronRight size={17}/></div></div>}
    </section>
  </div>;

}

function MissionsScreen({ missions, save, onClaim }: { missions: ReturnType<typeof getDailyMissions>; save: UserSave; onClaim: (id: string, reward: number) => void }) {
  const totalClaimed = missions.filter((mission) => mission.claimed).length;
  return <div className="screen-stack"><PanelTitle eyebrow="DAILY ROUTINE" title="미션 & 업적" description="라이브를 플레이하고 스토리를 읽으며 크리스탈과 칭호를 모아 보세요." />
    <section className="mission-summary"><div className="mission-summary-copy"><Tag tone="mint">TODAY'S CHALLENGE</Tag><h2>작은 한 걸음이<br /><em>새로운 무대가 돼!</em></h2><p>오늘의 미션 {totalClaimed}/{missions.length}개를 완료했어요.</p><div className="progress-track"><i style={{ width: `${(totalClaimed / missions.length) * 100}%` }} /></div></div><div className="mission-summary-visual"><div className="mission-orbit" /><div className="mission-gem"><Gem size={48} /></div><span>DAILY<br />MISSION</span></div></section>
    <section><PanelTitle eyebrow="DAILY MISSIONS" title="오늘의 미션" /><div className="mission-list">{missions.map((mission, index) => <div className="mission-row" key={mission.id}><div className="mission-row-icon">{index === 0 ? <Play size={18} /> : index === 1 ? <AudioLines size={18} /> : index === 2 ? <Trophy size={18} /> : <CalendarCheck size={18} />}</div><div className="mission-row-copy"><b>{mission.title}</b><span>{mission.description}</span><div className="progress-track"><i style={{ width: `${(mission.progress / mission.target) * 100}%` }} /></div></div><div className="mission-reward"><Gem size={15} /><b>{mission.reward}</b></div><Button size="sm" variant={mission.claimed ? 'ghost' : 'secondary'} disabled={mission.claimed || mission.progress < mission.target} onClick={() => onClaim(mission.id, mission.reward)}>{mission.claimed ? <><Check size={14} /> 완료</> : '받기'}</Button></div>)}</div></section>
    <section><PanelTitle eyebrow="ACHIEVEMENTS" title="플레이 업적" description="특별한 플레이 기록을 달성하면 업적이 해금됩니다." /><div className="achievement-grid">{[{ id: 'first_live', title: '첫 무대', desc: '라이브 1회 플레이', icon: <Music2 /> }, { id: 'full_combo', title: '콤보 마스터', desc: 'FULL COMBO 달성', icon: <Zap /> }, { id: 'all_perfect', title: '완벽주의 공룡', desc: 'ALL PERFECT 달성', icon: <Crown /> }, { id: 'million', title: '백만의 박자', desc: '1,000,000점 달성', icon: <Trophy /> }].map((achievement) => { const unlocked = save.achievements.includes(achievement.id); return <div key={achievement.id} className={cx('achievement-tile', unlocked && 'unlocked')}><div>{achievement.icon}</div><b>{achievement.title}</b><span>{achievement.desc}</span><small>{unlocked ? 'UNLOCKED' : 'LOCKED'}</small></div>; })}</div></section>
  </div>;
}

function AccountScreen({ save, session, ready, configured, email, password, nickname, message, busy, onEmail, onPassword, onNickname, onSaveNickname, onRegister, onLogin, onLogout }: { save: UserSave; session: Session | null; ready: boolean; configured: boolean; email: string; password: string; nickname: string; message: string; busy: boolean; onEmail: (value: string) => void; onPassword: (value: string) => void; onNickname: (value: string) => void; onSaveNickname: () => void; onRegister: () => void; onLogin: (event: FormEvent) => void; onLogout: () => void }) {
  return <div className="screen-stack"><PanelTitle eyebrow="PLAYER ID" title="계정 & 프로필" description="게스트 저장은 현재 브라우저에 보관됩니다. Supabase 연결 시 계정별 클라우드 저장을 사용할 수 있습니다." />
    <div className="account-layout"><section className="account-profile-card"><div className="account-profile-cover"><div className="account-profile-spark">✦</div><div className="account-big-avatar">{nickname.slice(0, 1) || 'R'}</div><Tag tone="gold">{save.profile.title}</Tag></div><div className="account-profile-copy"><div className="eyebrow">PLAYER PROFILE</div><h2>{save.profile.nickname}</h2><p>{session ? 'SUPABASE MEMBER' : 'GUEST RIDER'} · since {new Date(save.profile.joinedAt).toLocaleDateString('ko-KR')}</p><div className="account-profile-metrics"><div><b>{save.stats.plays}</b><span>PLAY</span></div><div><b>{save.stats.loginStreak}</b><span>STREAK</span></div><div><b>{save.achievements.length}</b><span>BADGES</span></div></div><label className="field-label">닉네임</label><div className="nickname-input"><input value={nickname} onChange={(event) => onNickname(event.target.value)} maxLength={16} /><Button size="sm" onClick={onSaveNickname}>저장</Button></div></div></section>
      <section className="account-auth-panel"><div className="auth-panel-header"><div className="account-auth-icon"><ShieldCheck size={20} /></div><div><h3>{session ? '계정 연결됨' : '이메일 계정 연결'}</h3><p>{configured ? session ? session.user.email : '계정을 연결해 다른 기기에서도 저장 데이터를 불러오세요.' : 'Supabase 환경변수 미설정 · 게스트 모드'}</p></div><Tag tone={session ? 'mint' : configured ? 'gold' : 'dark'}>{session ? 'ONLINE' : configured ? 'READY' : 'LOCAL'}</Tag></div>
        {session ? <div className="auth-session-state"><div className="auth-success"><Check size={20} />클라우드 저장이 활성화되어 있습니다.</div><p>현재 로그인: <b>{session.user.email}</b></p><Button variant="secondary" onClick={onLogout}><LogOut size={16} /> 로그아웃</Button></div> : <form className="auth-form" onSubmit={onLogin}><label>이메일<input type="email" value={email} onChange={(event) => onEmail(event.target.value)} placeholder="rider@example.com" required /></label><label>비밀번호<input type="password" value={password} onChange={(event) => onPassword(event.target.value)} placeholder="8자 이상 권장" minLength={6} required /></label><div className="auth-actions"><Button type="submit" disabled={busy || !configured}><LogIn size={15} /> 로그인</Button><Button type="button" variant="secondary" disabled={busy || !configured} onClick={onRegister}><Plus size={15} /> 회원가입</Button></div></form>}
        {message && <div className="auth-message">{message}</div>}
        {!configured && <div className="setup-note"><b>연결 방법</b><span>프로젝트 루트의 <code>.env.local</code>에 VITE_SUPABASE_URL과 VITE_SUPABASE_ANON_KEY를 입력한 뒤 다시 실행하세요. 서비스 역할 키는 프론트엔드에 넣지 않습니다.</span></div>}
        {!ready && <p className="muted">인증 상태 확인 중…</p>}
      </section></div>
  </div>;
}

function SettingsScreen({ save, onChange, onNotify }: { save: UserSave; onChange: (settings: Partial<UserSave['settings']>) => void; onNotify: (message: string) => void }) {
  return <div className="screen-stack"><PanelTitle eyebrow="SYSTEM SETTINGS" title="게임 설정" description="기기와 플레이 환경에 맞게 리듬 판정과 사운드를 조절할 수 있습니다." />
    <div className="settings-grid"><section className="sub-panel settings-panel"><PanelTitle eyebrow="LIVE CONTROL" title="라이브 옵션" /><div className="setting-row"><div><b>노트 속도</b><span>노트가 판정선으로 내려오는 속도</span></div><div className="setting-control"><b>{save.settings.noteSpeed.toFixed(2)}x</b><input type="range" min="0.7" max="1.6" step="0.05" value={save.settings.noteSpeed} onChange={(event) => onChange({ noteSpeed: Number(event.target.value) })} /></div></div><div className="setting-row"><div><b>판정 타이밍</b><span>양수는 늦은 입력을 보정하고, 음수는 이른 입력을 보정합니다.</span></div><div className="setting-control"><b>{save.settings.timingOffset > 0 ? '+' : ''}{save.settings.timingOffset} ms</b><input type="range" min="-150" max="150" step="5" value={save.settings.timingOffset} onChange={(event) => onChange({ timingOffset: Number(event.target.value) })} /></div></div><div className="setting-row"><div><b>음량</b><span>Web Audio 합성 음원 전체 음량</span></div><div className="setting-control"><b>{Math.round(save.settings.volume * 100)}%</b><input type="range" min="0" max="1" step="0.05" value={save.settings.volume} onChange={(event) => onChange({ volume: Number(event.target.value) })} /></div></div><div className="setting-row"><div><b>레인 가이드</b><span>라이브 중 레인과 키 입력 정보를 표시합니다.</span></div><button className={cx('toggle', save.settings.laneGuide && 'on')} onClick={() => onChange({ laneGuide: !save.settings.laneGuide })}><i /></button></div></section>
      <section className="sub-panel settings-panel"><PanelTitle eyebrow="DEVICE SUPPORT" title="조작 가이드" /><div className="control-guide-card"><Keyboard size={21} /><div><b>PC 키보드</b><span>새싹~초월: F / J · 혼돈: D / F / J / K</span></div></div><div className="control-guide-card"><Headphones size={21} /><div><b>모바일 터치</b><span>화면 하단 레인을 터치하고, 롱노트는 끝까지 누르세요.</span></div></div><div className="control-guide-card"><Volume2 size={21} /><div><b>오디오 정책</b><span>브라우저 정책상 라이브 시작 버튼을 눌러야 음원이 재생됩니다.</span></div></div><Button variant="secondary" onClick={() => { onChange({ noteSpeed: 1, timingOffset: 0, volume: 0.7, laneGuide: true }); onNotify('설정을 기본값으로 되돌렸어요.'); }}><RotateCcw size={15} /> 기본값으로 초기화</Button></section></div>
    <div className="data-note"><ShieldCheck size={18} /><div><b>저장 데이터 안내</b><span>게스트 저장은 브라우저 localStorage에 저장됩니다. 브라우저 데이터 삭제 시 게스트 기록이 사라질 수 있습니다. Supabase 연결 시 계정별 player_saves 테이블에 저장됩니다.</span></div></div>
  </div>;
}

function LiveScreen({ song, selectedSongId, onSongChange, difficulty, onDifficultyChange, save, teamSkills, rewardBonus, onFinish, result, onRestart, onExit, onNotify }: { song: ReturnType<typeof getSong>; selectedSongId: string; onSongChange: (id: string) => void; difficulty: DifficultyId; onDifficultyChange: (difficulty: DifficultyId) => void; save: UserSave; teamSkills: ReturnType<typeof getTeamEffects>; rewardBonus: number; onFinish: (result: LiveResult) => void; result: LiveResult | null; onRestart: () => void; onExit: () => void; onNotify: (message: string) => void }) {
  const [albumFilter, setAlbumFilter] = useState('all');
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [stats, setStats] = useState<LiveStats | null>(null);
  const sessionRef = useRef<RhythmSession | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [songTime, setSongTime] = useState(0);
  const difficultyInfo = DIFFICULTIES.find((item) => item.id === difficulty)!;
  const visibleSongs = SONGS.filter((item) => albumFilter === 'all' || item.albumId === albumFilter);

  useEffect(() => {
    if (!running || result || !canvasRef.current) return;
    const session = new RhythmSession(canvasRef.current, song, difficulty, {
      noteSpeed: save.settings.noteSpeed,
      timingOffset: save.settings.timingOffset,
      volume: save.settings.volume,
      laneGuide: save.settings.laneGuide,
      teamSkills,
      onUpdate: (nextStats, time) => { setStats(nextStats); setSongTime(time); },
      onFinish: (nextResult) => { setRunning(false); setPaused(false); onFinish(nextResult); },
    });
    sessionRef.current = session;
    void session.start().catch((error: unknown) => { onNotify(error instanceof Error ? error.message : '라이브를 시작할 수 없습니다.'); setRunning(false); });
    return () => { session.dispose(); sessionRef.current = null; };
  }, [running, result, song.id, difficulty]);

  useEffect(() => { sessionRef.current?.setVolume(save.settings.volume); }, [save.settings.volume]);

  const start = () => { const root = document.documentElement as HTMLElement & { requestFullscreen?: () => Promise<void> }; if (!document.fullscreenElement && root.requestFullscreen) void root.requestFullscreen().catch(() => undefined); setStats(null); setSongTime(0); setPaused(false); setRunning(true); };
  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await (document.querySelector('.live-stage-screen') || document.querySelector('.app-shell'))?.requestFullscreen();
    } catch { onNotify('이 브라우저에서 전체 화면 전환을 허용하지 않았습니다.'); }
  };
  const togglePause = async () => {
    if (!sessionRef.current) return;
    if (paused) { await sessionRef.current.resume(); setPaused(false); }
    else { await sessionRef.current.pause(); setPaused(true); }
  };
  const exitToLobby = () => { setRunning(false); setPaused(false); onExit(); if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined); };
  const leaveResult = () => { onExit(); if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined); };
  const songRecord = save.records[song.id]?.[difficulty];

  if (result) return <div className="screen-stack result-screen live-result-immersive"><div className="result-topline"><Tag tone="gold">LIVE RESULT</Tag><span>{getAlbum(song.albumId).title}</span></div><section className="result-hero"><div className="result-rank">{result.rank}</div><div className="result-title"><div className="eyebrow">{song.artist} · {difficultyInfo.english}</div><h2>{song.title}</h2><p>{result.allPerfect ? '완벽한 리듬! 모든 노트가 PERFECT입니다.' : result.fullCombo ? '흐름을 놓치지 않았어요. FULL COMBO!' : '한 번의 무대도 성장의 기록이에요.'}</p></div><div className="result-score"><span>SCORE</span><b>{result.score.toLocaleString('ko-KR')}</b><small>{result.accuracy.toFixed(2)}% ACCURACY</small></div></section><div className="result-badges">{result.allPerfect && <Tag tone="gold"><Crown size={13} /> ALL PERFECT</Tag>}{result.fullCombo && <Tag tone="mint"><Zap size={13} /> FULL COMBO</Tag>}<Tag tone="pink">MAX COMBO {result.maxCombo}</Tag></div><div className="result-stat-grid"><div><span>PERFECT</span><b>{result.perfect}</b></div><div><span>GREAT</span><b>{result.great}</b></div><div><span>GOOD</span><b>{result.good}</b></div><div><span>BAD</span><b>{result.bad}</b></div><div><span>MISS</span><b>{result.miss}</b></div><div><span>MAX COMBO</span><b>{result.maxCombo}</b></div></div><div className="result-reward"><div className="reward-icon"><Gem size={21} /></div><div><b>크리스탈을 획득했어요!</b><span>플레이 점수와 편성 효과에 따라 보상이 지급되었습니다.</span></div><Tag tone="gold">+{Math.round((result.score > 0 ? 15 + Math.floor(result.score / 100000) * 5 : 0) * (1 + rewardBonus / 100))}</Tag></div><div className="result-actions"><Button size="lg" onClick={onRestart}><RefreshCw size={16} /> 다시 플레이</Button><Button size="lg" variant="secondary" onClick={leaveResult}>선곡으로 돌아가기</Button></div></div>;

  if (running) return <div className="live-stage-screen"><div className="live-stage-top"><div><span className="eyebrow">NOW PLAYING</span><h2>{song.title}</h2><span>{song.artist} · {song.bpm} BPM · {difficultyInfo.name}</span></div><div className="live-top-controls"><button className="pause-button fullscreen-button" onClick={toggleFullscreen} aria-label="전체 화면"><Maximize2 size={16} /></button><div className="live-combo-mini"><span>COMBO</span><b>{stats?.combo || 0}</b></div><button className="pause-button" onClick={togglePause}>{paused ? <Play size={17} /> : <Pause size={17} />}</button><button className="exit-live-button" onClick={exitToLobby}><X size={17} /></button></div></div><div className="live-hud"><div><span>SCORE</span><b>{(stats?.score || 0).toLocaleString('ko-KR')}</b></div><div><span>ACCURACY</span><b>{(stats?.accuracy || 100).toFixed(2)}%</b></div><div><span>LIFE</span><div className="life-track"><i style={{ width: `${stats?.life ?? 100}%` }} /></div></div><div className="live-progress"><i style={{ width: `${Math.min(100, (songTime / ((96 * 60) / song.bpm + 1.4)) * 100)}%` }} /></div></div><div className="live-canvas-wrap"><canvas ref={canvasRef} className="live-canvas" /><div className="judge-callout">{stats?.lastJudge && <span className={`judge-${stats.lastJudge.toLowerCase()}`}>{stats.lastJudge}</span>}</div>{paused && <div className="pause-overlay"><div><Pause size={30} /><h2>PAUSED</h2><p>잠시 숨을 고르고 다시 시작하세요.</p><Button onClick={togglePause}><Play size={16} fill="currentColor" /> 계속하기</Button><Button variant="ghost" onClick={exitToLobby}>선곡 화면</Button></div></div>}</div><div className="live-bottom-bar"><span><Keyboard size={14} /> {difficulty === 'chaos' ? 'D · F · J · K' : 'F · J'} / TOUCH LANES</span><span>{songTime.toFixed(1)}s / {Math.round(song.duration)}s</span><span>PERFECT ±45ms</span></div></div>;

  return <div className="screen-stack live-lobby"><PanelTitle eyebrow="LIVE SELECT" title="라이브 선곡" description="곡과 난이도를 선택하고, 네 손끝으로 무대를 완성하세요." action={<div className="pity-pill"><Trophy size={15} /> 최고 기록 <b>{Object.keys(save.records).length}</b><span>곡</span></div>} />
    <div className="live-select-layout"><section className="song-select-panel"><div className="select-panel-head"><h3>TRACK SELECT</h3><span>{visibleSongs.length} TRACKS</span></div><div className="album-filter-scroll"><button className={cx(albumFilter === 'all' && 'active')} onClick={() => setAlbumFilter('all')}>ALL</button>{ALBUMS.map((album) => <button key={album.id} className={cx(albumFilter === album.id && 'active')} onClick={() => setAlbumFilter(album.id)}>{getGroup(album.groupId).name}</button>)}</div><div className="song-select-list">{visibleSongs.map((item) => { const album = getAlbum(item.albumId); const isSelected = item.id === selectedSongId; const best = save.records[item.id] ? Math.max(...Object.values(save.records[item.id]!).map((record) => record?.score || 0)) : 0; return <button key={item.id} className={cx('song-select-row', isSelected && 'selected')} onClick={() => onSongChange(item.id)}><div className="song-select-cover" style={{ background: `linear-gradient(145deg, ${album.colors[0]}, ${album.colors[2]})` }}>{getGroup(album.groupId).logo}</div><div className="song-select-copy"><b>{item.title}</b><span>{item.artist} · {item.genre}</span><small>{item.bpm} BPM · {item.duration}s</small></div><div className="song-select-best">{best ? <><b>{best.toLocaleString()}</b><small>BEST</small></> : <small>NEW</small>}</div><span className="song-select-check">{isSelected && <Check size={16} />}</span></button>; })}</div></section>
      <aside className="difficulty-panel"><div className="selected-song-art" style={{ '--album-a': getAlbum(song.albumId).colors[0], '--album-b': getAlbum(song.albumId).colors[1], '--album-c': getAlbum(song.albumId).colors[2] } as CSSProperties}><div className="selected-song-disc">{getGroup(getAlbum(song.albumId).groupId).logo}</div><span>LIVE TRACK</span><h3>{song.title}</h3><small>{song.artist}</small></div><div className="selected-song-meta"><div><span>BPM</span><b>{song.bpm}</b></div><div><span>LENGTH</span><b>{song.duration}s</b></div><div><span>GENRE</span><b>{song.genre}</b></div></div><div className="difficulty-select-head"><b>난이도 선택</b><span>6 LEVELS</span></div><div className="difficulty-list">{DIFFICULTIES.map((item, index) => <button key={item.id} className={cx('difficulty-option', `diff-${item.id}`, difficulty === item.id && 'active')} onClick={() => onDifficultyChange(item.id)}><span className="difficulty-index">0{index + 1}</span><span className="difficulty-name"><b>{item.name}</b><small>{item.english}</small></span><span className="difficulty-desc">{item.description}</span><strong>{song.levels[item.id]}</strong></button>)}</div><div className="selected-record-row"><span>MY BEST</span><b>{songRecord ? `${songRecord.score.toLocaleString()} PTS · ${songRecord.accuracy.toFixed(2)}%` : '기록 없음'}</b></div><Button size="lg" onClick={start}><Play size={17} fill="currentColor" /> 라이브 시작</Button><div className="live-key-hint"><Keyboard size={14} /> {difficulty === 'chaos' ? 'D / F / J / K · 4레인 멀티 입력' : 'F / J · 2레인 양손 입력'}</div></aside></div>
    <div className="live-note"><CircleHelp size={17} /><div><b>첫 플레이 안내</b><span>노트가 하단 판정선에 닿을 때 입력하세요. 롱노트는 누른 채 유지하고, 슬라이드는 표시된 레인까지 손가락 또는 키를 옮기면 됩니다. 모든 곡은 Web Audio API로 실시간 합성되는 오리지널 데모 음원입니다.</span></div></div>
  </div>;
}

export default App;
