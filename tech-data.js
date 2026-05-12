// Auto-generated tech data for the redesigned tech tree — do not edit by hand.
// Regenerate via `python3 generate_tech_tree.py --xml-dir XML/Infos`.

window.gameVersion = "Old World v1.0.83499 (May 06, 2026) | Generated May 12, 2026";

window.techData = {
  techs: [
    { id: "TECH_IRONWORKING", name: "Ironworking", cost: 100, column: 0, row: 2, prereqs: [], unlocks: { units: ["Warrior"], improvements: [], laws: [], projects: [] } },
    { id: "TECH_STONECUTTING", name: "Stonecutting", cost: 100, column: 0, row: 5, prereqs: [], unlocks: { units: [], improvements: ["Fort", "Quarry"], laws: [], projects: [] } },
    { id: "TECH_TRAPPING", name: "Trapping", cost: 100, column: 0, row: 7, prereqs: [], unlocks: { units: ["Slinger"], improvements: ["Camp"], laws: [], projects: [] } },
    { id: "TECH_DIVINATION", name: "Divination", cost: 100, column: 0, row: 8, prereqs: [], unlocks: { units: [], improvements: ["Shrine"], laws: [], projects: [] } },
    { id: "TECH_ADMINISTRATION", name: "Administration", cost: 100, column: 0, row: 10, prereqs: [], unlocks: { units: [], improvements: ["Granary"], laws: [], projects: ["Treasury"] } },
    { id: "TECH_LABOR_FORCE", name: "Labor Force", cost: 150, column: 1, row: 1, prereqs: ["TECH_IRONWORKING"], unlocks: { units: [], improvements: [], laws: ["Slavery/Freedom"], projects: [] } },
    { id: "TECH_HUSBANDRY", name: "Husbandry", cost: 150, column: 1, row: 3, prereqs: ["TECH_IRONWORKING"], unlocks: { units: [], improvements: ["Pasture"], laws: [], projects: [] } },
    { id: "TECH_DRAMA", name: "Drama", cost: 150, column: 1, row: 4, prereqs: ["TECH_STONECUTTING"], unlocks: { units: [], improvements: ["Odeon"], laws: [], projects: [] } },
    { id: "TECH_POLIS", name: "Polis", cost: 150, column: 1, row: 5, prereqs: ["TECH_STONECUTTING"], unlocks: { units: [], improvements: ["Hamlet"], laws: [], projects: ["Walls"] } },
    { id: "TECH_MILITARY_DRILL", name: "Military Drill", cost: 150, column: 1, row: 7, prereqs: ["TECH_TRAPPING"], unlocks: { units: [], improvements: ["Barracks"], laws: [], projects: [] } },
    { id: "TECH_ARISTOCRACY", name: "Aristocracy", cost: 150, column: 1, row: 8, prereqs: ["TECH_DIVINATION"], unlocks: { units: [], improvements: ["Kushite Pyramids"], laws: ["Centralization/Vassalage"], projects: [] } },
    { id: "TECH_RHETORIC", name: "Rhetoric", cost: 150, column: 1, row: 10, prereqs: ["TECH_ADMINISTRATION"], unlocks: { units: [], improvements: [], laws: ["Epics/Exploration"], projects: ["Forum"] } },
    { id: "TECH_NAVIGATION", name: "Navigation", cost: 250, column: 2, row: 0, prereqs: ["TECH_LABOR_FORCE"], unlocks: { units: ["Bireme"], improvements: [], laws: ["Colonies/Serfdom"], projects: [] } },
    { id: "TECH_PHALANX", name: "Phalanx", cost: 250, column: 2, row: 2, prereqs: ["TECH_LABOR_FORCE"], unlocks: { units: ["Spearman"], improvements: [], laws: [], projects: [] } },
    { id: "TECH_SPOKED_WHEEL", name: "Spoked Wheel", cost: 250, column: 2, row: 3, prereqs: ["TECH_HUSBANDRY"], unlocks: { units: ["Chariot"], improvements: [], laws: [], projects: [] } },
    { id: "TECH_FORESTRY", name: "Forestry", cost: 250, column: 2, row: 5, prereqs: ["TECH_POLIS"], unlocks: { units: [], improvements: ["Lumbermill"], laws: [], projects: [] } },
    { id: "TECH_STEEL", name: "Steel", cost: 250, column: 2, row: 7, prereqs: ["TECH_IRONWORKING", "TECH_MILITARY_DRILL"], unlocks: { units: ["Axeman"], improvements: [], laws: [], projects: [] } },
    { id: "TECH_SOVEREIGNTY", name: "Sovereignty", cost: 250, column: 2, row: 9, prereqs: ["TECH_ARISTOCRACY", "TECH_RHETORIC"], unlocks: { units: [], improvements: [], laws: ["Tyranny/Constitution"], projects: [] } },
    { id: "TECH_METAPHYSICS", name: "Metaphysics", cost: 250, column: 2, row: 10, prereqs: ["TECH_RHETORIC"], unlocks: { units: [], improvements: [], laws: [], projects: ["Archive"] } },
    { id: "TECH_COINAGE", name: "Coinage", cost: 400, column: 3, row: 0, prereqs: ["TECH_NAVIGATION"], unlocks: { units: [], improvements: ["Market"], laws: [], projects: [] } },
    { id: "TECH_CITIZENSHIP", name: "Citizenship", cost: 400, column: 3, row: 2, prereqs: ["TECH_PHALANX"], unlocks: { units: [], improvements: ["Courthouse"], laws: ["Divine Rule/Legal Code"], projects: [] } },
    { id: "TECH_PORTCULLIS", name: "Portcullis", cost: 400, column: 3, row: 3, prereqs: ["TECH_SPOKED_WHEEL"], unlocks: { units: [], improvements: [], laws: [], projects: ["Moat"] } },
    { id: "TECH_LAND_CONSOLIDATION", name: "Land Consolidation", cost: 400, column: 3, row: 5, prereqs: ["TECH_FORESTRY"], unlocks: { units: ["Camel Archer", "War Elephant"], improvements: ["Grove"], laws: [], projects: [] } },
    { id: "TECH_COMPOSITE_BOW", name: "Composite Bow", cost: 400, column: 3, row: 6, prereqs: ["TECH_MILITARY_DRILL"], unlocks: { units: ["Archer"], improvements: ["Range"], laws: [], projects: [] } },
    { id: "TECH_MONASTICISM", name: "Monasticism", cost: 400, column: 3, row: 8, prereqs: ["TECH_ARISTOCRACY"], unlocks: { units: [], improvements: ["Monastery"], laws: ["Monotheism/Polytheism"], projects: [] } },
    { id: "TECH_MACHINERY", name: "Machinery", cost: 400, column: 3, row: 9, prereqs: ["TECH_SOVEREIGNTY"], unlocks: { units: ["Onager"], improvements: [], laws: [], projects: [] } },
    { id: "TECH_SCHOLARSHIP", name: "Scholarship", cost: 700, column: 4, row: 1, prereqs: ["TECH_CITIZENSHIP"], unlocks: { units: [], improvements: ["Library"], laws: [], projects: [] } },
    { id: "TECH_STIRRUPS", name: "Stirrups", cost: 700, column: 4, row: 3, prereqs: ["TECH_PORTCULLIS"], unlocks: { units: ["Horseman", "Horse Archer"], improvements: [], laws: [], projects: [] } },
    { id: "TECH_ARCHITECTURE", name: "Architecture", cost: 400, column: 3, row: 4, prereqs: ["TECH_DRAMA"], unlocks: { units: [], improvements: ["Baths"], laws: ["Philosophy/Engineering"], projects: [] } },
    { id: "TECH_MANOR", name: "Manor", cost: 700, column: 4, row: 5, prereqs: ["TECH_LAND_CONSOLIDATION", "TECH_COMPOSITE_BOW"], unlocks: { units: ["Conscript"], improvements: [], laws: ["Professional Army/Volunteers"], projects: [] } },
    { id: "TECH_BATTLELINE", name: "Battle Line", cost: 700, column: 4, row: 7, prereqs: ["TECH_PHALANX", "TECH_STEEL"], unlocks: { units: ["Maceman"], improvements: [], laws: [], projects: [] } },
    { id: "TECH_DOCTRINE", name: "Doctrine", cost: 700, column: 4, row: 8, prereqs: ["TECH_MONASTICISM"], unlocks: { units: [], improvements: ["Temple"], laws: ["Tolerance/Orthodoxy"], projects: [] } },
    { id: "TECH_HYDRAULICS", name: "Hydraulics", cost: 700, column: 4, row: 9, prereqs: ["TECH_MACHINERY"], unlocks: { units: ["Ballista"], improvements: ["Watermill"], laws: [], projects: [] } },
    { id: "TECH_CARTOGRAPHY", name: "Cartography", cost: 700, column: 4, row: 10, prereqs: ["TECH_NAVIGATION", "TECH_METAPHYSICS"], unlocks: { units: ["Trireme"], improvements: ["Harbor"], laws: [], projects: [] } },
    { id: "TECH_LATEEN_SAIL", name: "Lateen Sail", cost: 1100, column: 5, row: 0, prereqs: ["TECH_COINAGE", "TECH_CARTOGRAPHY"], unlocks: { units: ["Dromon"], improvements: [], laws: ["Autarky/Trade League"], projects: [] } },
    { id: "TECH_JURISPRUDENCE", name: "Jurisprudence", cost: 1100, column: 5, row: 1, prereqs: ["TECH_SCHOLARSHIP"], unlocks: { units: [], improvements: [], laws: ["Guilds/Elites"], projects: [] } },
    { id: "TECH_MARTIAL_CODE", name: "Martial Code", cost: 1100, column: 5, row: 2, prereqs: ["TECH_STIRRUPS", "TECH_CITIZENSHIP"], unlocks: { units: [], improvements: [], laws: ["Pilgrimage/Holy War"], projects: ["Towers"] } },
    { id: "TECH_VAULTING", name: "Vaulting", cost: 700, column: 4, row: 4, prereqs: ["TECH_ARCHITECTURE"], unlocks: { units: [], improvements: ["Cathedral"], laws: ["Iconography/Calligraphy"], projects: [] } },
    { id: "TECH_BODKIN_ARROW", name: "Bodkin Arrow", cost: 1100, column: 5, row: 5, prereqs: ["TECH_MANOR"], unlocks: { units: ["Longbowman"], improvements: [], laws: [], projects: [] } },
    { id: "TECH_WINDLASS", name: "Windlass", cost: 1100, column: 5, row: 9, prereqs: ["TECH_COINAGE", "TECH_HYDRAULICS"], unlocks: { units: ["Crossbowman"], improvements: ["Windmill"], laws: [], projects: [] } },
    { id: "TECH_FISCAL_POLICY", name: "Fiscal Policy", cost: 1600, column: 6, row: 1, prereqs: ["TECH_LATEEN_SAIL", "TECH_JURISPRUDENCE"], unlocks: { units: [], improvements: [], laws: ["Coin Debasement/Monetary Reform"], projects: [] } },
    { id: "TECH_BARDING", name: "Barding", cost: 1600, column: 6, row: 2, prereqs: ["TECH_BATTLELINE", "TECH_MARTIAL_CODE"], unlocks: { units: ["Cataphract"], improvements: [], laws: [], projects: [] } },
    { id: "TECH_INFANTRY_SQUARE", name: "Infantry Square", cost: 1600, column: 6, row: 7, prereqs: ["TECH_BATTLELINE"], unlocks: { units: ["Pikeman"], improvements: [], laws: [], projects: [] } },
    { id: "TECH_COHORTS", name: "Cohorts", cost: 1600, column: 6, row: 6, prereqs: ["TECH_MANOR", "TECH_BATTLELINE"], unlocks: { units: ["Swordsman"], improvements: [], laws: [], projects: [] } },
    { id: "TECH_CHAIN_DRIVE", name: "Chain Drive", cost: 1600, column: 6, row: 9, prereqs: ["TECH_WINDLASS"], unlocks: { units: ["Polybolos"], improvements: [], laws: [], projects: [] } },
    { id: "TECH_BALLISTICS", name: "Ballistics", cost: 1600, column: 6, row: 10, prereqs: ["TECH_CARTOGRAPHY", "TECH_HYDRAULICS"], unlocks: { units: ["Mangonel"], improvements: [], laws: [], projects: [] } },
    { id: "TECH_ECONOMIC_REFORM", name: "Economic Reform", cost: 2000, column: 7, row: 1, prereqs: ["TECH_FISCAL_POLICY"], unlocks: { units: [], improvements: [], laws: [], projects: [] } },
    { id: "TECH_MILITARY_PRESTIGE", name: "Military Prestige", cost: 2000, column: 7, row: 5, prereqs: ["TECH_BARDING", "TECH_BODKIN_ARROW", "TECH_COHORTS"], unlocks: { units: [], improvements: [], laws: [], projects: [] } },
    { id: "TECH_INDUSTRIAL_PROGRESS", name: "Industrial Progress", cost: 2000, column: 7, row: 9, prereqs: ["TECH_CHAIN_DRIVE", "TECH_BALLISTICS"], unlocks: { units: [], improvements: [], laws: [], projects: [] } }
  ],
  bonusTechs: [
    { id: "TECH_STONECUTTING_BONUS_STONE", name: "Stone Boost", cost: 50, parent: "TECH_STONECUTTING", bonus: "+200 Stone", iconName: "BOOST_STONE" },
    { id: "TECH_ADMINISTRATION_BONUS_WORKER", name: "Free Worker", cost: 50, parent: "TECH_ADMINISTRATION", bonus: "+1 Worker", iconName: "BONUS_WORKER" },
    { id: "TECH_HUSBANDRY_BONUS_FOOD", name: "Food Boost", cost: 75, parent: "TECH_HUSBANDRY", bonus: "+200 Food", iconName: "BONUS_FOOD" },
    { id: "TECH_DRAMA_BONUS_SETTLER", name: "Free Settler", cost: 75, parent: "TECH_DRAMA", bonus: "+1 Settler", iconName: "BONUS_SETTLER" },
    { id: "TECH_ARISTOCRACY_BONUS_BORDERS", name: "Border Boost", cost: 75, parent: "TECH_ARISTOCRACY", bonus: "+6 Border Growth", iconName: "BOOST_BORDER" },
    { id: "TECH_NAVIGATION_BONUS_BIREME", name: "Free Bireme", cost: 125, parent: "TECH_STEEL", bonus: "+1 Bireme", iconName: "BONUS_BIREME" },
    { id: "TECH_PHALANX_BONUS_ORDERS", name: "Orders Boost", cost: 125, parent: "TECH_PHALANX", bonus: "+20 Orders", iconName: "BOOST_ORDERS" },
    { id: "TECH_SPOKED_WHEEL_BONUS_CHARIOT", name: "Free Chariot", cost: 125, parent: "TECH_SOVEREIGNTY", bonus: "+1 Chariot", iconName: "BONUS_CHARIOT" },
    { id: "TECH_FORESTRY_BONUS_SCIENTIST", name: "Free Court Scholar", cost: 125, parent: "TECH_METAPHYSICS", bonus: "+1 Court Scholar", iconName: "BONUS_COURTIER" },
    { id: "TECH_STEEL_BONUS_TRAINING", name: "Training Boost", cost: 125, parent: "TECH_STEEL", bonus: "+800 Training", iconName: "BONUS_TRAINING" },
    { id: "TECH_SOVEREIGNITY_BONUS_CIVICS", name: "Civics Boost", cost: 125, parent: "TECH_SOVEREIGNTY", bonus: "+800 Civics", iconName: "BONUS_CIVICS" },
    { id: "TECH_COINAGE_BONUS_MONEY", name: "Money Boost", cost: 200, parent: "TECH_COINAGE", bonus: "+4000 Money", iconName: "BOOST_MONEY" },
    { id: "TECH_CITIZENSHIP_BONUS_MINISTER", name: "Free Court Minister", cost: 200, parent: "TECH_CITIZENSHIP", bonus: "+1 Court Minister", iconName: "BONUS_COURTIER" },
    { id: "TECH_PORTCULLIS_BONUS_MACEMAN", name: "Free Maceman", cost: 200, parent: "TECH_PORTCULLIS", bonus: "+1 Maceman", iconName: "BONUS_MACEMAN" },
    { id: "TECH_LAND_CONSOLIDATION_BONUS_CAMEL_ARCHER", name: "Free Camel Archer", cost: 200, parent: "TECH_MONASTICISM", bonus: "+1 Camel Archer", iconName: "BONUS_CAMEL_ARCHER" },
    { id: "TECH_LAND_CONSOLIDATION_BONUS_WAR_ELEPHANT", name: "Free War Elephant", cost: 200, parent: "TECH_MACHINERY", bonus: "+1 War Elephant", iconName: "BONUS_WAR_ELEPHANT" },
    { id: "TECH_COMPOSITE_BOW_BONUS_ARCHER", name: "Free Archer", cost: 125, parent: "TECH_FORESTRY", bonus: "+1 Archer", iconName: "BONUS_ARCHER" },
    { id: "TECH_MACHINERY_BONUS_ONAGER", name: "Free Onager", cost: 200, parent: "TECH_PORTCULLIS", bonus: "+1 Onager", iconName: "BONUS_ONAGER" },
    { id: "TECH_SCHOLARSHIP_BONUS_SCIENTIST", name: "Free Court Scholar", cost: 350, parent: "TECH_SCHOLARSHIP", bonus: "+1 Court Scholar", iconName: "BONUS_COURTIER" },
    { id: "TECH_STIRRUPS_BONUS_HORSEMAN", name: "Free Horseman", cost: 200, parent: "TECH_LAND_CONSOLIDATION", bonus: "+1 Horseman", iconName: "BONUS_HORSEMAN" },
    { id: "TECH_STIRRUPS_BONUS_HORSE_ARCHER", name: "Free Horse Archer", cost: 200, parent: "TECH_COMPOSITE_BOW", bonus: "+1 Horse Archer", iconName: "BONUS_HORSE_ARCHER" },
    { id: "TECH_MANOR_BONUS_GOODS", name: "Goods Boost", cost: 200, parent: "TECH_MACHINERY", bonus: "+400 Iron, +400 Stone, +400 Wood", iconName: "BONUS_GOODS" },
    { id: "TECH_BATTLELINE_BONUS_SOLDIER", name: "Free Court Soldier", cost: 350, parent: "TECH_BATTLELINE", bonus: "+1 Court Soldier", iconName: "BONUS_COURTIER" },
    { id: "TECH_HYDRAULICS_BONUS_BALLISTA", name: "Free Ballista", cost: 200, parent: "TECH_COMPOSITE_BOW", bonus: "+1 Ballista", iconName: "BONUS_BALLISTA" },
    { id: "TECH_JURISPRUDENCE_BONUS_MINISTER", name: "Free Court Minister", cost: 550, parent: "TECH_JURISPRUDENCE", bonus: "+1 Court Minister", iconName: "BONUS_COURTIER" },
    { id: "TECH_VAULTING_BONUS_HAPPINESS", name: "Happiness Boost", cost: 350, parent: "TECH_VAULTING", bonus: "+1 Happiness", iconName: "BOOST_DISCONTENT" },
    { id: "TECH_BODKIN_ARROW_BONUS_LONGBOWMAN", name: "Free Longbowman", cost: 350, parent: "TECH_BATTLELINE", bonus: "+2 Longbowman", iconName: "BONUS_LONGBOWMAN" },
    { id: "TECH_FISCAL_POLICY_BONUS_MERCHANT", name: "Free Court Merchant", cost: 350, parent: "TECH_MANOR", bonus: "+1 Court Merchant", iconName: "BONUS_COURTIER" },
    { id: "TECH_INFANTRY_SQUARE_BONUS_SOLDIER", name: "Free Court Soldier", cost: 350, parent: "TECH_STIRRUPS", bonus: "+1 Court Soldier", iconName: "BONUS_COURTIER" },
    { id: "TECH_CHAIN_DRIVE_BONUS_MERCHANT", name: "Free Court Merchant", cost: 350, parent: "TECH_CARTOGRAPHY", bonus: "+1 Court Merchant", iconName: "BONUS_COURTIER" },
    { id: "TECH_BATTERING_RAM_BONUS", name: "Free Battering Ram", cost: 250, parent: "", bonus: "+2 Battering Ram", nation: "NATION_ASSYRIA", cultureRequired: "CULTURE_STRONG", iconName: "BONUS_BATTERING_RAM" },
    { id: "TECH_SIEGE_TOWER_BONUS", name: "Free Siege Tower", cost: 700, parent: "", bonus: "+2 Siege Tower", nation: "NATION_ASSYRIA", cultureRequired: "CULTURE_LEGENDARY", iconName: "BONUS_SIEGE_TOWER" },
    { id: "TECH_AKKADIAN_ARCHER_BONUS", name: "Free Akkadian Archer", cost: 250, parent: "", bonus: "+2 Akkadian Archer", nation: "NATION_BABYLONIA", cultureRequired: "CULTURE_STRONG", iconName: "BONUS_AKKADIAN" },
    { id: "TECH_CIMMERIAN_ARCHER_BONUS", name: "Free Cimmerian Archer", cost: 700, parent: "", bonus: "+2 Cimmerian Archer", nation: "NATION_BABYLONIA", cultureRequired: "CULTURE_LEGENDARY", iconName: "BONUS_CIMMERIAN_ARCHER" },
    { id: "TECH_AFRICAN_ELEPHANT_BONUS", name: "Free African Elephant", cost: 250, parent: "", bonus: "+2 African Elephant", nation: "NATION_CARTHAGE", cultureRequired: "CULTURE_STRONG", iconName: "BONUS_AFRICAN_ELEPHANT" },
    { id: "TECH_TURRETED_ELEPHANT_BONUS", name: "Free Turreted Elephant", cost: 700, parent: "", bonus: "+2 Turreted Elephant", nation: "NATION_CARTHAGE", cultureRequired: "CULTURE_LEGENDARY", iconName: "BONUS_TURRETED_ELEPHANT" },
    { id: "TECH_LIGHT_CHARIOT_BONUS", name: "Free Light Chariot", cost: 250, parent: "", bonus: "+2 Light Chariot", nation: "NATION_EGYPT", cultureRequired: "CULTURE_STRONG", iconName: "BONUS_LIGHT_CHARIOT" },
    { id: "TECH_MOUNTED_LANCER_BONUS", name: "Free Mounted Lancer", cost: 700, parent: "", bonus: "+2 Mounted Lancer", nation: "NATION_EGYPT", cultureRequired: "CULTURE_LEGENDARY", iconName: "BONUS_KUSHITE_CAVALRY" },
    { id: "TECH_HOPLITE_BONUS", name: "Free Hoplite", cost: 250, parent: "", bonus: "+2 Hoplite", nation: "NATION_GREECE", cultureRequired: "CULTURE_STRONG", iconName: "BONUS_HOPLITE" },
    { id: "TECH_PHALANGITE_BONUS", name: "Free Phalangite", cost: 700, parent: "", bonus: "+2 Phalangite", nation: "NATION_GREECE", cultureRequired: "CULTURE_LEGENDARY", iconName: "BONUS_PHALANGITE" },
    { id: "TECH_PALTON_CAVALRY_BONUS", name: "Free Palton Cavalry", cost: 250, parent: "", bonus: "+2 Palton Cavalry", nation: "NATION_PERSIA", cultureRequired: "CULTURE_STRONG", iconName: "BONUS_PALTON_CAVALRY" },
    { id: "TECH_CATAPHRACT_ARCHER_BONUS", name: "Free Cataphract Archer", cost: 700, parent: "", bonus: "+2 Cataphract Archer", nation: "NATION_PERSIA", cultureRequired: "CULTURE_LEGENDARY", iconName: "BONUS_CATAPHRACT_ARCHER" },
    { id: "TECH_HASTATUS_BONUS", name: "Free Hastatus", cost: 250, parent: "", bonus: "+2 Hastatus", nation: "NATION_ROME", cultureRequired: "CULTURE_STRONG", iconName: "BONUS_HASTATUS" },
    { id: "TECH_LEGIONARY_BONUS", name: "Free Legionary", cost: 700, parent: "", bonus: "+2 Legionary", nation: "NATION_ROME", cultureRequired: "CULTURE_LEGENDARY", iconName: "BONUS_LEGIONARY" },
    { id: "TECH_HITTITE_CHARIOT_1_BONUS", name: "Free Heavy Chariot", cost: 250, parent: "", bonus: "+2 Heavy Chariot", nation: "NATION_HITTITE", cultureRequired: "CULTURE_STRONG", iconName: "BONUS_HEAVY_CHARIOT" },
    { id: "TECH_HITTITE_CHARIOT_2_BONUS", name: "Free Three Man Chariot", cost: 700, parent: "", bonus: "+2 Three Man Chariot", nation: "NATION_HITTITE", cultureRequired: "CULTURE_LEGENDARY", iconName: "BONUS_THREE_MAN_CHARIOT" },
    { id: "TECH_MEDJAY_ARCHER_BONUS", name: "Free Medjay Archer", cost: 250, parent: "", bonus: "+2 Medjay Archer", nation: "NATION_KUSH", cultureRequired: "CULTURE_STRONG", iconName: "BONUS_NAPATAN_ARCHER" },
    { id: "TECH_BEJA_ARCHER_BONUS", name: "Free Beja Archer", cost: 700, parent: "", bonus: "+2 Beja Archer", nation: "NATION_KUSH", cultureRequired: "CULTURE_LEGENDARY", iconName: "BONUS_MEROITIC_ARCHER" },
    { id: "TECH_DMT_WARRIOR_BONUS", name: "Free D'mt Warrior", cost: 250, parent: "", bonus: "+1 D'mt Warrior", nation: "NATION_AKSUM", cultureRequired: "CULTURE_STRONG", iconName: "BONUS_DMT_WARRIOR" },
    { id: "TECH_SHOTELAI_BONUS", name: "Free Shotelai", cost: 700, parent: "", bonus: "+2 Shotelai", nation: "NATION_AKSUM", cultureRequired: "CULTURE_LEGENDARY", iconName: "BONUS_SHOTELAI" },
    { id: "TECH_RESOURCE_PORCELAIN_BONUS", name: "Free Porcelain", cost: 200, parent: "TECH_COINAGE", bonus: "+2 Porcelain", iconName: "TECH_PORCELAIN" },
    { id: "TECH_RESOURCE_EXOTIC_FUR_BONUS", name: "Free Exotic Fur", cost: 125, parent: "TECH_SPOKED_WHEEL", bonus: "+1 Exotic Furs", iconName: "TECH_EXOTIC_FUR" },
    { id: "TECH_RESOURCE_PERFUME_BONUS", name: "Free Perfume", cost: 200, parent: "TECH_ARCHITECTURE", bonus: "+2 Perfume", iconName: "TECH_PERFUME" },
    { id: "TECH_MAURYA_ASSAULT_ELEPHANT_BONUS", name: "Free Assault Elephant", cost: 250, parent: "", bonus: "+2 Assault Elephant", nation: "NATION_MAURYA", cultureRequired: "CULTURE_STRONG", iconName: "BONUS_ASSAULT_ELEPHANT" },
    { id: "TECH_MAURYA_ARMOURED_ELEPHANT_BONUS", name: "Free Armored Elephant", cost: 700, parent: "", bonus: "+2 Armored Elephant", nation: "NATION_MAURYA", cultureRequired: "CULTURE_LEGENDARY", iconName: "BONUS_ARMORED_ELEPHANT" },
    { id: "TECH_YUEZHI_STEPPE_RIDERS_BONUS", name: "Free Steppe Rider", cost: 100, parent: "", bonus: "+2 Steppe Rider", nation: "NATION_YUEZHI", cultureRequired: "CULTURE_DEVELOPING", iconName: "BONUS_STEPPE_RIDER" },
    { id: "TECH_YUEZHI_KUSHAN_CAVALRY_BONUS", name: "Free Kushan Cavalry", cost: 250, parent: "", bonus: "+2 Kushan Cavalry", nation: "NATION_YUEZHI", cultureRequired: "CULTURE_STRONG", iconName: "BONUS_KUSHAN_CAVALR" },
    { id: "TECH_YUEZHI_KUSHAN_WARLORD_BONUS", name: "Free Kushan Warlord", cost: 700, parent: "", bonus: "+2 Kushan Warlord", nation: "NATION_YUEZHI", cultureRequired: "CULTURE_LEGENDARY", iconName: "BONUS_KUSHAN_WARLORD" },
    { id: "TECH_TAMIL_JAVELIN_ELEPHANT_BONUS", name: "Free Javelin Elephant", cost: 250, parent: "", bonus: "+2 Javelin Elephant", nation: "NATION_TAMIL", cultureRequired: "CULTURE_STRONG", iconName: "BONUS_JAVELIN_ELEPHANT" },
    { id: "TECH_TAMIL_ARCHER_ELEPHANT_BONUS", name: "Free Elephant Archer", cost: 700, parent: "", bonus: "+2 Elephant Archer", nation: "NATION_TAMIL", cultureRequired: "CULTURE_LEGENDARY", iconName: "BONUS_ARCHER_ELEPHANT" }
  ]
};

