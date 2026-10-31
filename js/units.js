// Historical troop roster and counter rules for Age of Battels.
// Names are real troop types. They are not taken from any commercial game.
const UNIT_TYPES = [
  {
    id: 'swordsman', sprite: 'legion', group: 'foot', deploy: 'foot',
    name: { en: 'Roman Legionary', ko: '로마 군단병' },
    short: { en: 'Legionary', ko: '군단병' },
    era: { en: 'Late Republic', ko: '공화정 말기' },
    civ: { en: 'Roman Republic', ko: '로마 공화정' },
    weapon: { en: 'Gladius and pilum', ko: '글라디우스와 필룸' },
    armorName: { en: 'Lorica and scutum', ko: '로리카와 스쿠툼' },
    blurb: {
      en: 'Marian legionaries threw a heavy pilum to foul an enemy shield, then closed with the short gladius behind a tall scutum. The line was drilled to absorb a push and keep formation.',
      ko: '마리우스 개혁 이후의 군단병은 무거운 필룸으로 방패를 망가뜨린 뒤, 큰 스쿠툼 뒤에서 짧은 글라디우스로 붙었다. 밀어도 대열이 무너지지 않게 훈련된 보병이다.'
    },
    hp: 125, atk: 18, def: 12, speed: 1.7, range: 32, atkSpeed: 0.85,
    accuracy: 1, size: 13, type: 'melee', attackMode: 'melee', armorClass: 'infantry',
    tags: ['pilum', 'shieldwall'], rangedResist: 0.3, icon: '⚔️'
  },
  {
    id: 'spearman', sprite: 'spear', group: 'foot', deploy: 'foot',
    name: { en: 'Greek Spearman', ko: '그리스 창병' },
    short: { en: 'Spearman', ko: '창병' },
    era: { en: 'Classical Greece', ko: '고전 그리스' },
    civ: { en: 'Greek poleis', ko: '그리스 폴리스' },
    weapon: { en: 'Dory spear', ko: '도리 창' },
    armorName: { en: 'Linen cuirass, light shield', ko: '리넨 흉갑과 작은 방패' },
    blurb: {
      en: 'A dory was long enough to meet a horse before the rider could swing. Greek spearmen braced in files and used that reach to keep cavalry off the line.',
      ko: '도리 창은 기병이 칼을 휘두르기 전에 말에 닿을 만큼 길었다. 그리스 창병은 대열을 받치고 그 길이로 기병을 막았다.'
    },
    hp: 104, atk: 15, def: 8, speed: 1.6, range: 46, atkSpeed: 1.0,
    accuracy: 1, size: 13, type: 'melee', attackMode: 'melee', armorClass: 'infantry',
    tags: ['anticalv', 'polearm'], antiCav: 2.35, icon: '🔱'
  },
  {
    id: 'shieldman', sprite: 'hoplite', group: 'foot', deploy: 'foot',
    name: { en: 'Greek Hoplite', ko: '그리스 중장보병' },
    short: { en: 'Hoplite', ko: '중장보병' },
    era: { en: 'Archaic to Classical', ko: '고풍기–고전기' },
    civ: { en: 'Greek poleis', ko: '그리스 폴리스' },
    weapon: { en: 'Dory and aspis', ko: '도리와 아스피스' },
    armorName: { en: 'Bronze panoply', ko: '청동 중무장' },
    blurb: {
      en: 'The hoplite shield, the aspis, covered the bearer and the man to his left. Overlapping shields were built to shrug off arrows and javelins until the spears met.',
      ko: '중장보병의 방패 아스피스는 자신과 왼쪽 동료를 함께 가렸다. 겹친 방패는 창이 맞부딪치기 전까지 화살과 투창을 받아 내도록 만들어졌다.'
    },
    hp: 168, atk: 15, def: 15, speed: 1.28, range: 40, atkSpeed: 0.95,
    accuracy: 1, size: 14, type: 'melee', attackMode: 'melee', armorClass: 'infantry',
    tags: ['anticalv', 'shieldwall', 'polearm'], antiCav: 1.5, rangedResist: 0.5, icon: '🛡️'
  },
  {
    id: 'pikeman', sprite: 'pike', group: 'foot', deploy: 'foot',
    name: { en: 'Swiss Pikeman', ko: '스위스 장창병' },
    short: { en: 'Pikeman', ko: '장창병' },
    era: { en: '15th century', ko: '15세기' },
    civ: { en: 'Old Swiss Confederacy', ko: '구스위스 동맹' },
    weapon: { en: 'Pike, about 5 meters', ko: '약 5미터 파이크' },
    armorName: { en: 'Partial plate over mail', ko: '사슬 위의 부분 판금' },
    blurb: {
      en: 'Swiss pike squares broke Burgundian chivalry by presenting a moving hedge of points. Horses will not willingly charge a settled pike formation.',
      ko: '스위스 장창 방진은 끝없이 이어진 창끝으로 부르고뉴 기사를 무너뜨렸다. 대열이 선 파이크를 말은 좀처럼 들이받지 않는다.'
    },
    hp: 116, atk: 16, def: 10, speed: 1.38, range: 58, atkSpeed: 1.12,
    accuracy: 1, size: 13, type: 'melee', attackMode: 'melee', armorClass: 'infantry',
    tags: ['anticalv', 'polearm'], antiCav: 2.85, icon: '📏'
  },
  {
    id: 'manatarms', sprite: 'manatarms', group: 'foot', deploy: 'foot',
    name: { en: 'Man-at-Arms', ko: '맨앳암즈' },
    short: { en: 'Man-at-Arms', ko: '맨앳암즈' },
    era: { en: '15th century', ko: '15세기' },
    civ: { en: 'Western Europe', ko: '서유럽' },
    weapon: { en: 'Arming sword', ko: '아밍 소드' },
    armorName: { en: 'Full plate', ko: '전신 판금' },
    blurb: {
      en: 'A dismounted man-at-arms wore the same plate as a knight and fought in the front rank. Plate turns cuts; a pike hedge or a gun volley was the practical answer.',
      ko: '말에서 내린 맨앳암즈는 기사와 같은 판금을 입고 앞열에서 싸웠다. 판금은 베임을 막지만, 장창 숲이나 총 일제 사격에는 약했다.'
    },
    hp: 178, atk: 21, def: 17, speed: 1.42, range: 32, atkSpeed: 0.98,
    accuracy: 1, size: 14, type: 'melee', attackMode: 'melee', armorClass: 'infantry',
    tags: ['heavy', 'shieldwall'], rangedResist: 0.12, icon: '🗡️'
  },
  {
    id: 'huscarl', sprite: 'huscarl', group: 'foot', deploy: 'foot',
    name: { en: 'Housecarl', ko: '허스칼' },
    short: { en: 'Housecarl', ko: '허스칼' },
    era: { en: '11th century', ko: '11세기' },
    civ: { en: 'Anglo-Saxon England', ko: '앵글로색슨 잉글랜드' },
    weapon: { en: 'Dane axe', ko: '데인 액스' },
    armorName: { en: 'Mail and round shield', ko: '사슬갑과 원형 방패' },
    blurb: {
      en: 'Housecarls were the king’s household troops. At Hastings they held the ridge on foot with two-handed axes until the shield wall was pulled apart.',
      ko: '허스칼은 왕의 친위 전사였다. 헤이스팅스에서 그들은 양손 도끼로 능선을 지키다, 방패벽이 흩어진 뒤에야 무너졌다.'
    },
    hp: 148, atk: 23, def: 11, speed: 1.62, range: 36, atkSpeed: 0.92,
    accuracy: 1, size: 14, type: 'melee', attackMode: 'melee', armorClass: 'infantry',
    tags: ['axe', 'shieldwall'], vsClass: { ranged: 1.35 }, rangedResist: 0.2, icon: '🪓'
  },
  {
    id: 'samurai', sprite: 'samurai', group: 'foot', deploy: 'foot',
    name: { en: 'Sengoku Samurai', ko: '전국시대 사무라이' },
    short: { en: 'Samurai', ko: '사무라이' },
    era: { en: 'Sengoku period', ko: '센고쿠 시대' },
    civ: { en: 'Japan', ko: '일본' },
    weapon: { en: 'Katana and yari', ko: '카타나와 야리' },
    armorName: { en: 'Lamellar dou and kabuto', ko: '찰갑 동과 투구' },
    blurb: {
      en: 'Sengoku samurai led from the front in lacquered lamellar, with a spear for the field and a katana once the lines broke. They were professional soldiers, not duelists alone.',
      ko: '전국시대 사무라이는 옻칠 찰갑을 입고 앞장섰다. 들판에서는 창을, 대열이 무너지면 카타나를 썼다. 결투사가 아니라 직업 군인이었다.'
    },
    hp: 142, atk: 24, def: 13, speed: 1.72, range: 36, atkSpeed: 0.88,
    accuracy: 1, size: 14, type: 'melee', attackMode: 'melee', armorClass: 'infantry',
    tags: ['heavy'], vsClass: { infantry: 1.28 }, icon: '🏯'
  },
  {
    id: 'archer', sprite: 'archer', group: 'missile', deploy: 'missile',
    name: { en: 'Composite Archer', ko: '합성궁 궁수' },
    short: { en: 'Archer', ko: '궁수' },
    era: { en: 'Antiquity', ko: '고대' },
    civ: { en: 'Achaemenid Persia', ko: '아케메네스 페르시아' },
    weapon: { en: 'Composite bow', ko: '합성궁' },
    armorName: { en: 'Quilted cloth', ko: '누비 옷' },
    blurb: {
      en: 'Horn, wood, and sinew made a short bow that still hit hard. Persian archers showered a line before the sparabara shields closed. They fold if cavalry reaches them.',
      ko: '뿔과 나무, 힘줄을 붙인 짧은 활도 세게 맞았다. 페르시아 궁수는 방패벽이 붙기 전에 화살비를 퍼부었다. 기병이 붙으면 무너진다.'
    },
    hp: 66, atk: 14, def: 3, speed: 1.72, range: 200, atkSpeed: 1.05,
    accuracy: 0.8, size: 12, type: 'ranged', attackMode: 'ranged', armorClass: 'ranged',
    tags: ['arrow', 'archer'], shot: 'arrow', icon: '🏹'
  },
  {
    id: 'longbow', sprite: 'longbow', group: 'missile', deploy: 'missile',
    name: { en: 'Welsh Longbowman', ko: '웨일스 장궁병' },
    short: { en: 'Longbow', ko: '장궁' },
    era: { en: '14th–15th century', ko: '14–15세기' },
    civ: { en: 'Wales and England', ko: '웨일스와 잉글랜드' },
    weapon: { en: 'Yew longbow', ko: '주목 장궁' },
    armorName: { en: 'Jack and buckler', ko: '잭과 작은 버클러' },
    blurb: {
      en: 'A yew longbow of war draw sent a heavy arrow past two hundred paces. At Agincourt, mud and arrow storms stopped French cavalry before the knights could close.',
      ko: '전쟁용 주목 장궁은 무거운 화살을 200보 넘게 날렸다. 아쟁쿠르에서 진흙과 화살비는 프랑스 기병이 붙기 전에 말을 세웠다.'
    },
    hp: 70, atk: 17, def: 4, speed: 1.55, range: 255, atkSpeed: 1.18,
    accuracy: 0.84, size: 12, type: 'ranged', attackMode: 'ranged', armorClass: 'ranged',
    tags: ['arrow', 'archer', 'longrange'], shot: 'arrow', icon: '🏹'
  },
  {
    id: 'crossbow', sprite: 'crossbow', group: 'missile', deploy: 'missile',
    name: { en: 'Genoese Crossbowman', ko: '제노바 쇠뇌병' },
    short: { en: 'Crossbow', ko: '쇠뇌' },
    era: { en: '14th century', ko: '14세기' },
    civ: { en: 'Republic of Genoa', ko: '제노바 공화국' },
    weapon: { en: 'Steel crossbow', ko: '강철 쇠뇌' },
    armorName: { en: 'Mail and pavise', ko: '사슬갑과 파비스' },
    blurb: {
      en: 'A spanned steel bow launched a quarrel with enough force to worry a man in plate. It was slow to reload, which is why Genoese crews carried a pavise shield.',
      ko: '당긴 강철 활은 판금을 입은 사람도 불안하게 만드는 볼트를 날렸다. 재장전이 느려서 제노바 쇠뇌병은 파비스 방패를 들고 다녔다.'
    },
    hp: 82, atk: 25, def: 6, speed: 1.18, range: 175, atkSpeed: 1.95,
    accuracy: 0.86, size: 12, type: 'ranged', attackMode: 'ranged', armorClass: 'ranged',
    tags: ['pierce', 'archer'], shot: 'bolt', icon: '🎯'
  },
  {
    id: 'skirmisher', sprite: 'peltast', group: 'missile', deploy: 'missile',
    name: { en: 'Peltast', ko: '펠타스트' },
    short: { en: 'Peltast', ko: '투창병' },
    era: { en: 'Classical Greece', ko: '고전 그리스' },
    civ: { en: 'Thrace and Athens', ko: '트라키아와 아테네' },
    weapon: { en: 'Javelins and pelte', ko: '투창과 펠테' },
    armorName: { en: 'Little or none', ko: '거의 없음' },
    blurb: {
      en: 'Peltasts threw javelins and gave ground. At Lechaeum, Iphicrates’ light troops wore down a Spartan mora that could not catch them. Caught in the open, they are fragile.',
      ko: '펠타스트는 투창을 던지고 물러섰다. 레카이움에서 이피크라테스의 경보병은 쫓아오지 못하는 스파르타 부대를 깎아 냈다. 붙잡히면 약하다.'
    },
    hp: 58, atk: 11, def: 3, speed: 2.2, range: 128, atkSpeed: 0.88,
    accuracy: 0.76, size: 11, type: 'ranged', attackMode: 'ranged', armorClass: 'ranged',
    tags: ['skirmish', 'kite', 'javelin'], shot: 'javelin', icon: '🪶'
  },
  {
    id: 'slinger', sprite: 'slinger', group: 'missile', deploy: 'missile',
    name: { en: 'Balearic Slinger', ko: '발레아레스 투석병' },
    short: { en: 'Slinger', ko: '투석병' },
    era: { en: '3rd century BCE', ko: '기원전 3세기' },
    civ: { en: 'Balearic Islands', ko: '발레아레스 제도' },
    weapon: { en: 'Sling and lead bullet', ko: '투석구와 납 탄환' },
    armorName: { en: 'None', ko: '없음' },
    blurb: {
      en: 'Balearic slingers, hired by Carthage, could crack an unhelmeted skull with a lead glandes. Padding and plate blunt the bullet; open cloth does not.',
      ko: '카르타고가 고용한 발레아레스 투석병은 납 탄으로 투구 없는 머리를 부술 수 있었다. 두툼한 갑옷은 탄을 죽이고, 맨옷은 막지 못한다.'
    },
    hp: 56, atk: 12, def: 2, speed: 2.05, range: 168, atkSpeed: 0.95,
    accuracy: 0.74, size: 11, type: 'ranged', attackMode: 'ranged', armorClass: 'ranged',
    tags: ['sling'], shot: 'stone', icon: '🪨'
  },
  {
    id: 'repeater', sprite: 'repeater', group: 'missile', deploy: 'missile',
    name: { en: 'Repeating Crossbow', ko: '제갈노' },
    short: { en: 'Repeater', ko: '제갈노' },
    era: { en: 'Han dynasty', ko: '한나라' },
    civ: { en: 'Han China', ko: '한' },
    weapon: { en: 'Zhuge nu', ko: '제갈노' },
    armorName: { en: 'Lamellar, if any', ko: '찰갑, 있는 경우' },
    blurb: {
      en: 'The zhuge nu magazine let a soldier loose several light bolts before pausing to reload. Each bolt was weak against armor. The point was volume at short range.',
      ko: '제갈노의 탄창은 재장전 전에 가벼운 화살을 여러 발 쏟게 했다. 한 발의 위력은 갑옷에 약했다. 가까운 거리에서 수를 쏟는 무기다.'
    },
    hp: 62, atk: 8, def: 3, speed: 1.5, range: 122, atkSpeed: 0.42,
    accuracy: 0.64, size: 12, type: 'ranged', attackMode: 'ranged', armorClass: 'ranged',
    tags: ['pierce', 'archer'], shot: 'bolt', icon: '🔁'
  },
  {
    id: 'handcannoneer', sprite: 'handgun', group: 'missile', deploy: 'missile',
    name: { en: 'Handgonner', ko: '핸드캐넌 사수' },
    short: { en: 'Handgonne', ko: '핸드캐넌' },
    era: { en: '15th century', ko: '15세기' },
    civ: { en: 'Burgundy and the Empire', ko: '부르고뉴와 제국' },
    weapon: { en: 'Handgonne', ko: '핸드캐넌' },
    armorName: { en: 'Brigandine', ko: '브리간딘' },
    blurb: {
      en: 'Early handguns were inaccurate and slow, and the noise mattered as much as the ball. A lead shot that did land could punch a breastplate.',
      ko: '초기 휴대 화기는 부정확하고 느렸고, 소리도 탄환만큼 중요했다. 하지만 납 탄이 맞으면 흉갑을 뚫을 수 있었다.'
    },
    hp: 72, atk: 30, def: 4, speed: 1.05, range: 155, atkSpeed: 2.35,
    accuracy: 0.66, size: 12, type: 'ranged', attackMode: 'ranged', armorClass: 'ranged',
    tags: ['gun'], shot: 'bullet', icon: '💥'
  },
  {
    id: 'janissary', sprite: 'janissary', group: 'missile', deploy: 'missile',
    name: { en: 'Ottoman Janissary', ko: '오스만 예니체리' },
    short: { en: 'Janissary', ko: '예니체리' },
    era: { en: '16th century', ko: '16세기' },
    civ: { en: 'Ottoman Empire', ko: '오스만 제국' },
    weapon: { en: 'Matchlock tüfek', ko: '화승총 튀펙' },
    armorName: { en: 'Robes, light armor', ko: '예복과 가벼운 갑옷' },
    blurb: {
      en: 'Janissaries were the sultan’s standing infantry. By the sixteenth century their matchlock volleys, fired in ranks, were the shock of an Ottoman field army.',
      ko: '예니체리는 술탄의 상비 보병이었다. 16세기에는 열을 맞춰 쏘는 화승총 일제 사격이 오스만 야전군의 충격력이었다.'
    },
    hp: 84, atk: 36, def: 5, speed: 1.02, range: 150, atkSpeed: 2.15,
    accuracy: 0.8, size: 12, type: 'ranged', attackMode: 'ranged', armorClass: 'ranged',
    tags: ['gun', 'pierce'], shot: 'bullet', icon: '🔫'
  },
  {
    id: 'cavalry', sprite: 'lightcav', group: 'mounted', deploy: 'mounted',
    name: { en: 'Steppe Light Cavalry', ko: '초원 경기병' },
    short: { en: 'Light Horse', ko: '경기병' },
    era: { en: 'Antiquity', ko: '고대' },
    civ: { en: 'Scythian steppe', ko: '스키타이 초원' },
    weapon: { en: 'Lance and bow', ko: '창과 활' },
    armorName: { en: 'Leather scale', ko: '가죽 비늘갑' },
    blurb: {
      en: 'Light steppe horse struck where a line was thin: archers, engines, and a flank that had opened. They were not equipped to sit in front of a pike square.',
      ko: '초원 경기병은 얇은 곳을 쳤다. 궁수, 공성 무기, 벌어진 측면. 장창 방진 앞에 붙어 있을 장비는 아니었다.'
    },
    hp: 132, atk: 17, def: 8, speed: 3.85, range: 36, atkSpeed: 0.72,
    accuracy: 1, size: 16, type: 'melee', attackMode: 'melee', armorClass: 'cavalry',
    tags: ['shock', 'horse', 'mounted', 'charge'], chargeMul: 1.35, icon: '🐎'
  },
  {
    id: 'knight', sprite: 'knight', group: 'mounted', deploy: 'mounted',
    name: { en: 'Norman Knight', ko: '노르만 기사' },
    short: { en: 'Knight', ko: '기사' },
    era: { en: '11th century', ko: '11세기' },
    civ: { en: 'Normandy', ko: '노르망디' },
    weapon: { en: 'Couched lance', ko: '겨드랑이 랜스' },
    armorName: { en: 'Mail hauberk, kite shield', ko: '사슬 호버크와 카이트 실드' },
    blurb: {
      en: 'The couched lance put the weight of horse and rider into one point. It scattered archers and broken foot. A settled pike or spear wall was how infantry answered it.',
      ko: '겨드랑이에 낀 랜스는 말과 기수의 무게를 한 점에 실었다. 궁수와 무너진 보병을 흩었다. 선 장창과 창벽이 보병의 답이었다.'
    },
    hp: 214, atk: 26, def: 18, speed: 2.95, range: 40, atkSpeed: 0.9,
    accuracy: 1, size: 18, type: 'melee', attackMode: 'melee', armorClass: 'cavalry',
    tags: ['shock', 'horse', 'mounted', 'charge'], chargeMul: 1.55, icon: '🏇'
  },
  {
    id: 'cataphract', sprite: 'cataphract', group: 'mounted', deploy: 'mounted',
    name: { en: 'Sassanid Cataphract', ko: '사산 중장기병' },
    short: { en: 'Cataphract', ko: '중장기병' },
    era: { en: 'Sassanid era', ko: '사산조' },
    civ: { en: 'Sassanid Persia', ko: '사산 페르시아' },
    weapon: { en: 'Kontos lance', ko: '콘토스 장창' },
    armorName: { en: 'Scale on rider and horse', ko: '말과 기수의 비늘갑' },
    blurb: {
      en: 'Cataphracts armored both rider and horse, then charged knee to knee with a two-handed kontos. They were slower than steppe horse and just as lost in a pike hedge.',
      ko: '중장기병은 말과 사람을 모두 갑옷으로 두르고, 무릎을 맞댄 채 양손 콘토스로 돌격했다. 초원 말보다 느리고, 장창 숲에서는 똑같이 막힌다.'
    },
    hp: 248, atk: 23, def: 22, speed: 2.35, range: 42, atkSpeed: 1.05,
    accuracy: 1, size: 18, type: 'melee', attackMode: 'melee', armorClass: 'cavalry',
    tags: ['shock', 'horse', 'mounted', 'charge', 'heavy'], chargeMul: 1.4, icon: '🐴'
  },
  {
    id: 'horsearcher', sprite: 'horsearcher', group: 'mounted', deploy: 'mounted',
    name: { en: 'Mongol Horse Archer', ko: '몽골 기마궁수' },
    short: { en: 'Horse Archer', ko: '기마궁수' },
    era: { en: '13th century', ko: '13세기' },
    civ: { en: 'Mongol Empire', ko: '몽골 제국' },
    weapon: { en: 'Composite bow on horseback', ko: '마상 합성궁' },
    armorName: { en: 'Lamellar or coat', ko: '찰갑 또는 외투' },
    blurb: {
      en: 'Mongol horse archers shot, turned, and shot again. The Parthian shot and the feigned retreat were drills, not myths. Pinned by heavier horse, they lose the range.',
      ko: '몽골 기마궁수는 쏘고, 돌아서고, 다시 쏘았다. 파르티안 샷과 거짓 퇴각은 신화가 아니라 훈련이었다. 더 무거운 기병에게 붙잡히면 거리를 잃는다.'
    },
    hp: 92, atk: 12, def: 6, speed: 3.25, range: 158, atkSpeed: 1.12,
    accuracy: 0.7, size: 15, type: 'ranged', attackMode: 'ranged', armorClass: 'cavalry',
    tags: ['arrow', 'archer', 'kite', 'horse', 'mounted'], shot: 'arrow', icon: '🐎'
  },
  {
    id: 'camelrider', sprite: 'camel', group: 'mounted', deploy: 'mounted',
    name: { en: 'Camel Rider', ko: '낙타 기병' },
    short: { en: 'Camel', ko: '낙타병' },
    era: { en: 'Antiquity', ko: '고대' },
    civ: { en: 'Nabataea and Arabia', ko: '나바테아와 아라비아' },
    weapon: { en: 'Spear', ko: '창' },
    armorName: { en: 'Leather and cloth', ko: '가죽과 천' },
    blurb: {
      en: 'Camel corps were used because horses often shy from the smell and size of camels. Roman and Arab writers both mention the effect. Camels are still animals, and pikes still stop them.',
      ko: '낙타 부대가 쓰인 이유 중 하나는 말이 낙타의 냄새와 덩치를 꺼리기 때문이다. 로마와 아랍 기록 모두 그 효과를 적는다. 그래도 짐승이고, 장창은 막는다.'
    },
    hp: 164, atk: 17, def: 11, speed: 3.05, range: 38, atkSpeed: 0.84,
    accuracy: 1, size: 17, type: 'melee', attackMode: 'melee', armorClass: 'cavalry',
    tags: ['antihors', 'mounted', 'camel'], icon: '🐪'
  },
  {
    id: 'chariot', sprite: 'chariot', group: 'mounted', deploy: 'mounted',
    name: { en: 'Egyptian Chariot', ko: '이집트 전차' },
    short: { en: 'Chariot', ko: '전차' },
    era: { en: 'New Kingdom', ko: '신왕국' },
    civ: { en: 'Egypt', ko: '이집트' },
    weapon: { en: 'Composite bow from the car', ko: '차상 합성궁' },
    armorName: { en: 'None on the crew', ko: '승무원 갑옷 없음' },
    blurb: {
      en: 'A New Kingdom chariot was a fast two-horse bow platform, not a tank. It scouted, pursued, and harassed. Broken ground and spearmen took the advantage away.',
      ko: '신왕국 전차는 전차가 아니라 두 필이 끄는 빠른 활 플랫폼이었다. 정찰하고, 추격하고, 괴롭혔다. 거친 땅과 창병 앞에서는 이점을 잃었다.'
    },
    hp: 86, atk: 13, def: 4, speed: 4.15, range: 148, atkSpeed: 1.05,
    accuracy: 0.7, size: 17, type: 'ranged', attackMode: 'ranged', armorClass: 'cavalry',
    tags: ['arrow', 'kite', 'horse', 'mounted', 'chariot'], shot: 'arrow', icon: '🛞'
  },
  {
    id: 'warelephant', sprite: 'elephant', group: 'mounted', deploy: 'special',
    name: { en: 'War Elephant', ko: '전투 코끼리' },
    short: { en: 'Elephant', ko: '코끼리' },
    era: { en: 'Antiquity', ko: '고대' },
    civ: { en: 'Mauryan India', ko: '마우리아 인도' },
    weapon: { en: 'Tusks, bulk, and crew spears', ko: '상아, 체구, 승무원 창' },
    armorName: { en: 'Head plate and cloth trapper', ko: '머리 갑옷과 포피' },
    blurb: {
      en: 'Indian war elephants broke horses and trampled loose infantry. Hellenistic and Roman armies answered with pikes, light troops, and by opening lanes so the animals passed through.',
      ko: '인도의 전투 코끼리는 말을 흩고 느슨한 보병을 짓밟았다. 헬레니즘과 로마 군대는 장창, 경보병, 그리고 짐승이 빠져나갈 길을 열어 맞섰다.'
    },
    hp: 490, atk: 36, def: 16, speed: 1.48, range: 52, atkSpeed: 1.45,
    accuracy: 1, size: 26, type: 'melee', attackMode: 'melee', armorClass: 'cavalry',
    tags: ['elephant', 'mounted', 'shock'], splash: 34, icon: '🐘'
  },
  {
    id: 'towelephant', sprite: 'howdah', group: 'mounted', deploy: 'special',
    name: { en: 'Howdah Elephant', ko: '하우다 코끼리' },
    short: { en: 'Howdah', ko: '하우다' },
    era: { en: 'Antiquity', ko: '고대' },
    civ: { en: 'India and the Hellenistic east', ko: '인도와 헬레니즘 동방' },
    weapon: { en: 'Crew bows from the howdah', ko: '하우다 위 승무원 활' },
    armorName: { en: 'Wooden tower and cloth', ko: '나무 탑과 포피' },
    blurb: {
      en: 'A howdah turned the elephant into a moving tower. Archers on its back shot over friendly heads. The animal was still the target, and spears at its legs still worked.',
      ko: '하우다는 코끼리를 움직이는 탑으로 만들었다. 등의 궁수는 아군 머리 너머로 쏘았다. 그래도 표적은 짐승이고, 다리의 창은 통했다.'
    },
    hp: 440, atk: 16, def: 14, speed: 1.28, range: 136, atkSpeed: 1.7,
    accuracy: 0.66, size: 26, type: 'ranged', attackMode: 'ranged', armorClass: 'cavalry',
    tags: ['elephant', 'mounted', 'arrow'], shot: 'arrow', splash: 26, icon: '🐘'
  },
  {
    id: 'mangonel', sprite: 'mangonel', group: 'engine', deploy: 'special',
    name: { en: 'Traction Mangonel', ko: '견인 투석기' },
    short: { en: 'Mangonel', ko: '망고넬' },
    era: { en: 'Early medieval', ko: '중세 초기' },
    civ: { en: 'Mediterranean armies', ko: '지중해 군대' },
    weapon: { en: 'Crew-pulled stone thrower', ko: '인력이 당기는 투석기' },
    armorName: { en: 'Timber frame', ko: '목재 틀' },
    blurb: {
      en: 'A traction mangonel used a crew hauling ropes, not a counterweight. It was a field stone-thrower: ugly against a moving horse, ugly for packed infantry.',
      ko: '견인 투석기는 평형추가 아니라 밧줄을 당기는 인원을 썼다. 야전용 돌팔매라, 달리는 말에게는 헛돌고 뭉친 보병에게는 가혹했다.'
    },
    hp: 70, atk: 30, def: 2, speed: 0.85, range: 210, atkSpeed: 2.3,
    accuracy: 0.62, size: 18, type: 'siege', attackMode: 'ranged', armorClass: 'siege',
    tags: ['stone'], shot: 'rock', splash: 48, icon: '🪨'
  },
  {
    id: 'catapult', sprite: 'trebuchet', group: 'engine', deploy: 'special',
    name: { en: 'Counterweight Trebuchet', ko: '평형추 투석기' },
    short: { en: 'Trebuchet', ko: '트레뷰셋' },
    era: { en: '12th–13th century', ko: '12–13세기' },
    civ: { en: 'Levantine siegecraft', ko: '레반트 공성술' },
    weapon: { en: 'Counterweight arm', ko: '평형추 투척 팔' },
    armorName: { en: 'Heavy timber', ko: '무거운 목재' },
    blurb: {
      en: 'The counterweight trebuchet was built to batter walls. On an open field it is slow and blind to a galloping target, but a stone that lands in a crowd is final.',
      ko: '평형추 투석기는 성벽을 부수려고 만들어졌다. 벌판에서는 느리고 달리는 표적을 놓치지만, 무리 한가운데 떨어진 돌은 끝이다.'
    },
    hp: 110, atk: 58, def: 2, speed: 0.42, range: 310, atkSpeed: 3.8,
    accuracy: 0.52, size: 22, type: 'siege', attackMode: 'ranged', armorClass: 'siege',
    tags: ['stone'], shot: 'rock', splash: 70, icon: '⚙️'
  },
  {
    id: 'scorpion', sprite: 'scorpion', group: 'engine', deploy: 'special',
    name: { en: 'Roman Scorpion', ko: '로마 스콜피오' },
    short: { en: 'Scorpion', ko: '스콜피오' },
    era: { en: 'Early Empire', ko: '제정 초기' },
    civ: { en: 'Roman Empire', ko: '로마 제국' },
    weapon: { en: 'Torsion bolt thrower', ko: '비틀림 볼트 발사기' },
    armorName: { en: 'Wooden frame', ko: '나무 틀' },
    blurb: {
      en: 'The scorpio was a light torsion engine prized for accuracy against men, not walls. A bolt could pass a file. Vegetius treats it as anti-personnel artillery.',
      ko: '스콜피오는 성벽이 아니라 사람을 노리는 정확한 경량 비틀림 병기였다. 볼트는 대열을 관통할 수 있다. 베게티우스는 이를 대인 포로 다룬다.'
    },
    hp: 96, atk: 28, def: 3, speed: 0.78, range: 230, atkSpeed: 1.85,
    accuracy: 0.8, size: 16, type: 'siege', attackMode: 'ranged', armorClass: 'siege',
    tags: ['pierce', 'bolt'], shot: 'scorpion', splash: 0, icon: '🏹'
  },
  {
    id: 'ram', sprite: 'ram', group: 'engine', deploy: 'special',
    name: { en: 'Battering Ram', ko: '공성추' },
    short: { en: 'Ram', ko: '공성추' },
    era: { en: 'Antiquity', ko: '고대' },
    civ: { en: 'Assyria and after', ko: '아시리아 이후' },
    weapon: { en: 'Iron-capped log', ko: '철두 통나무' },
    armorName: { en: 'Hide-covered shed', ko: '가죽 덮개 지붕' },
    blurb: {
      en: 'A ram was for gates and wall bases, under a shed of hides. On a battlefield it is a slow shed full of men. Horses ride around it. Engines cannot.',
      ko: '공성추는 가죽 지붕 아래에서 성문과 성벽 밑동을 치는 도구였다. 전장에서는 사람이 든 느린 막사다. 말은 돌아 지나가고, 공성 무기는 그러지 못한다.'
    },
    hp: 420, atk: 42, def: 6, speed: 0.48, range: 30, atkSpeed: 2.6,
    accuracy: 1, size: 22, type: 'siege', attackMode: 'melee', armorClass: 'siege',
    tags: ['ram'], splash: 22, icon: '🪵'
  },
  {
    id: 'monk', sprite: 'chaplain', group: 'support', deploy: 'special',
    name: { en: 'Field Chaplain', ko: '종군 사제' },
    short: { en: 'Chaplain', ko: '사제' },
    era: { en: 'High medieval', ko: '중세 성기' },
    civ: { en: 'Latin Christendom', ko: '라틴 그리스도교권' },
    weapon: { en: 'None', ko: '없음' },
    armorName: { en: 'Vestments', ko: '제의' },
    blurb: {
      en: 'Priests marched with medieval hosts. This one does not fight. Between the clashes he binds wounds and keeps a hurt soldier in the line.',
      ko: '중세 군대에는 사제가 함께 행군했다. 이 인물은 싸우지 않는다. 충돌 사이에 상처를 묶고, 다친 병사를 대열에 붙잡아 둔다.'
    },
    hp: 78, atk: 0, def: 4, speed: 1.5, range: 120, atkSpeed: 1.45,
    accuracy: 1, size: 12, type: 'support', attackMode: 'support', armorClass: 'ranged',
    tags: ['healer'], behavior: 'heal', healAmount: 10, icon: '✝️'
  },
  {
    id: 'signifer', sprite: 'signifer', group: 'support', deploy: 'special',
    name: { en: 'Roman Signifer', ko: '로마 기수' },
    short: { en: 'Signifer', ko: '기수' },
    era: { en: 'Early Empire', ko: '제정 초기' },
    civ: { en: 'Roman Empire', ko: '로마 제국' },
    weapon: { en: 'Signum standard', ko: '시그눔 군기' },
    armorName: { en: 'Mail and animal skin', ko: '사슬갑과 짐승 가죽' },
    blurb: {
      en: 'The signifer carried the century’s signum, the rally point in noise and dust. Soldiers near the standard hold their blows longer. If he falls, that heart goes with him.',
      ko: '시그니페르는 백인대의 시그눔을 들었다. 소음과 먼지 속의 집결점이다. 군기 근처의 병사는 더 버틴다. 그가 쓰러지면 그 중심도 함께 사라진다.'
    },
    hp: 90, atk: 0, def: 7, speed: 1.55, range: 40, atkSpeed: 1.2,
    accuracy: 1, size: 13, type: 'support', attackMode: 'support', armorClass: 'infantry',
    tags: ['banner'], behavior: 'aura', auraRadius: 150, auraMul: 1.14, icon: '🚩'
  }
];

