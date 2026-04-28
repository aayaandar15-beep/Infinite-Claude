// INFINITE — script.js

let currentUser = null;
let currentMode = 'basic';
let chatHistory = [];
let currentChatId = null;
let fpAttempts = 0;
const MAX_FP = 5;
let allChats = [];

// ─── CANVAS ───

const canvas = document.getElementById('infinite-canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
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
        this.x += this.vx; this.y += this.vy; this.phase += 0.018;
        this.a = 0.15 + Math.abs(Math.sin(this.phase)) * 0.5;
        if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) this.init();
    }
    draw() {
        ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.col},${this.a})`; ctx.fill();
    }
}

class InfSign {
    constructor() { this.init(); }
    init() {
        this.x = Math.random() * canvas.width; this.y = Math.random() * canvas.height;
        this.sz = Math.random() * 28 + 12; this.a = 0;
        this.target = Math.random() * 0.07 + 0.02;
        this.rot = Math.random() * Math.PI * 2; this.rotv = (Math.random() - 0.5) * 0.004;
        this.life = 0; this.max = Math.random() * 280 + 180; this.fadein = true;
    }
    update() {
        this.life++; this.rot += this.rotv;
        if (this.fadein) { this.a += 0.001; if (this.a >= this.target) this.fadein = false; }
        else { this.a -= 0.0004; }
        if (this.life > this.max || this.a <= 0) this.init();
    }
    draw() {
        ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.rot);
        ctx.font = `${this.sz}px Inter`; ctx.fillStyle = `rgba(124,111,255,${this.a})`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('∞', 0, 0); ctx.restore();
    }
}

function drawLines(pts) {
    for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
            const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
            const d = Math.sqrt(dx*dx + dy*dy);
            if (d < 110) {
                ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y);
                ctx.strokeStyle = `rgba(124,111,255,${0.05*(1-d/110)})`; ctx.lineWidth = 0.5; ctx.stroke();
            }
        }
    }
}

function drawNebula() {
    const t = Date.now() * 0.0003;
    [{x:0.15,y:0.2,r:280,c:'124,111,255',a:0.04},{x:0.85,y:0.8,r:240,c:'184,169,255',a:0.03},{x:0.5,y:0.5,r:180,c:'79,195,247',a:0.018}]
    .forEach((o,i) => {
        const p = Math.sin(t+i*2)*0.5+0.5;
        const g = ctx.createRadialGradient(o.x*canvas.width,o.y*canvas.height,0,o.x*canvas.width,o.y*canvas.height,o.r+p*40);
        g.addColorStop(0,`rgba(${o.c},${o.a+p*0.018})`); g.addColorStop(1,`rgba(${o.c},0)`);
        ctx.fillStyle=g; ctx.fillRect(0,0,canvas.width,canvas.height);
    });
}

const particles = Array.from({length:110},()=>new Particle());
const signs = Array.from({length:6},()=>{ const s=new InfSign(); s.life=Math.random()*s.max; return s; });

function animate() {
    ctx.clearRect(0,0,canvas.width,canvas.height); drawNebula(); drawLines(particles);
    particles.forEach(p=>{p.update();p.draw()}); signs.forEach(s=>{s.update();s.draw()});
    requestAnimationFrame(animate);
}
animate();

// ─── AUTH ───

function showSignup() { document.getElementById('login-form').style.display='none'; document.getElementById('signup-form').style.display='block'; }
function showLogin() { document.getElementById('signup-form').style.display='none'; document.getElementById('login-form').style.display='block'; }

function showSignupStep2() {
    const n=document.getElementById('signup-name').value.trim();
    const e=document.getElementById('signup-email').value.trim();
    const p=document.getElementById('signup-password').value.trim();
    if(!n||!e||!p){alert('Please fill in all fields');return;}
    document.getElementById('signup-step-1').style.display='none';
    document.getElementById('signup-step-2').style.display='block';
}

function showSignupStep1() { document.getElementById('signup-step-2').style.display='none'; document.getElementById('signup-step-1').style.display='block'; }

async function handleSignup() {
    const full_name=document.getElementById('signup-name').value.trim();
    const email=document.getElementById('signup-email').value.trim();
    const password=document.getElementById('signup-password').value.trim();
    const school=document.getElementById('signup-school').value.trim();
    const curriculum=document.getElementById('signup-curriculum').value;
    const grade=document.getElementById('signup-grade').value;
    const err=document.getElementById('signup-error');
    if(!school||!curriculum||!grade){err.textContent='Please fill in all fields';return;}
    const res=await fetch('/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({full_name,email,password,school,curriculum,grade})});
    const data=await res.json();
    if(data.status==='success'){err.style.color='var(--success)';err.textContent='Account created! Signing you in...';setTimeout(()=>loginWith(email,password),900);}
    else{err.style.color='var(--danger)';err.textContent=data.message;}
}

async function handleLogin() {
    const email=document.getElementById('login-email').value.trim();
    const password=document.getElementById('login-password').value.trim();
    if(!email||!password){document.getElementById('login-error').textContent='Please fill in all fields';return;}
    await loginWith(email,password);
}

async function loginWith(email,password) {
    const err=document.getElementById('login-error');
    try {
        const res=await fetch('/login_user',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});
        const data=await res.json();
        if(data.status==='success'){
            currentUser=data.user;
            localStorage.setItem('infinite_user',JSON.stringify(currentUser));
            launchApp();
        } else { if(err) err.textContent=data.message||'Login failed'; }
    } catch(e) { if(err) err.textContent='Connection error. Is the server running?'; }
}

function launchApp() {
    document.getElementById('auth-screen').style.display='none';
    document.getElementById('app-screen').style.display='flex';
    const first=currentUser.full_name.split(' ')[0];
    document.getElementById('user-greeting') && (document.getElementById('user-greeting').textContent=`Hey, ${first}!`);
    document.getElementById('sidebar-username').textContent=currentUser.full_name;
    document.getElementById('sidebar-school').textContent=currentUser.school||'Student';
    document.getElementById('user-avatar').textContent=currentUser.full_name.charAt(0).toUpperCase();
    document.getElementById('welcome-title').textContent=`Welcome back, ${first}!`;
    document.getElementById('welcome-sub').textContent='Your AI companion is ready. What shall we work on today?';
    loadChatHistory();
}

async function handleLogout() {
    try{await fetch('/logout',{method:'POST'});}catch(e){}
    localStorage.removeItem('infinite_user');
    currentUser=null; chatHistory=[]; currentChatId=null; currentMode='basic'; allChats=[];
    document.getElementById('app-screen').style.display='none';
    document.getElementById('auth-screen').style.display='flex';
    document.getElementById('login-email').value='';
    document.getElementById('login-password').value='';
    document.getElementById('login-error').textContent='';
    showLogin();
}

// ─── CHAT HISTORY SIDEBAR ───

const modeIcons = { basic:'☀️', school:'🎓', university:'🏛️', coding:'💻', applaunch:'🚀', fullpower:'⚡' };

async function loadChatHistory() {
    if(!currentUser) return;
    try {
        const res = await fetch(`/get_chats/${currentUser.id}`);
        allChats = await res.json();
        renderChatList(allChats);
    } catch(e) { console.log('Could not load chats'); }
}

function renderChatList(chats) {
    const container = document.getElementById('chat-history');
    if(!chats.length) {
        container.innerHTML = '<p class="history-empty">No chats yet.<br>Start a new conversation!</p>';
        return;
    }

    const today = new Date().toDateString();
    const yesterday = new Date(Date.now()-86400000).toDateString();

    const groups = {};
    chats.forEach(c => {
        const d = new Date(c.updated_at);
        let label = d.toDateString() === today ? 'Today' : d.toDateString() === yesterday ? 'Yesterday' : c.updated_at;
        if(!groups[label]) groups[label] = [];
        groups[label].push(c);
    });

    container.innerHTML = Object.entries(groups).map(([label, items]) => `
        <div class="history-group-label">${label}</div>
        ${items.map(c => `
            <div class="chat-item ${c.id === currentChatId ? 'active' : ''}" id="chat-item-${c.id}" onclick="loadChat(${c.id})">
                <span class="chat-item-icon">${modeIcons[c.mode]||'💬'}</span>
                <div class="chat-item-info">
                    <div class="chat-item-title">${c.title}</div>
                </div>
                <button class="chat-delete-btn" onclick="deleteChatItem(event,${c.id})" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('')}
    `).join('');
}

