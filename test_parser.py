#!/usr/bin/env python3
"""
Tests for Old World Tech Tree parser - verifying game data update changes.
Uses red-green TDD: tests written first, then parser updated to pass.
"""

import unittest
import json
import sys
from pathlib import Path

# Import the parser
from generate_tech_tree import OldWorldParser


class TestParserWithLatestGameData(unittest.TestCase):
    """Tests that verify the parser handles the latest game data correctly."""

    @classmethod
    def setUpClass(cls):
        """Parse the XML files once for all tests."""
        cls.parser = OldWorldParser("XML/Infos")
        cls.parser.parse_all()
        cls.data = cls.parser.export_data()

    # =========================================================================
    # 1. Disabled techs should be excluded
    # =========================================================================

    def test_disabled_crossbowman_windlass_excluded(self):
        """TECH_WINDLASS_BONUS_CROSSBOWMAN has bDisable=1 and should not appear."""
        all_ids = [t["id"] for t in self.data["bonusTechs"]]
        self.assertNotIn("TECH_WINDLASS_BONUS_CROSSBOWMAN", all_ids)

    def test_disabled_silk_bonus_excluded(self):
        """TECH_RESOURCE_SILK_BONUS has bDisable=1 and should not appear."""
        all_ids = [t["id"] for t in self.data["bonusTechs"]]
        self.assertNotIn("TECH_RESOURCE_SILK_BONUS", all_ids)

    def test_disabled_ebony_bonus_excluded(self):
        """TECH_RESOURCE_EBONY_BONUS has bDisable=1 and should not appear."""
        all_ids = [t["id"] for t in self.data["bonusTechs"]]
        self.assertNotIn("TECH_RESOURCE_EBONY_BONUS", all_ids)

    def test_disabled_techs_not_in_main_techs_either(self):
        """Disabled techs should not appear in main tech list."""
        all_ids = [t["id"] for t in self.data["techs"]]
        self.assertNotIn("TECH_WINDLASS_BONUS_CROSSBOWMAN", all_ids)
        self.assertNotIn("TECH_RESOURCE_SILK_BONUS", all_ids)
        self.assertNotIn("TECH_RESOURCE_EBONY_BONUS", all_ids)

    # =========================================================================
    # 2. Nation bonus techs now use CultureValid instead of tech prereqs
    # =========================================================================

    def _find_bonus(self, tech_id):
        """Helper to find a bonus tech by ID."""
        for b in self.data["bonusTechs"]:
            if b["id"] == tech_id:
                return b
        return None

    def test_nation_bonus_tier1_has_culture_strong(self):
        """Tier 1 nation bonus techs should have cultureRequired=CULTURE_STRONG."""
        tier1_ids = [
            "TECH_BATTERING_RAM_BONUS",
            "TECH_AKKADIAN_ARCHER_BONUS",
            "TECH_AFRICAN_ELEPHANT_BONUS",
            "TECH_LIGHT_CHARIOT_BONUS",
            "TECH_HOPLITE_BONUS",
            "TECH_PALTON_CAVALRY_BONUS",
            "TECH_HASTATUS_BONUS",
            "TECH_HITTITE_CHARIOT_1_BONUS",
            "TECH_MEDJAY_ARCHER_BONUS",
            "TECH_DMT_WARRIOR_BONUS",
        ]
        for tech_id in tier1_ids:
            bonus = self._find_bonus(tech_id)
            if bonus is None:
                self.fail(f"Bonus tech {tech_id} not found in output")
            self.assertEqual(
                bonus.get("cultureRequired"), "CULTURE_STRONG",
                f"{tech_id} should require CULTURE_STRONG"
            )

    def test_nation_bonus_tier2_has_culture_legendary(self):
        """Tier 2 nation bonus techs should have cultureRequired=CULTURE_LEGENDARY."""
        tier2_ids = [
            "TECH_SIEGE_TOWER_BONUS",
            "TECH_CIMMERIAN_ARCHER_BONUS",
            "TECH_TURRETED_ELEPHANT_BONUS",
            "TECH_MOUNTED_LANCER_BONUS",
            "TECH_PHALANGITE_BONUS",
            "TECH_CATAPHRACT_ARCHER_BONUS",
            "TECH_LEGIONARY_BONUS",
            "TECH_HITTITE_CHARIOT_2_BONUS",
            "TECH_BEJA_ARCHER_BONUS",
            "TECH_SHOTELAI_BONUS",
        ]
        for tech_id in tier2_ids:
            bonus = self._find_bonus(tech_id)
            if bonus is None:
                self.fail(f"Bonus tech {tech_id} not found in output")
            self.assertEqual(
                bonus.get("cultureRequired"), "CULTURE_LEGENDARY",
                f"{tech_id} should require CULTURE_LEGENDARY"
            )

    def test_nation_bonus_tier1_no_parent_tech(self):
        """Tier 1 nation bonus techs no longer have a parent tech prereq."""
        bonus = self._find_bonus("TECH_BATTERING_RAM_BONUS")
        self.assertIsNotNone(bonus)
        # parent should be empty/None since there are no tech prereqs anymore
        self.assertFalse(bonus.get("parent"),
                         "TECH_BATTERING_RAM_BONUS should have no parent tech")

    def test_nation_bonus_tier1_cost_200(self):
        """Tier 1 nation bonus techs now cost 200 (was 100)."""
        bonus = self._find_bonus("TECH_BATTERING_RAM_BONUS")
        self.assertIsNotNone(bonus)
        self.assertEqual(bonus["cost"], 200)

    def test_nation_bonus_tier2_cost_600(self):
        """Tier 2 nation bonus techs still cost 600."""
        bonus = self._find_bonus("TECH_SIEGE_TOWER_BONUS")
        self.assertIsNotNone(bonus)
        self.assertEqual(bonus["cost"], 600)

    # =========================================================================
    # 3. Porcelain bonus changes
    # =========================================================================

    def test_porcelain_bonus_cost_reduced(self):
        """Porcelain bonus should cost 200 (was 600)."""
        bonus = self._find_bonus("TECH_RESOURCE_PORCELAIN_BONUS")
        self.assertIsNotNone(bonus, "Porcelain bonus should exist")
        self.assertEqual(bonus["cost"], 200)

    def test_porcelain_bonus_prereq_coinage(self):
        """Porcelain bonus prerequisite changed from Lateen Sail to Coinage."""
        bonus = self._find_bonus("TECH_RESOURCE_PORCELAIN_BONUS")
        self.assertIsNotNone(bonus)
        self.assertEqual(bonus.get("parent"), "TECH_COINAGE")

    # =========================================================================
    # 4. Non-disabled bonus techs should still exist
    # =========================================================================

    def test_remaining_resource_bonuses_exist(self):
        """Non-disabled resource bonuses should still be present."""
        all_ids = [t["id"] for t in self.data["bonusTechs"]]
        # These should still exist
        expected = [
            "TECH_RESOURCE_PORCELAIN_BONUS",
            "TECH_RESOURCE_EXOTIC_FUR_BONUS",
            "TECH_RESOURCE_PERFUME_BONUS",
        ]
        for tid in expected:
            self.assertIn(tid, all_ids, f"{tid} should still exist as bonus tech")

    # =========================================================================
    # 5. Smoke tests - overall output sanity
    # =========================================================================

    def test_has_main_techs(self):
        """Should have a reasonable number of main techs (46 regular + 3 victory = 49)."""
        self.assertGreaterEqual(len(self.data["techs"]), 49)

    def test_has_bonus_techs(self):
        """Should have bonus techs (fewer now with 3 disabled)."""
        self.assertGreaterEqual(len(self.data["bonusTechs"]), 40)

    def test_has_nation_data(self):
        """Should have nation starting tech data."""
        self.assertGreaterEqual(len(self.data["nationData"]["startingTechs"]), 8)

    def test_victory_techs_are_main(self):
        """Victory techs should be in main techs, not bonus techs."""
        main_ids = [t["id"] for t in self.data["techs"]]
        bonus_ids = [t["id"] for t in self.data["bonusTechs"]]
        for vid in ["TECH_ECONOMIC_REFORM", "TECH_MILITARY_PRESTIGE", "TECH_INDUSTRIAL_PROGRESS"]:
            self.assertIn(vid, main_ids, f"{vid} should be a main tech")
            self.assertNotIn(vid, bonus_ids, f"{vid} should not be a bonus tech")


