# 뭐라노사우르스 LIVE (MORANOSAURUS LIVE)

오리지널 공룡 아이돌 세계관을 기반으로 만든 React + TypeScript + Vite 웹 리듬게임 프로토타입입니다. PC와 모바일 브라우저를 모두 지원하며, 게스트 로컬 플레이는 별도 키 없이 실행할 수 있습니다.

> **현재 빌드의 범위**: 실제 플레이 가능한 리듬게임 수직 슬라이스입니다. 5개 그룹·15명 캐릭터·5개 앨범·15곡·6개 난이도·실시간 Web Audio 합성 음악·채보·판정·결과·로컬 저장·가챠·카드·스토리·미션 화면을 포함합니다. 실제 녹음 음원 파일은 포함하지 않으며, 곡 데이터에 따라 생성되는 오리지널 신스/드럼 패턴이 재생됩니다. Supabase 모드는 프로젝트 키와 SQL 마이그레이션 적용이 필요합니다.

## 주요 기능

- **세계관/캐릭터**: 논점공룡, 화산주의보, 무음구역, 메테오 메일, 페른프렌즈 등 5개 그룹과 15명 캐릭터 프로필
- **앨범/곡**: 사용자가 지정한 3개 필수 앨범 + 오리지널 2개 앨범, 총 15곡의 BPM/곡 길이/난이도/설명/재킷 콘셉트
- **리듬 엔진**: Web Audio API `AudioContext.currentTime` 기반 타이밍, `requestAnimationFrame` 기반 렌더링, PERFECT/GREAT/GOOD/BAD/MISS, 콤보/점수/정확도/라이프/풀콤보/올퍼펙트
- **노트**: 탭, 롱노트, 슬라이드, 플릭, 특수 노트, 동시치기
- **난이도**: 새싹·성장·숙련·폭주·초월은 2레인 F/J, 혼돈은 4레인 D/F/J/K 및 멀티터치
- **가챠**: 1회/10회, 픽업/상시/이벤트 배너, 등급 확률, 100회 천장, 교환 포인트, 중복 조각, 기록
- **카드/콘텐츠**: 1~4성 카드 도감, 레벨업, 5장 편성, 편성 스킬의 점수·판정·라이프 보정, 카드별 에피소드, 일일 미션, 업적, 플레이 기록
- **계정**: 게스트(localStorage) 모드와 선택적 Supabase 이메일 인증 및 계정별 `player_saves`
- **반응형 UI**: PC 사이드 내비게이션, 모바일 하단 내비게이션, 세로/가로 레이아웃 대응, 라이브 전체 화면

## 실행 방법

필수: Node.js 20 이상 권장 (워크플로는 Node 22 사용)

```bash
npm install
npm run dev
```

Vite가 출력하는 로컬 주소를 브라우저에서 엽니다. 음악은 브라우저 자동재생 정책 때문에 **라이브 시작 버튼을 누른 뒤** 재생됩니다.

프로덕션 빌드:

```bash
npm run build
npm run preview
```

## 조작법

| 난이도 | PC 키보드 | 모바일 |
|---|---|---|
| 새싹~초월 | 왼쪽 F / 오른쪽 J | 왼쪽·오른쪽 레인 터치 |
| 혼돈 | D / F / J / K (왼쪽부터 4레인) | 4개 레인 멀티터치 |

노트가 판정선에 닿는 시점에 입력합니다. 롱노트는 시작을 누른 뒤 끝까지 유지합니다. 슬라이드는 끝 레인으로 키 또는 손가락을 옮겨 유지합니다. 설정에서 노트 속도와 판정 보정값을 변경할 수 있습니다.

## Supabase 설정 (선택)

1. Supabase 프로젝트를 생성합니다.
2. 프로젝트 루트에 `.env.local` 파일을 만들고 아래 값을 설정합니다.

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

3. Supabase CLI를 설치하고 프로젝트를 연결한 후 마이그레이션을 적용합니다.

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

4. 가챠 Edge Function을 배포합니다.

```bash
supabase functions deploy draw-gacha
```

5. Supabase Dashboard의 Authentication에서 이메일 가입 정책과 이메일 확인 설정을 확인합니다.
6. 앱의 계정 화면에서 가입/로그인합니다.

### 서버 측 보안 구조