function searchChats(query) {
    const filtered = allChats.filter(c => c.title.toLowerCase().includes(query.toLowerCase()));
    renderChatList(filtered);
}

async function loadChat(chatId) {
    const chat = allChats.find(c => c.id === chatId);
    if(!chat) return;

    currentChatId = chatId;
    currentMode = chat.mode;
    chatHistory = chat.messages;

    document.getElementById('mode-icon').textContent = modeIcons[chat.mode] || '☀️';
    document.getElementById('mode-label').textContent = chat.mode.charAt(0).toUpperCase() + chat.mode.slice(1);
    document.querySelectorAll('.mode-option').forEach(el => el.classList.toggle('selected', el.dataset.mode === chat.mode));
    document.querySelectorAll('.chat-item').forEach(el => el.classList.remove('active'));
    const item = document.getElementById(`chat-item-${chatId}`);
    if(item) item.classList.add('active');

    const msgs = document.getElementById('messages');
    msgs.innerHTML = '';
    chat.messages.forEach(m => addMsgToUI(m.content, m.role === 'user' ? 'user' : 'ai'));
}

async function deleteChatItem(e, chatId) {
    e.stopPropagation();
    await fetch(`/delete_chat/${chatId}`, {method:'DELETE'});
    allChats = allChats.filter(c => c.id !== chatId);
    if(currentChatId === chatId) {
        currentChatId = null;
        chatHistory = [];
        startNewChat();
    }
    renderChatList(allChats);
}

