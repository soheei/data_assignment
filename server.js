// ============================================================
// 데이터 통신 과제 - 회원가입 서비스 백엔드
// Node.js + Express + JSON File DB + bcryptjs
//
// ※ 네이티브 빌드가 필요 없는 순수 JavaScript 의존성만 사용하여
//   어떤 PC에서도 `npm install` 후 바로 구동되도록 구성하였습니다.
// ============================================================

const express = require('express');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const SALT_ROUNDS = 10;                              // bcrypt 해시 강도
const DB_PATH = path.join(__dirname, 'users.json');  // DB 파일 경로

// ----------------------------------------
// 미들웨어 설정
// ----------------------------------------
app.use(express.json());                                  // JSON body 파싱
app.use(express.static(path.join(__dirname, 'public')));  // 정적 파일 제공

// ============================================================
// JSON 파일 기반 DB 모듈
// 과제 지문의 "SELECT 후 존재 여부 확인" 방식으로 중복 방지 구현
// ============================================================
const DB = {
  // 파일에서 사용자 목록 읽기
  loadUsers() {
    if (!fs.existsSync(DB_PATH)) return [];
    try {
      const raw = fs.readFileSync(DB_PATH, 'utf8');
      return JSON.parse(raw);
    } catch (err) {
      console.error('DB 읽기 오류:', err);
      return [];
    }
  },
  // 파일에 사용자 목록 저장
  saveUsers(users) {
    fs.writeFileSync(DB_PATH, JSON.stringify(users, null, 2), 'utf8');
  },
  // 특정 필드값으로 사용자 조회 (SELECT WHERE field = value 와 동일)
  findByField(field, value) {
    return this.loadUsers().find(u => u[field] === value);
  },
  // 새 사용자 추가 (INSERT)
  insertUser(user) {
    const users = this.loadUsers();
    const newUser = {
      id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
      ...user,
      created_at: new Date().toISOString()
    };
    users.push(newUser);
    this.saveUsers(users);
    return newUser;
  }
};

// ----------------------------------------
// 서버 측 유효성 검사 패턴
// (프론트에서도 검사하지만, 보안상 백엔드에서도 반드시 재검사)
// ----------------------------------------
const PATTERNS = {
  username: /^[a-zA-Z0-9]{4,20}$/,                              // 영문/숫자 4~20자
  password: /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/, // 영문+숫자+특수문자 8자 이상
  email:    /^[^\s@]+@[^\s@]+\.[^\s@]+$/,                       // 표준 이메일 형식
  name:     /^[가-힣a-zA-Z]{2,20}$/                              // 한글/영문 2~20자
};

// ============================================================
// API: 회원가입
// POST /api/signup
// body: { username, password, email, name }
// ============================================================
app.post('/api/signup', async (req, res) => {
  try {
    const { username, password, email, name } = req.body;

    // 1) 필수 입력 확인
    if (!username || !password || !email || !name) {
      return res.status(400).json({ success: false, message: '모든 항목을 입력해주세요.' });
    }

    // 2) 서버 측 유효성 검사 (라 항목)
    if (!PATTERNS.username.test(username)) {
      return res.status(400).json({ success: false, message: '아이디는 영문/숫자 4~20자여야 합니다.' });
    }
    if (!PATTERNS.password.test(password)) {
      return res.status(400).json({ success: false, message: '비밀번호는 영문+숫자+특수문자 포함 8자 이상이어야 합니다.' });
    }
    if (!PATTERNS.email.test(email)) {
      return res.status(400).json({ success: false, message: '올바른 이메일 형식이 아닙니다.' });
    }
    if (!PATTERNS.name.test(name)) {
      return res.status(400).json({ success: false, message: '이름은 한글 또는 영문 2~20자여야 합니다.' });
    }

    // 3) 중복 확인 (바 항목)
    if (DB.findByField('username', username)) {
      return res.status(409).json({ success: false, message: '이미 사용 중인 아이디입니다.' });
    }
    if (DB.findByField('email', email)) {
      return res.status(409).json({ success: false, message: '이미 사용 중인 이메일입니다.' });
    }

    // 4) 비밀번호 암호화 - bcrypt 해시 (마 항목)
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // 5) DB 저장
    DB.insertUser({
      username,
      email,
      name,
      password: hashedPassword
    });

    return res.status(201).json({ success: true, message: '회원가입이 완료되었습니다.' });

  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
  }
});

// ============================================================
// API: 중복 확인 (실시간 체크용)
// GET /api/check?field=username&value=hong123
// ============================================================
app.get('/api/check', (req, res) => {
  const { field, value } = req.query;
  if (!['username', 'email'].includes(field) || !value) {
    return res.status(400).json({ available: false });
  }
  const user = DB.findByField(field, value);
  return res.json({ available: !user });
});

// ============================================================
// API: 로그인 (회원가입 검증용)
// POST /api/login
// body: { username, password }
// ============================================================
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: '아이디와 비밀번호를 입력해주세요.' });
    }

    const user = DB.findByField('username', username);
    if (!user) {
      return res.status(401).json({ success: false, message: '아이디 또는 비밀번호가 일치하지 않습니다.' });
    }

    // bcrypt.compare 로 평문과 해시 비교
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: '아이디 또는 비밀번호가 일치하지 않습니다.' });
    }

    return res.json({ success: true, message: `환영합니다, ${user.name}님!` });

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
  }
});

// ----------------------------------------
// 루트 접속 시 로그인 페이지로
// ----------------------------------------
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// ----------------------------------------
// 서버 시작
// ----------------------------------------
app.listen(PORT, () => {
  console.log('============================================');
  console.log(`✅ 서버 실행 중: http://localhost:${PORT}`);
  console.log('   브라우저에서 위 주소로 접속하세요.');
  console.log('   종료: Ctrl + C');
  console.log('============================================');
});
