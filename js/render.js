let terrainCanvas = null;

function rebuildTerrain() {
  terrainFeatures = [];
  const width = WORLD_WIDTH;
  const height = WORLD_HEIGHT;
  for (let i = 0; i < 70; i++) {
    terrainFeatures.push({
      type: 'grass',
      x: Math.random() * width,
      y: Math.random() * height,
      r: 40 + Math.random() * 90,
      shade: Math.random() < 0.5 ? '#3f5328' : '#2c4020'
    });
  }
  for (let i = 0; i < 18; i++) {
    terrainFeatures.push({
      type: 'hill',
      x: Math.random() * width,
      y: Math.random() * height,
      r: 70 + Math.random() * 110
    });
  }
  for (let i = 0; i < 16; i++) {
    terrainFeatures.push({
      type: 'rock',
      x: Math.random() * width,
      y: Math.random() * height,
      r: 10 + Math.random() * 18,
      shade: `hsl(${28 + Math.random() * 18}, 14%, ${28 + Math.random() * 12}%)`
    });
  }
  for (let i = 0; i < 34; i++) {
    terrainFeatures.push({
      type: 'tree',
      x: Math.random() * width,
      y: Math.random() * height,
      r: 16 + Math.random() * 18,
      shade: `hsl(${108 + Math.random() * 36}, 32%, ${18 + Math.random() * 10}%)`
    });
  }
  for (let i = 0; i < 2; i++) {
    const points = [];
    let x = 200 + Math.random() * (width - 400);
    let y = 40;
    points.push({ x, y });
    for (let j = 0; j < 5; j++) {
      x += (Math.random() - 0.5) * 420;
      y += height / 5;
      points.push({ x, y });
    }
    terrainFeatures.push({ type: 'path', points, width: 18 + Math.random() * 16 });
  }
  const river = [];
  let rx = width * (0.42 + Math.random() * 0.16);
  for (let j = 0; j <= 7; j++) {
    river.push({ x: rx + Math.sin(j) * 80, y: j * (height / 7) });
    rx += (Math.random() - 0.5) * 160;
  }
  terrainFeatures.push({ type: 'river', points: river, width: 34 });

  terrainCanvas = document.createElement('canvas');
  terrainCanvas.width = width;
  terrainCanvas.height = height;
  const g = terrainCanvas.getContext('2d');
  const sky = g.createLinearGradient(0, 0, width, height);
  sky.addColorStop(0, '#6d7a45');
  sky.addColorStop(0.45, '#5a6a3d');
  sky.addColorStop(1, '#465433');
  g.fillStyle = sky;
  g.fillRect(0, 0, width, height);

  for (let i = 0; i < 900; i++) {
    g.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.05)';
    g.fillRect(Math.random() * width, Math.random() * height, 2, 2);
  }

  terrainFeatures.forEach((feature) => {
    if (feature.type === 'grass') {
      g.fillStyle = feature.shade;
      g.globalAlpha = 0.35;
      g.beginPath();
      g.ellipse(feature.x, feature.y, feature.r * 1.3, feature.r, 0, 0, Math.PI * 2);
      g.fill();
      g.globalAlpha = 1;
    } else if (feature.type === 'hill') {
      const hill = g.createRadialGradient(feature.x, feature.y, 10, feature.x, feature.y, feature.r);
      hill.addColorStop(0, 'rgba(214, 196, 150, 0.28)');
      hill.addColorStop(1, 'rgba(214, 196, 150, 0)');
      g.fillStyle = hill;
      g.beginPath();
      g.ellipse(feature.x, feature.y, feature.r * 1.25, feature.r * 0.82, 0, 0, Math.PI * 2);
      g.fill();
    } else if (feature.type === 'rock') {
      g.fillStyle = feature.shade;
      g.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const radius = feature.r * (0.75 + Math.sin(i * 2.1) * 0.25);
        const px = feature.x + Math.cos(angle) * radius;
        const py = feature.y + Math.sin(angle) * radius * 0.72;
        if (i === 0) g.moveTo(px, py);
        else g.lineTo(px, py);
      }
      g.closePath();
      g.fill();
    } else if (feature.type === 'path' || feature.type === 'river') {
      g.strokeStyle = feature.type === 'river' ? 'rgba(63, 112, 148, 0.8)' : 'rgba(112, 86, 52, 0.55)';
      g.lineWidth = feature.width;
      g.lineCap = 'round';
      g.lineJoin = 'round';
      g.beginPath();
      feature.points.forEach((point, index) => {
        if (index === 0) g.moveTo(point.x, point.y);
        else g.lineTo(point.x, point.y);
      });
      g.stroke();
      if (feature.type === 'river') {
        g.strokeStyle = 'rgba(196, 224, 232, 0.35)';
        g.lineWidth = Math.max(3, feature.width * 0.18);
        g.stroke();
      }
    }
  });

  terrainFeatures.filter((feature) => feature.type === 'tree').forEach((feature) => {
    g.fillStyle = '#3d2817';
    g.fillRect(feature.x - 2, feature.y, 4, feature.r * 0.7);
    g.fillStyle = feature.shade;
    g.beginPath();
    g.arc(feature.x, feature.y - feature.r * 0.15, feature.r * 0.62, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = 'rgba(255,255,255,0.08)';
    g.beginPath();
    g.arc(feature.x - feature.r * 0.15, feature.y - feature.r * 0.28, feature.r * 0.28, 0, Math.PI * 2);
    g.fill();
  });

  g.strokeStyle = 'rgba(32, 24, 16, 0.45)';
  g.lineWidth = 8;
  g.strokeRect(6, 6, width - 12, height - 12);
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const mag = shake > 0 ? shake : 0;
  const sx = mag ? (Math.random() - 0.5) * mag : 0;
  const sy = mag ? (Math.random() - 0.5) * mag : 0;
  ctx.save();
  ctx.translate(sx, sy);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-camera.x, -camera.y);
  if (terrainCanvas) ctx.drawImage(terrainCanvas, 0, 0);
  drawPlacementGuides();
  drawDeadUnits();
  drawStrikes();
  drawUnits();
  drawProjectiles();
  drawParticles();
  drawMissMarkers();
  ctx.restore();
  drawVignette();
  drawMinimap();
  drawEventBanners();
  if (shake > 0) shake = Math.max(0, shake - 0.8);
}