async function saveCurrentChat() {
    if(!currentUser || !chatHistory.length) return;
    const title = chatHistory[0]?.content?.slice(0,40) || 'New Chat';
    const res = await fetch('/save_chat', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({user_id:currentUser.id, chat_id:currentChatId, title, mode:currentMode, messages:chatHistory})
    });
    const data = await res.json();
    if(data.chat_id && !currentChatId) {
        currentChatId = data.chat_id;
        loadChatHistory();
    } else {
        loadChatHistory();
    }
}

function startNewChat() {
    currentChatId = null;
    chatHistory = [];
    applyMode(currentMode);
    document.querySelectorAll('.chat-item').forEach(el => el.classList.remove('active'));
}

// ─── MODES ───

const modes = {
    basic:      {icon:'☀️',label:'Basic',welcome:'Ask me anything about your day, life decisions, general knowledge — I am here for everything.'},
    school:     {icon:'🎓',label:'School',welcome:"Let's ace your studies! Homework, tests, exam prediction — I've got you completely covered."},
    university: {icon:'🏛️',label:'University',welcome:'University level assistance. Thesis, research, complex problems — let\'s go deep.'},
    coding:     {icon:'💻',label:'Coding & Web',welcome:"Let's build something amazing. Tell me what you want to create and I'll build it with you."},
    applaunch:  {icon:'🚀',label:'App Launch',welcome:"Ready to launch? Tell me your app idea and I'll help you build, brand and ship it to the world."},
    fullpower:  {icon:'⚡',label:'Full Power',welcome:'Full Power activated. No limits. No hedging. I will give you my absolute best on everything.'}
};

function toggleDropdown() {
    const dd=document.getElementById('mode-dropdown');
    const ch=document.getElementById('mode-chevron');
    const open=dd.classList.contains('open');
    dd.classList.toggle('open',!open); ch.classList.toggle('spin',!open);
}

function closeDropdown() { document.getElementById('mode-dropdown').classList.remove('open'); document.getElementById('mode-chevron').classList.remove('spin'); }