- 프론트엔드에는 공개 anon key만 둡니다. **service role key는 절대로 Vite 환경변수나 GitHub Pages에 넣지 않습니다.**
- `player_wallet`, `player_cards`, `gacha_history`는 RLS를 켜고 클라이언트의 직접 INSERT/UPDATE/DELETE 권한을 회수합니다.
- `draw-gacha` Edge Function은 사용자 JWT로 `draw_gacha` RPC를 호출합니다.
- `draw_gacha`는 지갑 행을 `FOR UPDATE`로 잠근 상태에서 암호학적 난수 기반 확률 판정, 재화 차감, 천장, 중복 조각, 서버 카드 인벤토리 반영, 모집 기록을 한 트랜잭션으로 처리합니다.
- 가입 시 시작 카드 3장은 서버에서 지급됩니다. 로그인 후 카드 목록/레벨은 `player_cards`에서 읽으며, 계정 모드 카드 레벨업은 `level_up_card` RPC가 조각 차감과 레벨 상승을 원자적으로 처리합니다.
- 4성 3%, 3성 17%, 2성 35%, 1성 45%; 10회 모집은 3성 이상 1장 보장, 100회 내 4성 확정으로 설정했습니다.
- `player_saves`는 사용자 본인만 읽고 쓸 수 있도록 RLS 정책을 적용했습니다.
- `record_live_finish`는 점수 범위와 요청 간격을 제한하고 서버 지갑에 보상을 반영하지만, 이 프로토타입은 입력 이벤트의 전체 리플레이 검증까지 구현하지 않습니다. 따라서 랭킹 보상이나 경쟁 대회에 쓰려면 서버 리플레이 검증/서명된 플레이 세션을 추가해야 합니다.
- 일일 미션 클레임은 서버에서 하루 1회만 처리합니다. 플레이 진행 조건은 현재 클라이언트 표시 기준이므로, 상용화 전에는 서버 플레이 기록과 연결해 보완해야 합니다.

## GitHub Pages 배포

1. 이 프로젝트를 `moranosaurus-live`라는 GitHub 저장소에 push합니다 (`.github/workflows/deploy.yml`은 main 브랜치를 감시합니다).
2. 저장소 Settings → Pages에서 Source를 **GitHub Actions**로 설정합니다.
3. Supabase를 사용한다면 저장소 Settings → Secrets and variables → Actions에 다음 repository secrets를 추가합니다.
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. `main`에 push하거나 Actions의 수동 실행을 누르면 빌드 후 Pages에 배포됩니다.

Vite의 `base: './'` 설정으로 저장소 하위 경로에서도 정적 asset을 로드하도록 구성했습니다. 이 앱은 URL 경로 기반 라우팅 대신 화면 상태 기반 내비게이션을 사용하므로 정적 호스팅에서 별도의 SPA rewrite가 필요하지 않습니다.

## 프로젝트 구조

```text
moranosaurus-live/
├── .github/workflows/deploy.yml
├── supabase/
│   ├── functions/draw-gacha/index.ts
│   └── migrations/20261124000000_initial_schema.sql
├── src/
│   ├── components/CharacterArt.tsx
│   ├── data/gameData.ts
│   ├── engine/chart.ts
│   ├── engine/RhythmSession.ts
│   ├── lib/storage.ts
│   ├── lib/supabase.ts
│   ├── App.tsx
│   ├── main.tsx
│   ├── styles.css
│   └── vite-env.d.ts
├── .env.example
├── index.html
├── package.json
├── tsconfig*.json
└── vite.config.ts
```

## 현재 프로토타입 범위와 미구현 항목

랭킹·친구 요청 UI/워크플로, 주간 미션, 카드 특훈(진화), 칭호 변경, 커스텀 키 바인딩은 아직 구현하지 않았습니다. `live_records` 기반 랭킹 집계와 친구 테이블은 후속 확장 대상으로 남겨 두었습니다. Supabase 연결 전에는 게스트 저장과 로컬 가챠만 실제 동작하며, 계정 모드의 서버 뽑기·지갑·카드·스토리 보상·미션/라이브 보상은 SQL 마이그레이션 및 Edge Function 배포 후 활성화됩니다.

## 데이터/콘텐츠 참고

- 음악 파일은 외부 저작물이나 임시로 가장한 음원을 사용하지 않습니다. 각 곡의 BPM/시드 기반으로 브라우저가 드럼·베이스·패드·멜로디를 합성합니다.
- 카드/앨범/캐릭터 일러스트는 코드로 생성되는 오리지널 벡터 아트입니다. 제작용 원화 레이어나 별도 스프라이트 시트는 포함하지 않습니다.
- 채보는 곡 시드와 난이도별 패턴 규칙을 사용해 결정적으로 생성되므로, 동일 곡/난이도는 항상 동일한 패턴이 나옵니다. 롱노트/슬라이드는 종료 시점까지 누르고 이동하는 하나의 판정 이벤트로 처리합니다.
- 게스트 데이터는 해당 브라우저의 localStorage에 저장됩니다. 브라우저 데이터 초기화 전에 계정 모드로 전환하거나 별도 export 기능을 구현하는 것을 권장합니다.
