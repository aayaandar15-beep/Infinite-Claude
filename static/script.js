// INFINITE — script.js

let currentUser = null;
let currentMode = 'basic';
let chatHistory = [];
let currentChatId = null;
let fpAttempts = 0;
const MAX_FP = 5;
let allChats = [];

// ══ CANVAS — INFINITE UNIVERSE ══

const canvas = document.getElementById('infinite-canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Particles
class Particle {
    constructor() { this.init(); }
    init() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.r = Math.random() * 1.6 + 0.3;
        this.vx = (Math.random() - 0.5) * 0.2;
        this.vy = (Math.random() - 0.5) * 0.2;
        this.phase = Math.random() * Math.PI * 2;
        this.col = ['124,111,255','184,169,255','79,195,247','167,139,250'][Math.floor(Math.random()*4)];
        this.a = 0.3;
    }
    update() {
        this.x += this.vx; this.y += this.vy; this.phase += 0.015;
        this.a = 0.1 + Math.abs(Math.sin(this.phase)) * 0.55;
        if (this.x<0||this.x>canvas.width||this.y<0||this.y>canvas.height) this.init();
    }
    draw() {
        ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI*2);
        ctx.fillStyle = `rgba(${this.col},${this.a})`; ctx.fill();
    }
}

// Floating infinity signs
class InfSign {
    constructor() { this.init(); }
    init() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.sz = Math.random() * 32 + 14;
        this.a = 0; this.target = Math.random() * 0.06 + 0.015;
        this.rot = Math.random() * Math.PI * 2;
        this.rotv = (Math.random() - 0.5) * 0.003;
        this.life = 0; this.max = Math.random() * 300 + 200;
        this.fadein = true;
    }
    update() {
        this.life++; this.rot += this.rotv;
        if (this.fadein) { this.a += 0.0008; if (this.a >= this.target) this.fadein = false; }
        else { this.a -= 0.0003; }
        if (this.life > this.max || this.a <= 0) this.init();
    }
    draw() {
        ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.rot);
        ctx.font = `${this.sz}px Inter`;
        ctx.fillStyle = `rgba(124,111,255,${this.a})`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('∞', 0, 0); ctx.restore();
    }
}

// Moving nebula orbs
function drawNebula() {
    const t = Date.now() * 0.00025;
    [
        {x:0.1,y:0.15,r:350,c:'100,80,255',a:0.05},
        {x:0.9,y:0.85,r:300,c:'180,100,255',a:0.04},
        {x:0.5,y:0.4,r:250,c:'40,180,255',a:0.025},
        {x:0.2,y:0.8,r:200,c:'124,111,255',a:0.03},
    ].forEach((o,i) => {
        const pulse = Math.sin(t + i * 1.8) * 0.5 + 0.5;
        const ox = o.x * canvas.width + Math.sin(t * 0.5 + i) * 60;
        const oy = o.y * canvas.height + Math.cos(t * 0.4 + i) * 40;
        const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, o.r + pulse * 60);
        g.addColorStop(0, `rgba(${o.c},${o.a + pulse * 0.02})`);
        g.addColorStop(1, `rgba(${o.c},0)`);
        ctx.fillStyle = g; ctx.fillRect(0, 0, canvas.width, canvas.height);
    });
}

// Connection lines between close particles
function drawLines(pts) {
    for (let i = 0; i < pts.length; i++) {
        for (let j = i+1; j < pts.length; j++) {
            const dx = pts[i].x-pts[j].x, dy = pts[i].y-pts[j].y;
            const d = Math.sqrt(dx*dx+dy*dy);
            if (d < 100) {
                ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y);
                ctx.strokeStyle = `rgba(124,111,255,${0.04*(1-d/100)})`; ctx.lineWidth=0.5; ctx.stroke();
            }
        }
    }
}

const particles = Array.from({length:130}, () => new Particle());
const signs = Array.from({length:7}, () => { const s=new InfSign(); s.life=Math.random()*s.max; return s; });

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawNebula();
    drawLines(particles);
    particles.forEach(p => { p.update(); p.draw(); });
    signs.forEach(s => { s.update(); s.draw(); });
    requestAnimationFrame(animate);
}
animate();

// ══ SIDEBAR MOBILE ══

function openSidebar() {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('sidebar-overlay').classList.add('show');
}

function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-overlay').classList.remove('show');
}

// ══ AUTH ══

function showSignup() { document.getElementById('login-form').style.display='none'; document.getElementById('signup-form').style.display='block'; }
function showLogin() { document.getElementById('signup-form').style.display='none'; document.getElementById('login-form').style.display='block'; }

