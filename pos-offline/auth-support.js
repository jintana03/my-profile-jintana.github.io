(function () {
  const AUTH_KEY = 'pos_auth_v1';
  const SESSION_KEY = 'pos_session_v1';
  const form = document.querySelector('#authForm');
  const gate = document.querySelector('#authGate');
  if (!form || !gate) return;

  const usernameInput = document.querySelector('#authUsername');
  const passwordInput = document.querySelector('#authPassword');
  const confirmInput = document.querySelector('#authConfirmPassword');
  const confirmField = document.querySelector('#authConfirmField');
  const eyebrow = document.querySelector('#authEyebrow');
  const title = document.querySelector('#authTitle');
  const description = document.querySelector('#authDescription');
  const submit = document.querySelector('#authSubmit');
  const message = document.querySelector('#authMessage');

  function readAuth() {
    try { return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null'); } catch (_) { return null; }
  }

  function simpleHash(value) {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return `fallback-${(hash >>> 0).toString(16)}`;
  }

  async function hashPassword(value) {
    if (!window.crypto?.subtle) return simpleHash(value);
    const data = new TextEncoder().encode(value);
    const buffer = await window.crypto.subtle.digest('SHA-256', data);
    return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  function setAuthenticated() {
    document.body.classList.add('pos-authenticated');
    gate.setAttribute('aria-hidden', 'true');
  }

  function setMessage(text, type = 'error') {
    message.textContent = text;
    message.className = `auth-message ${type}`;
  }

  function configureMode() {
    const hasAccount = Boolean(readAuth());
    confirmField.hidden = hasAccount;
    confirmInput.required = !hasAccount;
    eyebrow.textContent = hasAccount ? 'เข้าสู่ระบบ' : 'เริ่มต้นใช้งาน';
    title.textContent = hasAccount ? 'เข้าสู่ระบบ POS' : 'สร้างบัญชีผู้ดูแล';
    description.textContent = hasAccount
      ? 'กรุณาเข้าสู่ระบบเพื่อใช้งานระบบขายสินค้า'
      : 'สร้างชื่อผู้ใช้และรหัสผ่านสำหรับเครื่องนี้ก่อนเริ่มใช้งาน';
    submit.textContent = hasAccount ? 'เข้าสู่ระบบ' : 'สร้างบัญชีและเข้าสู่ระบบ';
    usernameInput.autocomplete = hasAccount ? 'username' : 'new-username';
    passwordInput.autocomplete = hasAccount ? 'current-password' : 'new-password';
  }

  if (sessionStorage.getItem(SESSION_KEY) === '1' && readAuth()) setAuthenticated();
  configureMode();

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    setMessage('');
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    const existing = readAuth();
    if (username.length < 3 || password.length < 4) {
      setMessage('ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร และรหัสผ่านอย่างน้อย 4 ตัวอักษร');
      return;
    }
    if (!existing && password !== confirmInput.value) {
      setMessage('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    submit.disabled = true;
    try {
      const passwordHash = await hashPassword(password);
      if (!existing) {
        localStorage.setItem(AUTH_KEY, JSON.stringify({ username, passwordHash }));
      } else if (existing.username !== username || existing.passwordHash !== passwordHash) {
        setMessage('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
        return;
      }
      sessionStorage.setItem(SESSION_KEY, '1');
      setAuthenticated();
      form.reset();
    } finally {
      submit.disabled = false;
    }
  });

  document.querySelector('#logoutBtn')?.addEventListener('click', () => {
    sessionStorage.removeItem(SESSION_KEY);
    window.location.reload();
  });
})();