function drawPlacementGuides() {
  if (gameState !== 'placing' || titleOpen) return;
  const mid = WORLD_WIDTH / 2;
  ctx.save();
  ctx.strokeStyle = 'rgba(243, 230, 207, 0.18)';
  ctx.setLineDash([12, 10]);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(mid, 0);
  ctx.lineTo(mid, WORLD_HEIGHT);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.font = '28px Cinzel, Palatino, serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(196, 69, 54, 0.45)';
  ctx.fillText(t('redHost'), mid / 2, 70);
  ctx.fillStyle = 'rgba(61, 168, 184, 0.5)';
  ctx.fillText(t('blueHost'), mid + mid / 2, 70);
  ctx.restore();
}

function drawVignette() {
  const vignette = ctx.createRadialGradient(
    canvas.width / 2, canvas.height / 2, canvas.width * 0.35,
    canvas.width / 2, canvas.height / 2, canvas.width * 0.72
  );
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(12, 9, 6, 0.28)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawUnits() {
  units.forEach((unit) => {
    if (!unit.alive) return;
    const teamColor = TEAM_COLORS[unit.team].main;
    let drawX = unit.x;
    let drawY = unit.y;
    if (unit.attackAnim > 0 && unit.attackAnimDir) {
      const maxDuration = unit.attackMode === 'melee' ? 0.3 : 0.18;
      const t = 1 - unit.attackAnim / maxDuration;
      const amount = Math.sin(Math.max(0, t) * Math.PI) * (unit.attackMode === 'melee' ? 8 : 4);
      const dir = unit.attackMode === 'melee' ? 1 : -1;
      drawX += unit.attackAnimDir.x * amount * dir;
      drawY += unit.attackAnimDir.y * amount * dir;
    }

    if (unit.behavior === 'aura') {
      ctx.beginPath();
      ctx.arc(drawX, drawY, unit.auraRadius || 140, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(230, 195, 106, 0.18)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    if ((unit.furyStacks || 0) > 0 && unit.furyTime > 0) {
      const pulse = 1 + Math.sin(animTime * 8 + unit.x * 0.01) * 0.08;
      ctx.beginPath();
      ctx.arc(drawX, drawY, unit.size * (1.35 + unit.furyStacks * 0.12) * pulse, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 170, 48, ${0.25 + unit.furyStacks * 0.12})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    const visual = unit.size * 1.9;
    drawUnitSprite(ctx, unit, drawX, drawY, visual, teamColor, unit.flashTimer > 0);

    const barW = Math.max(28, visual * 1.7);
    const barX = drawX - barW / 2;
    const barY = drawY - visual - 10;
    ctx.fillStyle = 'rgba(20,14,8,0.55)';
    ctx.fillRect(barX, barY, barW, 4);
    const ratio = Math.max(0, unit.currentHp / unit.maxHp);
    ctx.fillStyle = ratio > 0.55 ? teamColor : ratio > 0.28 ? '#e0b15a' : '#d4533c';
    ctx.fillRect(barX, barY, barW * ratio, 4);
  });
}

function drawProjectiles() {
  projectiles.forEach((shot) => {
    if (shot.kind === 'beam') {
      ctx.save();
      ctx.globalAlpha = Math.max(0, shot.life / shot.maxLife) * 0.75;
      ctx.strokeStyle = '#9be7a4';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(shot.x, shot.y);
      ctx.lineTo(shot.tx, shot.ty);
      ctx.stroke();
      ctx.restore();
      return;
    }
    const angle = Math.atan2(shot.y - shot.prevY, shot.x - shot.prevX);
    ctx.save();
    ctx.translate(shot.x, shot.y);
    ctx.rotate(angle);
    if (shot.kind === 'arrow' || shot.kind === 'javelin' || shot.kind === 'pilum') {
      ctx.strokeStyle = shot.kind === 'pilum' ? '#d5dbe3' : '#d7c4a1';
      ctx.lineWidth = shot.kind === 'javelin' ? 3 : 2;
      ctx.beginPath();
      ctx.moveTo(-14, 0);
      ctx.lineTo(2, 0);
      ctx.stroke();
      ctx.fillStyle = TEAM_COLORS[shot.team].main;
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(1, -3);
      ctx.lineTo(1, 3);
      ctx.fill();
    } else if (shot.kind === 'bolt' || shot.kind === 'scorpion') {
      ctx.strokeStyle = '#ece7df';
      ctx.lineWidth = shot.kind === 'scorpion' ? 3 : 2;
      ctx.beginPath();
      ctx.moveTo(-16, 0);
      ctx.lineTo(6, 0);
      ctx.stroke();
    } else if (shot.kind === 'bullet') {
      ctx.fillStyle = '#fff4c4';
      ctx.shadowColor = '#ffd56a';
      ctx.shadowBlur = 8;
      ctx.fillRect(-10, -1.5, 14, 3);
    } else if (shot.kind === 'stone') {
      ctx.fillStyle = '#8d9094';
      ctx.beginPath();
      ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#b7b1a8';
      ctx.beginPath();
      ctx.arc(0, 0, shot.kind === 'rock' ? 7 : 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(60,40,20,0.35)';
      ctx.stroke();
    }
    ctx.restore();
  });
}

function drawParticles() {
  particles = particles.filter((particle) => {
    particle.life -= 1 / 60;
    if (particle.life <= 0) return false;
    const alpha = Math.max(0, particle.life / particle.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    if (particle.type === 'spark' || particle.type === 'dust') {
      particle.x += (particle.vx || 0) / 60;
      particle.y += (particle.vy || 0) / 60;
      particle.vx *= 0.96;
      particle.vy *= 0.96;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, (particle.size || 2) * alpha, 0, Math.PI * 2);
      ctx.fill();
    } else {
      particle.y += (particle.vy || 0) / 60;
      ctx.font = particle.big ? 'bold 15px "IBM Plex Mono", ui-monospace, monospace' : 'bold 13px "IBM Plex Mono", ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(20,12,8,0.8)';
      ctx.strokeText(particle.text, particle.x, particle.y);
      ctx.fillStyle = particle.color;
      ctx.fillText(particle.text, particle.x, particle.y);
    }
    ctx.restore();
    return true;
  });
  if (particles.length > 140) particles.splice(0, particles.length - 140);
}

function drawMissMarkers() {
  missMarkers = missMarkers.filter((mark) => {
    mark.life -= 1 / 60;
    if (mark.life <= 0) return false;
    ctx.save();
    ctx.globalAlpha = Math.max(0, mark.life / 0.6) * 0.7;
    ctx.strokeStyle = '#f3e6cf';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(mark.x, mark.y, 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    return true;
  });
}

function drawDeadUnits() {
  deadUnits.forEach((dead) => {
    const progress = 1 - dead.deathTimer;
    ctx.save();
    ctx.globalAlpha = Math.max(0, dead.deathTimer) * 0.75;
    ctx.translate(dead.x, dead.y);
    ctx.rotate(dead.deathAngle * dead.deathDir * progress);
    ctx.scale(1 - progress * 0.25, 1 - progress * 0.25);
    drawUnitSprite(ctx, dead, 0, 0, dead.size, TEAM_COLORS[dead.team].main, false);
    ctx.restore();
  });
}

function drawStrikes() {
  strikes = strikes.filter((strike) => {
    strike.life -= 1 / 60;
    if (strike.life <= 0) return false;
    ctx.save();
    ctx.globalAlpha = Math.max(0, strike.life / strike.maxLife);
    ctx.strokeStyle = '#f4f0c8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    strike.points.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();
    ctx.restore();
    return true;
  });
}

function drawMinimap() {
  const g = minimapCtx;
  const mw = minimapCanvas.width;
  const mh = minimapCanvas.height;
  const sx = mw / WORLD_WIDTH;
  const sy = mh / WORLD_HEIGHT;
  g.clearRect(0, 0, mw, mh);
  g.fillStyle = '#24301c';
  g.fillRect(0, 0, mw, mh);
  if (terrainFeatures) {
    const river = terrainFeatures.find((feature) => feature.type === 'river');
    if (river) {
      g.strokeStyle = 'rgba(90, 150, 180, 0.8)';
      g.lineWidth = 2;
      g.beginPath();
      river.points.forEach((point, index) => {
        if (index === 0) g.moveTo(point.x * sx, point.y * sy);
        else g.lineTo(point.x * sx, point.y * sy);
      });
      g.stroke();
    }
  }
  units.forEach((unit) => {
    if (!unit.alive) return;
    g.fillStyle = unit.team === 'red' ? '#e05a4a' : '#3ec2cf';
    const size = unit.tags && unit.tags.includes('elephant') ? 4 : 2.5;
    g.fillRect(unit.x * sx - size / 2, unit.y * sy - size / 2, size, size);
  });
  g.strokeStyle = 'rgba(243,230,207,0.85)';
  g.lineWidth = 1;
  g.strokeRect(camera.x * sx, camera.y * sy, (canvas.width / camera.zoom) * sx, (canvas.height / camera.zoom) * sy);
  g.strokeStyle = 'rgba(212, 180, 131, 0.7)';
  g.strokeRect(0.5, 0.5, mw - 1, mh - 1);
}

function drawEventBanners() {
  eventBanners.forEach((banner, index) => {
    const alpha = Math.min(1, banner.life / 0.4);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = '700 22px Cinzel, Palatino, serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(16,10,6,0.82)';
    ctx.fillStyle = banner.color;
    const y = 78 + index * 32;
    ctx.strokeText(banner.text, canvas.width / 2, y);
    ctx.fillText(banner.text, canvas.width / 2, y);
    ctx.restore();
  });
}