function showSignupStep2() {
    if (!document.getElementById('signup-name').value.trim() || !document.getElementById('signup-email').value.trim() || !document.getElementById('signup-password').value.trim()) {
        alert('Please fill in all fields'); return;
    }
    document.getElementById('signup-step-1').style.display='none';
    document.getElementById('signup-step-2').style.display='block';
}

function showSignupStep1() {
    document.getElementById('signup-step-2').style.display='none';
    document.getElementById('signup-step-1').style.display='block';
}

async function handleSignup() {
    const full_name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value.trim();
    const school = document.getElementById('signup-school').value.trim();
    const curriculum = document.getElementById('signup-curriculum').value;
    const grade = document.getElementById('signup-grade').value;
    const err = document.getElementById('signup-error');
    if (!school||!curriculum||!grade) { err.textContent='Please fill in all fields'; return; }
    try {
        const res = await fetch('/register', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({full_name,email,password,school,curriculum,grade})});
        const data = await res.json();
        if (data.status==='success') { err.style.color='var(--success)'; err.textContent='Account created! Signing you in...'; setTimeout(()=>loginWith(email,password),900); }
        else { err.style.color='var(--danger)'; err.textContent=data.message; }
    } catch(e) { err.style.color='var(--danger)'; err.textContent='Connection error. Try again.'; }
}

async function handleLogin() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value.trim();
    if (!email||!password) { document.getElementById('login-error').textContent='Please fill in all fields'; return; }
    await loginWith(email, password);
}

async function loginWith(email, password) {
    const err = document.getElementById('login-error');
    try {
        const res = await fetch('/login_user', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});
        const data = await res.json();
        if (data.status==='success') {
            currentUser = data.user;
            localStorage.setItem('infinite_user', JSON.stringify(currentUser));
            launchApp();
        } else { if(err) err.textContent = data.message||'Login failed'; }
    } catch(e) { if(err) err.textContent='Connection error. Is the server running?'; }
}

function launchApp() {
    document.getElementById('auth-screen').style.display='none';
    document.getElementById('app-screen').style.display='flex';
    const first = currentUser.full_name.split(' ')[0];
    document.getElementById('sidebar-username').textContent = currentUser.full_name;
    document.getElementById('sidebar-school').textContent = currentUser.school||'Student';
    document.getElementById('user-avatar').textContent = currentUser.full_name.charAt(0).toUpperCase();
    document.getElementById('welcome-title').textContent = `Hey ${first}! 👋`;
    document.getElementById('welcome-sub').textContent = 'Your AI companion is ready. What shall we work on today?';
    loadChatHistory();
}

async function handleLogout() {
    try { await fetch('/logout',{method:'POST'}); } catch(e) {}
    localStorage.removeItem('infinite_user');
    currentUser=null; chatHistory=[]; currentChatId=null; currentMode='basic'; allChats=[];
    document.getElementById('app-screen').style.display='none';
    document.getElementById('auth-screen').style.display='flex';
    document.getElementById('login-email').value='';
    document.getElementById('login-password').value='';
    document.getElementById('login-error').textContent='';
    showLogin();
}

// ══ CHAT HISTORY ══

const modeIcons = {basic:'☀️',school:'🎓',university:'🏛️',coding:'💻',applaunch:'🚀',fullpower:'⚡'};

async function loadChatHistory() {
    if (!currentUser) return;
    try {
        const res = await fetch(`/get_chats/${currentUser.id}`);
        allChats = await res.json();
        renderChatList(allChats);
    } catch(e) {}
}

function renderChatList(chats) {
    const c = document.getElementById('chat-history');
    if (!chats.length) { c.innerHTML='<p class="empty-history">No chats yet.<br>Start a conversation!</p>'; return; }

    const today = new Date().toDateString();
    const yesterday = new Date(Date.now()-86400000).toDateString();
    const groups = {};

    chats.forEach(ch => {
        const d = new Date(ch.updated_at);
        const label = d.toDateString()===today ? 'Today' : d.toDateString()===yesterday ? 'Yesterday' : ch.updated_at;
        if (!groups[label]) groups[label]=[];
        groups[label].push(ch);
    });

    c.innerHTML = Object.entries(groups).map(([label, items]) => `
        <div class="group-label">${label}</div>
        ${items.map(ch => `
            <div class="chat-item ${ch.id===currentChatId?'active':''}" id="ci-${ch.id}" onclick="loadChat(${ch.id})">
                <span class="chat-icon">${modeIcons[ch.mode]||'💬'}</span>
                <div class="chat-item-body">
                    <div class="chat-item-title">${ch.title}</div>
                </div>
                <button class="chat-del-btn" onclick="delChat(event,${ch.id})"><i class="fas fa-trash"></i></button>
            </div>
        `).join('')}
    `).join('');
}

