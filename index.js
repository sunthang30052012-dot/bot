const mineflayer = require('mineflayer');
const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const app = express();
 
app.disable('x-powered-by');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
 
// === THÔNG TIN TÀI KHOẢN BOT ===
// [SỬA] Mật khẩu không còn nằm trong code: đặt biến môi trường MC_PASSWORD trên nơi chạy bot.
const config = {
  host: 'kingmc.vn',
  username: 'ipttdup',
  version: '1.20.1',
  matkhau: process.env.MC_PASSWORD || ''
};
 
// [SỬA] Tài khoản đăng nhập vào bảng điều khiển web (đặt PANEL_USER / PANEL_PASS)
const PANEL_USER = process.env.PANEL_USER || 'admin';
const PANEL_PASS = process.env.PANEL_PASS || crypto.randomBytes(6).toString('hex');
if (!process.env.PANEL_PASS) {
  console.log(`[!] Chưa đặt PANEL_PASS. Mật khẩu tạm cho web (user "${PANEL_USER}"): ${PANEL_PASS}`);
}
if (!config.matkhau) {
  console.log('[!] Chưa đặt MC_PASSWORD nên bot sẽ KHÔNG tự gõ /dn.');
}
 
// [SỬA] Chỉ đánh quái trong tầm ~3 block (tầm đánh bình thường của người chơi, xa hơn dễ bị anti-cheat bắt)
const TAM_DANH = 3;
 
let bot;
let farmInterval;
let currentBotStatus = "Đang khởi động...";
let lastLogs = [];
 
// [SỬA] Escape HTML để log / tin nhắn không chèn được mã vào trang web
function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}
 
// So sánh chuỗi an toàn (chống dò mật khẩu qua thời gian phản hồi)
function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}
 
// [SỬA] Lấy tên hiển thị của item dưới dạng chữ thường (bỏ JSON / mã màu §) để tìm theo tên
function chuTen(it) {
  let n = it && it.customName;
  if (!n) return '';
  if (typeof n !== 'string') n = n.toString();
  try {
    const flat = (j) => (typeof j === 'string' ? j : (j.text || '') + (j.extra || []).map(flat).join(''));
    n = flat(JSON.parse(n));
  } catch (e) { /* không phải JSON thì giữ nguyên */ }
  return n.replace(/§./g, '').trim();
}
 
// Hàm lưu log để hiển thị lên giao diện web
function logToWeb(msg) {
  // [SỬA] Hiện giờ Việt Nam (máy chủ host thường chạy giờ UTC)
  const time = new Date().toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  const fullMsg = `[${time}] ${msg}`;
  console.log(fullMsg);
  lastLogs.unshift(fullMsg);
  if (lastLogs.length > 40) lastLogs.pop();
}
 
// [SỬA] /ping để công khai (cho UptimeRobot giữ app luôn thức); mọi đường dẫn khác phải đăng nhập
app.get('/ping', (req, res) => res.send('ok'));
 
app.use((req, res, next) => {
  const [scheme, encoded] = (req.headers.authorization || '').split(' ');
  if (scheme === 'Basic' && encoded) {
    const decoded = Buffer.from(encoded, 'base64').toString();
    const i = decoded.indexOf(':');
    if (i >= 0 && safeEqual(decoded.slice(0, i), PANEL_USER) && safeEqual(decoded.slice(i + 1), PANEL_PASS)) {
      return next();
    }
  }
  res.set('WWW-Authenticate', 'Basic realm="Bot Minecraft"');
  res.status(401).send('Cần đăng nhập để vào bảng điều khiển.');
});
 
