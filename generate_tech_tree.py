#!/usr/bin/env python3
"""
Generate Old World Tech Tree HTML from game XML files

This script extracts technology data from Old World game files and generates
a single HTML file with an interactive tech tree visualization.
"""

import xml.etree.ElementTree as ET
import hashlib
import json
import re
import os
import subprocess
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
import argparse


# Version history: maps version hash -> { main: [tech_ids], bonus: [bonus_ids] }
# When the tech list changes, snapshot the previous version here before regenerating.
# This allows old shared URLs to be translated to current tech indices.
VERSION_HISTORY = {
    "67b2": {
        "techs": ["TECH_IRONWORKING", "TECH_STONECUTTING", "TECH_TRAPPING", "TECH_DIVINATION", "TECH_ADMINISTRATION", "TECH_LABOR_FORCE", "TECH_HUSBANDRY", "TECH_DRAMA", "TECH_POLIS", "TECH_MILITARY_DRILL", "TECH_ARISTOCRACY", "TECH_RHETORIC", "TECH_NAVIGATION", "TECH_PHALANX", "TECH_SPOKED_WHEEL", "TECH_FORESTRY", "TECH_STEEL", "TECH_SOVEREIGNTY", "TECH_METAPHYSICS", "TECH_COINAGE", "TECH_CITIZENSHIP", "TECH_PORTCULLIS", "TECH_LAND_CONSOLIDATION", "TECH_COMPOSITE_BOW", "TECH_MONASTICISM", "TECH_MACHINERY", "TECH_SCHOLARSHIP", "TECH_STIRRUPS", "TECH_ARCHITECTURE", "TECH_MANOR", "TECH_BATTLELINE", "TECH_DOCTRINE", "TECH_HYDRAULICS", "TECH_CARTOGRAPHY", "TECH_LATEEN_SAIL", "TECH_JURISPRUDENCE", "TECH_MARTIAL_CODE", "TECH_VAULTING", "TECH_BODKIN_ARROW", "TECH_WINDLASS", "TECH_FISCAL_POLICY", "TECH_BARDING", "TECH_INFANTRY_SQUARE", "TECH_COHORTS", "TECH_CHAIN_DRIVE", "TECH_BALLISTICS", "TECH_ECONOMIC_REFORM", "TECH_MILITARY_PRESTIGE", "TECH_INDUSTRIAL_PROGRESS"],
        "bonusTechs": ["TECH_STONECUTTING_BONUS_STONE", "TECH_ADMINISTRATION_BONUS_WORKER", "TECH_HUSBANDRY_BONUS_FOOD", "TECH_DRAMA_BONUS_SETTLER", "TECH_ARISTOCRACY_BONUS_BORDERS", "TECH_NAVIGATION_BONUS_BIREME", "TECH_PHALANX_BONUS_ORDERS", "TECH_SPOKED_WHEEL_BONUS_CHARIOT", "TECH_FORESTRY_BONUS_SCIENTIST", "TECH_STEEL_BONUS_TRAINING", "TECH_SOVEREIGNITY_BONUS_CIVICS", "TECH_COINAGE_BONUS_MONEY", "TECH_CITIZENSHIP_BONUS_MINISTER", "TECH_PORTCULLIS_BONUS_MACEMAN", "TECH_LAND_CONSOLIDATION_BONUS_CAMEL_ARCHER", "TECH_LAND_CONSOLIDATION_BONUS_WAR_ELEPHANT", "TECH_COMPOSITE_BOW_BONUS_ARCHER", "TECH_MACHINERY_BONUS_ONAGER", "TECH_SCHOLARSHIP_BONUS_SCIENTIST", "TECH_STIRRUPS_BONUS_HORSEMAN", "TECH_STIRRUPS_BONUS_HORSE_ARCHER", "TECH_MANOR_BONUS_GOODS", "TECH_BATTLELINE_BONUS_SOLDIER", "TECH_HYDRAULICS_BONUS_BALLISTA", "TECH_JURISPRUDENCE_BONUS_MINISTER", "TECH_VAULTING_BONUS_HAPPINESS", "TECH_BODKIN_ARROW_BONUS_LONGBOWMAN", "TECH_FISCAL_POLICY_BONUS_MERCHANT", "TECH_INFANTRY_SQUARE_BONUS_SOLDIER", "TECH_CHAIN_DRIVE_BONUS_MERCHANT", "TECH_BATTERING_RAM_BONUS", "TECH_SIEGE_TOWER_BONUS", "TECH_AKKADIAN_ARCHER_BONUS", "TECH_CIMMERIAN_ARCHER_BONUS", "TECH_AFRICAN_ELEPHANT_BONUS", "TECH_TURRETED_ELEPHANT_BONUS", "TECH_LIGHT_CHARIOT_BONUS", "TECH_MOUNTED_LANCER_BONUS", "TECH_HOPLITE_BONUS", "TECH_PHALANGITE_BONUS", "TECH_PALTON_CAVALRY_BONUS", "TECH_CATAPHRACT_ARCHER_BONUS", "TECH_HASTATUS_BONUS", "TECH_LEGIONARY_BONUS", "TECH_HITTITE_CHARIOT_1_BONUS", "TECH_HITTITE_CHARIOT_2_BONUS", "TECH_MEDJAY_ARCHER_BONUS", "TECH_BEJA_ARCHER_BONUS", "TECH_DMT_WARRIOR_BONUS", "TECH_SHOTELAI_BONUS", "TECH_RESOURCE_PORCELAIN_BONUS", "TECH_RESOURCE_EXOTIC_FUR_BONUS", "TECH_RESOURCE_PERFUME_BONUS"],
    },
}


