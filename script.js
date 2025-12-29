let contacts = JSON.parse(localStorage.getItem('brick_v3_data')) || [];
let curId = null;
let queue = [];

window.onload = () => {
    // 时钟
    setInterval(() => {
        const now = new Date();
        const t = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');
        document.getElementById('st-time').innerText = t;
        const timeBox = document.querySelector('.time-display');
        if(timeBox) timeBox.innerText = t;
    }, 1000);

    const saved = localStorage.getItem('home_sq_img');
    if(saved) document.getElementById('home-square-img').src = saved;

    setTimeout(() => {
        const s = document.getElementById('splash-screen');
        if(s) { s.style.opacity = '0'; setTimeout(() => s.style.display = 'none', 800); }
    }, 1500);

    renderWC();
    applyIcons();
};

function openApp(id) {
    document.querySelectorAll('.app-layer').forEach(l => l.classList.remove('active'));
    document.getElementById(id + '-app').classList.add('active');
    if(id === 'settings') openSetSub('main');
}

function goHome() {
    document.querySelectorAll('.app-layer').forEach(l => l.classList.remove('active'));
    document.getElementById('home-screen').classList.add('active');
}

function switchWCTab(t) {
    document.querySelectorAll('#wechat-app .sub-page').forEach(p => p.classList.remove('active'));
    document.getElementById('wc-' + t + '-page').classList.add('active');
}

function openChat(id) {
    curId = id;
    const c = contacts.find(x => x.id == id);
    document.getElementById('chat-title').innerText = c.nickname;
    document.querySelectorAll('#wechat-app .sub-page').forEach(p => p.classList.remove('active'));
    document.getElementById('wc-chat-page').classList.add('active');
    renderMsgs();
}

function renderMsgs() {
    const c = contacts.find(x => x.id == curId);
    const f = document.getElementById('msg-flow');
    f.innerHTML = c.history.map(h => `
        <div style="display:flex; margin-bottom:12px; justify-content:${h.s === 'u' ? 'flex-end' : 'flex-start'}">
            <div style="max-width:75%; padding:10px; border-radius:8px; font-size:14px; background:${h.s === 'u' ? '#95ec69' : '#fff'}">${h.m}</div>
        </div>`).join('');
    f.scrollTop = f.scrollHeight;
}

function openSetSub(n) {
    document.querySelectorAll('#settings-app .sub-page').forEach(p => p.classList.remove('active'));
    document.getElementById('set-' + n + '-page').classList.add('active');
}

function showAddModal() { document.getElementById('add-modal').style.display = 'flex'; }
function closeAddModal() { document.getElementById('add-modal').style.display = 'none'; }

function saveNewContact() {
    const c = { id: Date.now(), avatar: document.getElementById('in-avatar').value, name: document.getElementById('in-name').value, nickname: document.getElementById('in-nickname').value, role: document.getElementById('in-role').value, user_prompt: document.getElementById('in-user').value, history: [] };
    if(!c.name) return; contacts.push(c); 
    localStorage.setItem('brick_v3_data', JSON.stringify(contacts));
    closeAddModal(); renderWC();
}

function renderWC() {
    const chatB = document.getElementById('chat-list-box');
    const contB = document.getElementById('contacts-box');
    if(!chatB || !contB) return;
    chatB.innerHTML = contacts.map(c => `<div class="list-item" onclick="openChat(${c.id})"><img src="${c.avatar || ''}"><div><b>${c.nickname}</b><br><small>${c.history.length ? c.history[c.history.length-1].m : '点击开始'}</small></div></div>`).join('');
    contB.innerHTML = contacts.map(c => `<div class="list-item" onclick="openChat(${c.id})"><img src="${c.avatar || ''}"><span>${c.name}</span></div>`).join('');
}

async function fetchModels() {
    const b = document.getElementById('api-base').value, k = document.getElementById('api-key').value;
    try {
        const res = await fetch(`${b}/models`, { headers: { 'Authorization': `Bearer ${k}` } });
        const d = await res.json();
        document.getElementById('api-model').innerHTML = d.data.map(m => `<option value="${m.id}">${m.id}</option>`).join('');
    } catch(e) { alert("拉取失败"); }
}
function saveApi() { localStorage.setItem('api_base', document.getElementById('api-base').value); localStorage.setItem('api_key', document.getElementById('api-key').value); localStorage.setItem('api_model', document.getElementById('api-model').value); alert("保存成功"); }
function applyIcons() { /* 逻辑同原版 */ }
function toggleFullscreen() { if (!document.fullscreenElement) document.documentElement.requestFullscreen(); else document.exitFullscreen(); }