export interface HeroContent {
  name: string
  nameEn: string
  role: string
  tagline: string
  scrollLabel: string
  dateline: string
  issue: string
}

export interface Stat {
  value: string
  unit?: string
  label: string
  caption: string
  source: string
}

export interface Story {
  id: string
  index: string
  title: string
  hook: string
  metric: { before: string; after: string; delta: string }
  body: string
  bullets: string[]
}

export interface Project {
  id: string
  name: string
  role: '솔로' | '팀' | '팀장'
  period: string
  summary: string
  stack: string[]
  outcomes: string[]
  href?: string
}

export interface TechCategory {
  label: string
  items: string[]
}

export interface Award {
  year: string
  title: string
  org: string
}

export interface FaqItem {
  q: string
  a: string
}

export interface CtaContent {
  kicker: string
  headline: string
  body: string
  github: { label: string; href: string }
  email: { label: string; href: string }
  backToTopLabel: string
}

export interface HeroContent2 extends HeroContent {
  hook: string
}

export interface AiTool {
  name: string
  use: string
}

export interface AiAssistedContent {
  kicker: string
  quote: string
  paragraphs: string[]
  tools: AiTool[]
  stat: { value: string; label: string }
  note: string
}

export interface MeContent {
  hero: HeroContent
  heroHook: string
  stats: Stat[]
  stories: Story[]
  projects: Project[]
  techCategories: TechCategory[]
  aiAssisted: AiAssistedContent
  awards: Award[]
  faq: FaqItem[]
  cta: CtaContent
}