def compute_version_hash(techs, bonus_techs):
    """Compute a short 4-char hex hash from the ordered tech ID lists."""
    ids = [t["id"] for t in techs] + ["|"] + [t["id"] for t in bonus_techs]
    combined = ",".join(ids)
    return hashlib.sha256(combined.encode()).hexdigest()[:4]


class OldWorldParser:
    """Parser for Old World XML game files"""
    
    def __init__(self, xml_dir: str = "XML/Infos"):
        self.xml_dir = Path(xml_dir)
        self.techs = []
        self.bonus_techs = []
        self.nations = {}
        self.text_data = {}
        self.effect_player_data = {}
        
    def parse_all(self):
        """Parse all required XML files"""
        print("Parsing Old World XML files...")
        
        # Parse text files first to get names and descriptions
        self.parse_text_infos()
        self.parse_text_nation()
        self.parse_text_bonus()
        self.parse_text_eoti()
        
        # Parse effect player data for unlocks
        self.parse_effect_player()
        
        # Parse main data files
        self.parse_techs()
        self.parse_nations()
        self.parse_bonuses()
        
        # Parse what techs unlock
        self.parse_unit_unlocks()
        self.parse_improvement_unlocks()
        self.parse_law_unlocks()
        self.parse_project_unlocks()
        
        # Post-process to separate bonus techs
        self.identify_bonus_techs()
        
        print(f"Parsed {len(self.techs)} main technologies")
        print(f"Parsed {len(self.bonus_techs)} bonus technologies")
        print(f"Parsed {len(self.nations)} nations")
        
    TEXT_FILES = [
        "text-infos.xml",
        "text-nation.xml",
        "text-bonus.xml",
        "text-eoti.xml",
        "text-unit.xml",
        "text-yield.xml",
        "text-infos-btt.xml",
        "text-infos-hittite.xml",
        "text-infos-sap.xml",
        "text-bonus-btt.xml",
        "text-bonus-hittite.xml",
        "text-bonus-sap.xml",
        "text-bonus-wog.xml",
        "text-unit-hittite.xml",
    ]

    def _load_text_file(self, filename: str) -> int:
        """Load any text-*.xml file. Real schema is <zType>…</zType><en-US>…</en-US>."""
        file_path = self.xml_dir / filename
        if not file_path.exists():
            return 0
        try:
            root = ET.parse(file_path).getroot()
        except ET.ParseError:
            return 0
        loaded = 0
        for entry in root.findall(".//Entry"):
            key_node = entry.find("zType")
            text_node = entry.find("en-US")
            if key_node is None or text_node is None:
                continue
            if not key_node.text or not text_node.text:
                continue
            self.text_data[key_node.text] = self.clean_text(text_node.text)
            loaded += 1
        return loaded

    def parse_text_infos(self):
        for f in self.TEXT_FILES:
            self._load_text_file(f)

    def parse_text_nation(self):
        # Folded into parse_text_infos via TEXT_FILES — kept as a no-op for
        # backwards-compat with the parse_all() call list.
        return

    def parse_text_bonus(self):
        return

    def parse_text_eoti(self):
        # text-eoti.xml is part of TEXT_FILES; the legacy hand-rolled loader
        # below is kept for compatibility with older versions of the game that
        # used a slightly different schema (zType + the *first* localized
        # child). Most modern installs hit the standard loader first.
        file_path = self.xml_dir / "text-eoti.xml"
        if not file_path.exists():
            return

        tree = ET.parse(file_path)
        root = tree.getroot()

        for entry in root.findall(".//Entry"):
            tag = entry.find("zType")
            text = entry.find("en-US")
            if tag is not None and text is not None and tag.text and text.text:
                self.text_data[tag.text] = self.clean_text(text.text)

    def parse_effect_player(self):
        """Parse effectPlayer.xml for tech unlocks"""
        file_path = self.xml_dir / "effectPlayer.xml"
        if not file_path.exists():
            print(f"Warning: {file_path} not found")
            return
            
        tree = ET.parse(file_path)
        root = tree.getroot()
        
        for entry in root.findall(".//Entry"):
            effect_type = entry.find("zType")
            if effect_type is None or not effect_type.text:
                continue
                
            unlocks = {
                "units": [],
                "improvements": [],
                "laws": [],
                "projects": [],
                "specialists": [],
                "other": []
            }
            
            # Extract various unlock types
            for unit in entry.findall(".//aeUnitUnlock/zValue"):
                if unit.text:
                    unlocks["units"].append(self.format_name(unit.text, "UNIT_"))
            
            for imp in entry.findall(".//aeImprovementUnlock/zValue"):
                if imp.text:
                    unlocks["improvements"].append(self.format_name(imp.text, "IMPROVEMENT_"))
            
            for law in entry.findall(".//aeLawUnlock/zValue"):
                if law.text:
                    unlocks["laws"].append(self.format_name(law.text, "LAW_"))
            
            for proj in entry.findall(".//aeProjectUnlock/zValue"):
                if proj.text:
                    unlocks["projects"].append(self.format_name(proj.text, "PROJECT_"))
            
            for spec in entry.findall(".//aeSpecialistUnlock/zValue"):
                if spec.text:
                    unlocks["specialists"].append(self.format_name(spec.text, "SPECIALIST_"))
            
            self.effect_player_data[effect_type.text] = unlocks
    
    def format_name(self, text: str, prefix: str) -> str:
        """Format a game constant name for display"""
        if text.startswith(prefix):
            text = text[len(prefix):]
        # Convert underscore to spaces and title case
        result = text.replace("_", " ").title()
        
        # Remove upgrade numbers from project names
        if prefix == "PROJECT_":
            # Remove " 1", " 2", etc. from the end
            import re
            result = re.sub(r'\s+\d+$', '', result)
        
        return result
    
    def clean_text(self, text: str) -> str:
        """Store a game-text value in a lightly normalized form.

        Old World's localization strings encode grammatical forms with `~`
        separators (e.g. "Stone~icon(YIELD_STONE)Stone") plus templating
        macros: `link(TYPE)` / `link(TYPE,N)` / `icon(TYPE)` and curly
        substitution like `{TEXT_X}`.

        We keep only the first grammatical form here. We do NOT yet resolve
        `link()` references because the target text may not be loaded yet —
        callers go through `pretty_text()` to get a fully resolved label.
        """
        if not text:
            return ""

        text = text.split("~", 1)[0]
        # Strip HTML-ish formatting tags but leave link()/icon() macros for
        # pretty_text() to resolve.
        text = re.sub(r'</?[^>]+>', '', text)
        text = re.sub(r'\{[^}]+\}', '', text)
        text = re.sub(r'\s+', ' ', text).strip()
        return text

    def pretty_text(self, value: str, _depth: int = 0) -> str:
        """Resolve a stored text value or a TEXT_* key into a final display
        string: drops icon() macros and substitutes link(X) / link(X,N) with
        the resolved label of X."""
        if not value:
            return ""
        # If the caller passed a key (e.g. "TEXT_YIELD_STONE"), dereference.
        if isinstance(value, str) and value.startswith("TEXT_") and value in self.text_data:
            value = self.text_data[value]

        # Bound the recursion so a broken loop in localization data can't
        # infinite-loop the parser.
        if _depth > 5:
            return re.sub(r'\b(?:link|icon)\([^)]*\)', '', value).strip()

        def link_sub(m):
            target = m.group(1).split(",")[0].strip()
            if not target:
                return ""
            key = target if target.startswith("TEXT_") else f"TEXT_{target}"
            resolved = self.text_data.get(key, "")
            if resolved:
                return self.pretty_text(resolved, _depth + 1)
            # Fall back to a human-ish slug if the target is missing.
            slug = target.replace("YIELD_", "").replace("UNIT_", "").replace("COURTIER_", "")
            slug = slug.replace("RESOURCE_", "").replace("TECH_", "")
            return slug.replace("_", " ").title()

        value = re.sub(r'\blink\(([^)]*)\)', link_sub, value)
        value = re.sub(r'\bicon\([^)]*\)', '', value)
        return re.sub(r'\s+', ' ', value).strip()
    
    def parse_techs(self):
        """Parse tech.xml for technology data"""
        file_path = self.xml_dir / "tech.xml"
        if not file_path.exists():
            print(f"Error: {file_path} not found")
            return
            
        tree = ET.parse(file_path)
        root = tree.getroot()
        
        for tech in root.findall(".//Entry"):
            tech_data = self.parse_tech_node(tech)
            if tech_data:
                self.techs.append(tech_data)
    
    def parse_tech_node(self, tech_node) -> Optional[Dict]:
        """Parse a single tech XML node"""
        tech_type = tech_node.find("zType")
        if tech_type is None or not tech_type.text:
            return None
            
        tech_id = tech_type.text
        
        # Skip the template entry
        if not tech_id:
            return None
        
        # Get basic info
        cost = self.get_int_value(tech_node, "iCost", 0)
        
        # Get position for tech tree layout
        row = self.get_int_value(tech_node, "iRow", 0)
        column = self.get_int_value(tech_node, "iColumn", 0)
        
        # Get prerequisites from abTechPrereq
        prereqs = []
        prereq_node = tech_node.find("abTechPrereq")
        if prereq_node is not None:
            for pair in prereq_node.findall("Pair"):
                index = pair.find("zIndex")
                value = pair.find("bValue")
                if index is not None and index.text and value is not None and value.text == "1":
                    prereqs.append(index.text)
        
        # Get unlocks from EffectPlayer
        unlocks = {"units": [], "improvements": [], "laws": [], "projects": [], "specialists": [], "other": []}
        effect_player = tech_node.find("EffectPlayer")
        if effect_player is not None and effect_player.text:
            if effect_player.text in self.effect_player_data:
                unlocks = self.effect_player_data[effect_player.text]
        
        # Get name and description from text data
        name_tag = tech_node.find("Name")
        if name_tag is not None and name_tag.text:
            name = self.pretty_text(name_tag.text) or tech_id.replace("TECH_", "").replace("_", " ").title()
        else:
            name = tech_id.replace("TECH_", "").replace("_", " ").title()

        # Get description
        desc = ""
        advice_tag = tech_node.find("Advice")
        if advice_tag is not None and advice_tag.text:
            desc = self.pretty_text(advice_tag.text)
        
        # Check if disabled (skip entirely)
        is_disabled = self.get_bool_value(tech_node, "bDisable")
        if is_disabled:
            return None

        # Check if it's a bonus tech
        is_bonus = (
            self.get_bool_value(tech_node, "bHide") or
            self.get_bool_value(tech_node, "bTrash") or
            self.get_bool_value(tech_node, "bNoFree")
        )
        
        # Get bonus discover value
        bonus_discover = None
        bonus_node = tech_node.find("BonusDiscover")
        if bonus_node is not None and bonus_node.text:
            bonus_discover = bonus_node.text
        
        # Get nation restrictions for bonus techs
        nation_valid = []
        nation_node = tech_node.find("aeNationValid")
        if nation_node is not None:
            for nation in nation_node.findall("zValue"):
                if nation.text:
                    nation_valid.append(nation.text)

        # Get culture requirement (replaces tech prereqs for nation bonus techs)
        culture_valid = None
        culture_node = tech_node.find("CultureValid")
        if culture_node is not None and culture_node.text:
            culture_valid = culture_node.text

        # Sprite name in resources.assets (used to pull bonus-card icons).
        icon_name = None
        icon_node = tech_node.find("zIconName")
        if icon_node is not None and icon_node.text:
            icon_name = icon_node.text

        return {
            "id": tech_id,
            "name": name,
            "description": desc,
            "cost": cost,
            "row": row,
            "column": column,
            "prereqs": prereqs,
            "unlocks": unlocks,
            "isBonus": is_bonus,
            "bonusDiscover": bonus_discover,
            "nationValid": nation_valid,
            "cultureValid": culture_valid,
            "iconName": icon_name,
        }
    
    def parse_nations(self):
        """Parse nation.xml for nation data and starting techs"""
        file_path = self.xml_dir / "nation.xml"
        if not file_path.exists():
            print(f"Warning: {file_path} not found")
            return
            
        tree = ET.parse(file_path)
        root = tree.getroot()
        
        for nation in root.findall(".//Entry"):
            nation_type = nation.find("zType")
            if nation_type is None or not nation_type.text:
                continue
                
            nation_id = nation_type.text
            
            # Get starting techs
            starting_techs = []
            starting_node = nation.find("aeStartingTech")
            if starting_node is not None:
                for tech in starting_node.findall("zValue"):
                    if tech.text:
                        starting_techs.append(tech.text)
            
            # Get nation name from text data
            name_tag = nation.find("Name")
            if name_tag is not None and name_tag.text:
                nation_name = self.text_data.get(name_tag.text, nation_id.replace("NATION_", "").title())
            else:
                nation_name = nation_id.replace("NATION_", "").title()
            
            if starting_techs:  # Only add nations that have starting techs
                self.nations[nation_id] = {
                    "id": nation_id,
                    "name": nation_name,
                    "startingTechs": starting_techs
                }
    
    def parse_bonuses(self):
        """Parse bonus.xml for bonus tech values"""
        file_path = self.xml_dir / "bonus.xml"
        if not file_path.exists():
            print(f"Warning: {file_path} not found")
            return
            
        tree = ET.parse(file_path)
        root = tree.getroot()

        # Lookup keyed by BONUS_* id. Each value captures every shape we know how
        # to format into a human effect string.
        self.bonus_values: Dict[str, Dict] = {}
        raw_entries: Dict[str, ET.Element] = {}
        for bonus in root.findall(".//Entry"):
            bonus_type = bonus.find("zType")
            if bonus_type is None or not bonus_type.text:
                continue
            raw_entries[bonus_type.text] = bonus

        def parse_entry(entry: ET.Element) -> Dict:
            data: Dict = {"yields": {}, "units": {}, "courtiers": [], "resources": {},
                          "borderGrowth": 0, "happinessLevels": 0, "all": []}
            gy = entry.find("aiGlobalYields")
            if gy is not None:
                for pair in gy.findall("Pair"):
                    k, v = pair.find("zIndex"), pair.find("iValue")
                    if k is not None and v is not None and k.text and v.text:
                        data["yields"][k.text.replace("YIELD_", "").lower()] = int(v.text)
            au = entry.find("aiUnits")
            if au is not None:
                for pair in au.findall("Pair"):
                    k, v = pair.find("zIndex"), pair.find("iValue")
                    if k is not None and v is not None and k.text and v.text:
                        data["units"][k.text] = int(v.text)
            ac = entry.find("AddCourtierOther")
            if ac is not None:
                for pair in ac.findall("Pair"):
                    first = pair.find("First")
                    if first is not None and first.text:
                        data["courtiers"].append(first.text)
            ir = entry.find("aeImportResources")
            if ir is not None:
                for pair in ir.findall("Pair"):
                    k, v = pair.find("zIndex"), pair.find("iValue")
                    if k is not None and v is not None and k.text and v.text:
                        data["resources"][k.text] = int(v.text)
            bg = entry.findtext("iBorderGrowth")
            if bg:
                data["borderGrowth"] = int(bg)
            hl = entry.findtext("iHappinessLevels")
            if hl:
                data["happinessLevels"] = int(hl)
            # Indirect city-bonus reference — follow and merge.
            city = entry.find("aeAllCityBonuses")
            if city is not None:
                for z in city.findall("zValue"):
                    if z.text:
                        data["all"].append(z.text)
            return data

        for bid, entry in raw_entries.items():
            data = parse_entry(entry)
            # Resolve aeAllCityBonuses references one level deep.
            for ref in data["all"]:
                ref_entry = raw_entries.get(ref)
                if ref_entry is None:
                    continue
                sub = parse_entry(ref_entry)
                for k in ("yields", "units", "resources"):
                    data[k].update(sub[k])
                data["courtiers"].extend(sub["courtiers"])
                data["borderGrowth"] += sub["borderGrowth"]
                data["happinessLevels"] += sub["happinessLevels"]
            self.bonus_values[bid] = data

    def get_bonus_value(self, tech_id, yield_type):
        """Get bonus value for a specific tech and yield type (legacy helper)."""
        bonus_key = f"BONUS_{tech_id}"
        return self.bonus_values.get(bonus_key, {}).get("yields", {}).get(yield_type.lower(), 0)

    def format_bonus_effect(self, bonus_discover_id: str) -> str:
        """Build a human-readable effect string for a BONUS_* entry by reading
        every shape we know (yields, free units, courtiers, resources, border /
        happiness from referenced city bonuses)."""
        data = self.bonus_values.get(bonus_discover_id)
        if not data:
            return ""

        def label_for(key: str, slug_fallback: str) -> str:
            return self.pretty_text(key) or slug_fallback.replace("_", " ").title()

        parts = []
        for slug, amount in data["yields"].items():
            label = label_for(f"TEXT_YIELD_{slug.upper()}", slug)
            parts.append(f"+{amount} {label}")
        for uid, amount in data["units"].items():
            label = label_for(f"TEXT_{uid}", uid.replace("UNIT_", ""))
            parts.append(f"+{amount} {label}")
        for cid in data["courtiers"]:
            label = label_for(f"TEXT_{cid}", cid.replace("COURTIER_", ""))
            parts.append(f"+1 {label}")
        for rid, amount in data["resources"].items():
            label = label_for(f"TEXT_{rid}", rid.replace("RESOURCE_", ""))
            parts.append(f"+{amount} {label}")
        if data["borderGrowth"]:
            parts.append(f"+{data['borderGrowth']} Border Growth")
        if data["happinessLevels"]:
            parts.append(f"+{data['happinessLevels']} Happiness")

        return ", ".join(parts)
    
    def identify_bonus_techs(self):
        """Separate bonus techs from main techs"""
        main_techs = []
        bonus_techs = []
        
        # Victory techs and event bonuses to exclude from bonus cards
        # Note: RESOURCE bonuses (luxuries) should be included as they're researchable
        exclude_from_bonus = ["ECONOMIC_REFORM", "MILITARY_PRESTIGE", "INDUSTRIAL_PROGRESS", 
                             "EVENT_"]
        
        for tech in self.techs:
            # Check if this should be excluded
            should_exclude = any(exc in tech["id"] for exc in exclude_from_bonus)
            
            if tech.get("isBonus") and not should_exclude:
                # Format bonus tech for the frontend
                # Get parent tech from prerequisites
                parent = tech["prereqs"][0] if tech.get("prereqs") else None
                
                # Name comes straight from text-infos.xml; effect comes
                # straight from bonus.xml. The big hardcoded if-elif chains
                # this used to carry have been removed in favor of the
                # generic format_bonus_effect helper.
                bonus_name = tech.get("name") or tech["id"].replace("TECH_", "").replace("_", " ").title()
                bonus_text = ""
                if tech.get("bonusDiscover"):
                    bonus_text = self.format_bonus_effect(tech["bonusDiscover"])
                if not bonus_text:
                    bonus_text = tech.get("description", "") or bonus_name

                
                bonus_tech = {
                    "id": tech["id"],
                    "name": bonus_name,
                    "cost": tech["cost"],
                    "parent": parent,
                    "bonus": bonus_text,
                }

                # Add nation field if nation-specific
                if tech.get("nationValid"):
                    bonus_tech["nation"] = tech["nationValid"][0]

                # Add culture requirement if present
                if tech.get("cultureValid"):
                    bonus_tech["cultureRequired"] = tech["cultureValid"]

                # Icon slug for img/icons/bonus/<slug>.png (sourced via extract_bonus_icons.py)
                if tech.get("iconName"):
                    bonus_tech["iconName"] = tech["iconName"]

                bonus_techs.append(bonus_tech)
            elif should_exclude and any(vic in tech["id"] for vic in ["ECONOMIC_REFORM", "MILITARY_PRESTIGE", "INDUSTRIAL_PROGRESS"]):
                # Victory techs should be main techs, not bonus cards
                tech.pop("isBonus", None)
                tech.pop("nationValid", None)
                tech.pop("bonusValue", None)
                tech.pop("bonusDiscover", None)
                main_techs.append(tech)
            elif not tech.get("isBonus"):
                # Regular main tech
                tech.pop("isBonus", None)
                tech.pop("nationValid", None)
                tech.pop("bonusValue", None)
                tech.pop("bonusDiscover", None)
                main_techs.append(tech)
        
        self.techs = main_techs
        self.bonus_techs = bonus_techs
    
    def parse_unit_unlocks(self):
        """Parse unit.xml to find what units each tech unlocks"""
        file_path = self.xml_dir / "unit.xml"
        if not file_path.exists():
            print(f"Warning: {file_path} not found")
            return
            
        tree = ET.parse(file_path)
        root = tree.getroot()
        
        # Build a mapping of tech -> units
        tech_units = {}
        for unit in root.findall(".//Entry"):
            unit_type = unit.find("zType")
            tech_prereq = unit.find("TechPrereq")
            if unit_type is not None and unit_type.text and tech_prereq is not None and tech_prereq.text:
                tech_id = tech_prereq.text
                unit_name = self.format_name(unit_type.text, "UNIT_")
                if tech_id not in tech_units:
                    tech_units[tech_id] = []
                tech_units[tech_id].append(unit_name)
        
        # Update tech data with unit unlocks
        for tech in self.techs:
            if tech["id"] in tech_units:
                tech["unlocks"]["units"] = tech_units[tech["id"]]
    
    def parse_improvement_unlocks(self):
        """Parse improvement.xml to find what improvements each tech unlocks"""
        file_path = self.xml_dir / "improvement.xml"
        if not file_path.exists():
            print(f"Warning: {file_path} not found")
            return
            
        # Improvements don't have direct tech prereqs in the XML
        # I need to manually map based on the original data
        manual_improvement_mapping = {
            "TECH_STONECUTTING": ["Fort", "Quarry"],
            "TECH_TRAPPING": ["Camp"],
            "TECH_DIVINATION": ["Shrine"],
            "TECH_ADMINISTRATION": ["Granary"],
            "TECH_HUSBANDRY": ["Pasture"],
            "TECH_DRAMA": ["Odeon"],
            "TECH_POLIS": ["Hamlet"],
            "TECH_MILITARY_DRILL": ["Barracks"],
            "TECH_ARISTOCRACY": ["Kushite Pyramids"],
            "TECH_FORESTRY": ["Lumbermill"],
            "TECH_COINAGE": ["Market"],
            "TECH_CITIZENSHIP": ["Courthouse"],
            "TECH_ARCHITECTURE": ["Baths"],
            "TECH_LAND_CONSOLIDATION": ["Grove"],
            "TECH_COMPOSITE_BOW": ["Range"],
            "TECH_MONASTICISM": ["Monastery"],
            "TECH_SCHOLARSHIP": ["Library"],
            "TECH_VAULTING": ["Cathedral"],
            "TECH_DOCTRINE": ["Temple"],
            "TECH_HYDRAULICS": ["Watermill"],
            "TECH_WINDLASS": ["Windmill"],
            "TECH_CARTOGRAPHY": ["Harbor"]
        }
        
        for tech in self.techs:
            if tech["id"] in manual_improvement_mapping:
                tech["unlocks"]["improvements"] = manual_improvement_mapping[tech["id"]]
    
    def parse_law_unlocks(self):
        """Parse law.xml to find what laws each tech unlocks"""
        file_path = self.xml_dir / "law.xml"
        if not file_path.exists():
            print(f"Warning: {file_path} not found")
            return
            
        tree = ET.parse(file_path)
        root = tree.getroot()
        
        # Laws don't have direct tech prereqs, they're unlocked by law classes
        # I need to manually map based on the original data
        manual_law_mapping = {
            "TECH_LABOR_FORCE": ["Slavery/Freedom"],
            "TECH_ARISTOCRACY": ["Centralization/Vassalage"],
            "TECH_RHETORIC": ["Epics/Exploration"],
            "TECH_NAVIGATION": ["Colonies/Serfdom"],
            "TECH_SOVEREIGNTY": ["Tyranny/Constitution"],
            "TECH_CITIZENSHIP": ["Divine Rule/Legal Code"],
            "TECH_ARCHITECTURE": ["Philosophy/Engineering"],
            "TECH_MONASTICISM": ["Monotheism/Polytheism"],
            "TECH_VAULTING": ["Iconography/Calligraphy"],
            "TECH_MANOR": ["Professional Army/Volunteers"],
            "TECH_DOCTRINE": ["Tolerance/Orthodoxy"],
            "TECH_LATEEN_SAIL": ["Autarky/Trade League"],
            "TECH_JURISPRUDENCE": ["Guilds/Elites"],
            "TECH_MARTIAL_CODE": ["Pilgrimage/Holy War"],
            "TECH_FISCAL_POLICY": ["Coin Debasement/Monetary Reform"]
        }
        
        for tech in self.techs:
            if tech["id"] in manual_law_mapping:
                tech["unlocks"]["laws"] = manual_law_mapping[tech["id"]]
    
    def parse_project_unlocks(self):
        """Parse project.xml to find what projects each tech unlocks"""
        file_path = self.xml_dir / "project.xml"
        if not file_path.exists():
            print(f"Warning: {file_path} not found")
            return
            
        tree = ET.parse(file_path)
        root = tree.getroot()
        
        tech_projects = {}
        for proj in root.findall(".//Entry"):
            proj_type = proj.find("zType")
            tech_prereq = proj.find("TechPrereq")
            if proj_type is not None and proj_type.text and tech_prereq is not None and tech_prereq.text:
                tech_id = tech_prereq.text
                proj_name = self.format_name(proj_type.text, "PROJECT_")
                if tech_id not in tech_projects:
                    tech_projects[tech_id] = []
                tech_projects[tech_id].append(proj_name)
        
        for tech in self.techs:
            if tech["id"] in tech_projects:
                tech["unlocks"]["projects"] = tech_projects[tech["id"]]
    
    def add_manual_unlock_data_OLD_REMOVED(self):
        """DEPRECATED - Now parsing from game files directly"""
        # Kept for reference only
        manual_unlocks = {
            "TECH_IRONWORKING": {"units": ["Warrior"], "improvements": [], "laws": [], "projects": []},
            "TECH_STONECUTTING": {"units": [], "improvements": ["Fort", "Quarry"], "laws": [], "projects": []},
            "TECH_TRAPPING": {"units": ["Slinger"], "improvements": ["Camp"], "laws": [], "projects": []},
            "TECH_DIVINATION": {"units": [], "improvements": ["Shrine"], "laws": [], "projects": []},
            "TECH_ADMINISTRATION": {"units": [], "improvements": ["Granary"], "laws": [], "projects": ["Treasury"]},
            "TECH_LABOR_FORCE": {"units": [], "improvements": [], "laws": ["Slavery/Freedom"], "projects": []},
            "TECH_HUSBANDRY": {"units": [], "improvements": ["Pasture"], "laws": [], "projects": []},
            "TECH_DRAMA": {"units": [], "improvements": ["Odeon"], "laws": [], "projects": []},
            "TECH_POLIS": {"units": [], "improvements": ["Hamlet"], "laws": [], "projects": ["Walls"]},
            "TECH_MILITARY_DRILL": {"units": [], "improvements": ["Barracks"], "laws": [], "projects": []},
            "TECH_ARISTOCRACY": {"units": [], "improvements": ["Kushite Pyramids"], "laws": ["Centralization/Vassalage"], "projects": []},
            "TECH_RHETORIC": {"units": [], "improvements": [], "laws": ["Epics/Exploration"], "projects": ["Forum"]},
            "TECH_NAVIGATION": {"units": ["Bireme"], "improvements": [], "laws": ["Colonies/Serfdom"], "projects": []},
            "TECH_PHALANX": {"units": ["Spearman"], "improvements": [], "laws": [], "projects": []},
            "TECH_SPOKED_WHEEL": {"units": ["Chariot"], "improvements": [], "laws": [], "projects": []},
            "TECH_FORESTRY": {"units": [], "improvements": ["Lumbermill"], "laws": [], "projects": []},
            "TECH_STEEL": {"units": ["Axeman"], "improvements": [], "laws": [], "projects": []},
            "TECH_SOVEREIGNTY": {"units": [], "improvements": [], "laws": ["Tyranny/Constitution"], "projects": []},
            "TECH_METAPHYSICS": {"units": [], "improvements": [], "laws": [], "projects": ["Archive"]},
            "TECH_COINAGE": {"units": [], "improvements": ["Market"], "laws": [], "projects": []},
            "TECH_CITIZENSHIP": {"units": [], "improvements": ["Courthouse"], "laws": ["Divine Rule/Legal Code"], "projects": []},
            "TECH_PORTCULLIS": {"units": [], "improvements": [], "laws": [], "projects": ["Moat"]},
            "TECH_ARCHITECTURE": {"units": [], "improvements": ["Baths"], "laws": ["Philosophy/Engineering"], "projects": []},
            "TECH_LAND_CONSOLIDATION": {"units": ["Camel Archer"], "improvements": ["Grove"], "laws": [], "projects": []},
            "TECH_COMPOSITE_BOW": {"units": [], "improvements": ["Range"], "laws": [], "projects": []},
            "TECH_MONASTICISM": {"units": [], "improvements": ["Monastery"], "laws": ["Monotheism/Polytheism"], "projects": []},
            "TECH_MACHINERY": {"units": ["Onager"], "improvements": [], "laws": [], "projects": []},
            "TECH_SCHOLARSHIP": {"units": [], "improvements": ["Library"], "laws": [], "projects": []},
            "TECH_STIRRUPS": {"units": ["Horseman", "Horse Archer"], "improvements": [], "laws": [], "projects": []},
            "TECH_VAULTING": {"units": [], "improvements": ["Cathedral"], "laws": ["Iconography/Calligraphy"], "projects": []},
            "TECH_MANOR": {"units": ["Conscript"], "improvements": [], "laws": ["Professional Army/Volunteers"], "projects": []},
            "TECH_BATTLELINE": {"units": ["Maceman"], "improvements": [], "laws": [], "projects": []},
            "TECH_DOCTRINE": {"units": [], "improvements": ["Temple"], "laws": ["Tolerance/Orthodoxy"], "projects": []},
            "TECH_HYDRAULICS": {"units": ["Ballista"], "improvements": ["Mill"], "laws": [], "projects": []},
            "TECH_CARTOGRAPHY": {"units": [], "improvements": ["Harbor"], "laws": [], "projects": []},
            "TECH_LATEEN_SAIL": {"units": ["Dromon"], "improvements": [], "laws": ["Autarky/Trade League"], "projects": []},
            "TECH_JURISPRUDENCE": {"units": [], "improvements": [], "laws": ["Guilds/Elites"], "projects": []},
            "TECH_MARTIAL_CODE": {"units": [], "improvements": [], "laws": ["Pilgrimage/Holy War"], "projects": ["Towers"]},
            "TECH_BODKIN_ARROW": {"units": ["Longbowman"], "improvements": [], "laws": [], "projects": []},
            "TECH_WINDLASS": {"units": ["Crossbowman"], "improvements": [], "laws": [], "projects": []},
            "TECH_FISCAL_POLICY": {"units": [], "improvements": [], "laws": ["Coin Debasement/Monetary Reform"], "projects": []},
            "TECH_BARDING": {"units": ["Cataphract"], "improvements": [], "laws": [], "projects": []},
            "TECH_COHORTS": {"units": ["Swordsman"], "improvements": [], "laws": [], "projects": []},
            "TECH_INFANTRY_SQUARE": {"units": ["Pikeman"], "improvements": [], "laws": [], "projects": []},
            "TECH_CHAIN_DRIVE": {"units": ["Polybolos"], "improvements": [], "laws": [], "projects": []},
            "TECH_BALLISTICS": {"units": ["Mangonel"], "improvements": [], "laws": [], "projects": []},
        }
        
        # Update tech unlocks with manual data
        for tech in self.techs:
            if tech["id"] in manual_unlocks:
                tech["unlocks"] = manual_unlocks[tech["id"]]
    
    def get_int_value(self, node, tag: str, default: int = 0) -> int:
        """Safely get integer value from XML node"""
        elem = node.find(tag)
        if elem is not None and elem.text:
            try:
                return int(elem.text)
            except ValueError:
                pass
        return default
    
    def get_bool_value(self, node, tag: str) -> bool:
        """Safely get boolean value from XML node"""
        elem = node.find(tag)
        if elem is None:
            return False
        # Check both attribute and text content
        value = elem.get("value") or elem.text
        return value == "1"
    
    def export_data(self) -> Dict:
        """Export parsed data as dictionary for JSON conversion"""
        # Format nation data for frontend
        nation_starting_techs = {}
        nation_names = {}
        
        for nation_id, nation_data in self.nations.items():
            nation_starting_techs[nation_id] = nation_data["startingTechs"]
            nation_names[nation_id] = nation_data["name"]
        
        # Find nation-specific bonus techs
        nation_specific_bonuses = {}
        for bonus in self.bonus_techs:
            if bonus.get("nation"):
                nation = bonus["nation"]
                if nation not in nation_specific_bonuses:
                    nation_specific_bonuses[nation] = []
                nation_specific_bonuses[nation].append(bonus["id"])
        
        return {
            "techs": self.techs,
            "bonusTechs": self.bonus_techs,
            "nationData": {
                "startingTechs": nation_starting_techs,
                "nationNames": nation_names,
                "nationSpecificBonuses": nation_specific_bonuses
            }
        }


