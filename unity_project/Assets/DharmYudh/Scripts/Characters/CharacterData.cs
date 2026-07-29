using System;
using UnityEngine;

namespace DharmYudh.Characters
{
    [Serializable]
    public struct WarriorStats
    {
        public float hp;
        public float speed;
        public float attack;
        public float defense;
        public float specialDmg;
    }

    [Serializable]
    public struct PassiveAbility
    {
        public string id;
        public string name;
        [TextArea(2, 5)]
        public string description;
        public string iconSymbol;
    }

    [Serializable]
    public struct CharacterColors
    {
        public Color skin;
        public Color skinShadow;
        public Color hair;
        public Color cloth;
        public Color clothLight;
        public Color armor;
        public Color armorLight;
        public Color dhoti;
        public Color dhotiShadow;
        public Color gold;
        public Color goldShadow;
    }

    [CreateAssetMenu(fileName = "NewCharacterData", menuName = "DharmYudh/Character Data")]
    public class CharacterData : ScriptableObject
    {
        [Header("Basic Info")]
        public string characterId;
        public string warriorName;
        public string title;
        public string devanagariName;
        public Color themeColor = Color.cyan;
        public Color themeColorDark = Color.blue;

        [Header("Weapon Info")]
        public string weaponName;
        public string weaponDevanagari;

        [Header("Stats")]
        public WarriorStats stats = new WarriorStats
        {
            hp = 100f,
            speed = 185f,
            attack = 13f,
            defense = 8f,
            specialDmg = 34f
        };

        [Header("Voice & Quotes")]
        public string taunt1 = "I fight with honor!";
        public string taunt2 = "Taste divine power!";
        public string taunt3 = "Dharma guides my hand!";
        public string taunt4 = "You cannot withstand my strike!";
        public string winQuote = "Dharma always prevails on the battlefield.";
        public string defeatQuote = "Dharma always triumphs...";

        [Header("Passive System")]
        public PassiveAbility passive;

        [Header("Visual Color Scheme")]
        public CharacterColors colors;

        [Header("Prefabs & Visuals")]
        public GameObject characterPrefab;
        public Sprite avatarPortrait;
    }
}
