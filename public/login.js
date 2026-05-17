// ============================================================
// 로그인 페이지 스크립트
// ============================================================

// 회원가입 버튼 → 회원가입 페이지로 이동 (window.location.href 사용)
document.getElementById('signupBtn').addEventListener('click', () => {
  window.location.href = 'signup.html';
});

// 로그인 폼 제출 처리
const loginForm = document.getElementById('loginForm');
const messageBox = document.getElementById('message');

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault(); // 기본 제출 동작 막기

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  if (!username || !password) {
    showMessage('아이디와 비밀번호를 입력해주세요.', 'error');
    return;
  }

  try {
    // fetch API로 백엔드에 로그인 요청
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();

    if (data.success) {
      sessionStorage.setItem('userName', data.name || username);
      window.location.href = 'complete.html';
    } else {
      showMessage(data.message, 'error');
    }
  } catch (err) {
    showMessage('서버에 연결할 수 없습니다.', 'error');
  }
});

function showMessage(text, type) {
  messageBox.textContent = text;
  messageBox.className = `message show ${type}`;
}
