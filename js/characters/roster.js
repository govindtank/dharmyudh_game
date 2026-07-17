// ============================================================
// DHARMYUDH - Warrior Roster Definition
// ============================================================

export const CHARACTERS = [
  {
    id: 'arjuna',
    name: 'Arjuna',
    title: 'The Peerless Archer',
    devanagari: 'अर्जुन',
    color: '#4fc3f7',
    colorDark: '#0288d1',
    weapon: 'Gandiva Bow',
    weaponDevanagari: 'गाण्डीव',
    stats: { hp: 100, speed: 185, attack: 13, defense: 8, specialDmg: 34 },
    taunt: 'I am Arjuna, the greatest archer!',
    taunt2: 'Pashupatastra, arise!',
    defeatQuote: 'Dharma always triumphs...',
    colors: {
      skin: '#d4a574', skinShadow: '#b8885a', hair: '#1a1a1a',
      cloth: '#2a2a3a', clothLight: '#3a3a4a', armor: '#1565c0',
      armorLight: '#1e88e5', dhoti: '#e8d5b0', dhotiShadow: '#c4a882',
      gold: '#ffd700', goldShadow: '#c8a000'
    }
  },
  {
    id: 'bhima',
    name: 'Bhima',
    title: 'The Mighty',
    devanagari: 'भीम',
    color: '#ff8f00',
    colorDark: '#e65100',
    weapon: 'Gada (Mace)',
    weaponDevanagari: 'गदा',
    stats: { hp: 160, speed: 120, attack: 22, defense: 14, specialDmg: 52 },
    taunt: 'No one can withstand my Gada!',
    taunt2: 'Taste the wrath of Vayu!',
    defeatQuote: 'My strength has failed me...',
    colors: {
      skin: '#c69c6d', skinShadow: '#a77a4f', hair: '#262626',
      cloth: '#4e342e', clothLight: '#5d4037', armor: '#37474f',
      armorLight: '#455a64', dhoti: '#ffcc80', dhotiShadow: '#ffa726',
      gold: '#ffd700', goldShadow: '#c8a000'
    }
  },
  {
    id: 'karna',
    name: 'Karna',
    title: 'The Radiant Warrior',
    devanagari: 'कर्ण',
    color: '#ffeb3b',
    colorDark: '#fbc02d',
    weapon: 'Vijaya Bow',
    weaponDevanagari: 'विजय',
    stats: { hp: 115, speed: 170, attack: 16, defense: 9, specialDmg: 42 },
    taunt: 'I fight for loyalty and honor!',
    taunt2: 'Surya Dev, grant me strength!',
    defeatQuote: 'My destiny is fulfilled...',
    colors: {
      skin: '#e0b07f', skinShadow: '#c29362', hair: '#1c1c1c',
      cloth: '#c62828', clothLight: '#d32f2f', armor: '#ffd700', // Kavach
      armorLight: '#fff176', dhoti: '#fff9c4', dhotiShadow: '#fbc02d',
      gold: '#ffd700', goldShadow: '#c8a000'
    }
  },
  {
    id: 'duryodhana',
    name: 'Duryodhana',
    title: 'The Crowned Prince',
    devanagari: 'दुर्योधन',
    color: '#e53935',
    colorDark: '#b71c1c',
    weapon: 'Iron Mace',
    weaponDevanagari: 'गदा',
    stats: { hp: 145, speed: 140, attack: 19, defense: 12, specialDmg: 46 },
    taunt: 'I rule this battlefield!',
    taunt2: 'Fear the wrath of the Kauravas!',
    defeatQuote: 'This throne is mine...',
    colors: {
      skin: '#d4a574', skinShadow: '#b8885a', hair: '#0f0f0f',
      cloth: '#1a1a1a', clothLight: '#2c2c2c', armor: '#880e4f',
      armorLight: '#ad1457', dhoti: '#ff8a80', dhotiShadow: '#ff5252',
      gold: '#ffd700', goldShadow: '#c8a000'
    }
  },
  {
    id: 'nakula',
    name: 'Nakula',
    title: 'The Swordmaster',
    devanagari: 'नकुल',
    color: '#00e676',
    colorDark: '#00c853',
    weapon: 'Sword & Shield',
    weaponDevanagari: 'खड्ग',
    stats: { hp: 95, speed: 225, attack: 13, defense: 6, specialDmg: 32 },
    taunt: 'Too fast for your eyes!',
    taunt2: 'My blade is unmatched!',
    defeatQuote: 'My shield broke...',
    colors: {
      skin: '#dfa675', skinShadow: '#b58051', hair: '#2a1a1a',
      cloth: '#004d40', clothLight: '#00695c', armor: '#00897b',
      armorLight: '#26a69a', dhoti: '#b9f6ca', dhotiShadow: '#69f0ae',
      gold: '#ffd700', goldShadow: '#c8a000'
    }
  },
  {
    id: 'yudhishthira',
    name: 'Yudhishthira',
    title: 'The Dharmic King',
    devanagari: 'युधिष्ठिर',
    color: '#ab47bc',
    colorDark: '#7b1fa2',
    weapon: 'Divine Spear',
    weaponDevanagari: 'शूल',
    stats: { hp: 125, speed: 150, attack: 14, defense: 15, specialDmg: 38 },
    taunt: 'Righteousness is my weapon.',
    taunt2: 'Let dharma guide my hand.',
    defeatQuote: 'I have strayed from the path...',
    colors: {
      skin: '#e0ad84', skinShadow: '#bf8e65', hair: '#241a1a',
      cloth: '#4a148c', clothLight: '#6a1b9a', armor: '#8e24aa',
      armorLight: '#ab47bc', dhoti: '#ea80fc', dhotiShadow: '#e040fb',
      gold: '#ffd700', goldShadow: '#c8a000'
    }
  },
  // NEW LOCKED CHARACTERS (Unlocked via progression)
  {
    id: 'abhimanyu',
    name: 'Abhimanyu',
    title: 'The Young Lion',
    devanagari: 'अभिमन्यु',
    color: '#ff4081',
    colorDark: '#f50057',
    weapon: 'Sword & Shield',
    weaponDevanagari: 'खड्ग',
    stats: { hp: 105, speed: 200, attack: 15, defense: 8, specialDmg: 36 },
    taunt: 'I know how to enter the formation!',
    taunt2: 'I will break the Chakravyuha!',
    defeatQuote: 'Father, I fought bravely...',
    colors: {
      skin: '#e5b88f', skinShadow: '#c49770', hair: '#111111',
      cloth: '#ad1457', clothLight: '#d81b60', armor: '#fbc02d',
      armorLight: '#fff59d', dhoti: '#f8bbd0', dhotiShadow: '#f48fb1',
      gold: '#ffd700', goldShadow: '#c8a000'
    }
  },
  {
    id: 'ashwatthama',
    name: 'Ashwatthama',
    title: 'The Immortal Rage',
    devanagari: 'अश्वत्थामा',
    color: '#00b0ff',
    colorDark: '#0091ea',
    weapon: 'Sword',
    weaponDevanagari: 'खड्ग',
    stats: { hp: 120, speed: 160, attack: 18, defense: 10, specialDmg: 45 },
    taunt: 'The gem on my forehead guides my blade!',
    taunt2: 'Narayanastra will destroy you!',
    defeatQuote: 'My curse is my eternal prison...',
    colors: {
      skin: '#cfa282', skinShadow: '#a87e5e', hair: '#1f1c1c',
      cloth: '#01579b', clothLight: '#0288d1', armor: '#263238',
      armorLight: '#37474f', dhoti: '#b3e5fc', dhotiShadow: '#4fc3f7',
      gold: '#ffd700', goldShadow: '#c8a000'
    }
  },
  {
    id: 'draupadi',
    name: 'Draupadi',
    title: 'Fire Born',
    devanagari: 'द्रौपदी',
    color: '#ff3d00',
    colorDark: '#dd2c00',
    weapon: 'Sword',
    weaponDevanagari: 'खड्ग',
    stats: { hp: 95, speed: 180, attack: 16, defense: 7, specialDmg: 44 },
    taunt: 'Born from the sacred fire!',
    taunt2: 'Agni Dev, consume them!',
    defeatQuote: 'Dharma must protect...',
    colors: {
      skin: '#d29f73', skinShadow: '#b08056', hair: '#0c0a0a',
      cloth: '#bf360c', clothLight: '#d84315', armor: '#e64a19',
      armorLight: '#ff7043', dhoti: '#ffccbc', dhotiShadow: '#ffab91',
      gold: '#ffd700', goldShadow: '#c8a000'
    }
  },
  {
    id: 'bhishma',
    name: 'Bhishma',
    title: 'The Grand Patriarch',
    devanagari: 'भीष्म',
    color: '#eceff1',
    colorDark: '#b0bec5',
    weapon: 'Gandiva Bow', // Heavy Bow wielder
    weaponDevanagari: 'धनुष',
    stats: { hp: 150, speed: 110, attack: 17, defense: 16, specialDmg: 40 },
    taunt: 'I hold the vow of absolute steel.',
    taunt2: 'My arrow bed awaits.',
    defeatQuote: 'My vow is fulfilled...',
    colors: {
      skin: '#d7ab87', skinShadow: '#ba8f6c', hair: '#eceff1', // White hair of age
      cloth: '#37474f', clothLight: '#455a64', armor: '#cfd8dc', // Silver armor
      armorLight: '#eceff1', dhoti: '#ffffff', dhotiShadow: '#cfd8dc',
      gold: '#ffd700', goldShadow: '#c8a000'
    }
  }
];