def fetch_game_version() -> str:
    """Fetch the latest game version from Mohawk's GitHub build notes."""
    try:
        result = subprocess.run(
            ["gh", "api", "repos/MohawkGames/main_buildnotes/contents"],
            capture_output=True, text=True, timeout=10
        )
        if result.returncode != 0:
            return ""

        files = json.loads(result.stdout)
        # Find the latest "Old World Release update" file
        release_files = [f["name"] for f in files if f["name"].startswith("Old World Release update")]
        if not release_files:
            return ""

        latest = sorted(release_files)[-1]

        # Fetch the file content
        result = subprocess.run(
            ["gh", "api", f"repos/MohawkGames/main_buildnotes/contents/{latest}"],
            capture_output=True, text=True, timeout=10
        )
        if result.returncode != 0:
            return ""

        import base64
        file_data = json.loads(result.stdout)
        content = base64.b64decode(file_data["content"]).decode("utf-8")

        # First line format: "Main Branch 1.0.82189 Release 2026-02-18"
        first_line = content.split("\n")[0].strip()
        parts = first_line.split()
        # Extract version and date
        version = None
        date = None
        for part in parts:
            if re.match(r'\d+\.\d+\.\d+', part):
                version = part
            if re.match(r'\d{4}-\d{2}-\d{2}', part):
                date = part

        if version and date:
            # Format date nicely
            dt = datetime.strptime(date, "%Y-%m-%d")
            formatted_date = dt.strftime("%b %d, %Y")
            return f"Old World v{version} ({formatted_date})"
        elif version:
            return f"Old World v{version}"
    except Exception as e:
        print(f"Warning: Could not fetch game version: {e}")

    return ""