function searchChats(q) {
    renderChatList(allChats.filter(c => c.title.toLowerCase().includes(q.toLowerCase())));
}

async function loadChat(chatId) {
    const chat = allChats.find(c=>c.id===chatId);
    if (!chat) return;
    currentChatId=chatId; currentMode=chat.mode; chatHistory=chat.messages;
    document.getElementById('mode-icon').textContent=modeIcons[chat.mode]||'☀️';
    document.getElementById('mode-label').textContent=chat.mode.charAt(0).toUpperCase()+chat.mode.slice(1);
    document.querySelectorAll('.mode-option').forEach(el=>el.classList.toggle('selected',el.dataset.mode===chat.mode));
    document.querySelectorAll('.chat-item').forEach(el=>el.classList.remove('active'));
    const item=document.getElementById(`ci-${chatId}`);
    if (item) item.classList.add('active');
    const msgs=document.getElementById('messages');
    msgs.innerHTML='';
    chat.messages.forEach(m=>addMsgToUI(m.content,m.role==='user'?'user':'ai'));
    closeSidebar();
}

async function delChat(e, chatId) {
    e.stopPropagation();
    await fetch(`/delete_chat/${chatId}`,{method:'DELETE'});
    allChats=allChats.filter(c=>c.id!==chatId);
    if (currentChatId===chatId) { currentChatId=null; chatHistory=[]; startNewChat(); }
    renderChatList(allChats);
}

async function saveCurrentChat() {
    if (!currentUser||!chatHistory.length) return;
    const title = chatHistory[0]?.content?.slice(0,45)||'New Chat';
    const res = await fetch('/save_chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({user_id:currentUser.id,chat_id:currentChatId,title,mode:currentMode,messages:chatHistory})});
    const data = await res.json();
    if (data.chat_id&&!currentChatId) { currentChatId=data.chat_id; }
    loadChatHistory();
}

function startNewChat() {
    currentChatId=null; chatHistory=[];
    applyMode(currentMode);
    document.querySelectorAll('.chat-item').forEach(el=>el.classList.remove('active'));
    closeSidebar();
}

// ══ MODES ══

const modes = {
    basic:      {icon:'☀️',label:'Basic',welcome:'Ask me anything about your day, life decisions, general knowledge — I am here for everything.'},
    school:     {icon:'🎓',label:'School',welcome:"Let's ace your studies! Homework, tests, exam prediction — I've got you completely covered."},
    university: {icon:'🏛️',label:'University',welcome:'University level assistance. Thesis, research, complex problems — let\'s go deep.'},
    coding:     {icon:'💻',label:'Coding & Web',welcome:"Let's build something amazing. Tell me what you want to create and I'll build it with you."},
    applaunch:  {icon:'🚀',label:'App Launch',welcome:"Ready to launch? Tell me your app idea and I'll help you build, brand and ship it to the world."},
    fullpower:  {icon:'⚡',label:'Full Power',welcome:'Full Power activated. No limits. No hedging. I will give you my absolute best on everything.'}
};

function toggleDropdown() {
    const dd=document.getElementById('mode-dropdown'),ch=document.getElementById('mode-chevron');
    const open=dd.classList.contains('open');
    dd.classList.toggle('open',!open); ch.classList.toggle('spin',!open);
}

function closeDropdown() { document.getElementById('mode-dropdown').classList.remove('open'); document.getElementById('mode-chevron').classList.remove('spin'); }

function selectMode(mode) {
    closeDropdown();
    if (mode==='fullpower') { showFPModal(); return; }
    applyMode(mode);
}

function applyMode(mode) {
    currentMode=mode; chatHistory=[]; currentChatId=null;
    document.getElementById('mode-icon').textContent=modes[mode].icon;
    document.getElementById('mode-label').textContent=modes[mode].label;
    document.querySelectorAll('.mode-option').forEach(el=>el.classList.toggle('selected',el.dataset.mode===mode));
    document.querySelectorAll('.chat-item').forEach(el=>el.classList.remove('active'));
    const isFP=mode==='fullpower';
    const iconStyle=isFP?'background:linear-gradient(135deg,#f59e0b,#ef4444);':'';
    const h2Style=isFP?'background:linear-gradient(135deg,#fbbf24,#f87171);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;':'';
    document.getElementById('messages').innerHTML=`
        <div class="welcome-wrap" id="welcome-wrap">
            <div class="welcome-glow"></div>
            <div class="welcome-icon" style="${iconStyle}">${isFP?'⚡':'∞'}</div>
            <h2 style="${h2Style}">${modes[mode].label} Mode</h2>
            <p>${modes[mode].welcome}</p>
            <div class="quick-btns">${getQuickBtns(mode)}</div>
        </div>`;
}

function getQuickBtns(mode) {
    const q={
        basic:['✨ Help me today','🤔 I need advice','📋 Plan my day','💡 Explain something'],
        school:['📚 Help with homework','📝 Create a test','🔮 Predict my exam','📖 Explain a topic'],
        university:['🎓 Help with thesis','📑 Literature review','🔬 Research help','✍️ Essay feedback'],
        coding:['💻 Build a website','🐛 Debug my code','📱 Create an app','🧠 Explain a concept'],
        applaunch:['🚀 Launch my app','🎨 Brand my product','📣 Marketing strategy','💰 Monetization ideas'],
        fullpower:['⚡ Ask anything','🧠 Hard problem','💥 Full analysis','🔓 No limits']
    };
    return (q[mode]||q.basic).map(t=>`<button onclick="quickSend('${t}')">${t}</button>`).join('');
}

// ══ FULL POWER ══

function showFPModal() {
    if (currentUser&&currentUser.full_power_free) { applyMode('fullpower'); return; }
    fpAttempts=0;
    document.getElementById('fp-input').value='';
    document.getElementById('fp-input').disabled=false;
    document.getElementById('fp-error').textContent='';
    document.getElementById('fp-attempts').textContent='';
    document.getElementById('fp-btn').disabled=false;
    document.getElementById('fp-modal').style.display='flex';
}

async function verifyFP() {
    const pw=document.getElementById('fp-input').value;
    const errEl=document.getElementById('fp-error');
    const attEl=document.getElementById('fp-attempts');
    const res=await fetch('/verify_fullpower',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:pw,user_id:currentUser?.id})});
    const data=await res.json();
    if (data.status==='success') { closeOverlay('fp-modal'); applyMode('fullpower'); }
    else {
        fpAttempts++;
        const left=MAX_FP-fpAttempts;
        if (left<=0) { errEl.textContent='Too many attempts. Contact the admin.'; document.getElementById('fp-input').disabled=true; document.getElementById('fp-btn').disabled=true; }
        else { errEl.textContent='Wrong password.'; attEl.textContent=`${left} attempt${left!==1?'s':''} remaining`; }
    }
}

