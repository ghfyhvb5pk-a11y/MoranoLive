# 뭐라노사우르스 LIVE (MORANOSAURUS LIVE)

버전: **v0.3.0 — 사용자 자작곡 수록 업데이트**

세 공룡이 무대를 만드는 오리지널 웹 리듬게임 프로젝트입니다. React + TypeScript + Vite, Canvas 2D, Web Audio API 기반이며 PC·모바일 브라우저를 지원합니다.

## 이번 업데이트: USER ORIGINAL TRACK / 3 DINO / IMMERSIVE STAGE

- 사용자 자작곡 **「뭐라노사우르스」** MP3를 첫 번째 앨범 「뭐라노사우르스의 뭐라노」에 수록했습니다.
- 실제 MP3 원본을 Web Audio API 오디오 타임라인에 연결하고, 일시정지 시 재생도 함께 정지합니다.
- 자작곡은 분석 추정치 약 173 BPM, 558박자 자동 채보로 전 구간 플레이할 수 있습니다.
- 캐릭터 로스터를 **뭐라노사우르스, 개빡치노사우르스, 알빠노사우르스** 세 공룡으로 정리했습니다.
- 캐릭터 도감, 그룹, 카드, 스토리 대사, 앨범 소속과 시작 카드가 세 공룡 기준으로 정리됩니다.
- 라이브 플레이·일시정지·결과 화면은 뷰포트 전체를 덮는 전용 게임 화면으로 표시됩니다.
- 스토리 모드는 사이드바와 브라우저형 대시보드를 숨기는 전체 화면 극장 레이아웃입니다. 브라우저가 허용하면 Fullscreen API도 요청합니다.
- 터치 입력은 실제 터치 위치의 파동·십자 조준점·레인 발광으로 표시됩니다. 키보드도 입력 레인이 밝아집니다.
- 플릭 노트는 큼직한 위쪽 화살표와 `FLICK` 라벨로, 롱노트는 지속 꼬리와 `HOLD` 표시로, 슬라이드는 밝은 경로 리본과 `TRACE` 라벨로 구분합니다.
- 짧은 손가락 스와이프 흔적, 입력 파티클, 하단 키 레이블이 표시됩니다.
- 이전 로컬 저장 파일에서 제거된 캐릭터 카드만 남은 경우 세 공룡의 시작 카드로 안전하게 정리합니다.

## 콘텐츠 규모

- 캐릭터: 3명
- 그룹: 3개
- 앨범: 5개 (기본 지정 앨범 3개 + 오리지널 추가 앨범 2개)
- 곡: 16곡 (기존 데모 트랙 15곡 + 사용자 제공 MP3 1곡)
- 난이도: 6단계 (새싹 / 성장 / 숙련 / 폭주 / 초월 / 혼돈)
- 카드: 9종
- 차트: 16곡 × 6난이도 (기존 곡 15개 + 자작곡 1개)

기존 15곡은 브라우저 Web Audio API가 BPM과 곡별 시드에 맞춰 오리지널 드럼·베이스·패드·멜로디를 실시간 합성합니다. 새로 추가된 **「뭐라노사우르스」**는 사용자가 제공한 MP3 원본을 Web Audio API의 AudioBufferSourceNode로 재생합니다. 업로드된 음원의 길이는 약 197.72초이며, 오디오 분석으로 추정한 템포는 약 173 BPM입니다. 첫 감지 박자 위상에 맞춰 음원 시작 지연을 설정했고 558박자 길이의 전 구간 채보를 생성합니다. 이 채보는 BPM 기반 자동 생성이며, 악기·보컬의 세부 어택을 수작업으로 편곡한 정밀 채보는 아닙니다.

## 설치 및 실행

필수: Node.js 20 이상 권장.

```bash
npm install
npm run dev
```

프로덕션 빌드:

```bash
npm run build
npm run preview
```

## 조작

| 난이도 | PC | 모바일 |
|---|---|---|
| 새싹~초월 | 왼쪽 `F` / 오른쪽 `J` | 화면의 2개 레인 터치 |
| 혼돈 | 왼쪽부터 `D` / `F` / `J` / `K` | 4개 레인 멀티터치 |

