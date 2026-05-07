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
            "TECH_MAURYA_ASSAULT_ELEPHANT_BONUS",
            "TECH_YUEZHI_KUSHAN_CAVALRY_BONUS",
            "TECH_TAMIL_JAVELIN_ELEPHANT_BONUS",
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
            "TECH_MAURYA_ARMOURED_ELEPHANT_BONUS",
            "TECH_YUEZHI_KUSHAN_WARLORD_BONUS",
            "TECH_TAMIL_ARCHER_ELEPHANT_BONUS",
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

    def test_nation_bonus_tier1_cost_250(self):
        """Tier 1 nation bonus techs cost 250 (May 2026 patch rebalance)."""
        bonus = self._find_bonus("TECH_BATTERING_RAM_BONUS")
        self.assertIsNotNone(bonus)
        self.assertEqual(bonus["cost"], 250)

    def test_nation_bonus_tier2_cost_700(self):
        """Tier 2 nation bonus techs cost 700 (May 2026 patch rebalance)."""
        bonus = self._find_bonus("TECH_SIEGE_TOWER_BONUS")
        self.assertIsNotNone(bonus)
        self.assertEqual(bonus["cost"], 700)

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
        """Should have nation starting tech data including EOTI nations."""
        self.assertGreaterEqual(len(self.data["nationData"]["startingTechs"]), 11)

    def test_victory_techs_are_main(self):
        """Victory techs should be in main techs, not bonus techs."""
        main_ids = [t["id"] for t in self.data["techs"]]
        bonus_ids = [t["id"] for t in self.data["bonusTechs"]]
        for vid in ["TECH_ECONOMIC_REFORM", "TECH_MILITARY_PRESTIGE", "TECH_INDUSTRIAL_PROGRESS"]:
            self.assertIn(vid, main_ids, f"{vid} should be a main tech")
            self.assertNotIn(vid, bonus_ids, f"{vid} should not be a bonus tech")

    # =========================================================================
    # 6. EOTI DLC - Empires of the Indus
    # =========================================================================

    def test_eoti_nations_exist(self):
        """EOTI nations (Maurya, Tamil, Yuezhi) should have starting techs."""
        for nation_id in ["NATION_MAURYA", "NATION_TAMIL", "NATION_YUEZHI"]:
            self.assertIn(nation_id, self.data["nationData"]["startingTechs"],
                          f"{nation_id} should be in starting techs")

    def test_eoti_nation_starting_techs(self):
        """EOTI nations should have correct starting techs."""
        st = self.data["nationData"]["startingTechs"]
        self.assertEqual(st["NATION_MAURYA"], ["TECH_IRONWORKING", "TECH_STONECUTTING", "TECH_ADMINISTRATION"])
        self.assertEqual(st["NATION_TAMIL"], ["TECH_DIVINATION", "TECH_TRAPPING", "TECH_IRONWORKING"])
        self.assertEqual(st["NATION_YUEZHI"], ["TECH_MILITARY_DRILL", "TECH_HUSBANDRY"])

    def test_eoti_bonus_techs_exist(self):
        """EOTI nation bonus techs should be in the bonus tech list."""
        all_ids = [t["id"] for t in self.data["bonusTechs"]]
        eoti_ids = [
            "TECH_MAURYA_ASSAULT_ELEPHANT_BONUS",
            "TECH_MAURYA_ARMOURED_ELEPHANT_BONUS",
            "TECH_YUEZHI_STEPPE_RIDERS_BONUS",
            "TECH_YUEZHI_KUSHAN_CAVALRY_BONUS",
            "TECH_YUEZHI_KUSHAN_WARLORD_BONUS",
            "TECH_TAMIL_JAVELIN_ELEPHANT_BONUS",
            "TECH_TAMIL_ARCHER_ELEPHANT_BONUS",
        ]
        for tech_id in eoti_ids:
            self.assertIn(tech_id, all_ids, f"{tech_id} should exist as bonus tech")

    def test_yuezhi_steppe_riders_culture_developing(self):
        """Yuezhi Steppe Riders should require CULTURE_DEVELOPING."""
        bonus = self._find_bonus("TECH_YUEZHI_STEPPE_RIDERS_BONUS")
        self.assertIsNotNone(bonus)
        self.assertEqual(bonus.get("cultureRequired"), "CULTURE_DEVELOPING")

    def test_eoti_bonus_nation_assignments(self):
        """EOTI bonus techs should be assigned to correct nations."""
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
            self.assertIsNotNone(bonus, f"{tech_id} should exist")
            self.assertEqual(bonus.get("nation"), nation, f"{tech_id} should belong to {nation}")


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
        self.assertIn('cultureRequired: "CULTURE_DEVELOPING"', self.html)

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
        """Should have 60 bonus techs (53 original + 7 EOTI nation bonuses)."""
        import re
        bonus_ids = re.findall(r'id: "TECH_[^"]*"', self.html)
        # Count only bonus section
        bonus_section = self.html[self.html.find("bonusTechs:"):]
        bonus_ids = re.findall(r'id: "TECH_[^"]*"', bonus_section)
        self.assertEqual(len(bonus_ids), 60)


