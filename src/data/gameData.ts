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
  { id: 'chaos', name: '혼돈', english: 'APPEND', description: '4레인 이상, 다지·슬라이드 패턴' },
];

export const ALBUMS: Album[] = [
  {
    id: 'moranosa', title: '뭐라노사우르스의 뭐라노', subtitle: '말이 꼬여도, 박자는 맞는다.',
    world: '대사가 자막보다 빨리 튀어나오는 도시 모라모라. 오해와 말장난이 뒤섞인 무대에서 세 친구는 서로의 진심을 박자에 실어 전한다.',
    groupId: 'moran', genre: '글리치 팝 · 펑크 팝', colors: ['#ffcf5c', '#ff6b8a', '#6857d9'],
    story: '모라가 무심코 던진 한마디가 도시 전체의 자막을 뒤집어 놓는다. 노노는 엉킨 문장을 리듬으로 정리하고, 라온은 그 틈에서 아무도 말하지 못했던 진짜 마음을 찾아낸다. 세 사람은 말이 통하지 않는 날에도 함께 노래할 수 있다는 걸 증명하려 한다.'
  },
  {
    id: 'rageosa', title: '개빡치노사우르스의 분노', subtitle: '화는 연료로, 무대는 탈출구로.',
    world: '소리의 크기로 감정을 측정하는 화산도시 레드크레이터. 화를 참으라는 규칙에 지친 세 멤버가 분노를 창작 에너지로 바꾼다.',
    groupId: 'rage', genre: '펑크 록 · 인더스트리얼 일렉트로', colors: ['#ff654e', '#ffb347', '#3a233b'],
    story: '도시의 감정 계기판이 위험 수치에 도달한다. 화록은 무조건 참으라는 충고 대신 감정을 안전하게 표현할 무대를 만들자고 제안한다. 티아의 날카로운 기타와 바락의 묵직한 드럼은 마침내 도시의 경보음을 축제의 카운트다운으로 바꾼다.'
  },
  {
    id: 'alppasa', title: '알빠노사우르스의 병먹금', subtitle: '소음은 끄고, 우리만의 주파수로.',
    world: '모든 소문이 실시간으로 떠다니는 데이터 습지. 세 멤버는 반응하지 않을 자유와 자기 목소리를 지킬 권리를 노래한다.',
    groupId: 'alppa', genre: '칠홉 · 트립합 · 로파이', colors: ['#7de0c3', '#9ca9ff', '#283c55'],
    story: '끝없이 갱신되는 소문 피드가 멤버들의 하루를 잠식한다. 알피는 가장 조용한 방송을 시작하고, 무심은 불필요한 알림을 정리한다. 쿨루가 찾아낸 작은 파도 소리 위에서 세 사람은 침묵도 하나의 선택이 될 수 있음을 배운다.'
  },
  {
    id: 'postosa', title: '쥬라기 우편국 : 별빛 배달부', subtitle: '도착하지 못한 마음을 배달합니다.',
    world: '밤하늘을 가로지르는 공중 우편선이 다니는 시간의 항로. 아직 전하지 못한 편지마다 작은 별이 된다.',
    groupId: 'post', genre: '시티팝 · 신스 오케스트라', colors: ['#7ac6ff', '#f3a8e7', '#293d70'],
    story: '사라진 별자리 우편함에서 수신인 없는 편지 세 통이 발견된다. 메일로는 주소를 추적하고, 시오는 오래된 종이의 흔적을 읽는다. 루프는 편지의 빈칸을 멜로디로 채우며 각자의 시간이 다시 이어지도록 돕는다.'
  },
  {
    id: 'fernosa', title: '백악기 옥상정원 : 초록빛 소음', subtitle: '도시 위에서 자라나는 우리들의 비트.',
    world: '회색 빌딩 꼭대기에 숨겨진 거대한 옥상 온실. 식물의 진동과 도시의 전자음을 섞어 새로운 생태계를 만든다.',
    groupId: 'fern', genre: '퓨처 펑크 · 하우스 · 브레이크비트', colors: ['#9de36f', '#51c8b2', '#383f77'],
    story: '재개발 예정인 옥상 온실을 지키기 위해 페른은 하루 동안 열린 사운드 가든을 연다. 리프는 도시 소리를 채집하고, 루미는 빛의 방향으로 무대를 설계한다. 작은 씨앗 하나가 관객의 발걸음을 모으는 커다란 숲이 된다.'
  },
];

