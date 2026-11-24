export type DifficultyId = 'seed' | 'grow' | 'skilled' | 'rage' | 'transcend' | 'chaos';
export type Rarity = 1 | 2 | 3 | 4;

export interface Character {
  id: string;
  name: string;
  alias: string;
  age: number;
  species: string;
  role: string;
  personality: string;
  speech: string;
  traits: string[];
  hobby: string;
  colors: [string, string, string];
  outfit: string;
  quote: string;
  groupId: string;
  story: string;
  relation: string;
  silhouette: 'crest' | 'horn' | 'spike' | 'wing' | 'sail' | 'frill';
}

export interface Group {
  id: string;
  albumId: string;
  name: string;
  logo: string;
  concept: string;
  genre: string;
  colors: [string, string, string];
  story: string;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  duration: number;
  albumId: string;
  genre: string;
  levels: Record<DifficultyId, number>;
  description: string;
  mood: string;
  seed: number;
  /** Optional user-provided audio file, served from the Vite public directory. */
  audioSrc?: string;
  /** Seconds from the MP3 start to its first musical beat. */
  audioLeadIn?: number;
  /** Number of beats used to generate a full-length chart for this song. */
  chartBeats?: number;
}

export interface Album {
  id: string;
  title: string;
  subtitle: string;
  world: string;
  groupId: string;
  genre: string;
  colors: [string, string, string];
  story: string;
}

export interface GameCard {
  id: string;
  characterId: string;
  name: string;
  rarity: Rarity;
  skillName: string;
  skillDescription: string;
  skillValue: number;
  skillKind?: 'score' | 'lifeShield' | 'gradeAssist' | 'badAssist' | 'lifeHeal' | 'reward' | 'greatScore' | 'perfectScore' | 'timingAssist';
  story: string;
  art: string;
}

export const DIFFICULTIES: { id: DifficultyId; name: string; english: string; description: string }[] = [
  { id: 'seed', name: '새싹', english: 'EASY', description: '리듬에 익숙해지는 첫 무대' },
  { id: 'grow', name: '성장', english: 'NORMAL', description: '두 손의 균형을 익히는 단계' },
  { id: 'skilled', name: '숙련', english: 'HARD', description: '엇박과 롱노트가 섞이는 구간' },
  { id: 'rage', name: '폭주', english: 'EXPERT', description: '빠른 교차 입력과 연속 플릭' },
  { id: 'transcend', name: '초월', english: 'MASTER', description: '밀도 높은 리듬과 정교한 패턴' },
  { id: 'chaos', name: '혼돈', english: 'APPEND', description: '6레인 고밀도 멀티 입력과 동시치기 패턴' },
];

