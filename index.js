const mineflayer = require('mineflayer');
const express = require('express');
const app = express();

app.use(express.json());

// === CẤU HÌNH THÔNG TIN TÀI KHOẢN BOT ===
const config = {
  host: 'kingmc.vn',
  username: 'ipttdup',
  version: '1.20.1',
  matkhau: 'Sam270311'
};

let bot = null;
let farmInterval = null;
let botStatus = "Chưa kết nối";
let currentXYZ = "X: 0 | Y: 0 | Z: 0";

// GIAO DIỆN PANEL ĐIỀU KHIỂN NÚT BẤM (HTML/CSS)
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Minecraft Bot Control Panel</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #121212; color: #fff; text-align: center; padding: 20px; }
            .container { max-width: 650px; margin: 0 auto; background: #1e1e1e; padding: 30px; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.5); }
            h1 { color: #4CAF50; margin-bottom: 5px; }
            .status-box { background: #2d2d2d; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 5px solid #4CAF50; text-align: left; }
            .btn { background: #4CAF50; color: white; border: none; padding: 12px 20px; margin: 8px 5px; font-size: 15px; font-weight: bold; border-radius: 5px; cursor: pointer; transition: 0.3s; width: 45%; }
            .btn:hover { background: #45a049; transform: translateY(-2px); }
            .btn-danger { background: #f44336; } .btn-danger:hover { background: #da190b; }
            .btn-warning { background: #ff9800; } .btn-warning:hover { background: #e68a00; }
            .input-group { margin: 15px 0; }
            input[type="text"] { width: 70%; padding: 10px; border-radius: 5px; border: 1px solid #444; background: #333; color: white; }
        </style>
        <script>
            // Tự động cập nhật toạ độ và trạng thái liên tục mỗi 1.5 giây
            setInterval(async () => {
                const res = await fetch('/api/status');
                const data = await res.json();
                document.getElementById('status').innerText = data.status;
                document.getElementById('xyz').innerText = data.xyz;
            }, 1500);

            async function sendCommand(endpoint, data = {}) {
                await fetch('/api/' + endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
            }
            function executeChat() {
                const msg = document.getElementById('chatMsg').value;
                if(msg) { sendCommand('chat', { text: msg }); document.getElementById('chatMsg').value = ''; }
            }
        </script>
    </head>
    <body>
        <div class="container">
            <h1>🎮 PANEL ĐIỀU KHIỂN BOT</h1>
            <p>Nick Bot: <strong style="color:#ff9800;">${config.username}</strong> | IP: <strong>${config.host}</strong></p>
            
            <div class="status-box">
                <p>🟢 Vị trí hiện tại: <span id="status" style="font-weight:bold; color:#4CAF50;">${botStatus}</span></p>
                <p>📍 Toạ độ thực tế (XYZ): <span id="xyz" style="font-weight:bold; color:#ff9800;">${currentXYZ}</span></p>
            </div>

            <h3>⚡ NÚT BẤM ĐIỀU KHIỂN TỪ XA ⚡</h3>
            <button class="btn" onclick="sendCommand('start')">🔌 Kết nối Bot vào Server</button>
            <button class="btn btn-danger" onclick="sendCommand('stop')">❌ Ngắt kết nối Bot (Tắt hẳn)</button>
            <button class="btn btn-warning" onclick="sendCommand('open-menu')">⏰ Cầm Đồng Hồ & Mở Menu</button>
            <button class="btn btn-warning" onclick="sendCommand('click-kingsmp')">🧱 Click Ô 24 vào KingSMP</button>
            <button class="btn" onclick="sendCommand('tpaccept')">🛸 Đồng ý dịch chuyển (/tpaccept)</button>
            <button class="btn" onclick="sendCommand('jump')">🦘 Nhảy tại chỗ (Chống AFK)</button>

            <h3>💬 GỬI LỆNH CHAT TRỰC TIẾP</h3>
            <div class="input-group">
                <input type="text" id="chatMsg" placeholder="Ví dụ: /dn Matkhau của bạn hoặc tin nhắn...">
                <button class="btn" style="width:20%; padding:10px; margin:0;" onclick="executeChat()">Gửi</button>
            </div>
        </div>
    </body>
    </html>
  `);
});

// API ĐỒNG BỘ TRẠNG THÁI RA WEB
app.get('/api/status', (req, res) => {
  res.json({ status: botStatus, xyz: currentXYZ });
});

// HÀM VẬN HÀNH BOT MINECRAFT
function connectBot() {
  if (bot) return;
  botStatus = "Đang kết nối vào máy chủ...";

  bot = mineflayer.createBot({
    host: config.host,
    username: config.username,
    version: config.version
  });

  bot.on('login', () => { 
    botStatus = "Đang ở Sảnh chờ Lobby (Hãy gõ lệnh đăng nhập)";
    console.log(`[OK] Bot ${bot.username} da vao mang.`); 
  });

  bot.on('spawn', () => {
    // Đo thời gian thực tọa độ gửi lên giao diện web
    setInterval(() => {
      if (bot && bot.entity && bot.entity.position) {
        const pos = bot.entity.position;
        currentXYZ = `X: ${Math.round(pos.x)} | Y: ${Math.round(pos.y)} | Z: ${Math.round(pos.z)}`;
        if (Math.round(pos.z) > 40 || Math.round(pos.x) > 10) {
            botStatus = "Đã vào thế giới chính cụm KingSMP thành công! 🎉";
        }
      }
    }, 1000);

    // Chế độ siêu farm tự động chém quái
    if (farmInterval) clearInterval(farmInterval);
    farmInterval = setInterval(() => {
      if (bot && bot.entity) {
        const target = bot.nearestEntity((entity) => entity.type === 'mob');
        if (target) bot.attack(target); 
      }
    }, 1000); 
  });

  bot.on('windowOpen', (window) => { botStatus = "Menu Đồng hồ đã mở! Sẵn sàng bấm nút click chọn cụm."; });
  bot.on('error', (err) => { botStatus = "Lỗi hệ thống: " + err.message; bot = null; });
  
  bot.on('end', (reason) => {
    botStatus = "Bot đã ngắt kết nối.";
    bot = null;
    clearInterval(farmInterval);
  });
}

// XỬ LÝ DỮ LIỆU TỪ WEB GỬI VỀ MÁY CHỦ BOT
app.post('/api/start', (req, res) => { connectBot(); res.sendStatus(200); });
app.post('/api/stop', (req, res) => { if(bot) { bot.quit(); bot = null; } res.sendStatus(200); });
app.post('/api/chat', (req, res) => { if(bot) bot.chat(req.body.text); res.sendStatus(200); });
app.post('/api/tpaccept', (req, res) => { if(bot) bot.chat('/tpaccept'); res.sendStatus(200); });
app.post('/api/jump', (req, res) => { if(bot) { bot.setControlState('jump', true); setTimeout(() => bot.setControlState('jump', false), 500); } res.sendStatus(200); });

app.post('/api/open-menu', (req, res) => {
  if(bot) {
    bot.setQuickBarSlot(4); 
    setTimeout(() => { bot.activateItem(); }, 1000);
  }
  res.sendStatus(200);
});

app.post('/api/click-kingsmp', (req, res) => {
  if(bot) {
    // Sửa thành ô số 24 chính xác tuyệt đối dựa theo ảnh lồng ngực 3 hàng thực tế của bạn
    bot.clickWindow(24, 0, 0).catch(e => console.log(e.message));
  }
  res.sendStatus(200);
});

app.listen(process.env.PORT || 3000, () => { console.log('Web server san sang.'); });
