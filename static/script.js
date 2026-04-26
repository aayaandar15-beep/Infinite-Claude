// INFINITE — script.js

let currentUser = null;
let currentMode = 'basic';
let chatHistory = [];
let fpAttempts = 0;
const MAX_FP = 5;

// ─── CANVAS ANIMATION ───

const canvas = document.getElementById('infinite-canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

class Particle {
    constructor() { this.init(); }
    init() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.r = Math.random() * 1.8 + 0.3;
        this.vx = (Math.random() - 0.5) * 0.25;
        this.vy = (Math.random() - 0.5) * 0.25;
        this.phase = Math.random() * Math.PI * 2;
        this.col = Math.random() > 0.5 ? '124,111,255' : '184,169,255';
        this.a = 0.3;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.phase += 0.018;
        this.a = 0.15 + Math.abs(Math.sin(this.phase)) * 0.5;
        if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) this.init();
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.col},${this.a})`;
        ctx.fill();
    }
}

class InfSign {
    constructor() { this.init(); }
    init() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.sz = Math.random() * 28 + 12;
        this.a = 0;
        this.target = Math.random() * 0.07 + 0.02;
        this.rot = Math.random() * Math.PI * 2;
        this.rotv = (Math.random() - 0.5) * 0.004;
        this.life = 0;
        this.max = Math.random() * 280 + 180;
        this.fadein = true;
    }
    update() {
        this.life++;
        this.rot += this.rotv;
        if (this.fadein) { this.a += 0.001; if (this.a >= this.target) this.fadein = false; }
        else { this.a -= 0.0004; }
        if (this.life > this.max || this.a <= 0) this.init();
    }
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rot);
        ctx.font = `${this.sz}px Inter`;
        ctx.fillStyle = `rgba(124,111,255,${this.a})`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('∞', 0, 0);
        ctx.restore();
    }
}

function drawLines(pts) {
    for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
            const dx = pts[i].x - pts[j].x;
            const dy = pts[i].y - pts[j].y;
            const d = Math.sqrt(dx*dx + dy*dy);
            if (d < 110) {
                ctx.beginPath();
                ctx.moveTo(pts[i].x, pts[i].y);
                ctx.lineTo(pts[j].x, pts[j].y);
                ctx.strokeStyle = `rgba(124,111,255,${0.05*(1-d/110)})`;
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }
        }
    }
}

function drawNebula() {
    const t = Date.now() * 0.0003;
    [
        { x:0.15, y:0.2, r:280, c:'124,111,255', a:0.04 },
        { x:0.85, y:0.8, r:240, c:'184,169,255', a:0.03 },
        { x:0.5, y:0.5, r:180, c:'79,195,247', a:0.018 }
    ].forEach((o,i) => {
        const p = Math.sin(t + i*2)*0.5 + 0.5;
        const g = ctx.createRadialGradient(o.x*canvas.width, o.y*canvas.height, 0, o.x*canvas.width, o.y*canvas.height, o.r+p*40);
        g.addColorStop(0, `rgba(${o.c},${o.a+p*0.018})`);
        g.addColorStop(1, `rgba(${o.c},0)`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    });
}

const particles = Array.from({length:110}, () => new Particle());
const signs = Array.from({length:6}, () => { const s=new InfSign(); s.life=Math.random()*s.max; return s; });

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawNebula();
    drawLines(particles);
    particles.forEach(p => { p.update(); p.draw(); });
    signs.forEach(s => { s.update(); s.draw(); });
    requestAnimationFrame(animate);
}
animate();

// ─── AUTH ───

function showSignup() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('signup-form').style.display = 'block';
}

function showLogin() {
    document.getElementById('signup-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
}

function showSignupStep2() {
    const n = document.getElementById('signup-name').value.trim();
    const e = document.getElementById('signup-email').value.trim();
    const p = document.getElementById('signup-password').value.trim();
    if (!n || !e || !p) { alert('Please fill in all fields'); return; }
    document.getElementById('signup-step-1').style.display = 'none';
    document.getElementById('signup-step-2').style.display = 'block';
}

function showSignupStep1() {
    document.getElementById('signup-step-2').style.display = 'none';
    document.getElementById('signup-step-1').style.display = 'block';
}

async function handleSignup() {
    const full_name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value.trim();
    const school = document.getElementById('signup-school').value.trim();
    const curriculum = document.getElementById('signup-curriculum').value;
    const grade = document.getElementById('signup-grade').value;
    const err = document.getElementById('signup-error');

    if (!school || !curriculum || !grade) { err.textContent = 'Please fill in all fields'; return; }

    const res = await fetch('/register', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({full_name, email, password, school, curriculum, grade})
    });
    const data = await res.json();

    if (data.status === 'success') {
        err.style.color = 'var(--success)';
        err.textContent = 'Account created! Signing you in...';
        setTimeout(() => loginWith(email, password), 900);
    } else {
        err.style.color = 'var(--danger)';
        err.textContent = data.message;
    }
}

async function handleLogin() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value.trim();
    if (!email || !password) {
        document.getElementById('login-error').textContent = 'Please fill in all fields';
        return;
    }
    await loginWith(email, password);
}

async function loginWith(email, password) {
    const err = document.getElementById('login-error');
    try {
        const res = await fetch('/login_user', {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({email, password})
        });
        const data = await res.json();
        if (data.status === 'success') {
            currentUser = data.user;
            localStorage.setItem('infinite_user', JSON.stringify(currentUser));
            launchApp();
        } else {
            if (err) err.textContent = data.message || 'Login failed';
        }
    } catch(e) {
        if (err) err.textContent = 'Connection error. Is the server running?';
    }
}

function launchApp() {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('app-screen').style.display = 'flex';
    const first = currentUser.full_name.split(' ')[0];
    document.getElementById('user-greeting').textContent = `Hey, ${first}!`;
    document.getElementById('sidebar-username').textContent = currentUser.full_name;
    document.getElementById('sidebar-school').textContent = currentUser.school || 'Student';
    document.getElementById('user-avatar').textContent = currentUser.full_name.charAt(0).toUpperCase();
    document.getElementById('welcome-title').textContent = `Welcome back, ${first}!`;
    document.getElementById('welcome-sub').textContent = 'Your AI companion is ready. What shall we work on today?';
}

async function handleLogout() {
    try { await fetch('/logout', {method:'POST'}); } catch(e) {}
    localStorage.removeItem('infinite_user');
    currentUser = null;
    chatHistory = [];
    currentMode = 'basic';
    document.getElementById('app-screen').style.display = 'none';
    document.getElementById('auth-screen').style.display = 'flex';
    document.getElementById('login-email').value = '';
    document.getElementById('login-password').value = '';
    document.getElementById('login-error').textContent = '';
    showLogin();
}

// ─── MODE SELECTOR ───

const modes = {
    basic:      { icon:'☀️', label:'Basic',        welcome:'Ask me anything about your day, life decisions, general knowledge — I am here for everything.' },
    school:     { icon:'🎓', label:'School',       welcome:"Let's ace your studies! Homework, tests, exam prediction — I've got you completely covered." },
    university: { icon:'🏛️', label:'University',   welcome:'University level assistance. Thesis, research, complex problems — let\'s go deep.' },
    coding:     { icon:'💻', label:'Coding & Web', welcome:"Let's build something amazing. Tell me what you want to create and I'll build it with you." },
    applaunch:  { icon:'🚀', label:'App Launch',   welcome:"Ready to launch? Tell me your app idea and I'll help you build, brand and ship it to the world." },
    fullpower:  { icon:'⚡', label:'Full Power',   welcome:'Full Power activated. No limits. No hedging. I will give you my absolute best on everything.' }
};

function toggleDropdown() {
    const dd = document.getElementById('mode-dropdown');
    const ch = document.getElementById('mode-chevron');
    const open = dd.classList.contains('open');
    dd.classList.toggle('open', !open);
    ch.classList.toggle('spin', !open);
}

function closeDropdown() {
    document.getElementById('mode-dropdown').classList.remove('open');
    document.getElementById('mode-chevron').classList.remove('spin');
}

function selectMode(mode) {
    closeDropdown();
    if (mode === 'fullpower') { showFPModal(); return; }
    applyMode(mode);
}

function applyMode(mode) {
    currentMode = mode;
    chatHistory = [];

    document.getElementById('mode-icon').textContent = modes[mode].icon;
    document.getElementById('mode-label').textContent = modes[mode].label;
    document.querySelectorAll('.mode-option').forEach(el => {
        el.classList.toggle('selected', el.dataset.mode === mode);
    });

    const isFP = mode === 'fullpower';
    const iconStyle = isFP ? 'background:linear-gradient(135deg,#f59e0b,#ef4444);' : '';
    const h2Style = isFP ? 'background:linear-gradient(135deg,#fbbf24,#f87171);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;' : '';

    document.getElementById('messages').innerHTML = `
        <div class="welcome-wrap" id="welcome-wrap">
            <div class="welcome-icon" style="${iconStyle}">${isFP ? '⚡' : '∞'}</div>
            <h2 style="${h2Style}">${modes[mode].label} Mode</h2>
            <p>${modes[mode].welcome}</p>
            <div class="quick-btns">${getQuickBtns(mode)}</div>
        </div>
    `;
}

function getQuickBtns(mode) {
    const q = {
        basic:      ['✨ Help me today','🤔 I need advice','📋 Plan my day','💡 Explain something'],
        school:     ['📚 Help with homework','📝 Create a test','🔮 Predict my exam','📖 Explain a topic'],
        university: ['🎓 Help with thesis','📑 Literature review','🔬 Research help','✍️ Essay feedback'],
        coding:     ['💻 Build a website','🐛 Debug my code','📱 Create an app','🧠 Explain a concept'],
        applaunch:  ['🚀 Launch my app','🎨 Brand my product','📣 Marketing strategy','💰 Monetization ideas'],
        fullpower:  ['⚡ Ask anything','🧠 Hard problem','💥 Full analysis','🔓 No limits']
    };
    return (q[mode]||q.basic).map(t=>`<button onclick="quickSend('${t}')">${t}</button>`).join('');
}

function newChat() {
    chatHistory = [];
    applyMode(currentMode);
}

// ─── FULL POWER ───

function showFPModal() {
    if (currentUser && currentUser.full_power_free) { applyMode('fullpower'); return; }
    fpAttempts = 0;
    document.getElementById('fp-input').value = '';
    document.getElementById('fp-input').disabled = false;
    document.getElementById('fp-error').textContent = '';
    document.getElementById('fp-attempts').textContent = '';
    document.getElementById('fp-btn').disabled = false;
    document.getElementById('fp-modal').style.display = 'flex';
}

async function verifyFP() {
    const pw = document.getElementById('fp-input').value;
    const errEl = document.getElementById('fp-error');
    const attEl = document.getElementById('fp-attempts');

    const res = await fetch('/verify_fullpower', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({password: pw, user_id: currentUser?.id})
    });
    const data = await res.json();

    if (data.status === 'success') {
        closeOverlay('fp-modal');
        applyMode('fullpower');
    } else {
        fpAttempts++;
        const left = MAX_FP - fpAttempts;
        if (left <= 0) {
            errEl.textContent = 'Too many attempts. Contact the admin for access.';
            document.getElementById('fp-input').disabled = true;
            document.getElementById('fp-btn').disabled = true;
        } else {
            errEl.textContent = 'Wrong password.';
            attEl.textContent = `${left} attempt${left!==1?'s':''} remaining`;
        }
    }
}

// ─── ADMIN ───

async function showAdmin() {
    const pw = prompt('🔐 Enter Admin Password:');
    if (pw === null) return;
    if (pw !== 'admingoat@1') { alert('❌ Wrong password. Access denied.'); return; }

    document.getElementById('admin-modal').style.display = 'flex';
    const list = document.getElementById('users-list');
    list.innerHTML = '<p class="muted-text">Loading accounts...</p>';

    const res = await fetch('/admin/users');
    const users = await res.json();

    if (!users.length) { list.innerHTML = '<p class="muted-text">No accounts found</p>'; return; }

    list.innerHTML = users.map(u => `
        <div class="user-row">
            <div class="user-row-info">
                <div class="user-row-name">${u.full_name}</div>
                <div class="user-row-email">${u.email} · ${u.curriculum} · ${u.grade}</div>
            </div>
            <button class="grant-btn ${u.full_power_free?'granted':''}"
                onclick="grantFP(${u.id},this)"
                ${u.full_power_free?'disabled':''}>
                ${u.full_power_free?'✓ Granted':'⚡ Grant'}
            </button>
        </div>
    `).join('');
}

async function grantFP(id, btn) {
    const res = await fetch('/admin/grant_fullpower', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({user_id: id})
    });
    const data = await res.json();
    if (data.status === 'success') {
        btn.textContent = '✓ Granted';
        btn.classList.add('granted');
        btn.disabled = true;
    }
}

async function deleteAll() {
    if (!confirm('⚠️ Delete ALL accounts? This cannot be undone!')) return;
    if (!confirm('Last chance — permanently delete every account?')) return;
    const res = await fetch('/admin/delete_all', {method:'POST'});
    const data = await res.json();
    if (data.status === 'success') {
        alert('All accounts deleted.');
        closeOverlay('admin-modal');
        handleLogout();
    }
}

function closeOverlay(id) { document.getElementById(id).style.display = 'none'; }

// ─── CHAT ───

function quickSend(text) {
    document.getElementById('user-input').value = text;
    sendMessage();
}

function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
}

function autoGrow(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 150) + 'px';
}

function addMsg(content, role) {
    const wrap = document.getElementById('welcome-wrap');
    if (wrap) wrap.remove();
    const msgs = document.getElementById('messages');
    const div = document.createElement('div');
    div.className = `msg ${role}`;
    const av = role === 'user' ? currentUser.full_name.charAt(0).toUpperCase() : '∞';
    div.innerHTML = `
        <div class="msg-avatar">${av}</div>
        <div class="msg-content">${fmt(content)}</div>
    `;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
}

function fmt(text) {
    text = text.replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
    text = text.replace(/`(.*?)`/g, '<code>$1</code>');
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    text = text.replace(/\n/g, '<br>');
    return text;
}

function showTyping() {
    const msgs = document.getElementById('messages');
    const div = document.createElement('div');
    div.className = 'typing';
    div.id = 'typing';
    div.innerHTML = `
        <div class="msg-avatar" style="width:32px;height:32px;border-radius:9px;background:var(--bg3);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-weight:700;color:var(--accent2);flex-shrink:0;font-size:13px;">∞</div>
        <div class="typing-dots"><span></span><span></span><span></span></div>
    `;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
}

function removeTyping() { const el = document.getElementById('typing'); if (el) el.remove(); }

async function sendMessage() {
    const input = document.getElementById('user-input');
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    input.style.height = 'auto';
    const btn = document.getElementById('send-btn');
    btn.disabled = true;
    addMsg(text, 'user');
    chatHistory.push({role:'user', content:text});
    showTyping();
    try {
        const res = await fetch('/chat', {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({
                message: text,
                history: chatHistory.slice(-20),
                mode: currentMode,
                user_data: currentUser
            })
        });
        const data = await res.json();
        removeTyping();
        addMsg(data.reply, 'ai');
        chatHistory.push({role:'assistant', content:data.reply});
    } catch(e) {
        removeTyping();
        addMsg('Connection issue. Please try again.', 'ai');
    }
    btn.disabled = false;
    input.focus();
}

function handleFile(input) {
    const file = input.files[0];
    if (!file) return;
    document.getElementById('user-input').value = `I uploaded a file: "${file.name}". Please help me with it.`;
}

// ─── INIT ───

// Auto login from saved session
const saved = localStorage.getItem('infinite_user');
if (saved) {
    try {
        currentUser = JSON.parse(saved);
        launchApp();
    } catch(e) {
        localStorage.removeItem('infinite_user');
    }
}

// Close dropdown on outside click
document.addEventListener('click', e => {
    if (!e.target.closest('.mode-selector-wrap')) closeDropdown();
});

// Enter shortcuts
document.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
        if (document.activeElement.id === 'login-password') handleLogin();
        if (document.activeElement.id === 'fp-input') verifyFP();
    }
});