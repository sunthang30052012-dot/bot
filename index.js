const mineflayer = require('mineflayer');
const express = require('express');
const app = express();

app.get('/', (req, res) => { res.send('Bot KingMC dang hoat dong!'); });
app.listen(process.env.PORT || 3000, () => { console.log('Web server da san sang.'); });

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
let daVaoCumChinh = false;

function startBot() {
  bot = mineflayer.createBot({
    host: config.host,
    username: config.username,
    version: config.version
  });

  bot.on('login', () => { 
    console.log(`[OK] Bot ${bot.username} da vao mang.`); 
    daVaoCumChinh = false; 
  });

  bot.on('spawn', () => {
    console.log('[INFO] Bot da xuat hien.');
    
    // Tự động gõ lệnh đăng nhập /dn sau khi vào sảnh 2 giây
    setTimeout(() => {
      bot.chat(`/dn ${config.matkhau}`);
      console.log('[AUTH] Da tu dong go /dn.');
    }, 2000);

    // Tự động check XYZ in Logs Render (Cứ 5 giây / 1 lần)
    if (xyzInterval) clearInterval(xyzInterval);
    xyzInterval = setInterval(() => {
      if (bot.entity && bot.entity.position) {
        const pos = bot.entity.position;
        console.log(`[CHECK XYZ] Vi tri: X: ${Math.round(pos.x)} | Y: ${Math.round(pos.y)} | Z: ${Math.round(pos.z)}`);
      }
    }, 5000);

    // Chế độ siêu farm: Tự động quét và tấn công quái vật đứng sát cạnh bot
    if (farmInterval) clearInterval(farmInterval);
    farmInterval = setInterval(() => {
      if (bot.entity && daVaoCumChinh) { 
        const target = bot.nearestEntity((entity) => entity.type === 'mob');
        if (target) bot.attack(target); 
      }
    }, 1000); 
  });

  // BỘ NHẬN DIỆN LỆNH CLICK MENU (Dùng để vượt sảnh chờ theo ý bạn)
  bot.on('windowOpen', (window) => {
    console.log('[MENU] Da mo Menu Dong ho thanh cong.');
  });

  // =========================================================================
  // ⚡ TRUNG TÂM ĐIỀU KHIỂN TỪ XA QUA CHAT GAME (CHAT-CONTROLLED) ⚡
  // Bất kể bot đang ở sảnh chờ hay cụm chính, bạn gõ lệnh trong game bot sẽ làm theo
  // =========================================================================
  bot.on('chat', async (username, message) => {
    // Để bảo mật, bot chỉ nghe lệnh gõ từ tài khoản chính của bạn.
    // HÃY ĐỔI CHỮ 'Tên_Nick_Chính_Của_Bạn' THÀNH TÊN NHÂN VẬT THẬT BẠN ĐANG CHƠI TRÊN PC
    const chuNhan = 'Tên_Nick_Chính_Của_Bạn'; 
    
    if (username !== chuNhan) return; // Nếu người khác gõ, bot sẽ phớt lờ

    const msg = message.toLowerCase();

    // 1. Lệnh bảo bot tự gõ một lệnh chat bất kỳ (Ví dụ bạn chat: bot chat /smp)
    if (msg.startsWith('bot chat ')) {
      const commandToRun = message.substring(9); // Lấy đoạn chữ phía sau chữ 'bot chat '
      bot.chat(commandToRun);
      console.log(`[REMOTE] Da ra lenh bot chat: ${commandToRun}`);
    }

    // 2. Lệnh bảo bot cầm đồng hồ mở Menu (Bạn chat: bot mo menu)
    if (msg === 'bot mo menu') {
      bot.setQuickBarSlot(4); // Ô số 5 trên thanh công cụ
      setTimeout(() => {
        bot.activateItem(); // Bấm chuột phải mở thực đơn
        console.log('[REMOTE] Da ra lenh bot mo Menu Dong ho.');
      }, 500);
    }

    // 3. Lệnh bảo bot tự click chuột vào ô số mấy trong Menu (Bạn chat: bot click 35)
    if (msg.startsWith('bot click ')) {
      const slotId = parseInt(msg.substring(10)); // Lấy số ô phía sau chữ 'bot click '
      try {
        daVaoCumChinh = true; // Khóa sảnh để vào cụm farm
        await bot.clickWindow(slotId, 0, 0); // Click chuột trái ảo vào ô đó
        console.log(`[REMOTE] Da ra lenh bot click vao Slot ID: ${slotId}`);
      } catch (err) {
        console.log(`[REMOTE] Click loi: ${err.message}`);
      }
    }

    // 4. Lệnh bảo bot đồng ý dịch chuyển ngay lập tức (Bạn chat: bot vao day)
    if (msg === 'bot vao day' || msg.includes('tpa') || msg.includes('tpahere')) {
      bot.chat('/tpaccept');
      console.log('[REMOTE] Da ra lenh bot dong y dich chuyen /tpaccept.');
    }

    // 5. Lệnh bắt bot nhảy lên tại chỗ (Bạn chat: bot nhay)
    if (msg === 'bot nhay') {
      bot.setControlState('jump', true);
      setTimeout(() => bot.setControlState('jump', false), 500);
      console.log('[REMOTE] Da ra lenh bot nhay.');
    }
  });
  // =========================================================================

  bot.on('end', (reason) => {
    console.log(`[RECONNECT] Mat ket noi: ${reason}. Vao lai sau 30s...`);
    clearInterval(farmInterval);
    clearInterval(xyzInterval);
    setTimeout(startBot, 30000);
  });
  
  bot.on('error', (err) => { console.log(`[LOI] ${err.message}`); });
}

startBot();
