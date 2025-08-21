/**
 * Bonus Cards Mapping for Old World Tech Tree
 * 
 * Maps XML technology IDs to human-readable names and effects.
 * Extracted from game files to ensure accuracy.
 */

const BONUS_CARDS = {
    // General Bonus Cards (available to all nations)
    "TECH_STONECUTTING_BONUS_STONE": {
        name: "Stone Boost",
        effect: "+200 Stone",
        cost: 40,
        parent: "TECH_STONECUTTING"
    },
    "TECH_ADMINISTRATION_BONUS_WORKER": {
        name: "Free Worker",
        effect: "+1 Worker",
        cost: 40,
        parent: "TECH_ADMINISTRATION"
    },
    "TECH_HUSBANDRY_BONUS_FOOD": {
        name: "Food Boost",
        effect: "+200 Food",
        cost: 60,
        parent: "TECH_HUSBANDRY"
    },
    "TECH_DRAMA_BONUS_SETTLER": {
        name: "Free Settler",
        effect: "+1 Settler",
        cost: 60,
        parent: "TECH_DRAMA"
    },
    "TECH_ARISTOCRACY_BONUS_BORDERS": {
        name: "Border Boost",
        effect: "Border Growth",
        cost: 60,
        parent: "TECH_ARISTOCRACY"
    },
    "TECH_NAVIGATION_BONUS_BIREME": {
        name: "Free Bireme",
        effect: "+1 Bireme",
        cost: 100,
        parent: "TECH_STEEL"
    },
    "TECH_PHALANX_BONUS_ORDERS": {
        name: "Orders Boost",
        effect: "+20 Orders",
        cost: 100,
        parent: "TECH_PHALANX"
    },
    "TECH_SPOKED_WHEEL_BONUS_CHARIOT": {
        name: "Free Chariot",
        effect: "+1 Chariot",
        cost: 100,
        parent: "TECH_SOVEREIGNTY"
    },
    "TECH_FORESTRY_BONUS_SCIENTIST": {
        name: "Free Scientist",
        effect: "Free Scientist",
        cost: 100,
        parent: "TECH_METAPHYSICS"
    },
    "TECH_STEEL_BONUS_TRAINING": {
        name: "Training Boost",
        effect: "+800 Training",
        cost: 100,
        parent: "TECH_STEEL"
    },
    "TECH_SOVEREIGNITY_BONUS_CIVICS": {
        name: "Civics Boost",
        effect: "+800 Civics",
        cost: 100,
        parent: "TECH_SOVEREIGNTY"
    },
    "TECH_COINAGE_BONUS_MONEY": {
        name: "Money Boost",
        effect: "+4000 Money",
        cost: 200,
        parent: "TECH_COINAGE"
    },
    "TECH_CITIZENSHIP_BONUS_MINISTER": {
        name: "Free Minister",
        effect: "+1 Minister",
        cost: 200,
        parent: "TECH_CITIZENSHIP"
    },
    "TECH_PORTCULLIS_BONUS_MACEMAN": {
        name: "Free Maceman",
        effect: "+1 Maceman",
        cost: 200,
        parent: "TECH_PORTCULLIS"
    },
    "TECH_LAND_CONSOLIDATION_BONUS_CAMEL_ARCHER": {
        name: "Free Camel Archer",
        effect: "+1 Camel Archer",
        cost: 200,
        parent: "TECH_MONASTICISM"
    },
    "TECH_LAND_CONSOLIDATION_BONUS_WAR_ELEPHANT": {
        name: "Free War Elephant",
        effect: "+1 War Elephant",
        cost: 200,
        parent: "TECH_MACHINERY"
    },
    "TECH_COMPOSITE_BOW_BONUS_ARCHER": {
        name: "Free Archer",
        effect: "+1 Archer",
        cost: 100,
        parent: "TECH_FORESTRY"
    },
    "TECH_MACHINERY_BONUS_ONAGER": {
        name: "Free Onager",
        effect: "+1 Onager",
        cost: 200,
        parent: "TECH_PORTCULLIS"
    },
    "TECH_SCHOLARSHIP_BONUS_SCIENTIST": {
        name: "Free Scientist",
        effect: "Free Scientist",
        cost: 400,
        parent: "TECH_SCHOLARSHIP"
    },
    "TECH_STIRRUPS_BONUS_HORSEMAN": {
        name: "Free Horseman",
        effect: "+1 Horseman",
        cost: 200,
        parent: "TECH_LAND_CONSOLIDATION"
    },
    "TECH_STIRRUPS_BONUS_HORSE_ARCHER": {
        name: "Free Horse Archer",
        effect: "+1 Horse Archer",
        cost: 200,
        parent: "TECH_LAND_CONSOLIDATION"
    },
    "TECH_MANOR_BONUS_GOODS": {
        name: "Goods Bonus",
        effect: "Luxury Goods",
        cost: 200,
        parent: "TECH_MACHINERY"
    },
    "TECH_BATTLELINE_BONUS_SOLDIER": {
        name: "Free Court Soldier",
        effect: "Free Court Soldier",
        cost: 400,
        parent: "TECH_BATTLELINE"
    },
    "TECH_HYDRAULICS_BONUS_BALLISTA": {
        name: "Free Ballista",
        effect: "+1 Ballista",
        cost: 200,
        parent: "TECH_COMPOSITE_BOW"
    },
    "TECH_JURISPRUDENCE_BONUS_MINISTER": {
        name: "Free Minister",
        effect: "+1 Minister",
        cost: 600,
        parent: "TECH_JURISPRUDENCE"
    },
    "TECH_VAULTING_BONUS_HAPPINESS": {
        name: "Happiness Boost",
        effect: "Happiness Boost",
        cost: 400,
        parent: "TECH_VAULTING"
    },
    "TECH_BODKIN_ARROW_BONUS_LONGBOWMAN": {
        name: "Free Longbowman",
        effect: "+2 Longbowman",
        cost: 400,
        parent: "TECH_MANOR"
    },
    "TECH_WINDLASS_BONUS_CROSSBOWMAN": {
        name: "Free Crossbowman",
        effect: "+2 Crossbowman",
        cost: 400,
        parent: "TECH_HYDRAULICS"
    },
    "TECH_FISCAL_POLICY_BONUS_MERCHANT": {
        name: "Free Merchant",
        effect: "Free Merchant",
        cost: 1000,
        parent: "TECH_FISCAL_POLICY"
    },
    "TECH_INFANTRY_SQUARE_BONUS_SOLDIER": {
        name: "Free Court Soldier",
        effect: "Free Court Soldier",
        cost: 1000,
        parent: "TECH_INFANTRY_SQUARE"
    },
    "TECH_CHAIN_DRIVE_BONUS_MERCHANT": {
        name: "Free Merchant",
        effect: "Free Merchant",
        cost: 1000,
        parent: "TECH_CHAIN_DRIVE"
    },

    // Nation-Specific Bonus Cards
    
    // Assyria
    "TECH_BATTERING_RAM_BONUS": {
        name: "Free Battering Ram",
        effect: "+1 Battering Ram",
        cost: 100,
        parent: "TECH_SPOKED_WHEEL",
        nation: "NATION_ASSYRIA"
    },
    "TECH_SIEGE_TOWER_BONUS": {
        name: "Free Siege Tower",
        effect: "+2 Siege Tower",
        cost: 600,
        parent: "TECH_WINDLASS",
        nation: "NATION_ASSYRIA"
    },

    // Babylonia
    "TECH_AKKADIAN_ARCHER_BONUS": {
        name: "Free Akkadian Archer",
        effect: "+1 Akkadian Archer",
        cost: 100,
        parent: "TECH_FORESTRY",
        nation: "NATION_BABYLONIA"
    },
    "TECH_CIMMERIAN_ARCHER_BONUS": {
        name: "Free Cimmerian Archer",
        effect: "+2 Cimmerian Archer",
        cost: 600,
        parent: "TECH_BODKIN_ARROW",
        nation: "NATION_BABYLONIA"
    },

    // Carthage
    "TECH_AFRICAN_ELEPHANT_BONUS": {
        name: "Free African Elephant",
        effect: "+1 African Elephant",
        cost: 100,
        parent: "TECH_STEEL",
        nation: "NATION_CARTHAGE"
    },
    "TECH_TURRETED_ELEPHANT_BONUS": {
        name: "Free Turreted Elephant",
        effect: "+2 Turreted Elephant",
        cost: 600,
        parent: "TECH_MARTIAL_CODE",
        nation: "NATION_CARTHAGE"
    },

    // Egypt
    "TECH_LIGHT_CHARIOT_BONUS": {
        name: "Free Light Chariot",
        effect: "+1 Light Chariot",
        cost: 100,
        parent: "TECH_SPOKED_WHEEL",
        nation: "NATION_EGYPT"
    },
    "TECH_MOUNTED_LANCER_BONUS": {
        name: "Free Mounted Lancer",
        effect: "+2 Mounted Lancer",
        cost: 600,
        parent: "TECH_MARTIAL_CODE",
        nation: "NATION_EGYPT"
    },

    // Greece
    "TECH_HOPLITE_BONUS": {
        name: "Free Hoplite",
        effect: "+1 Hoplite",
        cost: 100,
        parent: "TECH_PHALANX",
        nation: "NATION_GREECE"
    },
    "TECH_PHALANGITE_BONUS": {
        name: "Free Phalangite",
        effect: "+2 Phalangite",
        cost: 600,
        parent: "TECH_MARTIAL_CODE",
        nation: "NATION_GREECE"
    },

    // Persia
    "TECH_PALTON_CAVALRY_BONUS": {
        name: "Free Palton Cavalry",
        effect: "+1 Palton Cavalry",
        cost: 100,
        parent: "TECH_FORESTRY",
        nation: "NATION_PERSIA"
    },
    "TECH_CATAPHRACT_ARCHER_BONUS": {
        name: "Free Cataphract Archer",
        effect: "+2 Cataphract Archer",
        cost: 600,
        parent: "TECH_WINDLASS",
        nation: "NATION_PERSIA"
    },

    // Rome
    "TECH_HASTATUS_BONUS": {
        name: "Free Hastatus",
        effect: "+1 Hastatus",
        cost: 100,
        parent: "TECH_STEEL",
        nation: "NATION_ROME"
    },
    "TECH_LEGIONARY_BONUS": {
        name: "Free Legionary",
        effect: "+2 Legionary",
        cost: 600,
        parent: "TECH_MARTIAL_CODE",
        nation: "NATION_ROME"
    },

    // Hittite
    "TECH_HITTITE_CHARIOT_1_BONUS": {
        name: "Free Hittite Chariot",
        effect: "+1 Hittite Chariot",
        cost: 100,
        parent: "TECH_SPOKED_WHEEL",
        nation: "NATION_HITTITE"
    },
    "TECH_HITTITE_CHARIOT_2_BONUS": {
        name: "Free Hittite Chariot",
        effect: "+2 Hittite Chariot",
        cost: 600,
        parent: "TECH_MARTIAL_CODE",
        nation: "NATION_HITTITE"
    },

    // Kush
    "TECH_MEDJAY_ARCHER_BONUS": {
        name: "Free Medjay",
        effect: "+1 Medjay",
        cost: 100,
        parent: "TECH_FORESTRY",
        nation: "NATION_KUSH"
    },
    "TECH_BEJA_ARCHER_BONUS": {
        name: "Free Beja Archer",
        effect: "+2 Beja Archer",
        cost: 600,
        parent: "TECH_BODKIN_ARROW",
        nation: "NATION_KUSH"
    },

    // Aksum
    "TECH_DMT_WARRIOR_BONUS": {
        name: "Free Dmt Warrior",
        effect: "+1 Dmt Warrior",
        cost: 100,
        parent: "TECH_STEEL",
        nation: "NATION_AKSUM"
    },
    "TECH_SHOTELAI_BONUS": {
        name: "Free Shotelai",
        effect: "+2 Shotelai",
        cost: 600,
        parent: "TECH_MARTIAL_CODE",
        nation: "NATION_AKSUM"
    },

    // Luxury Resources
    "TECH_RESOURCE_SILK_BONUS": {
        name: "Silk",
        effect: "Silk",
        cost: 200,
        parent: "TECH_COINAGE"
    },
    "TECH_RESOURCE_PORCELAIN_BONUS": {
        name: "Porcelain",
        effect: "Porcelain",
        cost: 600,
        parent: "TECH_LATEEN_SAIL"
    },
    "TECH_RESOURCE_EXOTIC_FUR_BONUS": {
        name: "Exotic Furs",
        effect: "Exotic Furs",
        cost: 100,
        parent: "TECH_SPOKED_WHEEL"
    },
    "TECH_RESOURCE_EBONY_BONUS": {
        name: "Ebony",
        effect: "Ebony",
        cost: 100,
        parent: "TECH_FORESTRY"
    },
    "TECH_RESOURCE_PERFUME_BONUS": {
        name: "Perfume",
        effect: "Perfume",
        cost: 200,
        parent: "TECH_ARCHITECTURE"
    }
};