export const ALBUMS: Album[] = [
  {
    id: 'moranosa', title: '뭐라노사우르스의 뭐라노', subtitle: '말이 꼬여도, 박자는 맞는다.',
    world: '대사가 자막보다 빨리 튀어나오는 도시 모라모라. 세 공룡은 오해와 말장난을 박자로 정리해 서로의 진심을 전한다.',
    groupId: 'moran', genre: '글리치 팝 · 펑크 팝', colors: ['#ffcf5c', '#ff6b8a', '#6857d9'],
    story: '뭐라노사우르스가 무심코 던진 한마디가 도시 전체의 자막을 뒤집어 놓는다. 개빡치노사우르스는 엉킨 소리를 드럼으로 정리하고, 알빠노사우르스는 소음 속에서 진짜 마음을 찾아낸다. 셋은 말이 통하지 않는 날에도 함께 노래할 수 있다는 걸 증명한다.'
  },
  {
    id: 'rageosa', title: '개빡치노사우르스의 분노', subtitle: '화는 연료로, 무대는 탈출구로.',
    world: '소리의 크기로 감정을 측정하는 화산도시 레드크레이터. 화를 참으라는 규칙에 지친 세 공룡이 분노를 창작 에너지로 바꾼다.',
    groupId: 'rage', genre: '펑크 록 · 인더스트리얼 일렉트로', colors: ['#ff654e', '#ffb347', '#3a233b'],
    story: '도시의 감정 계기판이 위험 수치에 도달한다. 개빡치노사우르스는 무조건 참으라는 충고 대신 감정을 안전하게 표현할 무대를 만든다. 뭐라노사우르스의 뒤틀린 말풍선과 알빠노사우르스의 낮은 비트가 도시의 경보음을 축제의 카운트다운으로 바꾼다.'
  },
  {
    id: 'alppasa', title: '알빠노사우르스의 병먹금', subtitle: '소음은 끄고, 우리만의 주파수로.',
    world: '모든 소문이 실시간으로 떠다니는 데이터 습지. 세 공룡은 반응하지 않을 자유와 자기 목소리를 지킬 권리를 노래한다.',
    groupId: 'alppa', genre: '칠홉 · 트립합 · 로파이', colors: ['#7de0c3', '#9ca9ff', '#283c55'],
    story: '끝없이 갱신되는 소문 피드가 멤버들의 하루를 잠식한다. 알빠노사우르스는 가장 조용한 방송을 시작하고, 뭐라노사우르스와 개빡치노사우르스는 불필요한 알림을 잠시 끈다. 작은 파도 소리 위에서 셋은 침묵도 하나의 선택이 될 수 있음을 배운다.'
  },
  {
    id: 'postosa', title: '쥬라기 우편국 : 별빛 배달부', subtitle: '도착하지 못한 마음을 배달합니다.',
    world: '밤하늘을 가로지르는 공중 우편선이 다니는 시간의 항로. 아직 전하지 못한 편지마다 작은 별이 된다.',
    groupId: 'moran', genre: '시티팝 · 신스 오케스트라', colors: ['#7ac6ff', '#f3a8e7', '#293d70'],
    story: '사라진 별자리 우편함에서 수신인 없는 편지 세 통이 발견된다. 뭐라노사우르스는 편지의 빈칸을 멜로디로 채우고, 개빡치노사우르스는 별빛 항로의 박자를 만든다. 알빠노사우르스는 편지를 받을 사람을 정하지 않아도 마음은 출발할 수 있다고 말한다.'
  },
  {
    id: 'fernosa', title: '백악기 옥상정원 : 초록빛 소음', subtitle: '도시 위에서 자라나는 우리들의 비트.',
    world: '회색 빌딩 꼭대기에 숨겨진 거대한 옥상 온실. 식물의 진동과 도시의 전자음을 섞어 새로운 생태계를 만든다.',
    groupId: 'alppa', genre: '퓨처 펑크 · 하우스 · 브레이크비트', colors: ['#9de36f', '#51c8b2', '#383f77'],
    story: '재개발 예정인 옥상 온실을 지키기 위해 알빠노사우르스는 하루 동안 열린 사운드 가든을 연다. 뭐라노사우르스는 도시 소리를 가사로 만들고, 개빡치노사우르스는 온실 바닥에 리듬을 심는다. 작은 씨앗 하나가 관객의 발걸음을 모으는 커다란 숲이 된다.'
  },
];

export const GROUPS: Group[] = [
  { id: 'moran', albumId: 'moranosa', name: '뭐라노사우르스', logo: '?!', concept: '말이 꼬여도 박자만큼은 정확한 딜로포사우루스 솔로 아이돌', genre: '글리치 팝 · 펑크 팝', colors: ['#ffcf5c', '#ff6b8a', '#6857d9'], story: '뭐라노사우르스는 말풍선이 폭주하는 도시에서 자기 말이 왜곡되어도 노래만큼은 자기 목소리로 전하기로 한다.' },
  { id: 'rage', albumId: 'rageosa', name: '개빡치노사우르스', logo: '!!', concept: '분노를 리듬과 드럼으로 바꾸는 안킬로사우루스 록 아이돌', genre: '펑크 록 · 인더스트리얼', colors: ['#ff654e', '#ffb347', '#3a233b'], story: '개빡치노사우르스는 화를 숨기라는 도시의 규칙에 맞서, 감정을 안전하게 소리로 표현하는 무대를 만든다.' },
  { id: 'alppa', albumId: 'alppasa', name: '알빠노사우르스', logo: '…', concept: '소음은 낮추고 자기 주파수를 지키는 오비랍토르 칠홉 아이돌', genre: '칠홉 · 트립합', colors: ['#7de0c3', '#9ca9ff', '#283c55'], story: '알빠노사우르스는 모든 소문에 답할 필요는 없다는 걸 배우고, 조용하지만 단단한 음악으로 자기 경계를 지킨다.' },
];