// 🌐 THIẾT KẾ GIAO DIỆN WEB NÚT BẤM (HTML)
app.get('/', (req, res) => {
  const logHtml = lastLogs.map(l => `<div>${esc(l)}</div>`).join('');
  const posHtml = (bot && bot.entity && bot.entity.position)
    ? `X: ${Math.round(bot.entity.position.x)} | Y: ${Math.round(bot.entity.position.y)} | Z: ${Math.round(bot.entity.position.z)}`
    : "Chưa cập nhật";
 
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>BẢNG ĐIỀU KHIỂN BOT MINECRAFT</title>
      <style>
        body { font-family: Arial, sans-serif; background: #1e1e24; color: #fff; text-align: center; padding: 20px; }
        .container { max-width: 600px; margin: auto; background: #2a2a35; padding: 20px; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.5); }
        h2 { color: #4caf50; }
        .status-box { background: #3a3a4a; padding: 10px; margin: 15px 0; border-radius: 5px; font-size: 16px; }
        .btn { background: #4caf50; color: white; border: none; padding: 12px 20px; margin: 8px; font-size: 15px; font-weight: bold; border-radius: 5px; cursor: pointer; transition: 0.2s; width: 80%; max-width: 250px; }
        .btn:hover { background: #45a049; }
        .btn-orange { background: #ff9800; } .btn-orange:hover { background: #e68a00; }
        .btn-blue { background: #2196f3; } .btn-blue:hover { background: #0b7dda; }
        .log-box { background: #111; color: #00ff00; text-align: left; padding: 15px; height: 180px; overflow-y: auto; font-family: monospace; border-radius: 5px; margin-top: 15px; font-size: 13px; }
        input[type="text"] { padding: 10px; width: 60%; border-radius: 5px; border: none; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>🎮 ĐIỀU KHIỂN BOT TỪ XA</h2>
        <div class="status-box">
          <strong>Trạng thái:</strong> ${esc(currentBotStatus)}<br>
          <strong>Tọa độ thực:</strong> <span style="color:#ffeb3b">${posHtml}</span>
        </div>
 
        <h3>⚡ HÀNH ĐỘNG NHANH ⚡</h3>
        <form action="/action" method="POST" style="display:inline;"><button class="btn btn-orange" name="cmd" value="menu">1. Mở Menu Đồng Hồ</button></form>
        <form action="/action" method="POST" style="display:inline;"><button class="btn" name="cmd" value="click35">2. Click Vào KingSMP</button></form>
        <form action="/action" method="POST" style="display:inline;"><button class="btn btn-blue" name="cmd" value="tpa">3. Đồng Ý Dịch Chuyển (/tpaccept)</button></form>
        <form action="/action" method="POST" style="display:inline;"><button class="btn btn-orange" name="cmd" value="jump">4. Nhảy Lên Tại Chỗ</button></form>
 
        <form action="/click-slot" method="POST">
          <input type="text" name="slot" placeholder="Click ô số... (vd 35)" required>
          <button class="btn btn-orange" style="width:auto; padding: 10px 15px; margin:0 0 0 5px;">Click</button>
        </form>
 
        <h3>💬 GỬI LỆNH CHAT / LỆNH GAME</h3>
        <form action="/custom-chat" method="POST">
          <input type="text" name="text" placeholder="Ví dụ: /smp hoặc /home..." required>
          <button class="btn btn-blue" style="width:auto; padding: 10px 15px; margin:0 0 0 5px;">Gửi</button>
        </form>
 
        <h3>📜 LỊCH SỬ HOẠT ĐỘNG (LOGS)</h3>
        <div class="log-box">${logHtml}</div>
        <button class="btn btn-blue" onclick="location.reload()" style="width:auto; padding: 5px 15px; font-size:12px; margin-top:10px;">F5 Tải Lại Trang</button>
      </div>
    </body>
    </html>
  `);
});
 
// 🛠️ XỬ LÝ SỰ KIỆN KHI BẤM NÚT TRÊN WEB
app.post('/action', async (req, res) => {
  const action = req.body.cmd;
  if (!bot || !bot.entity) {
    return res.send("<script>alert('Bot chưa vào game, hãy đợi xíu!'); window.location.href='/';</script>");
  }
 
  if (action === 'menu') {
    bot.setQuickBarSlot(4);
    setTimeout(() => {
      try { bot.activateItem(); } catch (err) { logToWeb(`Mở menu lỗi: ${err.message}`); }
    }, 500);
    logToWeb("Nút bấm Web: Đã ra lệnh bot mở Menu Đồng hồ.");
  }
  else if (action === 'click35') {
    // [SỬA] Nếu chưa có menu nào mở thì clickWindow sẽ click nhầm vào túi đồ của bot
    if (!bot.currentWindow) {
      logToWeb('Chưa có menu nào đang mở. Bấm nút 1 trước, đợi menu hiện ra rồi mới bấm nút 2.');
    } else {
      try {
        // [SỬA] Tự tìm ô tên "KingSMP" trong menu; không thấy thì dùng ô 24 (theo ảnh menu thật)
        const w = bot.currentWindow;
        let slot = 24;
        for (let i = 0; i < w.inventoryStart; i++) {
          const it = w.slots[i];
          if (it && /king\s*smp/i.test(chuTen(it))) { slot = i; break; }
        }
        await bot.clickWindow(slot, 0, 0);
        logToWeb(`Nút bấm Web: Đã ra lệnh bot click vào Slot ${slot} (KingSMP).`);
      } catch (err) {
        logToWeb(`Click lỗi: ${err.message}`);
      }
    }
  }
  else if (action === 'tpa') {
    bot.chat('/tpaccept');
    logToWeb("Nút bấm Web: Đã ra lệnh bot gõ /tpaccept.");
  }
  else if (action === 'jump') {
    bot.setControlState('jump', true);
    setTimeout(() => bot.setControlState('jump', false), 500);
    logToWeb("Nút bấm Web: Đã ra lệnh bot nhảy.");
  }
 
  res.redirect('/');
});
 
// [SỬA] Click ô bất kỳ trong menu đang mở (để thử khi chưa biết KingSMP ở ô nào)
app.post('/click-slot', async (req, res) => {
  const slot = parseInt(req.body.slot, 10);
  const w = bot && bot.currentWindow;
  if (!w) {
    logToWeb('Chưa có menu nào đang mở. Bấm nút 1 trước.');
  } else if (!Number.isInteger(slot) || slot < 0 || slot >= w.slots.length) {
    logToWeb(`Ô "${req.body.slot}" không hợp lệ (0 - ${w.slots.length - 1}).`);
  } else {
    try {
      await bot.clickWindow(slot, 0, 0);
      logToWeb(`Nút bấm Web: Đã click ô ${slot}.`);
    } catch (err) {
      logToWeb(`Click lỗi: ${err.message}`);
    }
  }
  res.redirect('/');
});
 
// XỬ LÝ GỬI Ô CHAT TÙY Ý TỪ WEB
app.post('/custom-chat', (req, res) => {
  const text = String(req.body.text || '').trim().slice(0, 256); // [SỬA] chat Minecraft tối đa 256 ký tự
  if (text && bot && bot.entity) {
    bot.chat(text);
    // [SỬA] Nếu bạn tự gõ lệnh đăng nhập ở đây thì không ghi mật khẩu vào log
    const shown = /^\/(dn|login|register)\s/i.test(text) ? `${text.split(/\s+/)[0]} ****` : text;
    logToWeb(`Nút bấm Web: Bot đã gõ lệnh chat "${shown}"`);
  }
  res.redirect('/');
});
 
app.listen(process.env.PORT || 3000, () => { console.log('Web server da sẵn sàng.'); });
 
// 🤖 KHỞI TẠO MINEFLAYER BOT
function startBot() {
  bot = mineflayer.createBot({
    host: config.host,
    username: config.username,
    version: config.version
  });
 
  let daGuiDangNhap = false; // [SỬA] mỗi lần kết nối chỉ gõ /dn một lần
 
  bot.on('login', () => {
    currentBotStatus = "Đã kết nối, đang ở sảnh chờ.";
    logToWeb(`Bot ${bot.username} đã vào mạng thành công.`);
  });
 
  bot.on('spawn', () => {
    logToWeb('Bot đã xuất hiện tại thế giới.');
 
    // Tự động đăng nhập sảnh chờ
    // [SỬA] 'spawn' chạy lại mỗi lần đổi world / chuyển server (vd sang KingSMP) nên cần cờ để không gửi /dn lại
    if (!daGuiDangNhap && config.matkhau) {
      daGuiDangNhap = true;
      setTimeout(() => {
        bot.chat(`/dn ${config.matkhau}`);
        logToWeb('Đã tự động gửi lệnh /dn mở khóa.');
      }, 2000);
    }
 
    // Chế độ siêu farm tự động chém quái đứng cạnh
    if (farmInterval) clearInterval(farmInterval);
    farmInterval = setInterval(async () => {
      if (!bot.entity) return;
      // [SỬA] Ở các bản mới quái thù địch có type 'hostile' ('mob' là kiểu cũ),
      //       và chỉ đánh khi quái đứng đủ gần thay vì đánh con gần nhất bất kể xa bao nhiêu.
      const target = bot.nearestEntity((e) =>
        (e.type === 'hostile' || e.type === 'mob') &&
        e.position.distanceTo(bot.entity.position) <= TAM_DANH
      );
      if (!target) return;
      try {
        // [SỬA] Quay mặt về phía quái trước khi đánh cho giống người chơi thật
        await bot.lookAt(target.position.offset(0, (target.height || 1) / 2, 0), true);
        bot.attack(target);
      } catch (err) { /* quái biến mất giữa chừng, bỏ qua */ }
    }, 1000);
  });
 
  bot.on('windowOpen', (window) => {
    logToWeb('Menu Đồng hồ sảnh chờ đã mở ra trên màn hình ảo.');
    // [SỬA] Liệt kê item trong menu để biết KingSMP nằm ở ô nào
    const ds = [];
    for (let i = 0; i < window.inventoryStart; i++) {
      const it = window.slots[i];
      if (!it || /glass_pane/.test(it.name)) continue; // bỏ ô kính viền trang trí
      ds.push(`${i}:${chuTen(it) || it.name}`);
    }
    logToWeb(`Các ô trong menu: ${ds.join(' | ') || '(trống)'}`);
  });
 
  // [SỬA] Sự kiện 'chat' chỉ bắt tin nhắn của người chơi; thông báo từ plugin
  //       (kiểu "X muốn dịch chuyển đến bạn") là tin hệ thống nên phải dùng 'messagestr'.
  bot.on('messagestr', (msg) => {
    if (/\btpa|d[iị]ch chuy[eể]n|đăng nhập|dang nhap|login|mật khẩu|mat khau/i.test(msg)) {
      logToWeb(`Server: ${msg.slice(0, 150)}`);
    }
  });
 
  // [SỬA] Xem lý do bị kick (sự kiện 'end' thường không cho biết lý do này)
  bot.on('kicked', (reason) => {
    const text = typeof reason === 'string' ? reason : JSON.stringify(reason);
    logToWeb(`Bị kick: ${text.slice(0, 200)}`);
  });
 
  bot.on('end', (reason) => {
    currentBotStatus = "Mất kết nối! Đang tự vào lại...";
    logToWeb(`Mất kết nối do: ${reason}. Đang thử lại sau 30 giây...`);
    clearInterval(farmInterval);
    setTimeout(startBot, 30000);
  });
 
  bot.on('error', (err) => { logToWeb(`LỖI HỆ THỐNG: ${err.message}`); });
}
 
startBot();
 