// ══ ADMIN ══

async function showAdmin() {
    const pw=prompt('🔐 Enter Admin Password:');
    if (pw===null) return;
    if (pw!=='admingoat@1') { alert('❌ Wrong password. Access denied.'); return; }

    document.getElementById('admin-modal').style.display='flex';
    const grantList=document.getElementById('grant-list');
    const deleteList=document.getElementById('delete-list');
    grantList.innerHTML='<p class="muted-text">Loading...</p>';
    deleteList.innerHTML='<p class="muted-text">Loading...</p>';

    const res=await fetch('/admin/users');
    const users=await res.json();

    if (!users.length) {
        grantList.innerHTML='<p class="muted-text">No accounts found</p>';
        deleteList.innerHTML='<p class="muted-text">No accounts found</p>';
        return;
    }

    grantList.innerHTML=users.map(u=>`
        <div class="user-row">
            <div class="user-row-left">
                <div class="user-row-info">
                    <div class="user-row-name">${u.full_name}</div>
                    <div class="user-row-email">${u.email} · ${u.curriculum} · ${u.grade}</div>
                </div>
            </div>
            <button class="grant-btn ${u.full_power_free?'granted':''}" onclick="grantFP(${u.id},this)" ${u.full_power_free?'disabled':''}>
                ${u.full_power_free?'✓ Granted':'⚡ Grant'}
            </button>
        </div>
    `).join('');

    deleteList.innerHTML=users.map(u=>`
        <div class="user-row" id="dr-${u.id}">
            <div class="user-row-left">
                <input type="checkbox" class="user-checkbox" id="dc-${u.id}" value="${u.id}" onchange="toggleDelRow(${u.id})">
                <div class="user-row-info">
                    <div class="user-row-name">${u.full_name}</div>
                    <div class="user-row-email">${u.email} · ${u.curriculum} · ${u.grade}</div>
                </div>
            </div>
        </div>
    `).join('');

    document.getElementById('delete-selected-btn').style.display='none';
}