export const CHARACTERS: Character[] = [
  { id: 'mora', name: '뭐라노사우르스', alias: '말풍선 폭주 공룡', age: 20, species: '딜로포사우루스 공룡형', role: '메인 보컬 · 작사', personality: '호기심이 많고 생각보다 먼저 말이 튀어나온다. 실수한 뒤에는 누구보다 먼저 사과하고, 그 실수까지 후렴으로 만든다.', speech: '빠른 반말과 부산 사투리, 놀라면 “어라라? 뭐라노!”', traits: ['즉흥 작사', '말장난', '크레스트 퍼포먼스'], hobby: '이상한 표지판과 말실수 수집', colors: ['#ffcf5c', '#ff6b8a', '#6857d9'], outfit: '노란 스테이지 재킷, 분홍 스카프, 보랏빛 발광 볏 장식과 작은 마이크 하네스', quote: '말이 좀 샜다 아이가! 다시 박자 맞추자!', groupId: 'moran', story: '첫 라이브에서 가사를 통째로 잊은 뒤, 실수한 말까지 관객과 함께 후렴으로 바꾸며 무대 공포를 자신만의 유머로 이겨낸다.', relation: '개빡치노사우르스의 직설을 존중하고, 알빠노사우르스에게 말의 속도를 낮추는 법을 배운다.', silhouette: 'crest' },
  { id: 'hwarok', name: '개빡치노사우르스', alias: '화산처럼 터지는 드러머', age: 22, species: '안킬로사우루스 공룡형', role: '드럼 · 퍼포먼스', personality: '직설적이고 책임감이 강하다. 화가 나면 폭발하기보다 먼저 스틱을 잡고 리듬으로 정리한다.', speech: '짧고 강한 단문, 끝에 “확실히 하자!”', traits: ['강력한 드럼', '꼬리 곤봉', '불꽃 추진력'], hobby: '고장 난 앰프와 드럼 페달 고치기', colors: ['#ff654e', '#ffb347', '#3a233b'], outfit: '검붉은 무대 아머 베스트, 주황색 금속 플레이트, 꼬리 곤봉을 닮은 드럼 케이스', quote: '화가 난 게 아니라, 바꿀 때가 온 거다!', groupId: 'rage', story: '감정을 억누르라는 말을 들을수록 화가 커졌지만, 공연장에서 자기 분노가 누군가를 지키는 에너지로 바뀔 수 있음을 깨닫는다.', relation: '뭐라노사우르스의 즉흥성을 무대 에너지로 바꿔 주고, 알빠노사우르스가 쉬어 갈 수 있도록 볼륨을 조절한다.', silhouette: 'spike' },
  { id: 'alpi', name: '알빠노사우르스', alias: '저자극 주파수 DJ', age: 21, species: '오비랍토르 공룡형', role: 'DJ · 프로듀서', personality: '조용하지만 취향이 확실하다. 남의 경계를 존중하고 급하게 결론 내리지 않는다.', speech: '낮은 톤의 존댓말, “굳이 답하지 않아도 돼요.”', traits: ['샘플링', '차분한 판단', '깃털 크레스트'], hobby: '빗소리와 바람 소리 녹음', colors: ['#7de0c3', '#9ca9ff', '#283c55'], outfit: '민트색 후드 케이프, 딥네이비 조거 팬츠, 반투명 깃털 볏 이어커프', quote: '알림은 꺼도 음악은 남아요.', groupId: 'alppa', story: '모든 소문에 답해야 한다고 느끼던 알빠노사우르스는 아무 말 없이 머물 수 있는 라디오를 열고, 반응하지 않는 것도 자기 목소리라는 걸 알게 된다.', relation: '뭐라노사우르스가 급해질 때 호흡을 맞춰 주고, 개빡치노사우르스에게는 소리의 여백을 알려 준다.', silhouette: 'crest' },
];

