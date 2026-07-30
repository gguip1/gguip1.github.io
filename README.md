# Odd Tools

잠깐씩 해볼 수 있는 이상하고 유용한 웹 도구를 모으는 정적 웹 프로젝트입니다.

이 저장소는 프로젝트 중심 모노레포입니다. 포털과 각 도구는 `projects/` 아래에서 코드, 문서, 에이전트 지침, 하네스를 함께 관리합니다.

## 시작하기

```bash
npm install
npm run dev:portal
```

첫 번째 도구만 실행하려면:

```bash
npm run dev:money-world
```

## 검증

```bash
npm run verify
```

이 명령은 프로젝트 계약, 타입, 개별 빌드, 최종 배포 묶음을 검사합니다.

로컬에 Node.js가 없다면 Docker로 같은 검증을 실행할 수 있습니다.

```bash
docker compose run --rm verify
```

## 주요 문서

- `ARCHITECTURE.md`: 저장소 구조와 프로젝트 경계
- `CHANGELOG.md`: 저장소 전체 변경 기록
- `AGENTS.md`: 모든 AI 에이전트가 따르는 공통 규칙
- `projects/*/AGENTS.md`: 프로젝트별 작업 규칙
- `projects/*/CHANGELOG.md`: 프로젝트별 변경 기록
- `projects/*/SPEC.md`: 프로젝트별 제품 명세
- `projects/*/harnesses/`: 프로젝트별 검증 하네스
