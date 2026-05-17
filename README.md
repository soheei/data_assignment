# 데이터 통신 과제(1) - 회원가입 서비스

> Node.js + Express + bcryptjs 기반 회원가입/로그인 웹 서비스

---

## ✅ 채점 항목 충족 내역

| 항목 | 배점 | 구현 내용 |
|------|------|-----------|
| **가)** 프론트엔드 – 백엔드 구성 | - | `public/`(프론트) + `server.js`(백엔드 Express) |
| **나)** 회원가입 절차 구성 | 10점 | 로그인→회원가입 버튼→정보입력→완료→로그인 자동이동(1.5초) |
| **다)** 비밀번호 `*` 대체 표기 | 5점 | `<input type="password">` 마스킹 |
| **라)** 정보 3가지 이상 + 유효성 검사 | 15점 | 아이디/비밀번호/이메일/이름 4개 필드 + 정규표현식 실시간 검사 |
| **마)** 백엔드 암호화 저장 | 12점 | `bcrypt.hash(password, 10)` — users.json에 해시만 저장 |
| **바)** 중복 방지 처리 | 8점 | 아이디·이메일 중복 확인 (SELECT 후 존재 여부 확인 방식) |
| **합계** | **50점** | |

---

## 📦 로컬 구동 방법 (테스트 PC 제출용)

### 사전 요구사항
**Node.js v16 이상** 필요 → [https://nodejs.org](https://nodejs.org) LTS 다운로드

```bash
node -v   # v16 이상 확인
npm -v
```

### 실행 순서

```bash
# 1. 패키지 설치
npm install

# 2. 서버 실행
npm start
```

콘솔에 아래 메시지가 뜨면 정상:
```
============================================
✅ 서버 실행 중: http://localhost:3000
   브라우저에서 위 주소로 접속하세요.
   종료: Ctrl + C
============================================
```

### 접속
브라우저에서 → **http://localhost:3000**

> 의존성: `express`, `bcryptjs` — 순수 JS 패키지로 별도 빌드 도구 불필요

---

## 🌐 온라인 배포 (Render.com — 무료, GitHub 링크로 누구나 접속)

### 배포 순서

**① GitHub에 코드 푸시**
```bash
git add .
git commit -m "데이터통신 과제 회원가입 서비스"
git push origin main
```

**② [https://render.com](https://render.com) 접속 → GitHub 계정으로 로그인**

**③ New + → Web Service 클릭**
- 이 저장소 선택
- 설정값:

  | 항목 | 값 |
  |------|-----|
  | Name | `data-assignment` (자유) |
  | Runtime | `Node` |
  | Build Command | `npm install` |
  | Start Command | `node server.js` |
  | Instance Type | **Free** 선택 |

**④ "Create Web Service" 클릭 → 약 1~2분 후 배포 완료**

배포 완료 후 아래 형태의 **공개 URL** 발급:
```
https://data-assignment-xxxx.onrender.com
```

> ⚠️ **무료 플랜 주의사항**
> - 15분 이상 접속 없으면 슬립(sleep) 상태 전환 → 첫 접속 시 약 30~60초 로딩
> - 재배포 시 `users.json` 초기화됨 (과제 데모용으로는 문제없음)

---

## 🧭 사용자 흐름

```
[로그인 페이지]
    │
    └─ "회원가입" 버튼 클릭
            │
    [회원가입 페이지]
    (아이디/비밀번호/이메일/이름 입력 + 실시간 유효성 검사)
            │
    "가입하기" 제출 → 백엔드 검증 + bcrypt 암호화 저장
            │
    ✅ 성공 → 1.5초 후 [로그인 페이지] 자동 이동
```

---

## 🗂️ 프로젝트 구조

```
data_assignment/
├── server.js          # Express 백엔드 (API 라우팅, DB, bcrypt 암호화)
├── package.json       # 의존성 (express, bcryptjs)
├── render.yaml        # Render.com 배포 설정
├── .gitignore         # node_modules / users.json 제외
├── README.md
└── public/            # 프론트엔드 정적 파일
    ├── login.html     # 로그인 페이지
    ├── login.js       # 로그인 스크립트 (fetch API)
    ├── signup.html    # 회원가입 페이지
    ├── signup.js      # 회원가입 스크립트 (유효성 검사 + fetch API)
    └── style.css      # 공통 스타일
```

> `users.json`은 서버 최초 실행 시 자동 생성되며 Git에는 포함되지 않습니다.

---

## 🔐 유효성 검사 규칙

| 필드 | 규칙 | 정규표현식 |
|------|------|-----------|
| 아이디 | 영문/숫자 4~20자 | `/^[a-zA-Z0-9]{4,20}$/` |
| 비밀번호 | 영문+숫자+특수문자 8자 이상 | `/^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/` |
| 이메일 | 표준 이메일 형식 | `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` |
| 이름 | 한글/영문 2~20자 | `/^[가-힣a-zA-Z]{2,20}$/` |

프론트엔드(실시간 피드백) + 백엔드(보안 재검증) **이중 검사** 적용

---

## 🛡️ 주요 구현 설명

**비밀번호 암호화 (마 항목)**
```javascript
// 저장 시 — bcrypt 단방향 해시
const hashedPassword = await bcrypt.hash(password, 10);

// 로그인 시 — 해시 비교
const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
```
`users.json`에는 `$2a$10$...` 형태의 해시값만 저장, 평문 비밀번호는 어디에도 남지 않음

**중복 방지 (바 항목)**
- 회원가입 제출 시 백엔드에서 `username`, `email` 사전 조회 후 409 응답으로 차단
- 프론트엔드에서는 포커스 이탈(blur) 시 `/api/check` API 호출로 실시간 중복 확인

---

## 🧪 테스트 계정 예시

| 필드 | 값 |
|------|----|
| 아이디 | `hong123` |
| 비밀번호 | `Pass123!` |
| 이메일 | `hong@test.com` |
| 이름 | `홍길동` |

동일 정보로 재가입 시도 → 중복 방지 메시지 확인 가능

---

## ❓ 문제 해결

**`npm install` 오류** → Node.js v16 이상으로 업그레이드 후 재시도

**`EADDRINUSE: address already in use :::3000`** → 3000번 포트 사용 중. 다른 프로그램 종료하거나 `server.js`의 `PORT` 기본값 변경

**가입 데이터 초기화** → 프로젝트 폴더의 `users.json` 파일 삭제