export const me: MeContent = {
  hero: {
    name: '이기용',
    nameEn: 'GIYONG LEE',
    role: 'DevOps · Cloud Engineer',
    tagline:
      '실패를 투명하게 마주하고, 데이터로 정답을 찾아가는 데브옵스 엔지니어.',
    scrollLabel: '아래로 — 근거가 있습니다',
    dateline: '2026. KAKAO TECH BOOTCAMP · CLOUD TRACK',
    issue: 'ISSUE No. 001',
  },

  heroHook:
    '그래서, 채용하지 마세요. 합류 후의 후회는 돌이킬 수 없습니다.',

  stats: [
    {
      value: '98',
      unit: '%',
      label: '비용 절감',
      caption: 'EC2 상시 구동 → Lambda 서버리스 전환',
      source: 'ArcanaWhisper · $15/월 → $0.30/월',
    },
    {
      value: '23',
      unit: '×',
      label: '속도 개선',
      caption: '분산 트레이싱으로 인덱스 병목 적중',
      source: 'MongoDB meetingId+createdAt · 369ms → 16ms',
    },
    {
      value: '0',
      unit: '분',
      label: '서비스 중단',
      caption: '900,385건 채팅 데이터 듀얼라이트 이관',
      source: 'PostgreSQL → MongoDB · 정합성 100%',
    },
    {
      value: '17',
      unit: '×',
      label: 'p99 악화 증명',
      caption: '팀 튜닝 계획을 데이터로 반려',
      source: 'HikariCP 10 → 30 pool · p99 2s → 34s',
    },
  ],

  stories: [
    {
      id: '1',
      index: '01',
      title: 'HikariCP 풀 증설안, 데이터로 반려했다.',
      hook: '직감 대신 측정치로.',
      metric: {
        before: 'pool 10 · 373.7 req/s',
        after: 'pool 30 · 309.0 req/s',
        delta: '-17% throughput · p99 2s → 34s (17× 악화)',
      },
      body:
        '”HikariCP 풀을 10 → 30 으로 늘리면 처리량이 늘 것” 이라는 팀 가설을 그대로 받지 않았다. 풀 크기만 다르게 둔 두 환경을 같은 부하로 측정한 결과, 오히려 처리량이 17% 떨어지고 p99 지연이 17 배 악화(2s → 34s) 된다는 수치가 나왔다. 병목은 풀이 아니라 DB 측 리소스 경쟁이었다. 결과: 증설 계획 반려, 기존 설정 유지.',
      bullets: [
        '”바꾸는 변수는 한 개” 원칙으로 풀 크기만 격리 비교',
        'TPS · p50 / p95 / p99 · 에러율을 같은 축에서 관측',
        '측정치가 먼저 말하게 — 말 대신 데이터로 반박',
      ],
    },
    {
      id: '2',
      index: '02',
      title: '900만 건을, 12분에, 중단 없이.',
      hook: '완벽한 컷오버는 스위치가 아니라 단계다.',
      metric: {
        before: 'PG 단일 저장소',
        after: 'PG → Mongo · 917,306건',
        delta: '12분 이관 · 정합성 100% · 다운타임 0분',
      },
      body:
        '채팅 데이터 저장소를 PG → MongoDB 로 옮기면서 듀얼라이트 3 단계 전략을 설계했다. 환경변수로 단계 토글, 역방향 롤백 경로 확보, 5,000 건 배치마다 양쪽 카운트·해시·샘플 쿼리를 자동 검증. 900,385 건 이관이 약 12 분에 끝났고, 서비스는 한 번도 멈추지 않았다.',
      bullets: [
        '1단계: 이중 쓰기로 신규 데이터부터 동기화',
        '2단계: 5,000 건 배치 이관 + 건수·해시·샘플 검증',
        '3단계: 읽기 경로 카나리 전환, PG 를 관측용 섀도로 유지',
      ],
    },
    {
      id: '3',
      index: '03',
      title: '브라우저는 3초, curl은 40ms였다.',
      hook: '원인은 스택이 아니라 트레이스에 있었다.',
      metric: {
        before: '쿼리 369ms · scan 1.8M',
        after: '쿼리 16ms · scan 32',
        delta: '23× 개선 · 복합 인덱스 적중',
      },
      body:
        '같은 요청이 브라우저에서 1.7~3.5 초, curl 에선 38~58 ms 로 측정되는 모순이 있었다. OpenTelemetry + Tempo 로 스팬을 펼쳐보니 connection 획득 구간이 1.68 초, 정작 SQL 실행은 12 ms. 한 단계 더 올라가 실행 계획을 보니 `meetingId + createdAt` 복합 인덱스가 없어 1,820,445 도큐먼트를 전수 스캔하고 있었다. 인덱스 추가 후 쿼리 369 ms → 16 ms.',
      bullets: [
        '수치 모순을 가설이 아니라 트레이스로 분해',
        'connection 획득 지연의 뒤에 쿼리 점유가 있음을 확인',
        '복합 인덱스 적중 후 전 구간 재측정 검증',
      ],
    },
  ],

  projects: [
    {
      id: 'moyeobab',
      name: 'Moyeobab',
      role: '팀',
      period: '2025.09 – 2026.03',
      summary:
        '카카오 테크 부트캠프 클라우드 트랙 팀 프로젝트. v1 DoS 한계를 데이터로 증명한 뒤 v2를 컴퓨트 분리·ALB 카나리·3-AZ HA·K8s GitOps로 재설계, 5xx 0%로 컷오버.',
      stack: [
        'AWS',
        'Kubernetes (kubeadm)',
        'Terraform',
        'GitHub Actions OIDC',
        'Prometheus / Loki / Grafana',
        'ArgoCD',
      ],
      outcomes: [
        'v1 RPS 722 DoS 지점 특정 → v2 재설계 가설을 k6로 전면 검증',
        '카나리 컷오버 중 5xx 0% 유지',
      ],
    },
    {
      id: 'arcanawhisper',
      name: 'ArcanaWhisper',
      role: '솔로',
      period: '2024 – 현재',
      summary:
        'Google Gemini 기반 AI 타로 리딩 서비스. 프런트(S3+CloudFront) · 백(Lambda+API GW) · 인증(Firebase) · TTL 공유 링크까지 혼자 구현.',
      stack: [
        'React 19 / TypeScript / Vite',
        'AWS Lambda',
        'API Gateway',
        'S3 / CloudFront',
        'Firebase Auth',
        'Google Gemini API',
      ],
      outcomes: [
        '상시 구동 EC2 $15/월 → Lambda $0.30/월 (98% ↓)',
        '게스트 1회/일 · 유저 10회/일 레이트리밋, 공유 링크 TTL 운영',
        '2024 Cloud Innovation Competition 장려상',
      ],
      href: 'https://github.com/gguip1',
    },
    {
      id: 'wepick',
      name: 'WePick',
      role: '솔로',
      period: '2024',
      summary:
        'A/B 투표 커뮤니티. 1인 풀스택으로 EC2 → 컨테이너화 v2 이행, 사설 레지스트리·Portainer·Let\'s Encrypt까지 직접 운영.',
      stack: ['Docker', 'Nginx', 'Spring Boot', 'PostgreSQL', 'Portainer'],
      outcomes: [
        'Docker 이미지 900MB → 150MB (jlink 커스텀 JRE, 83% ↓)',
        'CI/CD 빌드 14분 → 2분 (ARM64 네이티브 러너, 86% ↓)',
      ],
    },
    {
      id: 'nm',
      name: 'N.M — AI Nutrition Manager',
      role: '팀장',
      period: '2024',
      summary:
        '캡스톤 프로젝트 팀장. YOLOv8 식품 인식 모델 직접 학습 및 Django 운영 환경 안정화를 맡아 API 성공률을 30% 실패에서 100%로 끌어올림.',
      stack: ['Django', 'Nginx + Gunicorn', 'YOLOv8', 'Python'],
      outcomes: [
        'API 성공률 ≈70% → 100% (Nginx + Gunicorn 전환)',
        'YOLOv8 식품 인식 mAP@50 88.79%',
        '2024 캡스톤 디자인 경진대회 우수상',
      ],
    },
  ],

  techCategories: [
    {
      label: 'Cloud / AWS',
      items: [
        'EC2',
        'VPC',
        'ALB',
        'Route53',
        'Lambda',
        'API Gateway',
        'S3',
        'CloudFront',
        'CloudWatch',
        'SSM',
        'IAM / OIDC',
        'ECR',
      ],
    },
    {
      label: 'Container & Orchestration',
      items: ['Docker', 'Kubernetes', 'ArgoCD', 'GitHub Actions OIDC'],
    },
    {
      label: 'IaC',
      items: ['Terraform'],
    },
    {
      label: 'Observability',
      items: ['Prometheus', 'Loki', 'Grafana', 'AlertManager', 'OpenTelemetry', 'Tempo'],
    },
    {
      label: 'Data',
      items: ['PostgreSQL', 'Redis', 'MongoDB', 'RabbitMQ', 'Qdrant'],
    },
    {
      label: 'Load & Testing',
      items: ['k6'],
    },
    {
      label: 'Backend',
      items: ['Spring Boot', 'Python', 'Django', 'FastAPI'],
    },
    {
      label: 'Frontend',
      items: ['React', 'TypeScript', 'Vite'],
    },
  ],

  aiAssisted: {
    kicker: 'AI와 함께 짓는 법',
    quote: 'AI는 부조종사. 결정은 내가.',
    paragraphs: [
      'Claude · Cursor · Codex · Copilot. 하루 코딩의 절반을 이들과 짝을 이뤄 움직입니다. 빠르게 가설을 만들고, 의심스러운 답은 버리고, 남는 것만 내 손으로 정돈합니다.',
      '이 사이트의 구조 설계와 섹션별 구현도 사람 한 명 + AI 여러 대의 합작입니다. 방향과 판단은 전적으로 제가 쥐고, 반복 작업과 탐색은 AI에게 맡겼습니다. 누가 무엇을 했는지 커밋 로그에서 추적할 수 있습니다.',
      '"AI가 다 했다" vs "AI를 거부한다" 양 극단 모두 비효율입니다. 어떤 결정은 사람이 해야 하고, 어떤 탐색은 기계가 더 빠릅니다. 그 경계선을 설계하는 것이 요즘 DevOps의 일입니다.',
    ],
    tools: [
      { name: 'Claude Code', use: '반복 작업·섹션 단위 페어 프로그래밍' },
      { name: 'Cursor', use: '프로젝트 리팩터링·대규모 코드 탐색' },
      { name: 'Codex', use: '보조 아트워크(SVG) 생성·자연어 스크립트' },
      { name: 'Copilot', use: '라인 단위 자동 완성·테스트 보일러플레이트' },
    ],
    stat: { value: '2×', label: '생산성 체감 — 탐색·문서화 영역 기준' },
    note:
      '채택 기준은 단 하나 — "내가 읽고 이해할 수 있는 코드만 머지한다."',
  },

  awards: [
    { year: '2024', title: 'Cloud Innovation Competition · 장려상', org: '주최: 클라우드 혁신 경진대회' },
    { year: '2024', title: '캡스톤 디자인 경진대회 · 우수상', org: '주최: 교내 공학 캡스톤' },
  ],

  faq: [
    {
      q: '이 사람, 실존합니까?',
      a: 'GitHub에 커밋 기록과 빌드 로그가 있습니다. 필요하면 블레임도 보여드립니다.',
    },
    {
      q: '정말 신입이 팀 결정을 뒤집었나요?',
      a: '네. 측정치와 시나리오 스크립트, 대시보드가 모두 남아 있습니다. 데이터 앞에 직급은 없습니다.',
    },
    {
      q: '"과장 광고" 아닙니까?',
      a: '모든 수치는 부하 테스트 리포트·트레이스·리소스 메트릭에 근거합니다. 허세가 아니라 재현 가능한 벤치마크입니다.',
    },
    {
      q: '무엇을 가장 잘합니까?',
      a: '문제를 “직감”이 아니라 “수치와 트레이스”로 분해하는 일. 그리고 그 결론을 팀이 받아들일 수 있게 문서로 정리하는 일입니다.',
    },
    {
      q: '채용 프로세스는 어떻게 시작하죠?',
      a: '아래 Final CTA의 GitHub 링크 또는 이메일. 어느 쪽이든 48시간 안에 답장합니다.',
    },
  ],

  cta: {
    kicker: '최종 조치 / FINAL ACTION',
    headline: '지금, 채용하세요.',
    body: '합류 이후의 후회는 돌이킬 수 없습니다. 대신, 합류하지 않은 후회는 가능합니다.',
    github: { label: 'GitHub · gguip1', href: 'https://github.com/gguip1' },
    email: { label: 'gguip7554@gmail.com', href: 'mailto:gguip7554@gmail.com' },
    backToTopLabel: '처음으로',
  },
}