window.nationLookup = [
  "NATION_AKSUM",
  "NATION_ASSYRIA",
  "NATION_BABYLONIA",
  "NATION_CARTHAGE",
  "NATION_EGYPT",
  "NATION_GREECE",
  "NATION_HITTITE",
  "NATION_KUSH",
  "NATION_MAURYA",
  "NATION_PERSIA",
  "NATION_ROME",
  "NATION_TAMIL",
  "NATION_YUEZHI"
];

window.nationData = {
  startingTechs: {
  "NATION_AKSUM": [
    "TECH_TRAPPING",
    "TECH_LABOR_FORCE",
    "TECH_ADMINISTRATION"
  ],
  "NATION_ASSYRIA": [
    "TECH_TRAPPING",
    "TECH_ADMINISTRATION",
    "TECH_MILITARY_DRILL"
  ],
  "NATION_BABYLONIA": [
    "TECH_TRAPPING",
    "TECH_ADMINISTRATION",
    "TECH_RHETORIC"
  ],
  "NATION_CARTHAGE": [
    "TECH_TRAPPING",
    "TECH_DIVINATION",
    "TECH_ARISTOCRACY"
  ],
  "NATION_EGYPT": [
    "TECH_IRONWORKING",
    "TECH_STONECUTTING",
    "TECH_LABOR_FORCE"
  ],
  "NATION_GREECE": [
    "TECH_IRONWORKING",
    "TECH_STONECUTTING",
    "TECH_DRAMA"
  ],
  "NATION_HITTITE": [
    "TECH_IRONWORKING",
    "TECH_HUSBANDRY",
    "TECH_ADMINISTRATION"
  ],
  "NATION_KUSH": [
    "TECH_TRAPPING",
    "TECH_STONECUTTING",
    "TECH_DIVINATION"
  ],
  "NATION_MAURYA": [
    "TECH_IRONWORKING",
    "TECH_STONECUTTING",
    "TECH_ADMINISTRATION"
  ],
  "NATION_PERSIA": [
    "TECH_IRONWORKING",
    "TECH_TRAPPING",
    "TECH_HUSBANDRY"
  ],
  "NATION_ROME": [
    "TECH_IRONWORKING",
    "TECH_STONECUTTING",
    "TECH_POLIS"
  ],
  "NATION_TAMIL": [
    "TECH_DIVINATION",
    "TECH_TRAPPING",
    "TECH_IRONWORKING"
  ],
  "NATION_YUEZHI": [
    "TECH_MILITARY_DRILL",
    "TECH_HUSBANDRY"
  ]
},
  nationNames: [
  {
    "id": "NATION_AKSUM",
    "name": "Aksum"
  },
  {
    "id": "NATION_ASSYRIA",
    "name": "Assyria"
  },
  {
    "id": "NATION_BABYLONIA",
    "name": "Babylonia"
  },
  {
    "id": "NATION_CARTHAGE",
    "name": "Carthage"
  },
  {
    "id": "NATION_EGYPT",
    "name": "Egypt"
  },
  {
    "id": "NATION_GREECE",
    "name": "Greece"
  },
  {
    "id": "NATION_HITTITE",
    "name": "Hittite"
  },
  {
    "id": "NATION_KUSH",
    "name": "Kush"
  },
  {
    "id": "NATION_MAURYA",
    "name": "Maurya"
  },
  {
    "id": "NATION_PERSIA",
    "name": "Persia"
  },
  {
    "id": "NATION_ROME",
    "name": "Rome"
  },
  {
    "id": "NATION_TAMIL",
    "name": "Tamil"
  },
  {
    "id": "NATION_YUEZHI",
    "name": "Yuezhi"
  }
],
  nationSpecificBonuses: {
  "NATION_ASSYRIA": [
    "TECH_BATTERING_RAM_BONUS",
    "TECH_SIEGE_TOWER_BONUS"
  ],
  "NATION_BABYLONIA": [
    "TECH_AKKADIAN_ARCHER_BONUS",
    "TECH_CIMMERIAN_ARCHER_BONUS"
  ],
  "NATION_CARTHAGE": [
    "TECH_AFRICAN_ELEPHANT_BONUS",
    "TECH_TURRETED_ELEPHANT_BONUS"
  ],
  "NATION_EGYPT": [
    "TECH_LIGHT_CHARIOT_BONUS",
    "TECH_MOUNTED_LANCER_BONUS"
  ],
  "NATION_GREECE": [
    "TECH_HOPLITE_BONUS",
    "TECH_PHALANGITE_BONUS"
  ],
  "NATION_PERSIA": [
    "TECH_PALTON_CAVALRY_BONUS",
    "TECH_CATAPHRACT_ARCHER_BONUS"
  ],
  "NATION_ROME": [
    "TECH_HASTATUS_BONUS",
    "TECH_LEGIONARY_BONUS"
  ],
  "NATION_HITTITE": [
    "TECH_HITTITE_CHARIOT_1_BONUS",
    "TECH_HITTITE_CHARIOT_2_BONUS"
  ],
  "NATION_KUSH": [
    "TECH_MEDJAY_ARCHER_BONUS",
    "TECH_BEJA_ARCHER_BONUS"
  ],
  "NATION_AKSUM": [
    "TECH_DMT_WARRIOR_BONUS",
    "TECH_SHOTELAI_BONUS"
  ],
  "NATION_MAURYA": [
    "TECH_MAURYA_ASSAULT_ELEPHANT_BONUS",
    "TECH_MAURYA_ARMOURED_ELEPHANT_BONUS"
  ],
  "NATION_YUEZHI": [
    "TECH_YUEZHI_STEPPE_RIDERS_BONUS",
    "TECH_YUEZHI_KUSHAN_CAVALRY_BONUS",
    "TECH_YUEZHI_KUSHAN_WARLORD_BONUS"
  ],
  "NATION_TAMIL": [
    "TECH_TAMIL_JAVELIN_ELEPHANT_BONUS",
    "TECH_TAMIL_ARCHER_ELEPHANT_BONUS"
  ]
}
};