const songRows: Omit<Song, 'duration' | 'levels'>[] = [
  { id: 'mora_01', title: '말이 되나? 됨!', artist: '뭐라노사우르스', bpm: 148, albumId: 'moranosa', genre: 'Glitch Pop', description: '뒤엉킨 말풍선이 킥과 스네어로 정렬되는 데뷔 라이브 넘버.', mood: '통통 튀고 장난스러움', seed: 101 },
  { id: 'mora_02', title: '자막은 잠시 쉬는 중', artist: '뭐라노사우르스', bpm: 126, albumId: 'moranosa', genre: 'Indie Funk', description: '말보다 표정이 먼저 도착하는 오후의 펑키한 대화.', mood: '산뜻하고 따뜻함', seed: 102 },
  { id: 'mora_03', title: '논점 이탈 대행진', artist: '뭐라노사우르스', bpm: 174, albumId: 'moranosa', genre: 'Speed Glitch', description: '엉뚱한 샘플과 변박이 몰아치는 앨범의 피날레.', mood: '빠르고 유쾌함', seed: 103 },
  { id: 'rage_01', title: '화산도 휴식이 필요해', artist: '개빡치노사우르스', bpm: 168, albumId: 'rageosa', genre: 'Punk Rock', description: '분노의 에너지를 드럼 브레이크로 해방하는 라이브 트랙.', mood: '뜨겁고 시원함', seed: 201 },
  { id: 'rage_02', title: '온도계 폭주', artist: '개빡치노사우르스', bpm: 184, albumId: 'rageosa', genre: 'Industrial Electro', description: '메탈릭 신스와 기타 리프가 맞물리는 고속 질주.', mood: '거칠고 강렬함', seed: 202 },
  { id: 'rage_03', title: '소리 질러도 괜찮아', artist: '개빡치노사우르스', bpm: 142, albumId: 'rageosa', genre: 'Anthem Rock', description: '큰 후렴으로 서로의 감정을 받아 주는 밴드 앤섬.', mood: '벅차고 단단함', seed: 203 },
  { id: 'alppa_01', title: '읽씹이 아니라 쉼표', artist: '알빠노사우르스', bpm: 92, albumId: 'alppasa', genre: 'Lo-fi Hip-hop', description: '알림을 내려놓고 빗소리에 귀를 기울이는 칠홉.', mood: '포근하고 차분함', seed: 301 },
  { id: 'alppa_02', title: '저소음 파도', artist: '알빠노사우르스', bpm: 108, albumId: 'alppasa', genre: 'Trip-hop', description: '낮게 출렁이는 베이스와 공기 같은 보컬의 조화.', mood: '몽환적이고 여유로움', seed: 302 },
  { id: 'alppa_03', title: '알림 0개, 마음 100%', artist: '알빠노사우르스', bpm: 120, albumId: 'alppasa', genre: 'Chill Garage', description: '조용한 해방감을 가볍게 흔드는 리듬으로 표현했다.', mood: '잔잔하고 경쾌함', seed: 303 },
  { id: 'post_01', title: '별빛 배송 완료', artist: '뭐라노사우르스', bpm: 132, albumId: 'postosa', genre: 'City Pop', description: '밤의 우편선을 타고 미처 전하지 못한 마음을 배달한다.', mood: '반짝이고 포근함', seed: 401 },
  { id: 'post_02', title: '수신인 미상', artist: '뭐라노사우르스', bpm: 116, albumId: 'postosa', genre: 'Dream Synth', description: '주소가 없는 편지의 빈칸을 신스 스트링으로 채운 곡.', mood: '서정적이고 신비로움', seed: 402 },
  { id: 'post_03', title: '은하수 우편선 03:17', artist: '뭐라노사우르스', bpm: 158, albumId: 'postosa', genre: 'Orchestral Dance', description: '새벽 항로를 통과하는 순간을 웅장한 댄스 비트로 그렸다.', mood: '극적이고 희망참', seed: 403 },
  { id: 'fern_01', title: '옥상에 숲이 자란다', artist: '알빠노사우르스', bpm: 126, albumId: 'fernosa', genre: 'Future Funk', description: '빌딩 사이의 바람과 잎사귀 소리를 샘플링한 그루브.', mood: '밝고 싱그러움', seed: 501 },
  { id: 'fern_02', title: '초록빛 소음', artist: '알빠노사우르스', bpm: 150, albumId: 'fernosa', genre: 'House / Breakbeat', description: '도시의 기계음이 식물의 박동과 겹쳐지는 댄스 트랙.', mood: '에너지 넘치고 청량함', seed: 502 },
  { id: 'fern_03', title: '새벽 네 시의 새싹', artist: '알빠노사우르스', bpm: 138, albumId: 'fernosa', genre: 'Melodic House', description: '작은 씨앗이 무대를 가득 채우는 순간을 담은 엔딩 곡.', mood: '희망차고 벅참', seed: 503 },
];