function selectMode(mode) {
    closeDropdown();
    if(mode==='fullpower'){showFPModal();return;}
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

// ─── FULL POWER ───

function showFPModal() {
    if(currentUser&&currentUser.full_power_free){applyMode('fullpower');return;}
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
    if(data.status==='success'){closeOverlay('fp-modal');applyMode('fullpower');}
    else {
        fpAttempts++;
        const left=MAX_FP-fpAttempts;
        if(left<=0){errEl.textContent='Too many attempts. Contact the admin.';document.getElementById('fp-input').disabled=true;document.getElementById('fp-btn').disabled=true;}
        else{errEl.textContent='Wrong password.';attEl.textContent=`${left} attempt${left!==1?'s':''} remaining`;}
    }
}

// ─── ADMIN ───

async function showAdmin() {
    const pw=prompt('🔐 Enter Admin Password:');
    if(pw===null)return;
    if(pw!=='admingoat@1'){alert('❌ Wrong password. Access denied.');return;}

    document.getElementById('admin-modal').style.display='flex';
    const grantList=document.getElementById('grant-list');
    const deleteList=document.getElementById('delete-list');
    grantList.innerHTML='<p class="muted-text">Loading...</p>';
    deleteList.innerHTML='<p class="muted-text">Loading...</p>';

    const res=await fetch('/admin/users');
    const users=await res.json();

    if(!users.length){
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
        <div class="user-row" id="del-row-${u.id}">
            <div class="user-row-left">
                <input type="checkbox" class="user-checkbox" id="del-${u.id}" value="${u.id}" onchange="toggleDeleteRow(${u.id})">
                <div class="user-row-info">
                    <div class="user-row-name">${u.full_name}</div>
                    <div class="user-row-email">${u.email} · ${u.curriculum} · ${u.grade}</div>
                </div>
            </div>
        </div>
    `).join('');

    document.getElementById('delete-selected-btn').style.display='none';
}

function toggleDeleteRow(userId) {
    const cb=document.getElementById(`del-${userId}`);
    const row=document.getElementById(`del-row-${userId}`);
    row.classList.toggle('selected-for-delete',cb.checked);
    const anyChecked=document.querySelectorAll('.user-checkbox:checked').length>0;
    document.getElementById('delete-selected-btn').style.display=anyChecked?'flex':'none';
}

async function grantFP(id,btn) {
    const res=await fetch('/admin/grant_fullpower',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({user_id:id})});
    const data=await res.json();
    if(data.status==='success'){btn.textContent='✓ Granted';btn.classList.add('granted');btn.disabled=true;}
}

async function deleteSelectedAccounts() {
    const checked=[...document.querySelectorAll('.user-checkbox:checked')].map(cb=>parseInt(cb.value));
    if(!checked.length)return;
    if(!confirm(`⚠️ Delete ${checked.length} account${checked.length>1?'s':''}? This cannot be undone!`))return;

    const res=await fetch('/admin/delete_accounts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({user_ids:checked})});
    const data=await res.json();
    if(data.status==='success'){
        alert(`${checked.length} account${checked.length>1?'s':''} deleted successfully.`);
        const isCurrentUserDeleted=checked.includes(currentUser?.id);
        closeOverlay('admin-modal');
        if(isCurrentUserDeleted)handleLogout();
        else showAdmin();
    }
}

function closeOverlay(id){document.getElementById(id).style.display='none';}

// ─── CHAT ───

function quickSend(text){document.getElementById('user-input').value=text;sendMessage();}
function handleKey(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage();}}
function autoGrow(el){el.style.height='auto';el.style.height=Math.min(el.scrollHeight,150)+'px';}

function addMsgToUI(content, role) {
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

function addMsg(content,role){addMsgToUI(content,role);}

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
    div.innerHTML=`<div class="msg-avatar" style="width:32px;height:32px;border-radius:9px;background:var(--bg3);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-weight:700;color:var(--accent2);flex-shrink:0;font-size:13px;">∞</div><div class="typing-dots"><span></span><span></span><span></span></div>`;
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

// ─── INIT ───

const saved=localStorage.getItem('infinite_user');
if(saved){try{currentUser=JSON.parse(saved);launchApp();}catch(e){localStorage.removeItem('infinite_user');}}

document.addEventListener('click',e=>{if(!e.target.closest('.mode-selector-wrap'))closeDropdown();});
document.addEventListener('keydown',e=>{
    if(e.key==='Enter'){
        if(document.activeElement.id==='login-password')handleLogin();
        if(document.activeElement.id==='fp-input')verifyFP();
    }
});