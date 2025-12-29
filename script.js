let contacts = JSON.parse(localStorage.getItem('brick_v3_data')) || [];
let curId = null;
let queue = [];

window.onload = () => {
    // 首次点击屏幕尝试进入全屏
    document.body.addEventListener('click', function() {
        if (!document.fullscreenElement) {
            enterFullscreen();
        }
    }, { once: true });

    // 全局时钟
    setInterval(() => {
        const now = new Date();
        const t = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');
        document.getElementById('st-time').innerText = t;
        const timeDisp = document.querySelector('.time-display');
        if(timeDisp) timeDisp.innerText = t;
    }, 1000);

    const saved = localStorage.getItem('home_sq_img');
    if(saved) document.getElementById('home-square-img').src = saved;

    setTimeout(() => {
        const s = document.getElementById('splash-screen');
        s.style.opacity = '0';
        setTimeout(() => s.style.display = 'none', 800);
    }, 1500);

    renderWC();
    applyIcons();
};

// 增强全屏逻辑
function enterFullscreen() {
    let el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else if (el.msRequestFullscreen) el.msRequestFullscreen();
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        enterFullscreen();
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
    }
}

// 导航
function openApp(id) {
    document.querySelectorAll('.app-layer').forEach(l => l.classList.remove('active'));
    document.getElementById(id + '-app').classList.add('active');
    if(id === 'settings') openSetSub('main');
    if(id === 'wechat') switchWCTab('list');
}

function goHome() {
    document.querySelectorAll('.app-layer').forEach(l => l.classList.remove('active'));
    document.getElementById('home-screen').classList.add('active');
}

// 微信功能
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
    queue = [];
}

document.getElementById('btn-send').onclick = () => {
    const i = document.getElementById('chat-in');
    if(!i.value.trim() || !curId) return;
    const c = contacts.find(x => x.id == curId);
    c.history.push({ s: 'u', m: i.value.trim() });
    queue.push(i.value.trim());
    i.value = '';
    renderMsgs(); save();
};

