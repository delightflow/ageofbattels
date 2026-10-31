function darkenColor(hex, factor) {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgb(${Math.floor(r * factor)}, ${Math.floor(g * factor)}, ${Math.floor(b * factor)})`;
}

function spritePalette(teamColor, flash) {
  return {
    cloth: flash ? '#fff4df' : teamColor,
    clothDark: flash ? '#f0e2c8' : darkenColor(teamColor, 0.62),
    skin: flash ? '#fff' : '#e7c4a4',
    metal: flash ? '#fff' : '#d5dbe3',
    metalDark: flash ? '#ddd' : '#6e7884',
    wood: flash ? '#fff' : '#7a4b2a',
    woodDark: flash ? '#eee' : '#4a2d18',
    leather: flash ? '#fff' : '#8d5a32',
    horse: flash ? '#fff' : '#8a5a32',
    horseDark: flash ? '#eee' : '#5c3a20',
    elephant: flash ? '#fff' : '#8d8e90',
    elephantDark: flash ? '#eee' : '#5e6166',
    camel: flash ? '#fff' : '#c9a36a',
    dark: '#241c16',
    gold: flash ? '#fff' : '#e6c36a'
  };
}

function poly(g, points, fill) {
  g.beginPath();
  points.forEach((point, index) => {
    if (index === 0) g.moveTo(point[0], point[1]);
    else g.lineTo(point[0], point[1]);
  });
  g.closePath();
  g.fillStyle = fill;
  g.fill();
}

function disc(g, x, y, r, fill) {
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fillStyle = fill;
  g.fill();
}

function drawShadow(g, s) {
  g.fillStyle = 'rgba(20, 16, 10, 0.28)';
  g.beginPath();
  g.ellipse(0, s * 0.55, s * 0.85, s * 0.28, 0, 0, Math.PI * 2);
  g.fill();
}

function drawHead(g, s, pal, helm) {
  disc(g, 0, -s * 0.42, s * 0.16, pal.skin);
  if (helm === 'galea') {
    disc(g, 0, -s * 0.48, s * 0.17, pal.metal);
    g.fillStyle = pal.cloth;
    g.fillRect(-s * 0.04, -s * 0.66, s * 0.08, s * 0.16);
  } else if (helm === 'crest') {
    disc(g, 0, -s * 0.48, s * 0.18, pal.metalDark);
    g.fillStyle = pal.cloth;
    g.beginPath();
    g.ellipse(0, -s * 0.62, s * 0.08, s * 0.2, 0, 0, Math.PI * 2);
    g.fill();
  } else if (helm === 'kettle') {
    g.fillStyle = pal.metal;
    g.beginPath();
    g.ellipse(0, -s * 0.5, s * 0.22, s * 0.08, 0, 0, Math.PI * 2);
    g.fill();
    disc(g, 0, -s * 0.46, s * 0.14, pal.metalDark);
  } else if (helm === 'kabuto') {
    disc(g, 0, -s * 0.48, s * 0.17, pal.metalDark);
    g.strokeStyle = pal.gold;
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(-s * 0.16, -s * 0.5);
    g.lineTo(0, -s * 0.78);
    g.lineTo(s * 0.16, -s * 0.5);
    g.stroke();
  } else if (helm === 'nasal') {
    disc(g, 0, -s * 0.48, s * 0.17, pal.metal);
    g.fillStyle = pal.metalDark;
    g.fillRect(-s * 0.02, -s * 0.48, s * 0.04, s * 0.14);
  } else if (helm === 'bork') {
    g.fillStyle = '#f4efe4';
    g.fillRect(-s * 0.1, -s * 0.78, s * 0.2, s * 0.34);
    disc(g, 0, -s * 0.42, s * 0.15, pal.skin);
  } else if (helm === 'hood') {
    disc(g, 0, -s * 0.46, s * 0.2, pal.woodDark);
    disc(g, 0, -s * 0.42, s * 0.11, pal.skin);
  }
}

function drawShield(g, s, pal, kind) {
  g.fillStyle = pal.cloth;
  g.strokeStyle = pal.gold;
  g.lineWidth = 1;
  if (kind === 'scutum') {
    g.beginPath();
    g.ellipse(-s * 0.34, -s * 0.02, s * 0.16, s * 0.34, 0, 0, Math.PI * 2);
    g.fill();
    g.stroke();
    disc(g, -s * 0.34, -s * 0.02, s * 0.05, pal.metal);
  } else if (kind === 'aspis') {
    disc(g, -s * 0.36, -s * 0.02, s * 0.28, pal.cloth);
    g.stroke();
    disc(g, -s * 0.36, -s * 0.02, s * 0.08, pal.metal);
  } else if (kind === 'round') {
    disc(g, -s * 0.34, 0, s * 0.2, pal.cloth);
    g.beginPath();
    g.arc(-s * 0.34, 0, s * 0.2, 0, Math.PI * 2);
    g.stroke();
    disc(g, -s * 0.34, 0, s * 0.05, pal.metal);
  } else if (kind === 'kite') {
    poly(g, [[-s * 0.22, -s * 0.28], [-s * 0.5, -s * 0.2], [-s * 0.42, s * 0.28], [-s * 0.28, s * 0.34]], pal.cloth);
  } else if (kind === 'heater') {
    poly(g, [[-s * 0.22, -s * 0.22], [-s * 0.46, -s * 0.16], [-s * 0.34, s * 0.22], [-s * 0.22, s * 0.08]], pal.clothDark);
  } else if (kind === 'pelte') {
    g.beginPath();
    g.arc(-s * 0.32, 0, s * 0.16, 0.4, Math.PI - 0.2);
    g.fill();
  }
}

function drawHorse(g, s, body, dark, tack) {
  g.fillStyle = body;
  g.beginPath();
  g.ellipse(-s * 0.05, s * 0.05, s * 0.62, s * 0.26, 0, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.moveTo(s * 0.28, -s * 0.02);
  g.quadraticCurveTo(s * 0.55, -s * 0.2, s * 0.72, -s * 0.42);
  g.lineTo(s * 0.52, -s * 0.36);
  g.quadraticCurveTo(s * 0.4, -s * 0.08, s * 0.22, s * 0.02);
  g.fill();
  disc(g, s * 0.7, -s * 0.42, s * 0.1, body);
  g.fillStyle = dark;
  g.fillRect(-s * 0.42, s * 0.18, s * 0.1, s * 0.32);
  g.fillRect(-s * 0.16, s * 0.2, s * 0.1, s * 0.3);
  g.fillRect(s * 0.14, s * 0.2, s * 0.1, s * 0.3);
  g.fillRect(s * 0.38, s * 0.18, s * 0.1, s * 0.32);
  g.strokeStyle = dark;
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(-s * 0.62, -s * 0.02);
  g.quadraticCurveTo(-s * 0.86, s * 0.1, -s * 0.7, s * 0.32);
  g.stroke();
  g.fillStyle = tack;
  g.fillRect(-s * 0.28, -s * 0.08, s * 0.46, s * 0.1);
}

function drawRider(g, s, pal, helm) {
  g.fillStyle = pal.cloth;
  g.fillRect(-s * 0.14, -s * 0.42, s * 0.28, s * 0.36);
  drawHead(g, s * 0.85, pal, helm);
}

function drawBow(g, s, pal, tall) {
  g.strokeStyle = pal.wood;
  g.lineWidth = tall ? 2.4 : 1.8;
  g.beginPath();
  g.arc(s * 0.34, -s * 0.05, tall ? s * 0.48 : s * 0.32, -1.15, 1.15);
  g.stroke();
  g.strokeStyle = pal.metal;
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(s * 0.34, -s * (tall ? 0.5 : 0.34));
  g.lineTo(s * 0.34, s * (tall ? 0.4 : 0.24));
  g.stroke();
}

function drawSword(g, s, pal) {
  g.strokeStyle = pal.metal;
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(s * 0.22, -s * 0.05);
  g.lineTo(s * 0.48, -s * 0.42);
  g.stroke();
}

function drawSpear(g, s, pal, length) {
  g.strokeStyle = pal.wood;
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(s * 0.18, s * 0.2);
  g.lineTo(s * 0.34, -s * length);
  g.stroke();
  poly(g, [[s * 0.34, -s * length], [s * 0.26, -s * (length - 0.16)], [s * 0.42, -s * (length - 0.16)]], pal.metal);
}

function drawHuman(g, s, pal, opts) {
  g.fillStyle = pal.clothDark;
  g.fillRect(-s * 0.22, -s * 0.08, s * 0.44, s * 0.5);
  g.fillStyle = pal.cloth;
  g.fillRect(-s * 0.18, -s * 0.16, s * 0.36, s * 0.42);
  g.fillStyle = pal.leather;
  g.fillRect(-s * 0.08, s * 0.24, s * 0.07, s * 0.24);
  g.fillRect(s * 0.04, s * 0.24, s * 0.07, s * 0.24);
  drawHead(g, s, pal, opts.helm || 'none');
  if (opts.shield) drawShield(g, s, pal, opts.shield);
  if (opts.weapon === 'sword') drawSword(g, s, pal);
  if (opts.weapon === 'spear') drawSpear(g, s, pal, opts.spear || 0.9);
  if (opts.weapon === 'pike') drawSpear(g, s, pal, 1.45);
  if (opts.weapon === 'axe') {
    g.strokeStyle = pal.wood;
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(s * 0.2, s * 0.15);
    g.lineTo(s * 0.42, -s * 0.35);
    g.stroke();
    poly(g, [[s * 0.36, -s * 0.38], [s * 0.58, -s * 0.28], [s * 0.4, -s * 0.16]], pal.metal);
  }
  if (opts.weapon === 'bow') drawBow(g, s, pal, !!opts.tallBow);
  if (opts.weapon === 'gun') {
    g.fillStyle = pal.dark;
    g.fillRect(s * 0.12, -s * 0.12, s * 0.5, s * 0.08);
    g.fillStyle = pal.metalDark;
    g.fillRect(s * 0.55, -s * 0.1, s * 0.12, s * 0.05);
  }
  if (opts.weapon === 'crossbow') {
    g.strokeStyle = pal.woodDark;
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(s * 0.05, -s * 0.08);
    g.lineTo(s * 0.48, -s * 0.08);
    g.stroke();
    g.strokeStyle = pal.wood;
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(s * 0.4, -s * 0.28);
    g.lineTo(s * 0.4, s * 0.12);
    g.stroke();
  }
  if (opts.plume) {
    g.fillStyle = pal.cloth;
    g.fillRect(-s * 0.03, -s * 0.7, s * 0.06, s * 0.2);
  }
}

function drawElephantBody(g, s, pal, withTower) {
  g.fillStyle = pal.elephant;
  g.beginPath();
  g.ellipse(-s * 0.05, s * 0.02, s * 0.58, s * 0.32, 0, 0, Math.PI * 2);
  g.fill();
  disc(g, s * 0.42, -s * 0.08, s * 0.2, pal.elephant);
  g.strokeStyle = pal.elephantDark;
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(s * 0.55, s * 0.02);
  g.quadraticCurveTo(s * 0.78, s * 0.2, s * 0.62, s * 0.42);
  g.stroke();
  g.fillStyle = '#efe8dc';
  poly(g, [[s * 0.48, -s * 0.02], [s * 0.7, s * 0.08], [s * 0.5, s * 0.08]], '#f4efe6');
  g.fillStyle = pal.elephantDark;
  g.fillRect(-s * 0.4, s * 0.22, s * 0.12, s * 0.28);
  g.fillRect(-s * 0.16, s * 0.24, s * 0.12, s * 0.26);
  g.fillRect(s * 0.08, s * 0.24, s * 0.12, s * 0.26);
  g.fillRect(s * 0.28, s * 0.22, s * 0.12, s * 0.28);
  g.fillStyle = pal.cloth;
  g.fillRect(-s * 0.42, -s * 0.12, s * 0.7, s * 0.1);
  if (withTower) {
    g.fillStyle = pal.wood;
    g.fillRect(-s * 0.28, -s * 0.48, s * 0.42, s * 0.32);
    g.fillStyle = pal.woodDark;
    g.fillRect(-s * 0.32, -s * 0.52, s * 0.12, s * 0.08);
    g.fillRect(-s * 0.08, -s * 0.52, s * 0.12, s * 0.08);
    g.fillRect(s * 0.1, -s * 0.52, s * 0.1, s * 0.08);
    g.fillStyle = pal.cloth;
    g.fillRect(-s * 0.08, -s * 0.4, s * 0.1, s * 0.14);
  } else {
    g.fillStyle = pal.cloth;
    g.fillRect(-s * 0.12, -s * 0.36, s * 0.18, s * 0.2);
    disc(g, -s * 0.02, -s * 0.42, s * 0.07, pal.skin);
  }
}

function drawEngineFrame(g, s, pal) {
  g.fillStyle = pal.woodDark;
  g.fillRect(-s * 0.46, s * 0.16, s * 0.92, s * 0.16);
  disc(g, -s * 0.3, s * 0.38, s * 0.1, pal.dark);
  disc(g, s * 0.28, s * 0.38, s * 0.1, pal.dark);
  g.fillStyle = pal.cloth;
  g.fillRect(-s * 0.46, s * 0.12, s * 0.92, s * 0.05);
}

const SPRITES = {
  legion(g, s, pal, unit) {
    drawHuman(g, s, pal, { helm: 'galea', shield: 'scutum', weapon: unit.threw ? 'sword' : 'spear', spear: 0.85 });
  },
  spear(g, s, pal) {
    drawHuman(g, s, pal, { helm: 'crest', shield: 'round', weapon: 'spear', spear: 1.05 });
  },
  hoplite(g, s, pal) {
    drawHuman(g, s, pal, { helm: 'crest', shield: 'aspis', weapon: 'spear', spear: 1.0 });
  },
  pike(g, s, pal) {
    drawHuman(g, s, pal, { helm: 'kettle', weapon: 'pike' });
  },
  manatarms(g, s, pal) {
    drawHuman(g, s, pal, { helm: 'nasal', shield: 'heater', weapon: 'sword' });
    g.fillStyle = pal.metal;
    g.fillRect(-s * 0.18, -s * 0.16, s * 0.36, s * 0.12);
  },
  huscarl(g, s, pal) {
    drawHuman(g, s, pal, { helm: 'nasal', shield: 'round', weapon: 'axe' });
  },
  samurai(g, s, pal) {
    drawHuman(g, s, pal, { helm: 'kabuto', weapon: 'spear', spear: 0.95 });
    g.fillStyle = pal.gold;
    g.fillRect(-s * 0.18, -s * 0.02, s * 0.36, s * 0.04);
  },
  archer(g, s, pal) {
    drawHuman(g, s, pal, { helm: 'none', weapon: 'bow' });
  },
  longbow(g, s, pal) {
    drawHuman(g, s, pal, { helm: 'kettle', weapon: 'bow', tallBow: true });
  },
  crossbow(g, s, pal) {
    drawHuman(g, s, pal, { helm: 'kettle', shield: 'heater', weapon: 'crossbow' });
  },
  peltast(g, s, pal) {
    drawHuman(g, s, pal, { helm: 'none', shield: 'pelte', weapon: 'spear', spear: 0.7 });
  },
  slinger(g, s, pal) {
    drawHuman(g, s, pal, { helm: 'none' });
    g.strokeStyle = pal.leather;
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(s * 0.1, -s * 0.1);
    g.quadraticCurveTo(s * 0.4, -s * 0.35, s * 0.55, -s * 0.05);
    g.stroke();
    disc(g, s * 0.55, -s * 0.05, s * 0.05, pal.metalDark);
  },
  repeater(g, s, pal) {
    drawHuman(g, s, pal, { helm: 'none', weapon: 'crossbow' });
    g.fillStyle = pal.wood;
    g.fillRect(s * 0.18, -s * 0.2, s * 0.16, s * 0.18);
  },
  handgun(g, s, pal) {
    drawHuman(g, s, pal, { helm: 'kettle', weapon: 'gun' });
  },
  janissary(g, s, pal) {
    drawHuman(g, s, pal, { helm: 'bork', weapon: 'gun' });
  },
  lightcav(g, s, pal) {
    drawHorse(g, s, pal.horse, pal.horseDark, pal.cloth);
    drawRider(g, s, pal, 'none');
    drawSpear(g, s * 0.8, pal, 0.7);
  },
  knight(g, s, pal) {
    drawHorse(g, s, pal.horseDark, pal.dark, pal.cloth);
    g.fillStyle = pal.metal;
    g.fillRect(-s * 0.4, -s * 0.08, s * 0.55, s * 0.08);
    drawRider(g, s, pal, 'nasal');
    drawShield(g, s * 0.8, pal, 'kite');
    drawSpear(g, s, pal, 0.85);
  },
  cataphract(g, s, pal) {
    drawHorse(g, s, pal.metalDark, pal.dark, pal.cloth);
    g.fillStyle = pal.metal;
    g.fillRect(-s * 0.5, -s * 0.02, s * 0.85, s * 0.16);
    drawRider(g, s, pal, 'galea');
    drawSpear(g, s, pal, 1.0);
  },
  horsearcher(g, s, pal) {
    drawHorse(g, s * 0.92, pal.horse, pal.horseDark, pal.cloth);
    drawRider(g, s * 0.9, pal, 'none');
    drawBow(g, s * 0.75, pal, false);
  },
  camel(g, s, pal) {
    g.fillStyle = pal.camel;
    g.beginPath();
    g.ellipse(0, s * 0.08, s * 0.58, s * 0.22, 0, 0, Math.PI * 2);
    g.fill();
    disc(g, s * 0.08, -s * 0.12, s * 0.16, pal.camel);
    g.beginPath();
    g.moveTo(s * 0.35, 0);
    g.quadraticCurveTo(s * 0.62, -s * 0.1, s * 0.7, -s * 0.28);
    g.lineTo(s * 0.55, -s * 0.22);
    g.fill();
    g.fillRect(-s * 0.35, s * 0.2, s * 0.08, s * 0.28);
    g.fillRect(s * 0.22, s * 0.2, s * 0.08, s * 0.28);
    drawRider(g, s * 0.8, pal, 'none');
    drawSpear(g, s * 0.7, pal, 0.7);
  },
  chariot(g, s, pal) {
    drawHorse(g, s * 0.72, pal.horse, pal.horseDark, pal.cloth);
    g.fillStyle = pal.wood;
    g.fillRect(-s * 0.15, s * 0.02, s * 0.4, s * 0.22);
    g.strokeStyle = pal.woodDark;
    g.lineWidth = 2;
    g.beginPath();
    g.arc(-s * 0.05, s * 0.28, s * 0.12, 0, Math.PI * 2);
    g.stroke();
    g.beginPath();
    g.arc(s * 0.2, s * 0.28, s * 0.12, 0, Math.PI * 2);
    g.stroke();
    drawRider(g, s * 0.7, pal, 'none');
    drawBow(g, s * 0.6, pal, false);
  },
  elephant(g, s, pal) {
    drawElephantBody(g, s, pal, false);
  },
  howdah(g, s, pal) {
    drawElephantBody(g, s, pal, true);
  },
  mangonel(g, s, pal) {
    drawEngineFrame(g, s, pal);
    g.strokeStyle = pal.wood;
    g.lineWidth = 4;
    g.beginPath();
    g.moveTo(0, s * 0.1);
    g.lineTo(-s * 0.28, -s * 0.48);
    g.stroke();
    disc(g, -s * 0.28, -s * 0.5, s * 0.1, pal.metalDark);
  },
  trebuchet(g, s, pal) {
    g.strokeStyle = pal.woodDark;
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(-s * 0.3, s * 0.35);
    g.lineTo(0, -s * 0.55);
    g.lineTo(s * 0.3, s * 0.35);
    g.stroke();
    g.beginPath();
    g.moveTo(-s * 0.42, -s * 0.15);
    g.lineTo(s * 0.5, -s * 0.45);
    g.stroke();
    disc(g, -s * 0.4, -s * 0.12, s * 0.12, pal.dark);
    disc(g, s * 0.5, -s * 0.48, s * 0.08, pal.metalDark);
  },
  scorpion(g, s, pal) {
    drawEngineFrame(g, s, pal);
    g.strokeStyle = pal.wood;
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(-s * 0.2, -s * 0.05);
    g.lineTo(s * 0.45, -s * 0.18);
    g.stroke();
    g.strokeStyle = pal.metal;
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(s * 0.4, -s * 0.18);
    g.lineTo(s * 0.7, -s * 0.28);
    g.stroke();
    poly(g, [[s * 0.72, -s * 0.3], [s * 0.58, -s * 0.2], [s * 0.62, -s * 0.34]], pal.metal);
  },
  ram(g, s, pal) {
    g.fillStyle = pal.wood;
    poly(g, [[-s * 0.55, s * 0.05], [0, -s * 0.4], [s * 0.55, s * 0.05]], pal.woodDark);
    g.fillStyle = pal.wood;
    g.fillRect(-s * 0.5, s * 0.05, s * 1.0, s * 0.28);
    g.fillStyle = pal.leather;
    g.fillRect(-s * 0.5, -s * 0.02, s * 1.0, s * 0.08);
    g.fillStyle = pal.metalDark;
    g.fillRect(-s * 0.72, s * 0.12, s * 0.4, s * 0.08);
    disc(g, -s * 0.28, s * 0.4, s * 0.1, pal.dark);
    disc(g, s * 0.28, s * 0.4, s * 0.1, pal.dark);
  },
  chaplain(g, s, pal) {
    g.fillStyle = pal.woodDark;
    g.fillRect(-s * 0.2, -s * 0.12, s * 0.4, s * 0.55);
    drawHead(g, s, pal, 'hood');
    g.strokeStyle = pal.gold;
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(0, -s * 0.78);
    g.lineTo(0, -s * 0.58);
    g.moveTo(-s * 0.08, -s * 0.7);
    g.lineTo(s * 0.08, -s * 0.7);
    g.stroke();
    g.fillStyle = pal.cloth;
    g.fillRect(-s * 0.2, -s * 0.02, s * 0.4, s * 0.08);
  },
  signifer(g, s, pal) {
    drawHuman(g, s, pal, { helm: 'galea' });
    g.strokeStyle = pal.woodDark;
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(s * 0.18, s * 0.3);
    g.lineTo(s * 0.18, -s * 0.85);
    g.stroke();
    g.fillStyle = pal.cloth;
    g.beginPath();
    g.moveTo(s * 0.18, -s * 0.82);
    g.lineTo(s * 0.55, -s * 0.68);
    g.lineTo(s * 0.18, -s * 0.52);
    g.fill();
    disc(g, s * 0.18, -s * 0.9, s * 0.06, pal.gold);
  }
};

function drawUnitSprite(ctx, unit, x, y, size, teamColor, flash) {
  const sprite = SPRITES[unit.sprite] || SPRITES.spear;
  const pal = spritePalette(teamColor, flash);
  const facing = unit.facing || 1;
  const bob = unit.moving && typeof animTime === 'number'
    ? Math.sin(animTime * (unit.tags && unit.tags.includes('mounted') ? 10 : 8) + (unit.x || 0) * 0.05) * size * 0.05
    : 0;
  ctx.save();
  ctx.translate(x, y + bob);
  drawShadow(ctx, size);
  ctx.scale(facing, 1);
  if (unit.attackAnim > 0 && unit.attackMode === 'melee') {
    const t = Math.sin(Math.min(1, unit.attackAnim / 0.3) * Math.PI);
    ctx.strokeStyle = 'rgba(255,244,220,0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(size * 0.2, -size * 0.05, size * 0.45, -0.9, 0.7);
    ctx.globalAlpha = t;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  sprite(ctx, size, pal, unit);
  ctx.restore();
}