export const GROUPS: Group[] = [
  { id: 'moran', albumId: 'moranosa', name: '논점공룡', logo: '??!', concept: '말장난과 진심이 교차하는 하이틴 글리치 아이돌', genre: '글리치 팝 · 펑크 팝', colors: ['#ffcf5c', '#ff6b8a', '#6857d9'], story: '세 사람은 방송 사고로 시작한 임시 합동 무대를 정식 그룹으로 바꿨다. 서로의 말버릇을 놀리면서도, 무대 위에서는 누구보다 정확하게 박자를 맞춘다.' },
  { id: 'rage', albumId: 'rageosa', name: '화산주의보', logo: '!!', concept: '분노를 연주로 바꾸는 고출력 밴드', genre: '펑크 록 · 인더스트리얼', colors: ['#ff654e', '#ffb347', '#3a233b'], story: '감정을 숨기지 않는 세 명이 오래된 화산 공연장을 수리해 라이브 하우스로 만들었다. 강한 소리 안에는 서로를 지키는 섬세한 합이 있다.' },
  { id: 'alppa', albumId: 'alppasa', name: '무음구역', logo: '…', concept: '불필요한 소음을 낮추는 미니멀 사운드 크루', genre: '칠홉 · 트립합', colors: ['#7de0c3', '#9ca9ff', '#283c55'], story: '시끄러운 데이터 습지에서 세 명이 만든 작은 라디오 부스. 누구든 쉬어갈 수 있지만, 침묵을 강요하지는 않는다.' },
  { id: 'post', albumId: 'postosa', name: '메테오 메일', logo: '✉', concept: '시간의 항로를 달리는 별빛 우편 공연단', genre: '시티팝 · 신스 오케스트라', colors: ['#7ac6ff', '#f3a8e7', '#293d70'], story: '공중 우편선의 승무원으로 만난 세 사람은 배달 경로마다 작은 공연을 연다. 늦게 도착한 편지에도 유효기간은 없다고 믿는다.' },
  { id: 'fern', albumId: 'fernosa', name: '페른프렌즈', logo: '✳', concept: '옥상 온실에서 자연과 도시의 리듬을 섞는 크루', genre: '퓨처 펑크 · 하우스', colors: ['#9de36f', '#51c8b2', '#383f77'], story: '버려진 옥상 온실을 음악 실험실로 바꾼 친구들. 잎사귀의 떨림부터 지하철 진동까지 모든 소리를 샘플로 모은다.' },
];

