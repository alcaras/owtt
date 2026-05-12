#!/usr/bin/env python3
"""
Tests for the Old World Tech Tree parser and tech-data.js emitter.
"""

import os
import re
import unittest
from pathlib import Path

from generate_tech_tree import (
    OldWorldParser,
    compute_version_hash,
    generate_tech_data_js,
)


class TestParserWithLatestGameData(unittest.TestCase):
    """Verify the parser handles the latest game data correctly."""

    @classmethod
    def setUpClass(cls):
        cls.parser = OldWorldParser("XML/Infos")
        cls.parser.parse_all()
        cls.data = cls.parser.export_data()

    # -- disabled techs --

    def test_disabled_crossbowman_windlass_excluded(self):
        all_ids = [t["id"] for t in self.data["bonusTechs"]]
        self.assertNotIn("TECH_WINDLASS_BONUS_CROSSBOWMAN", all_ids)

    def test_disabled_silk_bonus_excluded(self):
        all_ids = [t["id"] for t in self.data["bonusTechs"]]
        self.assertNotIn("TECH_RESOURCE_SILK_BONUS", all_ids)

    def test_disabled_ebony_bonus_excluded(self):
        all_ids = [t["id"] for t in self.data["bonusTechs"]]
        self.assertNotIn("TECH_RESOURCE_EBONY_BONUS", all_ids)

    def test_disabled_techs_not_in_main_techs_either(self):
        all_ids = [t["id"] for t in self.data["techs"]]
        self.assertNotIn("TECH_WINDLASS_BONUS_CROSSBOWMAN", all_ids)
        self.assertNotIn("TECH_RESOURCE_SILK_BONUS", all_ids)
        self.assertNotIn("TECH_RESOURCE_EBONY_BONUS", all_ids)

    # -- nation bonuses use CultureValid --

    def _find_bonus(self, tech_id):
        for b in self.data["bonusTechs"]:
            if b["id"] == tech_id:
                return b
        return None

    def test_nation_bonus_tier1_has_culture_strong(self):
        tier1_ids = [
            "TECH_BATTERING_RAM_BONUS", "TECH_AKKADIAN_ARCHER_BONUS",
            "TECH_AFRICAN_ELEPHANT_BONUS", "TECH_LIGHT_CHARIOT_BONUS",
            "TECH_HOPLITE_BONUS", "TECH_PALTON_CAVALRY_BONUS",
            "TECH_HASTATUS_BONUS", "TECH_HITTITE_CHARIOT_1_BONUS",
            "TECH_MEDJAY_ARCHER_BONUS", "TECH_DMT_WARRIOR_BONUS",
            "TECH_MAURYA_ASSAULT_ELEPHANT_BONUS",
            "TECH_YUEZHI_KUSHAN_CAVALRY_BONUS",
            "TECH_TAMIL_JAVELIN_ELEPHANT_BONUS",
        ]
        for tech_id in tier1_ids:
            bonus = self._find_bonus(tech_id)
            self.assertIsNotNone(bonus, f"Bonus tech {tech_id} not found")
            self.assertEqual(bonus.get("cultureRequired"), "CULTURE_STRONG",
                             f"{tech_id} should require CULTURE_STRONG")

    def test_nation_bonus_tier2_has_culture_legendary(self):
        tier2_ids = [
            "TECH_SIEGE_TOWER_BONUS", "TECH_CIMMERIAN_ARCHER_BONUS",
            "TECH_TURRETED_ELEPHANT_BONUS", "TECH_MOUNTED_LANCER_BONUS",
            "TECH_PHALANGITE_BONUS", "TECH_CATAPHRACT_ARCHER_BONUS",
            "TECH_LEGIONARY_BONUS", "TECH_HITTITE_CHARIOT_2_BONUS",
            "TECH_BEJA_ARCHER_BONUS", "TECH_SHOTELAI_BONUS",
            "TECH_MAURYA_ARMOURED_ELEPHANT_BONUS",
            "TECH_YUEZHI_KUSHAN_WARLORD_BONUS",
            "TECH_TAMIL_ARCHER_ELEPHANT_BONUS",
        ]
        for tech_id in tier2_ids:
            bonus = self._find_bonus(tech_id)
            self.assertIsNotNone(bonus, f"Bonus tech {tech_id} not found")
            self.assertEqual(bonus.get("cultureRequired"), "CULTURE_LEGENDARY",
                             f"{tech_id} should require CULTURE_LEGENDARY")

    def test_nation_bonus_tier1_no_parent_tech(self):
        bonus = self._find_bonus("TECH_BATTERING_RAM_BONUS")
        self.assertIsNotNone(bonus)
        self.assertFalse(bonus.get("parent"))

    def test_nation_bonus_tier1_cost_250(self):
        bonus = self._find_bonus("TECH_BATTERING_RAM_BONUS")
        self.assertIsNotNone(bonus)
        self.assertEqual(bonus["cost"], 250)

    def test_nation_bonus_tier2_cost_700(self):
        bonus = self._find_bonus("TECH_SIEGE_TOWER_BONUS")
        self.assertIsNotNone(bonus)
        self.assertEqual(bonus["cost"], 700)

    # -- porcelain --

    def test_porcelain_bonus_cost_reduced(self):
        bonus = self._find_bonus("TECH_RESOURCE_PORCELAIN_BONUS")
        self.assertIsNotNone(bonus)
        self.assertEqual(bonus["cost"], 200)

    def test_porcelain_bonus_prereq_coinage(self):
        bonus = self._find_bonus("TECH_RESOURCE_PORCELAIN_BONUS")
        self.assertIsNotNone(bonus)
        self.assertEqual(bonus.get("parent"), "TECH_COINAGE")

    # -- general sanity --

    def test_remaining_resource_bonuses_exist(self):
        all_ids = [t["id"] for t in self.data["bonusTechs"]]
        for tid in [
            "TECH_RESOURCE_PORCELAIN_BONUS",
            "TECH_RESOURCE_EXOTIC_FUR_BONUS",
            "TECH_RESOURCE_PERFUME_BONUS",
        ]:
            self.assertIn(tid, all_ids, f"{tid} should still exist")

    def test_has_main_techs(self):
        self.assertGreaterEqual(len(self.data["techs"]), 49)

    def test_has_bonus_techs(self):
        self.assertGreaterEqual(len(self.data["bonusTechs"]), 40)

    def test_has_nation_data(self):
        self.assertGreaterEqual(len(self.data["nationData"]["startingTechs"]), 11)

    def test_victory_techs_are_main(self):
        main_ids = [t["id"] for t in self.data["techs"]]
        bonus_ids = [t["id"] for t in self.data["bonusTechs"]]
        for vid in ["TECH_ECONOMIC_REFORM", "TECH_MILITARY_PRESTIGE", "TECH_INDUSTRIAL_PROGRESS"]:
            self.assertIn(vid, main_ids)
            self.assertNotIn(vid, bonus_ids)

    # -- EOTI DLC --

    def test_eoti_nations_exist(self):
        for nation_id in ["NATION_MAURYA", "NATION_TAMIL", "NATION_YUEZHI"]:
            self.assertIn(nation_id, self.data["nationData"]["startingTechs"])

    def test_eoti_nation_starting_techs(self):
        st = self.data["nationData"]["startingTechs"]
        self.assertEqual(st["NATION_MAURYA"],
                         ["TECH_IRONWORKING", "TECH_STONECUTTING", "TECH_ADMINISTRATION"])
        self.assertEqual(st["NATION_TAMIL"],
                         ["TECH_DIVINATION", "TECH_TRAPPING", "TECH_IRONWORKING"])
        self.assertEqual(st["NATION_YUEZHI"],
                         ["TECH_MILITARY_DRILL", "TECH_HUSBANDRY"])

    def test_eoti_bonus_techs_exist(self):
        all_ids = [t["id"] for t in self.data["bonusTechs"]]
        for tid in [
            "TECH_MAURYA_ASSAULT_ELEPHANT_BONUS",
            "TECH_MAURYA_ARMOURED_ELEPHANT_BONUS",
            "TECH_YUEZHI_STEPPE_RIDERS_BONUS",
            "TECH_YUEZHI_KUSHAN_CAVALRY_BONUS",
            "TECH_YUEZHI_KUSHAN_WARLORD_BONUS",
            "TECH_TAMIL_JAVELIN_ELEPHANT_BONUS",
            "TECH_TAMIL_ARCHER_ELEPHANT_BONUS",
        ]:
            self.assertIn(tid, all_ids)

    def test_yuezhi_steppe_riders_culture_developing(self):
        bonus = self._find_bonus("TECH_YUEZHI_STEPPE_RIDERS_BONUS")
        self.assertIsNotNone(bonus)
        self.assertEqual(bonus.get("cultureRequired"), "CULTURE_DEVELOPING")

    def test_eoti_bonus_nation_assignments(self):
        for tech_id, nation in [
            ("TECH_MAURYA_ASSAULT_ELEPHANT_BONUS", "NATION_MAURYA"),
            ("TECH_MAURYA_ARMOURED_ELEPHANT_BONUS", "NATION_MAURYA"),
            ("TECH_YUEZHI_STEPPE_RIDERS_BONUS", "NATION_YUEZHI"),
            ("TECH_YUEZHI_KUSHAN_CAVALRY_BONUS", "NATION_YUEZHI"),
            ("TECH_YUEZHI_KUSHAN_WARLORD_BONUS", "NATION_YUEZHI"),
            ("TECH_TAMIL_JAVELIN_ELEPHANT_BONUS", "NATION_TAMIL"),
            ("TECH_TAMIL_ARCHER_ELEPHANT_BONUS", "NATION_TAMIL"),
        ]:
            bonus = self._find_bonus(tech_id)
            self.assertIsNotNone(bonus)
            self.assertEqual(bonus.get("nation"), nation)