def generate_tech_data_js(data: Dict, output_path: str = "tech-data.js"):
    """Emit tech-data.js consumed by index.html and phone.html.

    Exposes window.techData, window.nationData (with nationNames as a list of
    {id, name}), window.nationLookup, window.currentVersionHash,
    window.versionMaps, and window.gameVersion.
    """
    out = Path(output_path)
    if out.parent and not out.parent.exists():
        print(f"Error: parent directory {out.parent} does not exist")
        return False

    tech_entries = []
    for tech in data["techs"]:
        unlocks = tech.get("unlocks", {})
        tech_entries.append(
            f'    {{ id: "{tech["id"]}", name: "{tech["name"]}", '
            f'cost: {tech["cost"]}, column: {tech["column"]}, row: {tech["row"]}, '
            f'prereqs: {json.dumps(tech["prereqs"])}, '
            f'unlocks: {{ units: {json.dumps(unlocks.get("units", []))}, '
            f'improvements: {json.dumps(unlocks.get("improvements", []))}, '
            f'laws: {json.dumps(unlocks.get("laws", []))}, '
            f'projects: {json.dumps(unlocks.get("projects", []))} }} }}'
        )

    bonus_entries = []
    for bonus in data["bonusTechs"]:
        parts = [
            f'id: "{bonus["id"]}"',
            f'name: "{bonus["name"]}"',
            f'cost: {bonus["cost"]}',
            f'parent: "{bonus.get("parent", "") or ""}"',
            f'bonus: "{bonus.get("bonus", "")}"',
        ]
        if bonus.get("nation"):
            parts.append(f'nation: "{bonus["nation"]}"')
        if bonus.get("cultureRequired"):
            parts.append(f'cultureRequired: "{bonus["cultureRequired"]}"')
        if bonus.get("iconName"):
            parts.append(f'iconName: "{bonus["iconName"]}"')
        bonus_entries.append("    { " + ", ".join(parts) + " }")

    nation_names_list = [
        {"id": nid, "name": name}
        for nid, name in data["nationData"]["nationNames"].items()
    ]
    nation_lookup = list(data["nationData"]["nationNames"].keys())

    game_version = fetch_game_version() or "Old World"
    generated_date = datetime.now().strftime("%b %d, %Y")
    version_string = f"{game_version} | Generated {generated_date}"

    version_hash = compute_version_hash(data["techs"], data["bonusTechs"])

    body = (
        "// Auto-generated tech data for the redesigned tech tree — do not edit by hand.\n"
        "// Regenerate via `python3 generate_tech_tree.py --xml-dir XML/Infos`.\n\n"
        f"window.gameVersion = {json.dumps(version_string)};\n\n"
        "window.techData = {\n"
        "  techs: [\n"
        + ",\n".join(tech_entries) + "\n"
        "  ],\n"
        "  bonusTechs: [\n"
        + ",\n".join(bonus_entries) + "\n"
        "  ]\n"
        "};\n\n"
        f"window.nationLookup = {json.dumps(nation_lookup, indent=2)};\n\n"
        "window.nationData = {\n"
        f"  startingTechs: {json.dumps(data['nationData']['startingTechs'], indent=2)},\n"
        f"  nationNames: {json.dumps(nation_names_list, indent=2)},\n"
        f"  nationSpecificBonuses: {json.dumps(data['nationData']['nationSpecificBonuses'], indent=2)}\n"
        "};\n\n"
        f"window.currentVersionHash = {json.dumps(version_hash)};\n"
        f"window.versionMaps = {json.dumps(VERSION_HISTORY)};\n"
    )

    with open(out, "w") as f:
        f.write(body)
    print(f"Generated {out}")
    return True


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="Generate Old World Tech Tree data from game XML files")
    parser.add_argument(
        "--xml-dir",
        default="XML/Infos",
        help="Directory containing Old World XML files (default: XML/Infos)"
    )
    parser.add_argument(
        "--output",
        default="tech-data.js",
        help="Output JS file consumed by index.html / phone.html (default: tech-data.js)"
    )
    parser.add_argument(
        "--export-json",
        help="Also export parsed data to JSON for debugging"
    )

    args = parser.parse_args()

    # Check if XML directory exists
    if not Path(args.xml_dir).exists():
        print(f"Error: XML directory {args.xml_dir} not found")
        print("Please ensure you have the Old World game files in the correct location")
        return 1

    # Parse the XML files
    p = OldWorldParser(args.xml_dir)
    p.parse_all()

    # Export the data
    data = p.export_data()

    if args.export_json:
        with open(args.export_json, 'w') as f:
            json.dump(data, f, indent=2)
        print(f"Exported data to {args.export_json}")

    if not generate_tech_data_js(data, args.output):
        return 1

    print("Tech tree generation complete!")
    return 0


if __name__ == "__main__":
    exit(main())