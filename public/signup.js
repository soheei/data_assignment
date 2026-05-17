// ============================================================
// 회원가입 페이지 스크립트
// - 정규표현식 기반 실시간 유효성 검사 (라 항목)
// - 백엔드 중복 확인
// - fetch API로 회원가입 요청
// ============================================================

// 정규표현식 패턴 (백엔드와 동일)
const PATTERNS = {
  username: /^[a-zA-Z0-9]{4,20}$/,
  password: /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/,
  email:    /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  name:     /^[가-힣a-zA-Z]{2,20}$/
};

const HINTS = {
  username: {
    default: '영문 또는 숫자, 4~20자',
    error:   '영문/숫자만 사용 가능, 4~20자',
    success: '✓ 사용 가능한 형식'
  },
  password: {
    default: '영문, 숫자, 특수문자(!@#$%^&*) 포함 8자 이상',
    error:   '영문 + 숫자 + 특수문자(!@#$%^&*) 포함 8자 이상',
    success: '✓ 안전한 비밀번호'
  },
  passwordConfirm: {
    default: '위 비밀번호와 동일하게 입력하세요',
    error:   '비밀번호가 일치하지 않습니다',
    success: '✓ 비밀번호 일치'
  },
  email: {
    default: '올바른 이메일 형식으로 입력하세요',
    error:   '올바른 이메일 형식이 아닙니다',
    success: '✓ 올바른 형식'
  },
  name: {
    default: '한글 또는 영문 2~20자',
    error:   '한글 또는 영문, 2~20자',
    success: '✓ 사용 가능한 이름'
  }
};

// 검증 상태 저장
const validState = {
  username: false,
  password: false,
  passwordConfirm: false,
  email: false,
  name: false
};

// ----------------------------------------
// 입력 필드 검증 함수
// ----------------------------------------
function validateField(fieldName) {
  const input = document.getElementById(fieldName);
  const hint = document.getElementById(`hint-${fieldName}`);
  const value = input.value.trim();

  // 빈 값
  if (!value) {
    input.classList.remove('valid', 'invalid');
    hint.className = 'hint';
    hint.textContent = HINTS[fieldName].default;
    validState[fieldName] = false;
    return;
  }

  let isValid;
  if (fieldName === 'passwordConfirm') {
    // 비밀번호 확인은 위 비밀번호와 일치하는지 비교
    isValid = value === document.getElementById('password').value && value.length > 0;
  } else {
    isValid = PATTERNS[fieldName].test(value);
  }

  if (isValid) {
    input.classList.remove('invalid');
    input.classList.add('valid');
    hint.className = 'hint success';
    hint.textContent = HINTS[fieldName].success;
    validState[fieldName] = true;
  } else {
    input.classList.remove('valid');
    input.classList.add('invalid');
    hint.className = 'hint error';
    hint.textContent = HINTS[fieldName].error;
    validState[fieldName] = false;
  }
}

// ----------------------------------------
// 중복 확인 (서버 호출)
// ----------------------------------------
async function checkDuplicate(field) {
  const input = document.getElementById(field);
  const hint = document.getElementById(`hint-${field}`);
  const value = input.value.trim();

  if (!validState[field]) return; // 형식이 맞을 때만 중복 검사

  try {
    const res = await fetch(`/api/check?field=${field}&value=${encodeURIComponent(value)}`);
    const data = await res.json();

    if (!data.available) {
      input.classList.remove('valid');
      input.classList.add('invalid');
      hint.className = 'hint error';
      hint.textContent = field === 'username'
        ? '이미 사용 중인 아이디입니다'
        : '이미 사용 중인 이메일입니다';
      validState[field] = false;
    }
  } catch (err) {
    // 네트워크 오류는 무시 (제출 시 서버에서 다시 확인됨)
  }
}

// ----------------------------------------
// 이벤트 리스너 등록
// ----------------------------------------
['username', 'password', 'passwordConfirm', 'email', 'name'].forEach(field => {
  const input = document.getElementById(field);
  // 입력할 때마다 형식 검사
  input.addEventListener('input', () => {
    validateField(field);
    // 비밀번호가 변경되면 비밀번호 확인도 다시 검사
    if (field === 'password' && document.getElementById('passwordConfirm').value) {
      validateField('passwordConfirm');
    }
  });
});

// 아이디/이메일은 포커스를 벗어날 때 중복 확인
document.getElementById('username').addEventListener('blur', () => checkDuplicate('username'));
document.getElementById('email').addEventListener('blur', () => checkDuplicate('email'));

// 뒤로가기
document.getElementById('backBtn').addEventListener('click', () => {
  window.location.href = 'login.html';
});

// ----------------------------------------
// 회원가입 폼 제출
// ----------------------------------------
const signupForm = document.getElementById('signupForm');
const messageBox = document.getElementById('message');
const submitBtn = signupForm.querySelector('button[type="submit"]');

signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  // 모든 필드 다시 검증
  ['username', 'password', 'passwordConfirm', 'email', 'name'].forEach(validateField);

  // 검증 실패 항목 확인
  const allValid = Object.values(validState).every(v => v === true);
  if (!allValid) {
    showMessage('입력 정보를 다시 확인해주세요.', 'error');
    return;
  }

  // 백엔드로 회원가입 요청
  submitBtn.disabled = true;
  submitBtn.textContent = '처리 중...';

  try {
    const payload = {
      username: document.getElementById('username').value.trim(),
      password: document.getElementById('password').value,
      email:    document.getElementById('email').value.trim(),
      name:     document.getElementById('name').value.trim()
    };

    const res = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (data.success) {
      showMessage('회원가입 완료! 로그인 페이지로 이동합니다...', 'success');
      // 1.5초 후 로그인 페이지로 이동 (나 항목)
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1500);
    } else {
      showMessage(data.message, 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = '가입하기';
    }
  } catch (err) {
    showMessage('서버에 연결할 수 없습니다.', 'error');
    submitBtn.disabled = false;
    submitBtn.textContent = '가입하기';
  }
});

function showMessage(text, type) {
  messageBox.textContent = text;
  messageBox.className = `message show ${type}`;
}
