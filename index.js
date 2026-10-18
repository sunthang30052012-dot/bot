const mineflayer = require('mineflayer');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// === THÔNG TIN TÀI KHOẢN BOT ===
const config = {
  host: 'kingmc.vn',
  username: 'ipttdup',
  version: '1.20.1',
  matkhau: 'Sam270311'
};

let bot;
let farmInterval;
let xyzInterval;
let currentBotStatus = "Đang khởi động...";
let lastLogs = [];

// Hàm lưu log để hiển thị lên giao diện web
function logToWeb(msg) {
  const time = new Date().toLocaleTimeString();
  const fullMsg = `[${time}] ${msg}`;
  console.log(fullMsg);
  lastLogs.unshift(fullMsg);
  if (lastLogs.length > 20) lastLogs.pop();
}

// 🌐 THIẾT KẾ GIAO DIỆN WEB NÚT BẤM (HTML)
app.get('/', (req, res) => {
  let logHtml = lastLogs.map(l => `<div>${l}</div>`).join('');
  let posHtml = (bot && bot.entity && bot.entity.position) 
    ? `X: ${Math.round(bot.entity.position.x)} | Y: ${Math.round(bot.entity.position.y)} | Z: ${Math.round(bot.entity.position.z)}` 
    : "Chưa cập nhật";

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=device-width, initial-scale=1.0">
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
          <strong>Trạng thái:</strong> ${currentBotStatus}<br>
          <strong>Tọa độ thực:</strong> <span style="color:#ffeb3b">${posHtml}</span>
        </div>
        
        <h3>⚡ HÀNH ĐỘNG NHANH ⚡</h3>
        <form action="/action" method="POST" style="display:inline;"><button class="btn btn-orange" name="cmd" value="menu">1. Mở Menu Đồng Hồ</button></form>
        <form action="/action" method="POST" style="display:inline;"><button class="btn" name="cmd" value="click35">2. Click Vào KingSMP (Ô 36)</button></form>
        <form action="/action" method="POST" style="display:inline;"><button class="btn btn-blue" name="cmd" value="tpa">3. Đồng Ý Dịch Chuyển (/tpaccept)</button></form>
        <form action="/action" method="POST" style="display:inline;"><button class="btn btn-orange" name="cmd" value="jump">4. Nhảy Lên Tại Chỗ</button></form>
        
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
    setTimeout(() => { bot.activateItem(); }, 500);
    logToWeb("Nút bấm Web: Đã ra lệnh bot mở Menu Đồng hồ.");
  } 
  else if (action === 'click35') {
    try {
      await bot.clickWindow(35, 0, 0);
      logToWeb("Nút bấm Web: Đã ra lệnh bot click vào Slot 35 (KingSMP).");
    } catch (err) {
      logToWeb(`Click lỗi: ${err.message}`);
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

// XỬ LÝ GỬI Ô CHAT TÙY Ý TỪ WEB
app.post('/custom-chat', (req, res) => {
  const text = req.body.text;
  if (bot && bot.entity) {
    bot.chat(text);
    logToWeb(`Nút bấm Web: Bot đã gõ lệnh chat "${text}"`);
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

  bot.on('login', () => { 
    currentBotStatus = "Đã kết nối, đang ở sảnh chờ.";
    logToWeb(`Bot ${bot.username} đã vào mạng thành công.`); 
  });

  bot.on('spawn', () => {
    logToWeb('Bot đã xuất hiện tại thế giới.');
    
    // Tự động đăng nhập sảnh chờ
    setTimeout(() => {
      bot.chat(`/dn ${config.matkhau}`);
      logToWeb('Đã tự động gửi lệnh /dn mở khóa.');
    }, 2000);

    // Chế độ siêu farm tự động chém quái đứng cạnh
    if (farmInterval) clearInterval(farmInterval);
    farmInterval = setInterval(() => {
      if (bot.entity) {
        const target = bot.nearestEntity((entity) => entity.type === 'mob');
        if (target) bot.attack(target); 
      }
    }, 1000); 
  });

  bot.on('windowOpen', (window) => {
    logToWeb('Menu Đồng hồ sảnh chờ đã mở ra trên màn hình ảo.');
  });

  bot.on('chat', (username, message) => {
    if (message.includes('muon dich chuyen') || message.includes('tpa')) {
      logToWeb(`Nhận yêu cầu TPA từ người chơi: ${username}`);
    }
  });

  bot.on('end', (reason) => {
    currentBotStatus = "Mất kết nối! Đang tự vào lại...";
    logToWeb(`Mất kết nối do: ${reason}. Đang thử lại sau 30 giây...`);
    clearInterval(farmInterval);
    clearInterval(xyzInterval);
    setTimeout(startBot, 30000);
  });
  
  bot.on('error', (err) => { logToWeb(`LỖI HỆ THỐNG: ${err.message}`); });
}

startBot();