class TestTechDataJsGeneration(unittest.TestCase):
    """Verify the tech-data.js emitter exposes the right window.* globals."""

    OUT = "test_tech_data.js"

    @classmethod
    def setUpClass(cls):
        parser = OldWorldParser("XML/Infos")
        parser.parse_all()
        cls.data = parser.export_data()
        generate_tech_data_js(cls.data, output_path=cls.OUT)
        with open(cls.OUT) as f:
            cls.js = f.read()

    @classmethod
    def tearDownClass(cls):
        if os.path.exists(cls.OUT):
            os.remove(cls.OUT)

    def test_exports_window_globals(self):
        for symbol in [
            "window.techData", "window.nationData", "window.nationLookup",
            "window.currentVersionHash", "window.versionMaps", "window.gameVersion",
        ]:
            self.assertIn(symbol, self.js, f"{symbol} should be assigned")

    def test_contains_culture_required(self):
        self.assertIn('cultureRequired: "CULTURE_STRONG"', self.js)
        self.assertIn('cultureRequired: "CULTURE_LEGENDARY"', self.js)
        self.assertIn('cultureRequired: "CULTURE_DEVELOPING"', self.js)

    def test_excludes_disabled_techs(self):
        self.assertNotIn("TECH_WINDLASS_BONUS_CROSSBOWMAN", self.js)
        self.assertNotIn("TECH_RESOURCE_SILK_BONUS", self.js)
        self.assertNotIn("TECH_RESOURCE_EBONY_BONUS", self.js)

    def test_porcelain_parent_is_coinage(self):
        m = re.search(r'\{[^}]*TECH_RESOURCE_PORCELAIN_BONUS[^}]*\}', self.js)
        self.assertIsNotNone(m)
        self.assertIn('parent: "TECH_COINAGE"', m.group())

    def test_nation_bonus_empty_parent(self):
        m = re.search(r'\{[^}]*TECH_BATTERING_RAM_BONUS[^}]*\}', self.js)
        self.assertIsNotNone(m)
        self.assertIn('parent: ""', m.group())

    def test_bonus_count(self):
        # bonusTechs section
        section = self.js[self.js.find("bonusTechs:"):]
        ids = re.findall(r'id: "TECH_[^"]*"', section)
        # 49 main techs + 60 bonus techs is the current snapshot; bonus IDs in
        # bonusTechs section.
        self.assertEqual(len(ids), 60)

    def test_contains_version_hash(self):
        h = compute_version_hash(self.data["techs"], self.data["bonusTechs"])
        self.assertIn(f'window.currentVersionHash = "{h}"', self.js)

    def test_contains_version_maps(self):
        self.assertIn("window.versionMaps =", self.js)

    def test_contains_game_version(self):
        self.assertIn("window.gameVersion =", self.js)