class TestVersionHash(unittest.TestCase):
    """Tests for version hash and URL versioning system."""

    @classmethod
    def setUpClass(cls):
        from generate_tech_tree import OldWorldParser, compute_version_hash
        cls.parser = OldWorldParser("XML/Infos")
        cls.parser.parse_all()
        cls.data = cls.parser.export_data()
        cls.compute_version_hash = staticmethod(compute_version_hash)

    def test_compute_version_hash_returns_4_hex_chars(self):
        """Version hash should be 4 hex characters."""
        h = self.compute_version_hash(self.data["techs"], self.data["bonusTechs"])
        self.assertEqual(len(h), 4)
        self.assertTrue(all(c in "0123456789abcdef" for c in h))

    def test_version_hash_is_deterministic(self):
        """Same input should produce same hash."""
        h1 = self.compute_version_hash(self.data["techs"], self.data["bonusTechs"])
        h2 = self.compute_version_hash(self.data["techs"], self.data["bonusTechs"])
        self.assertEqual(h1, h2)

    def test_version_hash_changes_with_different_techs(self):
        """Different tech lists should produce different hashes."""
        h1 = self.compute_version_hash(self.data["techs"], self.data["bonusTechs"])
        # Modify techs
        modified = self.data["techs"][:-1]  # Remove last tech
        h2 = self.compute_version_hash(modified, self.data["bonusTechs"])
        self.assertNotEqual(h1, h2)

    def test_version_hash_in_generated_html(self):
        """Generated HTML should contain the version hash constant."""
        from generate_tech_tree import generate_html, compute_version_hash
        generate_html(self.data, output_path="test_output.html")
        with open("test_output.html") as f:
            html = f.read()
        h = compute_version_hash(self.data["techs"], self.data["bonusTechs"])
        self.assertIn(f'const currentVersionHash = "{h}"', html)

    def test_version_history_in_generated_html(self):
        """Generated HTML should contain the version history object."""
        with open("test_output.html") as f:
            html = f.read()
        self.assertIn("const versionMaps =", html)

    def test_url_includes_version_param(self):
        """updateURL should include v= parameter."""
        with open("template.html") as f:
            template = f.read()
        update_func = template.split("function updateURL")[1].split("\n        function ")[0]
        self.assertIn("currentVersionHash", update_func)

    def test_load_from_url_handles_version_migration(self):
        """loadFromUrl should check version hash and migrate if needed."""
        with open("template.html") as f:
            template = f.read()
        load_func = template.split("function loadFromUrl")[1].split("\n        function ")[0]
        self.assertIn("versionMaps", load_func)

    def test_warning_banner_exists(self):
        """Template should have a version warning banner element."""
        with open("template.html") as f:
            template = f.read()
        self.assertIn("versionWarning", template)

    @classmethod
    def tearDownClass(cls):
        import os
        if os.path.exists("test_output.html"):
            os.remove("test_output.html")


class TestTemplateBugs(unittest.TestCase):
    """Tests for known template bugs - verify source code patterns."""

    @classmethod
    def setUpClass(cls):
        with open("template.html") as f:
            cls.template = f.read()

    # =========================================================================
    # Bug 1: Nation swap pushes timestamps instead of tech IDs into researchOrder
    # =========================================================================

    def test_no_timestamp_in_research_order(self):
        """selectNation should push tech IDs, not Date.now() timestamps, into researchOrder."""
        # The bug: newResearchOrder.push(Date.now() - 10000)
        nation_func = self.template.split("function selectNation")[1].split("\n        function ")[0]
        self.assertNotIn("Date.now()", nation_func,
                         "selectNation should not use Date.now() for research order entries")

    def test_starting_techs_pushed_as_ids(self):
        """Starting techs added during nation selection should be tech IDs in researchOrder."""
        # After the fix, newResearchOrder should receive techId, not timestamps
        nation_func = self.template.split("function selectNation")[1].split("\n        function ")[0]
        self.assertIn("newResearchOrder.push(techId)", nation_func,
                       "selectNation should push techId into newResearchOrder")

    # =========================================================================
    # Bug 2: researchOrder uses .slice() instead of .filter() when removing techs
    # =========================================================================

    def test_research_order_filtered_not_sliced(self):
        """When removing old nation techs, researchOrder should be filtered, not sliced."""
        nation_func = self.template.split("function selectNation")[1].split("\n        function ")[0]
        # Should NOT have: researchOrder = researchOrder.slice(0, researchedTechs.length)
        self.assertNotIn("researchOrder.slice(0,", nation_func,
                         "Should not slice researchOrder by length")
        self.assertNotIn("researchOrder = researchOrder.slice(0", nation_func,
                         "Should not slice researchOrder by length")

    # =========================================================================
    # Bug 3: URL params not saved to localStorage (old build persists)
    # =========================================================================

    def test_url_load_saves_to_localstorage(self):
        """After loading from URL params, state should be saved to localStorage."""
        # Find the init section where URL vs localStorage is decided
        init_func = self.template.split("function initializeTechTree")[1].split("\n        function ")[0]
        # After loadFromUrl(), saveToLocalStorage() should be called
        url_section = init_func[init_func.find("loadFromUrl()"):]
        # Within the next ~10 lines after loadFromUrl, should save to localStorage
        self.assertIn("saveToLocalStorage()", init_func,
                       "initializeTechTree should call saveToLocalStorage after loading state")


if __name__ == "__main__":
    unittest.main(verbosity=2)