// Helper functions for working with bonus cards

/**
 * Get bonus card data by XML ID
 * @param {string} xmlId - The XML technology ID (e.g., "TECH_CITIZENSHIP_BONUS_MINISTER")
 * @returns {Object|null} Bonus card data or null if not found
 */
function getBonusCard(xmlId) {
    return BONUS_CARDS[xmlId] || null;
}

/**
 * Get all bonus cards for a specific nation
 * @param {string} nationId - The nation ID (e.g., "NATION_ROME")
 * @returns {Array} Array of bonus card objects for that nation
 */
function getBonusCardsByNation(nationId) {
    return Object.entries(BONUS_CARDS)
        .filter(([id, card]) => card.nation === nationId)
        .map(([id, card]) => ({ id, ...card }));
}

/**
 * Get all general bonus cards (not nation-specific)
 * @returns {Array} Array of general bonus card objects
 */
function getGeneralBonusCards() {
    return Object.entries(BONUS_CARDS)
        .filter(([id, card]) => !card.nation)
        .map(([id, card]) => ({ id, ...card }));
}

/**
 * Get all luxury resource bonus cards
 * @returns {Array} Array of luxury resource bonus card objects
 */
function getLuxuryResourceCards() {
    return Object.entries(BONUS_CARDS)
        .filter(([id, card]) => id.includes('RESOURCE'))
        .map(([id, card]) => ({ id, ...card }));
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        BONUS_CARDS,
        getBonusCard,
        getBonusCardsByNation,
        getGeneralBonusCards,
        getLuxuryResourceCards
    };
}