export const CHARACTERS: Character[] = [
  { id: 'mora', name: '모라', alias: '말 많은 리더', age: 20, species: '딜로포사우루스 혼합형', role: '메인 보컬 · 작사', personality: '호기심이 많고 생각보다 먼저 말이 튀어나온다. 실수한 뒤에는 누구보다 먼저 사과한다.', speech: '문장 끝을 올리는 빠른 반말, 놀라면 “어라라?”', traits: ['즉흥 작사', '말실수 수집', '팀 분위기 담당'], hobby: '폐점 직전 문구점에서 특이한 스티커 모으기', colors: ['#ffcf5c', '#ff6b8a', '#6857d9'], outfit: '노란 크롭 재킷 위에 분홍 스카프, 보랏빛 플리츠 팬츠와 반투명 크레스트 장식', quote: '말이 좀 샜다 아이가! 다시 박자 맞추자!', groupId: 'moran', story: '큰 무대에서 실수한 뒤 마이크를 내려놓으려 했지만, 노노가 실수까지 리듬으로 만들자고 손을 내밀었다. 이제 모라는 완벽한 말보다 솔직한 목소리를 노래한다.', relation: '노노에게 가사를 검수받고 라온에게 무대의 속도를 배운다.', silhouette: 'crest' },
  { id: 'nono', name: '노노', alias: '문장 정리 담당', age: 19, species: '파키케팔로사우루스 인간형', role: '리드 기타 · 편곡', personality: '차분하고 분석적이지만 은근히 장난기가 있다. 말장난의 구조를 해부하는 취미가 있다.', speech: '짧고 정확한 문장, 가끔 괄호로 속마음을 덧붙임', traits: ['정확한 박자', '언어 퍼즐', '무표정 개그'], hobby: '암호 퍼즐과 오래된 키보드 수리', colors: ['#a7a5ff', '#66d4d0', '#34325e'], outfit: '라벤더 오버핏 셔츠, 민트색 헤드폰, 둥근 두개골 실루엣을 살린 투명 바이저', quote: '그 말, 라임은 맞아. 의미는 다시 보자.', groupId: 'moran', story: '늘 남의 문장을 정리해 주던 노노는 자신의 감정을 표현하는 데 서툴렀다. 모라의 엉뚱한 가사를 편곡하면서 처음으로 자기 이름을 곡 크레딧에 올린다.', relation: '모라의 가사를 다듬지만 그 즉흥성을 가장 좋아한다. 티아와 장비 정보를 주고받는다.', silhouette: 'horn' },
  { id: 'raon', name: '라온', alias: '느긋한 저음', age: 21, species: '파라사우롤로푸스 혼합형', role: '베이스 · 서브 보컬', personality: '느긋하고 배려심이 깊다. 팀이 흔들릴 때 가장 먼저 중심을 잡는다.', speech: '낮고 느린 말투, 문장 끝에 “그라믄 됐지”', traits: ['절대음감', '느긋한 판단', '간식 담당'], hobby: '낡은 라디오에서 잡음 채집하기', colors: ['#79d7cb', '#ffcf75', '#31577b'], outfit: '청록색 롱 베스트, 크림색 와이드 팬츠, 파라사우롤로푸스 볏을 닮은 스트랩', quote: '천천히 가도 박자는 안 놓친다.', groupId: 'moran', story: '늘 다른 사람의 속도에 맞추느라 자신의 리듬을 놓쳤다. 세 사람이 함께 만든 첫 곡에서 라온은 낮은 베이스 라인으로 자기 존재를 드러낸다.', relation: '두 멤버의 중재자. 쿨루와 새벽 산책을 즐긴다.', silhouette: 'crest' },
  { id: 'hwarok', name: '화록', alias: '화산의 캡틴', age: 22, species: '안킬로사우루스 공룡형', role: '리더 · 드럼', personality: '직설적이고 책임감이 강하다. 화가 나면 일단 드럼 스틱부터 정리한다.', speech: '짧은 단문과 큰 목소리, 끝에 “확실히 하자!”', traits: ['강한 체력', '정리정돈', '불꽃 같은 추진력'], hobby: '고장 난 앰프 고치기', colors: ['#ff654e', '#ffb347', '#3a233b'], outfit: '검붉은 패딩 베스트와 금속 플레이트 숄더, 꼬리 곤봉을 닮은 드럼 케이스', quote: '화가 난 게 아니라, 바꿀 때가 온 거다!', groupId: 'rage', story: '감정을 억누르라는 규칙에 반발해 공연장을 세웠다. 힘으로 밀어붙이는 리더에서, 모두의 온도를 살피는 리더로 성장한다.', relation: '티아와 무대 방향으로 자주 부딪히지만 서로의 실력을 인정한다. 바락의 드럼 멘토.', silhouette: 'spike' },
  { id: 'tia', name: '티아', alias: '불꽃 기타리스트', age: 20, species: '유타랍토르 인간형', role: '리드 기타 · 작곡', personality: '승부욕이 강하고 솔직하다. 완벽주의지만 남의 노력을 가볍게 여기지 않는다.', speech: '빠르고 날카로운 말투, 칭찬할 때만 작게 말함', traits: ['초고속 기타', '무대 연출', '수집벽'], hobby: '한정판 기타 피크 모으기', colors: ['#ff8d76', '#e2a5ff', '#2c2b47'], outfit: '검정 비대칭 재킷, 주홍색 라인, 발톱 모양 기타 피크 목걸이', quote: '더 세게가 아니라, 더 정확하게!', groupId: 'rage', story: '화려한 솔로만이 자신을 증명한다고 믿었지만 화록과 합주하며 빈 공간의 힘을 배운다. 지금은 다른 멤버의 소리를 살리는 편곡을 즐긴다.', relation: '화록과 창작 방식이 다르지만 신뢰가 깊다. 노노와 이펙터 프리셋을 공유한다.', silhouette: 'crest' },
  { id: 'barak', name: '바락', alias: '저역의 수호자', age: 23, species: '카르노타우루스 공룡형', role: '베이스 · 퍼커션', personality: '과묵하고 온화하다. 작은 소리도 놓치지 않는 세심한 성격.', speech: '짧은 문장, 가끔 의성어로 대답', traits: ['저음 설계', '목공', '묵직한 배려'], hobby: '나무로 미니어처 공연장 만들기', colors: ['#b86d6c', '#f0b56a', '#3a3043'], outfit: '브라운 워크웨어와 와인색 후드, 작은 뿔을 감싼 니트 밴드', quote: '둥. 그게 우리 심장 소리야.', groupId: 'rage', story: '큰 체구 탓에 늘 강한 역할을 맡았지만 실제로는 소리를 세심하게 조율하는 것을 좋아한다. 바락의 저음은 밴드가 흔들리지 않게 붙잡아 준다.', relation: '화록을 묵묵히 지원한다. 메일로의 우편선 엔진 소리를 샘플링한다.', silhouette: 'horn' },
  { id: 'alpi', name: '알피', alias: '저자극 DJ', age: 21, species: '오비랍토르 혼합형', role: 'DJ · 메인 프로듀서', personality: '조용하지만 자기 취향은 확실하다. 남의 경계를 존중하고 급하게 결론 내리지 않는다.', speech: '낮은 톤의 존댓말, “굳이 답하지 않아도 돼요.”', traits: ['샘플링', '정리된 책상', '낮잠'], hobby: '빗소리와 바람 소리 녹음', colors: ['#7de0c3', '#9ca9ff', '#283c55'], outfit: '민트 후드 케이프와 딥네이비 조거 팬츠, 작은 깃털 귀걸이', quote: '알림은 꺼도 음악은 남아요.', groupId: 'alppa', story: '늘 모든 소문에 답해야 한다고 느꼈다. 자신이 만든 조용한 라디오에 누군가 말없이 머물다 간 뒤, 반응하지 않아도 연결될 수 있다는 걸 알게 된다.', relation: '무심과 작업실을 공유한다. 리프에게 도시 소리 채집법을 배운다.', silhouette: 'crest' },
  { id: 'musim', name: '무심', alias: '평온한 큐레이터', age: 22, species: '스테고사우루스 공룡형', role: '비주얼 · 신시사이저', personality: '덤덤하고 관찰력이 좋다. 필요한 순간에는 누구보다 단호하다.', speech: '건조한 단문과 핵심만 말하는 어투', traits: ['정보 큐레이션', '미니멀 디자인', '침착함'], hobby: '오래된 포스터 분류하기', colors: ['#98b8ec', '#8edacb', '#263c5b'], outfit: '아이스블루 셔츠와 회청색 롱 코트, 등판의 판 모양을 살린 반투명 플레이트', quote: '그건 지금 중요하지 않아. 다음 곡 틀게.', groupId: 'alppa', story: '모든 정보를 정리하다 보니 정작 자신의 취향은 미뤄 왔다. 알피의 라디오에서 처음으로 본인이 고른 곡을 틀고, 취향을 공개하는 즐거움을 배운다.', relation: '알피의 조용한 프로듀싱 파트너. 루미와 무대 색채를 논한다.', silhouette: 'spike' },
  { id: 'kulu', name: '쿨루', alias: '느린 파도', age: 20, species: '케찰코아틀루스 날개형', role: '보컬 · 앰비언트 퍼포먼스', personality: '낙천적이고 자유롭다. 바람과 날씨에 따라 즉흥적으로 움직인다.', speech: '부드럽고 늘어진 말투, 문장 사이에 긴 쉼', traits: ['공중 퍼포먼스', '즉흥 안무', '수면 전문가'], hobby: '옥상에서 구름 모양 기록하기', colors: ['#8fe3dc', '#f2c4df', '#506a98'], outfit: '하늘빛 시어 케이프와 은빛 레그 워머, 날개 막을 닮은 소매', quote: '대답 안 해도 괜찮아. 파도는 계속 오니까.', groupId: 'alppa', story: '높이 나는 것이 자유라고 생각했지만, 혼자 날 때는 바람 소리밖에 들리지 않았다. 무음구역에서 함께 호흡하는 법을 배우고 무대에 머무는 시간을 늘린다.', relation: '라온과 새벽 산책을 한다. 시오와 하늘 항로를 탐험한다.', silhouette: 'wing' },
  { id: 'mailo', name: '메일로', alias: '우편선 항해사', age: 20, species: '프테라노돈 공룡형', role: '리더 · 보컬', personality: '책임감 있고 낭만적이다. 지도에 없는 길을 발견하면 기록해 둔다.', speech: '또렷하고 친절한 안내 방송 톤', traits: ['항로 설계', '편지 낭독', '별자리 지식'], hobby: '손으로 지도 그리기', colors: ['#7ac6ff', '#f3a8e7', '#293d70'], outfit: '남청색 항공 재킷과 별 모양 견장, 긴 볏을 닮은 은색 항법 고글', quote: '수신인이 없어도, 보내는 마음은 분명해.', groupId: 'post', story: '정해진 항로만 따르던 항해사였지만 수신인 없는 편지를 배달하며 지도 밖에도 의미가 있음을 깨닫는다.', relation: '시오와 항로 기록을 함께 쓴다. 바락에게 엔진 점검을 배운다.', silhouette: 'crest' },
  { id: 'sio', name: '시오', alias: '기억 복원사', age: 19, species: '시조새 혼합형', role: '바이올린 · 코러스', personality: '섬세하고 상상력이 풍부하다. 오래된 물건에 담긴 이야기를 잘 읽는다.', speech: '조심스럽고 다정한 말투, 비유를 자주 씀', traits: ['기억 복원', '현악 편곡', '수집 기록'], hobby: '오래된 엽서 복원', colors: ['#f3a8e7', '#8ab8ff', '#514b81'], outfit: '연분홍 숏 케이프와 자주색 원피스, 깃털 레이어가 있는 소매', quote: '편지는 종이보다 오래 마음에 남아.', groupId: 'post', story: '기억을 보존하는 일에만 매달리다 현재의 순간을 놓쳤다. 메일로와 루프가 만드는 즉흥 공연에서 지금 이 순간도 기록할 가치가 있음을 배운다.', relation: '메일로의 항로 기록 담당. 쿨루와 하늘 공연 안무를 만든다.', silhouette: 'wing' },
  { id: 'loop', name: '루프', alias: '루프를 잇는 작곡가', age: 21, species: '코엘로피시스 인간형', role: '작곡 · 신시사이저', personality: '활발하고 엉뚱하다. 반복되는 일상에서 작은 변주를 찾아낸다.', speech: '리듬감 있게 말하고 문장 끝에 짧은 의성어', traits: ['루프 메이킹', '장난감 악기', '암기력'], hobby: '일상의 소리를 4마디 루프로 만들기', colors: ['#ffb8d4', '#83d7ff', '#494b82'], outfit: '청록 점퍼와 코랄 스니커즈, 꼬리 모양 MIDI 컨트롤러 벨트', quote: '같은 하루도 한 박자 바꾸면 새로워!', groupId: 'post', story: '반복은 지루하다고 여겼지만 우편선의 엔진 소리를 루프로 만들면서 반복이 사람을 안심시키기도 한다는 사실을 깨닫는다.', relation: '메일로의 항로를 음악으로 기록한다. 노노와 루프 장비를 공유한다.', silhouette: 'sail' },
  { id: 'fern', name: '페른', alias: '정원의 설계자', age: 20, species: '브라키오사우루스 혼합형', role: '리더 · 보컬', personality: '다정하고 끈기가 있다. 작은 변화도 기다려 줄 줄 안다.', speech: '차분하고 따뜻한 권유형 말투', traits: ['식물 돌봄', '공간 설계', '장기 계획'], hobby: '희귀 고사리 키우기', colors: ['#9de36f', '#51c8b2', '#383f77'], outfit: '라임색 하이넥 점퍼와 아이보리 멜빵, 잎맥 패턴 헤어 장식', quote: '천천히 자라도, 무대는 넓어질 거야.', groupId: 'fern', story: '한 번에 완성하려는 조급함 때문에 온실의 식물을 여러 번 놓쳤다. 친구들과 정원을 돌보며 성장에는 기다림이 필요하다는 것을 배운다.', relation: '리프의 채집을 지원하고 루미의 빛 설계를 신뢰한다.', silhouette: 'sail' },
  { id: 'reef', name: '리프', alias: '도시 소리 채집가', age: 19, species: '콤프소그나투스 공룡형', role: '샘플러 · 랩', personality: '재빠르고 장난스럽다. 주변 소리를 새로운 악기로 바꾸는 재주가 있다.', speech: '빠른 말과 의성어, 궁금하면 바로 질문', traits: ['필드 레코딩', '프리스타일 랩', '스케이트'], hobby: '골목의 독특한 반향 찾기', colors: ['#51c8b2', '#ffcf5c', '#374b73'], outfit: '민트색 바시티 재킷과 오렌지 크로스백, 꼬리 모티프 스케이트 보호대', quote: '저 환풍기 소리, 킥으로 쓰면 딱인데?', groupId: 'fern', story: '도시의 소음은 없애야 한다고 생각했지만, 귀 기울이면 그 안에도 리듬이 있음을 알게 된다. 리프는 버려진 소리를 정원의 음악으로 바꾼다.', relation: '알피에게 녹음 기술을 배운다. 페른에게 채집한 씨앗을 선물한다.', silhouette: 'spike' },
  { id: 'lumi', name: '루미', alias: '빛의 디자이너', age: 21, species: '트리케라톱스 인간형', role: '안무 · 조명', personality: '자신감 있고 세밀하다. 시각적 균형을 중요하게 생각한다.', speech: '분명한 어조와 정확한 단어 선택', traits: ['조명 프로그래밍', '안무 구성', '색채 감각'], hobby: '프리즘과 유리 조각 수집', colors: ['#b2a0ff', '#ff9bb8', '#55c8b3'], outfit: '보랏빛 크롭 망토와 진주색 쇼츠, 세 뿔을 모티프로 한 발광 헤어핀', quote: '빛은 박자를 보여 주는 또 하나의 악기야.', groupId: 'fern', story: '완벽한 화면을 만들려다 관객의 움직임을 놓쳤다. 라이브 현장에서 즉흥 조명을 배워, 관객이 만드는 우연까지 무대의 일부로 받아들인다.', relation: '무심과 시각 연출 취향이 맞는다. 페른에게 무대의 여백을 배운다.', silhouette: 'frill' },
];

