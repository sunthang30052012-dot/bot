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

function startBot() {
  bot = mineflayer.createBot({
    host: config.host,
    username: config.username,
    version: config.version
  });

  bot.on('login', () => { 
    console.log(`[OK] Bot ${bot.username} da vao mang.`); 
  });

  bot.on('spawn', () => {
    console.log('[INFO] Bot da xuat hien tai sanh cho.');
    
    // 1. Tự động gõ lệnh đăng nhập /dn sau khi vào sảnh 2 giây
    setTimeout(() => {
      bot.chat(`/dn ${config.matkhau}`);
      console.log('[AUTH] Da tu dong go /dn.');
    }, 2000);

    // 2. CƠ CHẾ ĐÂM CỔNG CHUYỂN CỤM: Đợi 5 giây đăng nhập xong, tự xoay góc chuẩn nhìn thẳng và chạy
    setTimeout(async () => {
      console.log('[LOBBY] Dang quay mat huong thang va chay vao Cong dich chuyen...');
      try {
        // Nhìn thẳng về phía trước góc 0 độ để hướng vào tâm cổng dịch chuyển
        await bot.look(0, 0, true); 
        
        // Nhấn giữ phím đi thẳng (W) trong vòng 5 giây để đi xuyên qua cổng
        bot.setControlState('forward', true);
        
        setTimeout(() => {
          bot.setControlState('forward', false); // Thả phím ra
          console.log('[LOBBY] Da ket thuc chuoi chay bo.');
        }, 5000);
      } catch (err) {
        console.log(`[LOBBY] Loi cu dong: ${err.message}`);
      }
    }, 5000);

    // 3. TỰ ĐỘNG CHECK XYZ IN LOGS RENDER (Cứ 5 giây / 1 lần)
    if (xyzInterval) clearInterval(xyzInterval);
    xyzInterval = setInterval(() => {
      if (bot.entity && bot.entity.position) {
        const pos = bot.entity.position;
        console.log(`[CHECK XYZ] Vi tri: X: ${Math.round(pos.x)} | Y: ${Math.round(pos.y)} | Z: ${Math.round(pos.z)}`);
      }
    }, 5000);

    // 4. CHẾ ĐỘ SIÊU FARM: Tự động quét và tấn công quái vật đứng sát cạnh bot
    if (farmInterval) clearInterval(farmInterval);
    farmInterval = setInterval(() => {
      if (bot.entity) {
        const target = bot.nearestEntity((entity) => entity.type === 'mob');
        if (target) {
          bot.attack(target); 
        }
      }
    }, 1000); 
  });

  // 5. TỰ ĐỘNG ĐỒNG Ý LỆNH DỊCH CHUYỂN (/tpaccept) KHI BẠN GỌI Ở CỤM CHÍNH
  bot.on('chat', (username, message) => {
    if (message.includes('muon dich chuyen') || message.includes('tpa') || message.includes('tpahere')) {
      setTimeout(() => {
        bot.chat('/tpaccept');
        console.log(`[TELEPORT] Da tu dong nhan lenh /tpaccept tu: ${username}`);
      }, 2000);
    }
  });

  bot.on('end', (reason) => {
    console.log(`[RECONNECT] Mat ket noi: ${reason}. Vao lai sau 30s...`);
    clearInterval(farmInterval);
    clearInterval(xyzInterval);
    setTimeout(startBot, 30000);
  });
  
  bot.on('error', (err) => { console.log(`[LOI] ${err.message}`); });
}

startBot();