const generatedSongs: Song[] = songRows.map((song, index) => {
  const levelsByIndex: Record<number, Record<DifficultyId, number>> = {
    0: { seed: 4, grow: 7, skilled: 12, rage: 16, transcend: 22, chaos: 26 },
    1: { seed: 5, grow: 8, skilled: 13, rage: 17, transcend: 23, chaos: 27 },
    2: { seed: 6, grow: 9, skilled: 14, rage: 18, transcend: 25, chaos: 29 },
  };
  const offset = index % 3;
  const base = levelsByIndex[offset];
  const duration = Math.round((96 * 60) / song.bpm + 4);
  return { ...song, duration, levels: { ...base, seed: Math.max(3, base.seed + (index % 2)), grow: base.grow + (index % 2), skilled: base.skilled + (index % 3), rage: base.rage + (index % 2), transcend: base.transcend + (index % 3), chaos: base.chaos + (index % 2) } };
});

// A user-created MP3 supplied for the MORANOSAURUS album. Tempo and beat phase
// were estimated from the uploaded recording; the song has its own full-length chart.
export const SONGS: Song[] = [
  ...generatedSongs,
  {
    id: 'mora_user_01',
    title: '뭐라노사우르스',
    artist: '사용자 제작 오리지널',
    bpm: 173,
    duration: 197.72,
    albumId: 'moranosa',
    genre: 'Original MP3',
    levels: { seed: 5, grow: 9, skilled: 16, rage: 22, transcend: 28, chaos: 31 },
    description: '사용자가 직접 만든 오리지널 곡. 업로드한 MP3 원본을 사용하며 약 173 BPM 분석값에 맞춰 전 구간 채보를 생성합니다.',
    mood: '자작곡 · 오리지널',
    seed: 601,
    audioSrc: './audio/moranosaurus.mp3',
    audioLeadIn: 1.005,
    chartBeats: 558,
  },
];