const songRows: Omit<Song, 'duration' | 'levels'>[] = [
  { id: 'mora_01', title: '말이 되나? 됨!', artist: '논점공룡', bpm: 148, albumId: 'moranosa', genre: 'Glitch Pop', description: '뒤엉킨 말풍선이 킥과 스네어로 정렬되는 데뷔 라이브 넘버.', mood: '통통 튀고 장난스러움', seed: 101 },
  { id: 'mora_02', title: '자막은 잠시 쉬는 중', artist: '논점공룡', bpm: 126, albumId: 'moranosa', genre: 'Indie Funk', description: '말보다 표정이 먼저 도착하는 오후의 펑키한 대화.', mood: '산뜻하고 따뜻함', seed: 102 },
  { id: 'mora_03', title: '논점 이탈 대행진', artist: '논점공룡', bpm: 174, albumId: 'moranosa', genre: 'Speed Glitch', description: '엉뚱한 샘플과 변박이 몰아치는 앨범의 피날레.', mood: '빠르고 유쾌함', seed: 103 },
  { id: 'rage_01', title: '화산도 휴식이 필요해', artist: '화산주의보', bpm: 168, albumId: 'rageosa', genre: 'Punk Rock', description: '분노의 에너지를 드럼 브레이크로 해방하는 라이브 트랙.', mood: '뜨겁고 시원함', seed: 201 },
  { id: 'rage_02', title: '온도계 폭주', artist: '화산주의보', bpm: 184, albumId: 'rageosa', genre: 'Industrial Electro', description: '메탈릭 신스와 기타 리프가 맞물리는 고속 질주.', mood: '거칠고 강렬함', seed: 202 },
  { id: 'rage_03', title: '소리 질러도 괜찮아', artist: '화산주의보', bpm: 142, albumId: 'rageosa', genre: 'Anthem Rock', description: '큰 후렴으로 서로의 감정을 받아 주는 밴드 앤섬.', mood: '벅차고 단단함', seed: 203 },
  { id: 'alppa_01', title: '읽씹이 아니라 쉼표', artist: '무음구역', bpm: 92, albumId: 'alppasa', genre: 'Lo-fi Hip-hop', description: '알림을 내려놓고 빗소리에 귀를 기울이는 칠홉.', mood: '포근하고 차분함', seed: 301 },
  { id: 'alppa_02', title: '저소음 파도', artist: '무음구역', bpm: 108, albumId: 'alppasa', genre: 'Trip-hop', description: '낮게 출렁이는 베이스와 공기 같은 보컬의 조화.', mood: '몽환적이고 여유로움', seed: 302 },
  { id: 'alppa_03', title: '알림 0개, 마음 100%', artist: '무음구역', bpm: 120, albumId: 'alppasa', genre: 'Chill Garage', description: '조용한 해방감을 가볍게 흔드는 리듬으로 표현했다.', mood: '잔잔하고 경쾌함', seed: 303 },
  { id: 'post_01', title: '별빛 배송 완료', artist: '메테오 메일', bpm: 132, albumId: 'postosa', genre: 'City Pop', description: '밤의 우편선을 타고 미처 전하지 못한 마음을 배달한다.', mood: '반짝이고 포근함', seed: 401 },
  { id: 'post_02', title: '수신인 미상', artist: '메테오 메일', bpm: 116, albumId: 'postosa', genre: 'Dream Synth', description: '주소가 없는 편지의 빈칸을 신스 스트링으로 채운 곡.', mood: '서정적이고 신비로움', seed: 402 },
  { id: 'post_03', title: '은하수 우편선 03:17', artist: '메테오 메일', bpm: 158, albumId: 'postosa', genre: 'Orchestral Dance', description: '새벽 항로를 통과하는 순간을 웅장한 댄스 비트로 그렸다.', mood: '극적이고 희망참', seed: 403 },
  { id: 'fern_01', title: '옥상에 숲이 자란다', artist: '페른프렌즈', bpm: 126, albumId: 'fernosa', genre: 'Future Funk', description: '빌딩 사이의 바람과 잎사귀 소리를 샘플링한 그루브.', mood: '밝고 싱그러움', seed: 501 },
  { id: 'fern_02', title: '초록빛 소음', artist: '페른프렌즈', bpm: 150, albumId: 'fernosa', genre: 'House / Breakbeat', description: '도시의 기계음이 식물의 박동과 겹쳐지는 댄스 트랙.', mood: '에너지 넘치고 청량함', seed: 502 },
  { id: 'fern_03', title: '새벽 네 시의 새싹', artist: '페른프렌즈', bpm: 138, albumId: 'fernosa', genre: 'Melodic House', description: '작은 씨앗이 무대를 가득 채우는 순간을 담은 엔딩 곡.', mood: '희망차고 벅참', seed: 503 },
];