document.getElementById('btn-gen').onclick = async () => {
    if(!curId || queue.length === 0) return;
    const c = contacts.find(x => x.id == curId);
    const base = localStorage.getItem('api_base') || "https://api520.pro/v1";
    const key = localStorage.getItem('api_key');
    const model = localStorage.getItem('api_model');
    if(!key) return alert("请在设置中配置API Key");

    const sys = `你是${c.name}。背景设定: ${c.role}。用户背景: ${c.user_prompt}。`;
    try {
        const res = await fetch(`${base}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
            body: JSON.stringify({ model: model, messages: [{ role: 'system', content: sys }, {role: 'user', content: queue.join("\n")}] })
        });
        const d = await res.json();
        c.history.push({ s: 'a', m: d.choices[0].message.content });
        queue = []; renderMsgs(); save();
    } catch(e) { alert("API连接失败"); }
};

function renderMsgs() {
    const c = contacts.find(x => x.id == curId);
    const f = document.getElementById('msg-flow');
    f.innerHTML = c.history.map(h => `
        <div style="display:flex; margin-bottom:12px; justify-content:${h.s === 'u' ? 'flex-end' : 'flex-start'}">
            <div style="max-width:75%; padding:10px; border-radius:8px; font-size:14px; background:${h.s === 'u' ? '#95ec69' : '#fff'}">${h.m}</div>
        </div>`).join('');
    f.scrollTop = f.scrollHeight;
}

// 设置功能
function openSetSub(n) {
    document.querySelectorAll('#settings-app .sub-page').forEach(p => p.classList.remove('active'));
    document.getElementById('set-' + n + '-page').classList.add('active');
}

function changeHomeImage() {
    const mode = confirm("确定: 上传图片\n取消: 输入URL");
    if(mode) document.getElementById('img-upload').click();
    else {
        const u = prompt("输入图片URL:");
        if(u) { document.getElementById('home-square-img').src = u; localStorage.setItem('home_sq_img', u); }
    }
}
function processLocalImg(input) {
    if (input.files && input.files[0]) {
        const r = new FileReader();
        r.onload = (e) => {
            document.getElementById('home-square-img').src = e.target.result;
            localStorage.setItem('home_sq_img', e.target.result);
        };
        r.readAsDataURL(input.files[0]);
    }
}

function showAddModal() { document.getElementById('add-modal').style.display = 'flex'; }
function closeAddModal() { document.getElementById('add-modal').style.display = 'none'; }
function saveNewContact() {
    const c = { id: Date.now(), avatar: document.getElementById('in-avatar').value, name: document.getElementById('in-name').value, nickname: document.getElementById('in-nickname').value, role: document.getElementById('in-role').value, user_prompt: document.getElementById('in-user').value, history: [] };
    if(!c.name) return; contacts.push(c); save(); closeAddModal(); renderWC();
}

function renderWC() {
    const chatB = document.getElementById('chat-list-box');
    const contB = document.getElementById('contacts-box');
    if(!chatB || !contB) return;
    if(contacts.length === 0) { chatB.innerHTML = '<p class="empty-hint">暂无聊天内容</p>'; contB.innerHTML = ''; return; }
    chatB.innerHTML = contacts.map(c => `<div class="list-item" style="display:flex; padding:15px; border-bottom:1px solid #f9f9f9; align-items:center;">
        <div onclick="openChat(${c.id})" style="flex:1; display:flex; align-items:center;">
            <img src="${c.avatar || 'https://api.iconify.design/pixelarticons:user.svg'}" style="width:45px; height:45px; border-radius:8px; margin-right:12px;">
            <div><b>${c.nickname}</b><br><small style="color:#aaa">${c.history.length ? c.history[c.history.length-1].m.substring(0,12) : '点击开始'}</small></div>
        </div>
        <i class="fas fa-comment-slash" style="color:#ccc" onclick="clearWC(${c.id}, event)"></i>
    </div>`).join('');
    contB.innerHTML = contacts.map(c => `<div class="list-item" style="display:flex; padding:15px; border-bottom:1px solid #f9f9f9; align-items:center;">
        <div onclick="openChat(${c.id})" style="flex:1; display:flex; align-items:center;">
            <img src="${c.avatar || 'https://api.iconify.design/pixelarticons:user.svg'}" style="width:45px; height:45px; border-radius:8px; margin-right:12px;">
            <span>${c.name}</span>
        </div>
        <i class="fas fa-trash-alt" style="color:#ff4d4f" onclick="delChar(${c.id}, event)"></i>
    </div>`).join('');
}

function delChar(id, e) { e.stopPropagation(); contacts = contacts.filter(x => x.id != id); save(); renderWC(); }
function clearWC(id, e) { e.stopPropagation(); contacts.find(x => x.id == id).history = []; save(); renderWC(); }
async function fetchModels() {
    const b = document.getElementById('api-base').value, k = document.getElementById('api-key').value;
    try {
        const res = await fetch(`${b}/models`, { headers: { 'Authorization': `Bearer ${k}` } });
        const d = await res.json();
        document.getElementById('api-model').innerHTML = d.data.map(m => `<option value="${m.id}">${m.id}</option>`).join('');
    } catch(e) { alert("拉取失败"); }
}
function saveApi() { localStorage.setItem('api_base', document.getElementById('api-base').value); localStorage.setItem('api_key', document.getElementById('api-key').value); localStorage.setItem('api_model', document.getElementById('api-model').value); alert("保存成功"); }
function applyIcons() { const wc = localStorage.getItem('brick_wc_ic'); const st = localStorage.getItem('brick_st_ic'); if(wc) document.getElementById('ic-wc').src = wc; if(st) document.getElementById('ic-set').src = st; }
function save() { localStorage.setItem('brick_v3_data', JSON.stringify(contacts)); }