export const CARDS: GameCard[] = [
  { id: 'mora_4_spark', characterId: 'mora', name: '말풍선 폭죽!', rarity: 4, skillName: '논점 폭발', skillDescription: '라이브 점수 보너스 +7%', skillValue: 7, skillKind: 'score', story: '첫 대형 무대에서 뭐라노사우르스는 대사를 잊는다. 개빡치노사우르스와 알빠노사우르스의 눈빛을 보고, 즉흥으로 만든 한 줄이 관객의 합창이 된다.', art: 'gold-confetti' },
  { id: 'hwarok_4_core', characterId: 'hwarok', name: '심장 속 화산핵', rarity: 4, skillName: '열정 점화', skillDescription: '라이프 감소량 12% 완화', skillValue: 12, skillKind: 'lifeShield', story: '개빡치노사우르스는 폭발 직전의 화산을 무대로 삼는 대신, 모두가 안전하게 소리 낼 수 있는 공연장을 선택한다.', art: 'ember-core' },
  { id: 'alpi_4_silence', characterId: 'alpi', name: '고요의 주파수', rarity: 4, skillName: '무음의 파동', skillDescription: 'GOOD 판정 일부를 GREAT로 보정', skillValue: 1, skillKind: 'gradeAssist', story: '알빠노사우르스가 송신한 작은 파동은 수많은 사람의 밤에 조용히 도착한다. 답장은 없지만 주파수는 계속 이어진다.', art: 'moon-wave' },
  { id: 'mora_3_misdirection', characterId: 'mora', name: '말풍선 미아 사건', rarity: 3, skillName: '논점 되감기', skillDescription: 'GREAT 점수 보너스 +4%', skillValue: 4, skillKind: 'greatScore', story: '뭐라노사우르스는 엉뚱한 말풍선을 따라가다 새로운 후렴을 찾아낸다.', art: 'violet-grid' },
  { id: 'hwarok_3_heartbeat', characterId: 'hwarok', name: '화산 심박 카운트', rarity: 3, skillName: '심박 방벽', skillDescription: '라이프 감소량 8% 완화', skillValue: 8, skillKind: 'lifeShield', story: '개빡치노사우르스는 화를 다루는 자신만의 네 박자 호흡을 만든다.', art: 'ember-core' },
  { id: 'alpi_3_moonrain', characterId: 'alpi', name: '달빛 아래 빗소리', rarity: 3, skillName: '잔향의 정리', skillDescription: '라이프 회복 +6', skillValue: 6, skillKind: 'lifeHeal', story: '알빠노사우르스는 빗소리만으로도 충분한 밤의 플레이리스트를 완성한다.', art: 'moon-wave' },
  { id: 'mora_2_sticker', characterId: 'mora', name: '스티커 대소동', rarity: 2, skillName: '말풍선 보충', skillDescription: '획득 재화 +4%', skillValue: 4, skillKind: 'reward', story: '뭐라노사우르스가 붙인 스티커가 연습실 모든 악기에 붙어 버렸다.', art: 'yellow-sticker' },
  { id: 'hwarok_2_drill', characterId: 'hwarok', name: '드럼은 정직해', rarity: 2, skillName: '박자 단련', skillDescription: '라이프 감소량 4% 완화', skillValue: 4, skillKind: 'lifeShield', story: '개빡치노사우르스는 처음 드럼 스틱을 잡은 날의 서툰 박자를 다시 연습한다.', art: 'orange-drum' },
  { id: 'alpi_1_rain', characterId: 'alpi', name: '창가의 빗방울', rarity: 1, skillName: '잔잔한 호흡', skillDescription: '라이프 회복 +2', skillValue: 2, skillKind: 'lifeHeal', story: '알빠노사우르스가 녹음한 빗소리는 작업실의 작은 배경음이 된다.', art: 'mint-rain' },
];