class TestHTMLGeneration(unittest.TestCase):
    """Tests for the generated HTML output."""

    @classmethod
    def setUpClass(cls):
        """Parse and generate HTML."""
        from generate_tech_tree import OldWorldParser, generate_html
        parser = OldWorldParser("XML/Infos")
        parser.parse_all()
        cls.data = parser.export_data()
        # Generate to a temp file
        generate_html(cls.data, output_path="test_output.html")
        with open("test_output.html") as f:
            cls.html = f.read()

    @classmethod
    def tearDownClass(cls):
        import os
        if os.path.exists("test_output.html"):
            os.remove("test_output.html")

    def test_html_contains_culture_required(self):
        """Generated HTML should contain cultureRequired fields for nation bonuses."""
        self.assertIn('cultureRequired: "CULTURE_STRONG"', self.html)
        self.assertIn('cultureRequired: "CULTURE_LEGENDARY"', self.html)

    def test_html_excludes_disabled_techs(self):
        """Generated HTML should not contain disabled tech IDs."""
        self.assertNotIn("TECH_WINDLASS_BONUS_CROSSBOWMAN", self.html)
        self.assertNotIn("TECH_RESOURCE_SILK_BONUS", self.html)
        self.assertNotIn("TECH_RESOURCE_EBONY_BONUS", self.html)

    def test_html_contains_porcelain_with_coinage_parent(self):
        """Porcelain bonus should reference TECH_COINAGE as parent."""
        # Find the porcelain entry in HTML
        import re
        match = re.search(r'\{[^}]*TECH_RESOURCE_PORCELAIN_BONUS[^}]*\}', self.html)
        self.assertIsNotNone(match, "Porcelain bonus should exist in HTML")
        self.assertIn('parent: "TECH_COINAGE"', match.group())

    def test_nation_bonus_empty_parent(self):
        """Nation bonus techs should have empty parent since no tech prereqs."""
        import re
        match = re.search(r'\{[^}]*TECH_BATTERING_RAM_BONUS[^}]*\}', self.html)
        self.assertIsNotNone(match)
        self.assertIn('parent: ""', match.group())

    def test_bonus_count_in_html(self):
        """Should have 53 bonus techs (56 original - 3 disabled)."""
        import re
        bonus_ids = re.findall(r'id: "TECH_[^"]*"', self.html)
        # Count only bonus section
        bonus_section = self.html[self.html.find("bonusTechs:"):]
        bonus_ids = re.findall(r'id: "TECH_[^"]*"', bonus_section)
        self.assertEqual(len(bonus_ids), 53)


if __name__ == "__main__":
    unittest.main(verbosity=2)
