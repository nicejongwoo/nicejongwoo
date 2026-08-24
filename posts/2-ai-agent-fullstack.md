# [AI Coding] AI 에이전트와 협업하여 인터뷰 시뮬레이터 풀스택 서비스 구축하기

> **작성일**: 2026-08-23  
> **카테고리**: AI & Fullstack  
> **관련 프로젝트**: [github.com/nicejongwoo/interview-simulator](https://github.com/nicejongwoo/interview-simulator)  
> **태그**: `AI Agent`, `Claude Code`, `React`, `Spring Boot`, `Fullstack`, `Vibe-Coding`

---

## 1. 프로젝트 배경 및 목표

채용 면접을 준비할 때, 기술 질문에 대해 실시간으로 피드백을 받고 꼬리 질문(Deep Dive)을 이어갈 수 있는 대화형 시뮬레이션 환경이 필요했습니다.

이 프로젝트(`interview-simulator`)는 **최신 AI CLI 도구(Claude Code 등)와 페어 프로그래밍을 진행하여 단기간에 기획부터 아키텍처 설계, Spring Boot 백엔드 API, React SPA 프론트엔드 연동까지 완성한 실전 풀스택 프로젝트**입니다.

---

## 2. 전체 시스템 아키텍처

```text
[ React Frontend (SPA) ]
          │ (REST API & SSE / Streaming)
          ▼
[ Spring Boot Backend ]
  ├── Interview Controller & Service
  ├── Prompt Template Engine
  ├── LLM Client (OpenAI / Anthropic API)
  └── Session / History Store (Redis)
```

- **Frontend**: React 18, TailwindCSS, TypeScript (반응형 UI, 실시간 타이핑 렌더링)
- **Backend**: Java 17, Spring Boot 3.x, Spring WebFlux / WebClient, Spring Data Redis
- **AI Integration**: 스트리밍 응답(Server-Sent Events)을 활용한 인터랙티브 면접관 페르소나 구현

---

## 3. AI 에이전트 페어 프로그래밍 실전 워크플로우

단순히 "코드 짜줘"라는 식의 단발성 프롬프트 대신, **체계적인 4단계 워크플로우**를 구축하여 개발을 진행했습니다.

### Step 1: 컨텍스트와 도메인 규칙 정의 (`PROJECT_RULES.md`)
AI 에이전트가 코드베이스를 오염시키지 않도록 명확한 규칙을 파일로 정의합니다.

```markdown
# Engineering Rules
1. 모든 API 응답은 `ApiResponse<T>` 공통 래퍼 클래스를 사용한다.
2. 비즈니스 로직은 Service 레이어에 캡슐화하고 Controller는 얇게 유지한다.
3. LLM 호출 실패 시 Fallback 전략 및 재시도(Retry) 메커니즘을 필수 구현한다.
4. React 컴포넌트는 단일 책임 원칙(SRP)을 준수하며 커스텀 훅으로 비즈니스 상태를 분리한다.
```

### Step 2: API 명세 기반 인터페이스 우선 개발
Controller와 DTO 스펙을 먼저 정의하여 프론트엔드와 백엔드가 병렬로 개발될 수 있도록 설계합니다.

```java
@RestController
@RequestMapping("/api/v1/interviews")
@RequiredArgsConstructor
public class InterviewController {

    private final InterviewService interviewService;

    @PostMapping("/start")
    public ApiResponse<InterviewSessionDto> startSession(@RequestBody @Valid StartInterviewRequest request) {
        return ApiResponse.success(interviewService.startSession(request));
    }

    @PostMapping("/{sessionId}/answer")
    public SseEmitter submitAnswer(
            @PathVariable String sessionId,
            @RequestBody @Valid AnswerRequest request) {
        return interviewService.streamNextQuestion(sessionId, request);
    }
}
```

### Step 3: 실시간 스트리밍(SSE) 및 상태 관리 연동
면접관 AI의 응답이 실시간으로 타이핑되듯 보여주기 위해 Server-Sent Events(SSE) 스트리밍을 구현했습니다.

```typescript
// React Custom Hook for SSE Streaming
export const useInterviewStream = (sessionId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const sendAnswer = async (answer: string) => {
    setIsStreaming(true);
    const eventSource = new EventSource(`/api/v1/interviews/${sessionId}/stream?answer=${encodeURIComponent(answer)}`);
    
    eventSource.onmessage = (event) => {
      setMessages((prev) => updateLastMessage(prev, event.data));
    };

    eventSource.onerror = () => {
      eventSource.close();
      setIsStreaming(false);
    };
  };

  return { messages, sendAnswer, isStreaming };
};
```

---

## 4. 직면했던 문제와 해결 경험

1. **LLM 응답 지연(Latency) 문제**:
   - 질문 생성이 완료될 때까지 사용자가 멈춘 화면을 보는 대신, SSE 스트리밍을 도입하여 첫 토큰 응답 속도(TTFT)를 0.5초 이내로 체감 단축시켰습니다.
2. **면접 세션 데이터 영속화**:
   - 진행 중인 면접 문맥(Context Window)을 관리하기 위해 Redis TTL 세션 저장소를 구성하여 서버 무상태성(Stateless)을 유지했습니다.

---

## 5. 배운 점 및 인사이트

- **AI는 사수가 아니라 유능한 페어 프로그래머**: 명확한 아키텍처 규칙과 검증 테스트를 제시할 때 AI의 생산성이 300% 이상 증폭됩니다.
- **반복 업무 자동화의 즐거움**: DTO 변환, CRUD 보일러플레이트, 목업 데이터 생성 등을 AI에게 위임하고, 개발자는 핵심 도메인 로직과 비즈니스 가치에 집중할 수 있었습니다.