class TestVersionHash(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        parser = OldWorldParser("XML/Infos")
        parser.parse_all()
        cls.data = parser.export_data()

    def test_returns_4_hex_chars(self):
        h = compute_version_hash(self.data["techs"], self.data["bonusTechs"])
        self.assertEqual(len(h), 4)
        self.assertTrue(all(c in "0123456789abcdef" for c in h))

    def test_deterministic(self):
        h1 = compute_version_hash(self.data["techs"], self.data["bonusTechs"])
        h2 = compute_version_hash(self.data["techs"], self.data["bonusTechs"])
        self.assertEqual(h1, h2)

    def test_changes_with_different_techs(self):
        h1 = compute_version_hash(self.data["techs"], self.data["bonusTechs"])
        modified = self.data["techs"][:-1]
        h2 = compute_version_hash(modified, self.data["bonusTechs"])
        self.assertNotEqual(h1, h2)


class TestStaticAssetsPresent(unittest.TestCase):
    """Sanity check that the deployable assets exist at the repo root."""

    def test_required_files_exist(self):
        for f in [
            "index.html", "phone.html",
            "tree-app.js", "tree-styles.css",
            "phone-app.js",
            "tech-data.js",
            "manifest.webmanifest", "sw.js",
            "img/app-icon.svg", "img/app-icon-192.png", "img/app-icon-512.png",
        ]:
            self.assertTrue(Path(f).exists(), f"{f} should exist at repo root")


if __name__ == "__main__":
    unittest.main(verbosity=2)