for (const unit of UNIT_TYPES) {
  unit.hp = Math.round(unit.hp * 2.6);
  unit.atkSpeed = Math.round(unit.atkSpeed * 1.22 * 100) / 100;
  if (unit.healAmount) unit.healAmount = Math.round(unit.healAmount * 2);
}

const UNIT_BY_ID = Object.fromEntries(UNIT_TYPES.map((unit) => [unit.id, unit]));

function getMatchupMultiplier(attackerId, defenderId) {
  const attacker = UNIT_BY_ID[attackerId];
  const defender = UNIT_BY_ID[defenderId];
  if (!attacker || !defender) return 1;
  if (attacker.type === 'support' || attacker.attackMode === 'support') return 0;

  let multiplier = 1;
  const mounted = defender.tags.includes('mounted');
  const horse = defender.tags.includes('horse');

  if (attacker.tags.includes('anticalv') && mounted) multiplier *= attacker.antiCav || 2.2;
  if (attacker.tags.includes('shock') && defender.armorClass === 'ranged') multiplier *= 2.05;
  if (attacker.tags.includes('shock') && defender.tags.includes('anticalv')) multiplier *= 0.48;
  if (attacker.tags.includes('antihors') && horse) multiplier *= 1.75;
  if (attacker.tags.includes('elephant') && defender.tags.includes('anticalv')) multiplier *= 0.5;
  if (attacker.tags.includes('elephant') && horse) multiplier *= 1.65;
  if (attacker.tags.includes('longrange') && mounted && !defender.tags.includes('elephant')) multiplier *= 1.8;
  if ((attacker.tags.includes('pierce') || attacker.tags.includes('gun')) && defender.def >= 14) multiplier *= 1.5;
  if (attacker.tags.includes('gun') && defender.tags.includes('elephant')) multiplier *= 1.35;
  if (attacker.tags.includes('skirmish') && defender.armorClass === 'infantry' && defender.speed <= 1.65) multiplier *= 1.45;
  if (attacker.tags.includes('skirmish') && defender.tags.includes('archer')) multiplier *= 1.55;
  if (attacker.tags.includes('skirmish') && defender.type === 'siege') multiplier *= 1.35;
  if (attacker.type === 'siege' && attacker.attackMode === 'ranged' && defender.armorClass === 'infantry') multiplier *= 1.45;
  if (attacker.type === 'siege' && attacker.attackMode === 'ranged' && mounted) multiplier *= 0.62;
  if (attacker.id === 'ram' && defender.type === 'siege') multiplier *= 1.9;
  if (attacker.id === 'ram' && mounted) multiplier *= 0.4;
  if (attacker.id === 'slinger' && defender.def <= 7) multiplier *= 1.45;
  if (attacker.id === 'slinger' && defender.def >= 16) multiplier *= 0.72;
  if (attacker.vsClass && attacker.vsClass[defender.armorClass]) multiplier *= attacker.vsClass[defender.armorClass];

  multiplier = Math.max(0.3, Math.min(3, multiplier));
  return Math.round(multiplier * 10) / 10;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { UNIT_TYPES, UNIT_BY_ID, getMatchupMultiplier };
}