노트가 판정선에 닿을 때 입력합니다. 롱노트는 시작을 누른 뒤 종료까지 유지하고, 슬라이드는 경로를 따라 손가락 또는 키 입력을 옮깁니다. 플릭은 화살표 노트 타이밍에 짧게 위쪽으로 스와이프합니다. 키보드는 키를 누르고 있는 동안 레인 불빛이 유지됩니다.

## GitHub Pages 배포

1. 프로젝트 파일을 GitHub 저장소에 업로드합니다.
2. 저장소 `Settings → Pages`에서 Source를 `GitHub Actions`로 선택합니다.
3. `.github/workflows/deploy.yml`이 `main` 브랜치 변경을 감지해 빌드·배포합니다.
4. 배포 성공 후 `Settings → Pages`의 사이트 주소로 접속합니다.

새 소스를 반영할 때는 수정된 `src` 폴더와 `supabase` 폴더를 저장소에 업로드하고 Commit하면 자동 배포가 다시 실행됩니다. `.github/workflows/deploy.yml`을 이미 저장소에서 수동으로 만들었다면 해당 파일은 그대로 두면 됩니다.

## Supabase (선택)

게스트 플레이는 Supabase 없이 작동합니다. 이메일 계정과 서버 검증 뽑기를 쓰려면 Supabase 프로젝트 설정이 필요합니다.

프로젝트 루트에 `.env.local`을 만들고 아래 값만 추가합니다.

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

`service_role` 키는 절대 프론트엔드나 GitHub 저장소에 넣지 않습니다.

Supabase CLI 사용 시:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
supabase functions deploy draw-gacha
```

### 이미 이전 버전의 DB 마이그레이션을 적용한 경우

기존 Supabase DB에는 새 로스터 마이그레이션을 추가 적용해야 합니다. 이 업데이트에는 `supabase/migrations/20261124190000_three_dino_roster.sql`이 포함되어 있습니다. Supabase CLI에서 `supabase db push`를 실행하면 이전 3공룡 로스터 업데이트가 적용됩니다. 이 마이그레이션은 이전 카드 인벤토리를 정리하고 세 공룡의 카드 풀과 신규 계정 시작 카드를 갱신합니다.

### 서버 보안 구조

- 프론트엔드에는 공개 anon key만 사용합니다.
- 지갑 차감·뽑기 확률·천장·중복 조각·뽑기 기록은 `draw_gacha` SQL RPC에서 트랜잭션으로 처리합니다.
- 카드 레벨업은 `level_up_card` RPC에서 조각 차감과 레벨 변경을 처리합니다.
- RLS로 사용자별 저장 데이터를 보호합니다.
- 현재 기록 제출은 요청/값 범위 검사까지이며 완전한 플레이 리플레이 검증은 없습니다. 경쟁 랭킹 보상에는 서버 리플레이 검증을 추가하기 전 사용하지 않는 것이 좋습니다.

## 파일 구조

```text
moranosaurus-live/
├── .github/workflows/deploy.yml
├── supabase/
│   ├── functions/draw-gacha/index.ts
│   └── migrations/
│       ├── 20261124000000_initial_schema.sql
│       └── 20261124190000_three_dino_roster.sql
├── public/
│   └── audio/
│       └── moranosaurus.mp3  # 사용자 제공 자작곡 원본
├── src/
│   ├── components/CharacterArt.tsx
│   ├── data/gameData.ts
│   ├── engine/chart.ts
│   ├── engine/RhythmSession.ts
│   ├── lib/storage.ts
│   ├── lib/supabase.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── styles.css
├── index.html
├── package.json
└── vite.config.ts
```

## 검증 범위 및 한계

TypeScript 소스의 구문 변환 검사와 콘텐츠 데이터 일관성 검사는 수행합니다. 현재 작업 환경에서는 npm 패키지 설치가 네트워크 시간 초과로 끝나 전체 Vite 프로덕션 빌드 및 실제 브라우저·기기별 터치 테스트를 완료하지 못했습니다. 배포 후 PC Chrome/Edge와 모바일 Safari/Chrome에서 첫 플레이, 멀티터치, 화면 회전, 브라우저 전체 화면 동작을 직접 확인해야 합니다.
