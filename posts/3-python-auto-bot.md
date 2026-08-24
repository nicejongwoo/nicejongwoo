# [Automation] Python & API 기반 소셜 미디어 자동화 봇 및 파이프라인 설계

> **작성일**: 2026-08-22  
> **카테고리**: Automation / Python  
> **관련 프로젝트**: [github.com/nicejongwoo/thread-coupon-bot](https://github.com/nicejongwoo/thread-coupon-bot) & [coupon-partners-auto-app](https://github.com/nicejongwoo/coupon-partners-auto-app)  
> **태그**: `Python`, `Automation`, `Bot`, `Threads API`, `Scheduler`, `Data Pipeline`

---

## 1. 개요: 수작업 없는 자동화 파이프라인 구축

개발자로서 매일 반복되는 정보 수집 및 콘텐츠 게시 작업을 수동으로 처리하는 것은 매우 비효율적입니다.

이 프로젝트는 **다양한 소스(이커머스 프로모션, 쿠폰 혜택, 테크 뉴스 등)에서 데이터를 수집·가공하여 템플릿 기반 콘텐츠로 변환하고, SNS 플랫폼(Threads / Instagram 등)의 Graph API를 통해 정해진 스케줄마다 자동으로 발행하는 봇 파이프라인**을 구축한 실전 기록입니다.

---

## 2. 데이터 파이프라인 아키텍처

```text
[ Data Sources ]
  ├── RSS Feeds & API Crawlers
  └── Partner Affiliate Feeds
          │
          ▼
[ Pipeline Core (Python) ]
  ├── 1. Data Extractor & Normalizer (데이터 정제)
  ├── 2. Duplicate Checker (SQLite / Hash Store 중복 방지)
  ├── 3. Content Generator (Jinja2 Template / AI 요약)
  └── 4. Rate Limiter & Token Refresher (API 토큰 갱신)
          │
          ▼
[ SNS API Dispatcher ] ────▶ [ Threads / Social Graph API ]
```

---

## 3. 핵심 구현 상세

### 1. 중복 발행 방지 (Deduplication Store)
이미 발행된 콘텐츠가 재발행되지 않도록 콘텐츠 고유 해시(Hash)를 로컬 SQLite/File DB에 기록하고 검증합니다.

```python
import hashlib
import sqlite3

class DedupManager:
    def __init__(self, db_path="history.db"):
        self.conn = sqlite3.connect(db_path)
        self.create_table()

    def create_table(self):
        with self.conn:
            self.conn.execute("""
                CREATE TABLE IF NOT EXISTS posted_history (
                    content_hash TEXT PRIMARY KEY,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

    def is_already_posted(self, text: str) -> bool:
        content_hash = hashlib.sha256(text.strip().encode('utf-8')).hexdigest()
        cursor = self.conn.cursor()
        cursor.execute("SELECT 1 FROM posted_history WHERE content_hash = ?", (content_hash,))
        return cursor.fetchone() is not None

    def record_posted(self, text: str):
        content_hash = hashlib.sha256(text.strip().encode('utf-8')).hexdigest()
        with self.conn:
            self.conn.execute("INSERT OR IGNORE INTO posted_history (content_hash) VALUES (?)", (content_hash,))
```

### 2. Threads Graph API 연동 및 2단계 게시 (Publishing)
Threads API는 미디어/텍스트 컨테이너 생성 후, 해당 컨테이너 ID를 기반으로 최종 발행(Publish)하는 2-Step 프로세스를 요구합니다.

```python
import requests
import time

class ThreadsClient:
    def __init__(self, user_id: str, access_token: str):
        self.user_id = user_id
        self.access_token = access_token
        self.base_url = "https://graph.threads.net/v1.0"

    def post_text(self, text: str) -> bool:
        # Step 1: Create Container
        container_url = f"{self.base_url}/{self.user_id}/threads"
        payload = {
            "media_type": "TEXT",
            "text": text,
            "access_token": self.access_token
        }
        res = requests.post(container_url, data=payload)
        res.raise_for_status()
        creation_id = res.json().get("id")

        time.sleep(3) # 컨테이너 준비 대기

        # Step 2: Publish Container
        publish_url = f"{self.base_url}/{self.user_id}/threads_publish"
        pub_payload = {
            "creation_id": creation_id,
            "access_token": self.access_token
        }
        pub_res = requests.post(publish_url, data=pub_payload)
        pub_res.raise_for_status()
        return pub_res.json().get("id") is not None
```

### 3. 무중단 스케줄링 (GitHub Actions / Crontab)
서버 유지비 없이 가볍게 실행하기 위해 **GitHub Actions Scheduled Workflow**를 활용했습니다.

```yaml
name: Scheduled Auto Poster Bot

on:
  schedule:
    - cron: '0 0,6,12 * * *' # 매일 9시, 15시, 21시 KST 실행
  workflow_dispatch:

jobs:
  run-bot:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: pip install -r requirements.txt
      - name: Execute Bot Script
        env:
          THREADS_ACCESS_TOKEN: ${{ secrets.THREADS_ACCESS_TOKEN }}
          THREADS_USER_ID: ${{ secrets.THREADS_USER_ID }}
        run: python main.py
```

---

## 4. 장애 방어 및 운영 노하우

- **Rate Limit 및 Exponential Backoff**: API 호출 제한에 도달할 경우 지수 백오프(Exponential Backoff)를 적용하여 일시적 429 에러를 방어했습니다.
- **장기 토큰 자동 갱신**: 만료 기간(60일)이 있는 Graph API 토큰을 만료 7일 전 자동으로 Refresh하는 로직을 내장하여 무중단 운영을 실현했습니다.

---

## 5. 성과 및 정리

- **완전 무인 자동화**: 사람이 직접 수집·게시할 때 소요되던 일일 30~40분의 반복 작업을 0분으로 단축.
- **안정적인 24/7 파이프라인**: 예외 처리 및 중복 방지 로직 덕분에 데이터 누락이나 중복 게시 사고 없이 수개월간 무장애 운영을 이어가고 있습니다.