export const SONGS: Song[] = songRows.map((song, index) => {
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

export const CARDS: GameCard[] = [
  { id: 'mora_4_spark', characterId: 'mora', name: '말풍선 폭죽!', rarity: 4, skillName: '논점 폭발', skillDescription: '라이브 점수 보너스 +7%', skillValue: 7, skillKind: 'score', story: '첫 대형 무대에서 모라는 대사를 잊는다. 노노와 라온의 눈빛을 보고, 즉흥으로 만든 한 줄이 관객의 합창이 된다.', art: 'gold-confetti' },
  { id: 'hwarok_4_core', characterId: 'hwarok', name: '심장 속 화산핵', rarity: 4, skillName: '열정 점화', skillDescription: '라이프 감소량 12% 완화', skillValue: 12, skillKind: 'lifeShield', story: '화록은 폭발 직전의 화산을 무대로 삼는 대신, 모두가 안전하게 소리 낼 수 있는 공연장을 선택한다.', art: 'ember-core' },
  { id: 'alpi_4_silence', characterId: 'alpi', name: '고요의 주파수', rarity: 4, skillName: '무음의 파동', skillDescription: 'GOOD 판정 일부를 GREAT로 보정', skillValue: 1, skillKind: 'gradeAssist', story: '알피가 송신한 작은 파동은 수많은 사람의 밤에 조용히 도착한다. 답장은 없지만 주파수는 계속 이어진다.', art: 'moon-wave' },
  { id: 'mailo_4_starlane', characterId: 'mailo', name: '별 사이의 항로', rarity: 4, skillName: '별빛 내비게이션', skillDescription: '라이브 획득 보상 +15%', skillValue: 15, skillKind: 'reward', story: '메일로는 지도에 없는 길을 택해 수신인 없는 편지를 별자리 우편함에 넣는다.', art: 'star-route' },
  { id: 'lumi_4_prism', characterId: 'lumi', name: '프리즘 스테이지', rarity: 4, skillName: '광휘의 큐', skillDescription: 'PERFECT 점수 보너스 +8%', skillValue: 8, skillKind: 'perfectScore', story: '루미는 관객의 움직임에 반응하는 조명을 설계한다. 정해진 빛보다 함께 만든 빛이 더 아름다웠다.', art: 'prism-stage' },
  { id: 'nono_3_formula', characterId: 'nono', name: '정답은 리듬 안에', rarity: 3, skillName: '정밀 편곡', skillDescription: 'GREAT 점수 보너스 +4%', skillValue: 4, skillKind: 'greatScore', story: '노노는 계산할 수 없는 즉흥의 아름다움을 처음으로 악보에 남긴다.', art: 'violet-grid' },
  { id: 'raon_3_radio', characterId: 'raon', name: '새벽 라디오 산책', rarity: 3, skillName: '저음의 온기', skillDescription: '라이프 회복 +6', skillValue: 6, skillKind: 'lifeHeal', story: '라온의 오래된 라디오에서 흘러나온 잡음이 세 사람의 새 곡 첫 소절이 된다.', art: 'teal-radio' },
  { id: 'tia_3_solo', characterId: 'tia', name: '불꽃 여섯 줄', rarity: 3, skillName: '정확한 화염', skillDescription: 'BAD 판정 일부를 GOOD로 완화', skillValue: 1, skillKind: 'badAssist', story: '티아는 솔로 파트를 줄이고 동료의 소리를 살리는 새로운 편곡을 완성한다.', art: 'red-guitar' },
  { id: 'barak_3_low', characterId: 'barak', name: '둥, 하고 시작', rarity: 3, skillName: '저역 방벽', skillDescription: '라이프 감소량 8% 완화', skillValue: 8, skillKind: 'lifeShield', story: '바락은 작은 공연장의 울림을 측정하며 모두가 편히 들을 수 있는 저음을 만든다.', art: 'brown-resonance' },
  { id: 'musim_3_archive', characterId: 'musim', name: '조용한 컬렉션', rarity: 3, skillName: '선곡의 미학', skillDescription: '획득 재화 +8%', skillValue: 8, skillKind: 'reward', story: '무심은 정리해 둔 포스터 중 가장 좋아하는 한 장을 작업실 벽에 붙인다.', art: 'blue-archive' },
  { id: 'sio_3_letter', characterId: 'sio', name: '접힌 편지의 온도', rarity: 3, skillName: '기억의 선율', skillDescription: '판정 범위 +3ms', skillValue: 3, skillKind: 'timingAssist', story: '시오는 오래된 엽서의 얼룩을 지우지 않기로 한다. 그 자국도 편지의 일부이기 때문이다.', art: 'pink-letter' },
  { id: 'fern_3_garden', characterId: 'fern', name: '온실의 첫 새싹', rarity: 3, skillName: '성장의 박동', skillDescription: '라이프 회복 +8', skillValue: 8, skillKind: 'lifeHeal', story: '페른은 매일 조금씩 자라는 식물을 보며 팀의 속도를 믿게 된다.', art: 'green-glass' },
  { id: 'reef_3_sample', characterId: 'reef', name: '골목 샘플러', rarity: 2, skillName: '필드 레코딩', skillDescription: '획득 재화 +5%', skillValue: 5, skillKind: 'reward', story: '리프는 오래된 환풍기 소리에서 새로운 킥을 찾아낸다.', art: 'mint-sample' },
  { id: 'kulu_2_cloud', characterId: 'kulu', name: '구름 아래 쉼표', rarity: 2, skillName: '느린 파도', skillDescription: '라이프 회복 +4', skillValue: 4, skillKind: 'lifeHeal', story: '쿨루는 아무 말 없이 함께 걷는 시간도 공연의 일부라고 생각한다.', art: 'sky-cloud' },
  { id: 'loop_2_repeat', characterId: 'loop', name: '네 마디의 우연', rarity: 2, skillName: '루프 메이커', skillDescription: 'GREAT 점수 보너스 +2%', skillValue: 2, skillKind: 'greatScore', story: '루프는 우편선 엔진 소리를 하루 종일 잘라 붙여 새 멜로디를 만든다.', art: 'coral-loop' },
  { id: 'mora_2_sticker', characterId: 'mora', name: '스티커 대소동', rarity: 2, skillName: '말풍선 보충', skillDescription: '획득 재화 +4%', skillValue: 4, skillKind: 'reward', story: '모라가 붙인 스티커가 연습실 모든 악기에 붙어 버렸다.', art: 'yellow-sticker' },
  { id: 'hwarok_2_drill', characterId: 'hwarok', name: '드럼은 정직해', rarity: 2, skillName: '박자 단련', skillDescription: '라이프 감소량 4% 완화', skillValue: 4, skillKind: 'lifeShield', story: '화록은 처음 드럼 스틱을 잡은 날의 서툰 박자를 다시 연습한다.', art: 'orange-drum' },
  { id: 'alpi_1_rain', characterId: 'alpi', name: '창가의 빗방울', rarity: 1, skillName: '잔잔한 호흡', skillDescription: '라이프 회복 +2', skillValue: 2, skillKind: 'lifeHeal', story: '알피가 녹음한 빗소리는 작업실의 작은 배경음이 된다.', art: 'mint-rain' },
  { id: 'nono_1_keycap', characterId: 'nono', name: '키캡 수집가', rarity: 1, skillName: '키보드 정비', skillDescription: 'GREAT 점수 보너스 +1%', skillValue: 1, skillKind: 'greatScore', story: '노노는 서로 다른 키보드의 타건음을 비교한다.', art: 'lavender-key' },
  { id: 'lumi_1_light', characterId: 'lumi', name: '작은 프리즘', rarity: 1, skillName: '무대 체크', skillDescription: '획득 재화 +3%', skillValue: 3, skillKind: 'reward', story: '루미는 작은 유리 조각으로 연습실 벽에 무지개를 만든다.', art: 'pink-prism' },
];

export const STORIES = [
  { id: 'main_01', title: '첫 번째 말풍선', category: '메인 스토리', requirement: '처음 접속 시 해금', reward: 120, lines: [
    { speaker: '모라', text: '마이크 테스트! 하나, 둘… 어라, 이거 도시 전체에 송출됐나?' },
    { speaker: '노노', text: '네. 방금 시청 전광판 자막이 전부 물음표로 바뀌었어요.' },
    { speaker: '라온', text: '그라믄 이왕 이렇게 된 거, 노래 한 곡 들려주자.' },
    { speaker: '모라', text: '좋아! 말이 꼬여도 박자는 안 꼬이게. 우리 이름은… 논점공룡이다!' },
  ] },
  { id: 'rage_01', title: '온도를 낮추지 않는 법', category: '앨범 스토리 · 분노', requirement: '화산도 휴식이 필요해 클리어', reward: 100, lines: [
    { speaker: '화록', text: '또 감정 수치 경고야. 화를 내지 말라는 말은 이제 지겹다.' },
    { speaker: '티아', text: '그럼 소리로 보여 주자. 참는 대신 제대로 연주하는 거야.' },
    { speaker: '바락', text: '둥. 공연장 문은 내가 열어 둘게.' },
    { speaker: '화록', text: '좋아. 우리 감정은 고장이 아니라 신호라는 걸 들려주자.' },
  ] },
  { id: 'alppa_01', title: '응답하지 않을 권리', category: '앨범 스토리 · 병먹금', requirement: '읽씹이 아니라 쉼표 클리어', reward: 100, lines: [
    { speaker: '알피', text: '오늘은 댓글을 읽지 않는 방송을 해 볼게요.' },
    { speaker: '무심', text: '화면도 최소화했어. 남은 건 음악뿐이야.' },
    { speaker: '쿨루', text: '침묵이 꼭 비어 있는 건 아니거든. 바람도 들리잖아.' },
    { speaker: '알피', text: '그럼 오늘은 답장 대신 파도 소리를 보낼게요.' },
  ] },
  { id: 'post_01', title: '수신인 없는 편지', category: '앨범 스토리 · 우편국', requirement: '별빛 배송 완료 클리어', reward: 100, lines: [
    { speaker: '메일로', text: '이 편지는 수신인 주소가 지워져 있어.' },
    { speaker: '시오', text: '그래도 쓴 사람의 마음은 남아 있어. 잉크가 기억하고 있거든.' },
    { speaker: '루프', text: '그 빈칸에 멜로디를 넣으면 어떨까? 주소 대신 후렴으로!' },
    { speaker: '메일로', text: '좋아. 별빛 항로로 보내자. 늦은 편지도 도착할 수 있게.' },
  ] },
  { id: 'fern_01', title: '옥상에 남은 초록', category: '앨범 스토리 · 정원', requirement: '옥상에 숲이 자란다 클리어', reward: 100, lines: [
    { speaker: '페른', text: '철거 안내문이 붙었어. 이 정원을 어떻게든 지키고 싶어.' },
    { speaker: '리프', text: '그러면 도시의 소리를 모아서 공연하자. 사람들이 여기까지 올라오게!' },
    { speaker: '루미', text: '빛은 내가 맡을게. 잎사귀 그림자가 무대가 되도록.' },
    { speaker: '페른', text: '하루 만에 숲을 만들 수는 없어도, 씨앗을 심을 수는 있겠지.' },
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
