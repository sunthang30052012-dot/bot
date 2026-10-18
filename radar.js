// File: radar.js - Quét block quanh bot và vẽ bản đồ ký tự nhìn từ trên xuống
const RADIUS = 8; // 8 => lưới 17x17

function blockChar(name) {
  if (name.includes('water')) return '~';
  if (name.includes('lava')) return '!';
  if (name.includes('leaves')) return '%';
  if (name.includes('log') || name.includes('wood')) return '|';
  if (name.includes('sand')) return ':';
  if (name.includes('snow') || name.includes('ice')) return '*';
  if (name.includes('grass') || name.includes('fern')) return '.';
  if (name.includes('dirt') || name.includes('path') || name.includes('mud')) return ',';
  if (name.includes('stone') || name.includes('deepslate') || name.includes('ore')) return '=';
  return '+';
}

function topBlock(bot, base, dx, dz) {
  for (let dy = 3; dy >= -4; dy--) {
    const b = bot.blockAt(base.offset(dx, dy, dz));
    if (b && b.name !== 'air' && b.name !== 'cave_air' && b.name !== 'void_air') {
      return { block: b, dy };
    }
  }
  return null;
}

function facing(yaw) {
  const deg = ((yaw * 180) / Math.PI + 360) % 360;
  const dirs = ['Bắc', 'Tây', 'Nam', 'Đông'];
  return dirs[Math.round(deg / 90) % 4];
}

function renderRadar(bot) {
  if (!bot || !bot.entity) return 'Bot chưa vào game...';
  const base = bot.entity.position.floored();

  const marks = new Map();
  for (const id in bot.entities) {
    const e = bot.entities[id];
    if (!e || e === bot.entity || !e.position) continue;
    const dx = Math.floor(e.position.x) - base.x;
    const dz = Math.floor(e.position.z) - base.z;
    if (Math.abs(dx) > RADIUS || Math.abs(dz) > RADIUS) continue;
    if (e.type === 'player') marks.set(dx + ',' + dz, 'P');
    else if (e.type === 'mob' || e.type === 'hostile') marks.set(dx + ',' + dz, 'M');
  }

  const lines = [];
  for (let dz = -RADIUS; dz <= RADIUS; dz++) {
    const row = [];
    for (let dx = -RADIUS; dx <= RADIUS; dx++) {
      let ch;
      if (dx === 0 && dz === 0) ch = '@';
      else if (marks.has(dx + ',' + dz)) ch = marks.get(dx + ',' + dz);
      else {
        const t = topBlock(bot, base, dx, dz);
        if (!t) ch = ' ';
        else if (t.dy >= 1 && !t.block.name.includes('water')) ch = '#';
        else ch = blockChar(t.block.name);
      }
      row.push(ch);
    }
    lines.push(row.join(' '));
  }

  const header = `Hướng nhìn: ${facing(bot.entity.yaw)}  |  Bắc ↑\n`;
  const legend = '\n@ Bot  P Người  M Mob  # Tường  . Cỏ  , Đất  = Đá  ~ Nước  ! Dung nham  | Gỗ  % Lá  : Cát';
  return header + lines.join('\n') + legend;
}

module.exports = { renderRadar };