window.currentVersionHash = "03e3";
window.versionMaps = {"67b2": {"techs": ["TECH_IRONWORKING", "TECH_STONECUTTING", "TECH_TRAPPING", "TECH_DIVINATION", "TECH_ADMINISTRATION", "TECH_LABOR_FORCE", "TECH_HUSBANDRY", "TECH_DRAMA", "TECH_POLIS", "TECH_MILITARY_DRILL", "TECH_ARISTOCRACY", "TECH_RHETORIC", "TECH_NAVIGATION", "TECH_PHALANX", "TECH_SPOKED_WHEEL", "TECH_FORESTRY", "TECH_STEEL", "TECH_SOVEREIGNTY", "TECH_METAPHYSICS", "TECH_COINAGE", "TECH_CITIZENSHIP", "TECH_PORTCULLIS", "TECH_LAND_CONSOLIDATION", "TECH_COMPOSITE_BOW", "TECH_MONASTICISM", "TECH_MACHINERY", "TECH_SCHOLARSHIP", "TECH_STIRRUPS", "TECH_ARCHITECTURE", "TECH_MANOR", "TECH_BATTLELINE", "TECH_DOCTRINE", "TECH_HYDRAULICS", "TECH_CARTOGRAPHY", "TECH_LATEEN_SAIL", "TECH_JURISPRUDENCE", "TECH_MARTIAL_CODE", "TECH_VAULTING", "TECH_BODKIN_ARROW", "TECH_WINDLASS", "TECH_FISCAL_POLICY", "TECH_BARDING", "TECH_INFANTRY_SQUARE", "TECH_COHORTS", "TECH_CHAIN_DRIVE", "TECH_BALLISTICS", "TECH_ECONOMIC_REFORM", "TECH_MILITARY_PRESTIGE", "TECH_INDUSTRIAL_PROGRESS"], "bonusTechs": ["TECH_STONECUTTING_BONUS_STONE", "TECH_ADMINISTRATION_BONUS_WORKER", "TECH_HUSBANDRY_BONUS_FOOD", "TECH_DRAMA_BONUS_SETTLER", "TECH_ARISTOCRACY_BONUS_BORDERS", "TECH_NAVIGATION_BONUS_BIREME", "TECH_PHALANX_BONUS_ORDERS", "TECH_SPOKED_WHEEL_BONUS_CHARIOT", "TECH_FORESTRY_BONUS_SCIENTIST", "TECH_STEEL_BONUS_TRAINING", "TECH_SOVEREIGNITY_BONUS_CIVICS", "TECH_COINAGE_BONUS_MONEY", "TECH_CITIZENSHIP_BONUS_MINISTER", "TECH_PORTCULLIS_BONUS_MACEMAN", "TECH_LAND_CONSOLIDATION_BONUS_CAMEL_ARCHER", "TECH_LAND_CONSOLIDATION_BONUS_WAR_ELEPHANT", "TECH_COMPOSITE_BOW_BONUS_ARCHER", "TECH_MACHINERY_BONUS_ONAGER", "TECH_SCHOLARSHIP_BONUS_SCIENTIST", "TECH_STIRRUPS_BONUS_HORSEMAN", "TECH_STIRRUPS_BONUS_HORSE_ARCHER", "TECH_MANOR_BONUS_GOODS", "TECH_BATTLELINE_BONUS_SOLDIER", "TECH_HYDRAULICS_BONUS_BALLISTA", "TECH_JURISPRUDENCE_BONUS_MINISTER", "TECH_VAULTING_BONUS_HAPPINESS", "TECH_BODKIN_ARROW_BONUS_LONGBOWMAN", "TECH_FISCAL_POLICY_BONUS_MERCHANT", "TECH_INFANTRY_SQUARE_BONUS_SOLDIER", "TECH_CHAIN_DRIVE_BONUS_MERCHANT", "TECH_BATTERING_RAM_BONUS", "TECH_SIEGE_TOWER_BONUS", "TECH_AKKADIAN_ARCHER_BONUS", "TECH_CIMMERIAN_ARCHER_BONUS", "TECH_AFRICAN_ELEPHANT_BONUS", "TECH_TURRETED_ELEPHANT_BONUS", "TECH_LIGHT_CHARIOT_BONUS", "TECH_MOUNTED_LANCER_BONUS", "TECH_HOPLITE_BONUS", "TECH_PHALANGITE_BONUS", "TECH_PALTON_CAVALRY_BONUS", "TECH_CATAPHRACT_ARCHER_BONUS", "TECH_HASTATUS_BONUS", "TECH_LEGIONARY_BONUS", "TECH_HITTITE_CHARIOT_1_BONUS", "TECH_HITTITE_CHARIOT_2_BONUS", "TECH_MEDJAY_ARCHER_BONUS", "TECH_BEJA_ARCHER_BONUS", "TECH_DMT_WARRIOR_BONUS", "TECH_SHOTELAI_BONUS", "TECH_RESOURCE_PORCELAIN_BONUS", "TECH_RESOURCE_EXOTIC_FUR_BONUS", "TECH_RESOURCE_PERFUME_BONUS"]}};