function toggleDelRow(id) {
    const cb=document.getElementById(`dc-${id}`);
    document.getElementById(`dr-${id}`).classList.toggle('sel-del',cb.checked);
    const any=document.querySelectorAll('.user-checkbox:checked').length>0;
    document.getElementById('delete-selected-btn').style.display=any?'flex':'none';
}

async function grantFP(id,btn) {
    const res=await fetch('/admin/grant_fullpower',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({user_id:id})});
    const data=await res.json();
    if (data.status==='success') { btn.textContent='✓ Granted'; btn.classList.add('granted'); btn.disabled=true; }
}

async function deleteSelectedAccounts() {
    const checked=[...document.querySelectorAll('.user-checkbox:checked')].map(cb=>parseInt(cb.value));
    if (!checked.length) return;
    if (!confirm(`⚠️ Delete ${checked.length} account${checked.length>1?'s':''}? This cannot be undone!`)) return;
    const res=await fetch('/admin/delete_accounts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({user_ids:checked})});
    const data=await res.json();
    if (data.status==='success') {
        alert(`${checked.length} account${checked.length>1?'s':''} deleted.`);
        const selfDeleted=checked.includes(currentUser?.id);
        closeOverlay('admin-modal');
        if (selfDeleted) handleLogout(); else showAdmin();
    }
}

function closeOverlay(id){document.getElementById(id).style.display='none';}

// ══ CHAT ══

function quickSend(text){document.getElementById('user-input').value=text;sendMessage();}
function handleKey(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage();}}
function autoGrow(el){el.style.height='auto';el.style.height=Math.min(el.scrollHeight,160)+'px';}

function addMsgToUI(content,role) {
    const wrap=document.getElementById('welcome-wrap');
    if(wrap)wrap.remove();
    const msgs=document.getElementById('messages');
    const div=document.createElement('div');
    div.className=`msg ${role}`;
    const av=role==='user'?currentUser.full_name.charAt(0).toUpperCase():'∞';
    div.innerHTML=`<div class="msg-avatar">${av}</div><div class="msg-content">${fmt(content)}</div>`;
    msgs.appendChild(div);
    msgs.scrollTop=msgs.scrollHeight;
}

function fmt(text){
    text=text.replace(/```(\w*)\n?([\s\S]*?)```/g,'<pre><code>$2</code></pre>');
    text=text.replace(/`(.*?)`/g,'<code>$1</code>');
    text=text.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>');
    text=text.replace(/\*(.*?)\*/g,'<em>$1</em>');
    text=text.replace(/\n/g,'<br>');
    return text;
}

function showTyping(){
    const msgs=document.getElementById('messages');
    const div=document.createElement('div');
    div.className='typing';div.id='typing';
    div.innerHTML=`<div class="msg-avatar" style="width:32px;height:32px;border-radius:10px;background:var(--bg3);border:1.5px solid var(--border);display:flex;align-items:center;justify-content:center;font-weight:700;color:var(--accent2);flex-shrink:0;font-size:13px;">∞</div><div class="typing-dots"><span></span><span></span><span></span></div>`;
    msgs.appendChild(div);msgs.scrollTop=msgs.scrollHeight;
}

function removeTyping(){const el=document.getElementById('typing');if(el)el.remove();}

async function sendMessage(){
    const input=document.getElementById('user-input');
    const text=input.value.trim();
    if(!text)return;
    input.value='';input.style.height='auto';
    const btn=document.getElementById('send-btn');
    btn.disabled=true;
    addMsgToUI(text,'user');
    chatHistory.push({role:'user',content:text});
    showTyping();
    try{
        const res=await fetch('/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:text,history:chatHistory.slice(-20),mode:currentMode,user_data:currentUser})});
        const data=await res.json();
        removeTyping();
        addMsgToUI(data.reply,'ai');
        chatHistory.push({role:'assistant',content:data.reply});
        saveCurrentChat();
    }catch(e){
        removeTyping();
        addMsgToUI('Connection issue. Please try again.','ai');
    }
    btn.disabled=false;
    input.focus();
}

function handleFile(input){
    const file=input.files[0];
    if(!file)return;
    document.getElementById('user-input').value=`I uploaded a file: "${file.name}". Please help me with it.`;
}

// ══ INIT ══

const saved=localStorage.getItem('infinite_user');
if(saved){try{currentUser=JSON.parse(saved);launchApp();}catch(e){localStorage.removeItem('infinite_user');}}

document.addEventListener('click',e=>{if(!e.target.closest('.mode-selector-wrap'))closeDropdown();});
document.addEventListener('keydown',e=>{
    if(e.key==='Enter'){
        if(document.activeElement.id==='login-password')handleLogin();
        if(document.activeElement.id==='fp-input')verifyFP();
    }
});