export const STORIES = [
  { id: 'main_01', title: '말풍선이 터진 날', category: '메인 스토리', requirement: '처음 접속 시 해금', reward: 120, lines: [
    { speaker: '뭐라노사우르스', text: '마이크 테스트! 하나, 둘… 어라? 내 말풍선이 왜 도시 전광판까지 날아갔노?' },
    { speaker: '개빡치노사우르스', text: '당황하지 마. 박자는 안 도망간다. 드럼 카운트 넣을 테니 네 말부터 정리해.' },
    { speaker: '알빠노사우르스', text: '꼭 바로 답할 필요는 없어요. 일단 이 소음부터 비트로 바꿔 볼까요?' },
    { speaker: '뭐라노사우르스', text: '좋다! 말이 꼬여도 박자는 맞는다. 우리 셋이 무대를 열자!' },
  ] },
  { id: 'rage_01', title: '분노는 박자로', category: '앨범 스토리 · 분노', requirement: '라이브 곡 3회 플레이', reward: 100, lines: [
    { speaker: '개빡치노사우르스', text: '또 감정을 낮추라는 안내문이 붙었네. 화가 난 게 아니라, 바꾸고 싶은 거다!' },
    { speaker: '뭐라노사우르스', text: '그럼 그 마음을 후렴으로 만들자. 크게 외쳐도 리듬은 놓치지 말고!' },
    { speaker: '알빠노사우르스', text: '소리를 키우는 것만이 답은 아니에요. 쉼표가 있어야 다음 박자도 선명해져요.' },
    { speaker: '개빡치노사우르스', text: '좋아. 분노를 무기로 쓰지 말고 음악으로 바꾸자. 카운트 간다!' },
  ] },
  { id: 'alppa_01', title: '응답하지 않을 권리', category: '앨범 스토리 · 병먹금', requirement: '라이브 곡 5회 플레이', reward: 100, lines: [
    { speaker: '알빠노사우르스', text: '오늘은 댓글을 읽지 않는 방송을 해 볼게요. 음악만 켜 둘게요.' },
    { speaker: '뭐라노사우르스', text: '아무 말 안 해도 괜찮나? 그럼 나도 잠깐 조용히 있어 볼게. 잠깐만!' },
    { speaker: '개빡치노사우르스', text: '침묵도 선택이다. 대신 드럼은 작게 칠게. 네가 편한 볼륨으로.' },
    { speaker: '알빠노사우르스', text: '고마워요. 답장 대신 파도 소리를 보낼게요. 듣고 싶을 때만 들어요.' },
  ] },
  { id: 'post_01', title: '늦게 도착한 마음', category: '스페셜 스토리 · 별빛', requirement: '라이브 곡 2회 플레이', reward: 80, lines: [
    { speaker: '뭐라노사우르스', text: '별빛 우편함에 편지가 한 통 있네. 주소는 없는데 마음은 꽉 찼다 아이가.' },
    { speaker: '알빠노사우르스', text: '수신인이 없어도 괜찮아요. 누군가에게 꼭 닿지 않아도 기록은 의미가 있으니까요.' },
    { speaker: '개빡치노사우르스', text: '그럼 우리가 배달하자. 드럼 비트에 실어서 하늘로 보내면 되겠네.' },
    { speaker: '뭐라노사우르스', text: '좋아! 목적지는 몰라도 출발은 할 수 있다. 하나, 둘, 셋!' },
  ] },
  { id: 'fern_01', title: '옥상에 남은 초록', category: '스페셜 스토리 · 정원', requirement: '라이브 곡 4회 플레이', reward: 80, lines: [
    { speaker: '알빠노사우르스', text: '옥상 온실의 식물이 소리에도 반응하네요. 잎이 흔들리는 박자가 참 예뻐요.' },
    { speaker: '개빡치노사우르스', text: '그럼 여긴 철거할 곳이 아니라 공연장이다. 내가 무대 바닥을 고칠게.' },
    { speaker: '뭐라노사우르스', text: '나는 식물 이름으로 랩을 쓸게. 바질, 로즈마리, 뭐라노… 어라라!' },
    { speaker: '알빠노사우르스', text: '급하지 않아도 돼요. 작은 씨앗부터 심으면, 우리만의 무대가 자랄 거예요.' },
  ] },
];

export const MISSION_DEFS = [
  { id: 'play1', title: '첫 라이브', description: '라이브를 1회 플레이하기', target: 1, reward: 80, type: 'play' },
  { id: 'play3', title: '리듬에 몸을 맡겨', description: '라이브를 3회 플레이하기', target: 3, reward: 140, type: 'play' },
  { id: 'score', title: '좋은 울림', description: '라이브에서 500,000점 달성하기', target: 500000, reward: 100, type: 'score' },
  { id: 'login', title: '오늘도 출석 완료', description: '게임에 접속하기', target: 1, reward: 50, type: 'login' },
];

export const getCharacter = (id: string) => CHARACTERS.find((character) => character.id === id)!;
export const getAlbum = (id: string) => ALBUMS.find((album) => album.id === id)!;
export const getSong = (id: string) => SONGS.find((song) => song.id === id)!;
export const getGroup = (id: string) => GROUPS.find((group) => group.id === id)!;
