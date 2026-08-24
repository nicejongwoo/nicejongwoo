# [Dev-Env] Docker를 활용한 로컬 백엔드 개발 & 테스트 환경 셋팅 가이드

> **작성일**: 2026-08-24  
> **카테고리**: Dev-Env / Backend  
> **관련 프로젝트**: [github.com/nicejongwoo/dev-env](https://github.com/nicejongwoo/dev-env)  
> **태그**: `Docker`, `docker-compose`, `MySQL`, `Redis`, `Kafka`, `Spring Boot`

---

## 1. 개요: 왜 로컬 컨테이너 환경이 중요한가?

백엔드 개발 시 로컬 머신에 직접 MySQL, PostgreSQL, Redis, Kafka 등을 설치하다 보면 버전 충돌이 발생하거나 테스트 데이터가 꼬여 로컬 환경이 지저분해지기 쉽습니다. 

또한, **"내 컴퓨터에서는 잘 되는데 운영 서버에서는 왜 안 되지?"**라는 문제는 대부분 로컬 환경과 운영 환경의 인프라 형상 불일치에서 비롯됩니다.

이 글에서는 개인 프로젝트인 `dev-env` 레포지토리를 기반으로, **`docker-compose` 명령어 한 줄로 백엔드 개발에 필수적인 인프라를 1분 만에 구성하고, 테스트 후 깨끗하게 리셋하는 실전 셋팅 방법**을 정리합니다.

---

## 2. 전체 디렉토리 구조

```text
dev-env/
├── docker-compose.yml        # 전체 인프라 통합 실행 설정
├── .env.example              # 환경 변수 템플릿
├── Makefile                  # 간편 실행 단축 명령어
│
├── mysql/
│   ├── conf.d/custom.cnf    # UTF-8 및 timezone 설정
│   └── initdb.d/            # 컨테이너 최초 기동 시 자동 실행될 SQL 스크립트
│       └── 01-schema.sql
│
├── postgresql/
│   └── initdb.d/
│
└── redis/
    └── redis.conf
```

---

## 3. docker-compose.yml 핵심 구성

```yaml
version: '3.8'

services:
  # 1. MySQL 8.0
  mysql:
    image: mysql:8.0
    container_name: local-mysql
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: devdb
      MYSQL_USER: devuser
      MYSQL_PASSWORD: devpassword
      TZ: Asia/Seoul
    ports:
      - "3306:3306"
    volumes:
      - ./mysql/data:/var/lib/mysql
      - ./mysql/initdb.d:/docker-entrypoint-initdb.d
    command:
      - --character-set-server=utf8mb4
      - --collation-server=utf8mb4_unicode_ci
      - --default-time-zone=+09:00

  # 2. Redis 7
  redis:
    image: redis:7-alpine
    container_name: local-redis
    restart: always
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes

  # 3. Apache Kafka & Zookeeper
  zookeeper:
    image: confluentinc/cp-zookeeper:7.3.0
    container_name: local-zookeeper
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000

  kafka:
    image: confluentinc/cp-kafka:7.3.0
    container_name: local-kafka
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: 'zookeeper:2181'
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
```

---

## 4. Makefile을 통한 개발 생산성 극대화

긴 도커 명령어를 매번 입력할 필요 없이 `Makefile`을 통해 단축키처럼 사용합니다.

```makefile
.PHONY: up down restart logs clean

up:
	docker compose up -d

down:
	docker compose down

restart:
	docker compose down && docker compose up -d

logs:
	docker compose logs -f

clean:
	docker compose down -v
	rm -rf ./mysql/data
```

---

## 5. Spring Boot `application-local.yml` 연동

로컬 프로파일(`local`)에서 위 컨테이너들과 즉시 연결되도록 구성합니다.

```yaml
spring:
  config:
    activate:
      on-profile: local
  datasource:
    url: jdbc:mysql://localhost:3306/devdb?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Seoul
    username: devuser
    password: devpassword
    driver-class-name: com.mysql.cj.jdbc.Driver
  data:
    redis:
      host: localhost
      port: 6379
  kafka:
    bootstrap-servers: localhost:9092
```

---

## 6. 결론 및 기대 효과

1. **온보딩 및 환경 구축 1분 완결**: 새로운 팀원이나 새 PC에서도 `git clone && make up` 한 줄이면 모든 DB와 브로커가 즉시 실행됩니다.
2. **테스트 데이터 격리**: 언제든 `make clean`으로 깨끗한 초기 상태로 돌아갈 수 있어 테스트 신뢰도가 향상됩니다.
3. **인프라 종속성 제거**: 로컬 OS 환경에 구애받지 않고 일관된 개발 경험을 누릴 수 있습니다.
