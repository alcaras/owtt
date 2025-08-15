#!/usr/bin/env python3
"""
Generate Old World Tech Tree HTML from game XML files

This script extracts technology data from Old World game files and generates
a single HTML file with an interactive tech tree visualization.
"""

import xml.etree.ElementTree as ET
import json
import re
import os
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
import argparse


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
        
    def parse_text_infos(self):
        """Parse text-infos.xml for tech names and descriptions"""
        file_path = self.xml_dir / "text-infos.xml"
        if not file_path.exists():
            print(f"Warning: {file_path} not found")
            return
            
        tree = ET.parse(file_path)
        root = tree.getroot()
        
        for entry in root.findall(".//Entry"):
            tag = entry.find("zTag")
            text = entry.find("zText")
            if tag is not None and text is not None and tag.text and text.text:
                self.text_data[tag.text] = self.clean_text(text.text)
    
    def parse_text_nation(self):
        """Parse text-nation.xml for nation names"""
        file_path = self.xml_dir / "text-nation.xml"
        if not file_path.exists():
            print(f"Warning: {file_path} not found")
            return
            
        tree = ET.parse(file_path)
        root = tree.getroot()
        
        for entry in root.findall(".//Entry"):
            tag = entry.find("zTag")
            text = entry.find("zText")
            if tag is not None and text is not None and tag.text and text.text:
                self.text_data[tag.text] = self.clean_text(text.text)
    
    def parse_text_bonus(self):
        """Parse text-bonus.xml for bonus tech descriptions"""
        file_path = self.xml_dir / "text-bonus.xml"
        if not file_path.exists():
            print(f"Warning: {file_path} not found")
            return
            
        tree = ET.parse(file_path)
        root = tree.getroot()
        
        for entry in root.findall(".//Entry"):
            tag = entry.find("zTag")
            text = entry.find("zText")
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
        return text.replace("_", " ").title()
    
    def clean_text(self, text: str) -> str:
        """Clean game text by removing formatting tags"""
        if not text:
            return ""
        
        # Remove Old World text formatting tags
        text = re.sub(r'</?[^>]+>', '', text)
        text = re.sub(r'\{[^}]+\}', '', text)
        text = text.replace('~', '')
        text = text.strip()
        
        return text
    
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
            name = self.text_data.get(name_tag.text, tech_id.replace("TECH_", "").replace("_", " ").title())
        else:
            name = tech_id.replace("TECH_", "").replace("_", " ").title()
        
        # Get description
        desc = ""
        advice_tag = tech_node.find("Advice")
        if advice_tag is not None and advice_tag.text:
            desc = self.text_data.get(advice_tag.text, "")
        
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
            "nationValid": nation_valid
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
        
        # Create lookup for bonus values
        bonus_values = {}
        for bonus in root.findall(".//Entry"):
            bonus_type = bonus.find("zType")
            if bonus_type is None or not bonus_type.text:
                continue
                
            # Extract numeric values from bonus
            value = 0
            for tag in ["iValue", "iCivics", "iScience", "iGold", "iFood", "iWood", "iStone", "iIron"]:
                val = self.get_int_value(bonus, tag, 0)
                if val > 0:
                    value = val
                    break
            
            # Also try to get text description
            name_tag = bonus.find("Name")
            name = ""
            if name_tag is not None and name_tag.text:
                name = self.text_data.get(name_tag.text, "")
            
            bonus_values[bonus_type.text] = {"value": value, "name": name}
        
        # Update tech data with bonus values
        for tech in self.techs:
            if tech.get("bonusDiscover") and tech["bonusDiscover"] in bonus_values:
                tech["bonusValue"] = bonus_values[tech["bonusDiscover"]]["value"]
                # Update bonus tech name if available
                bonus_name = bonus_values[tech["bonusDiscover"]]["name"]
                if bonus_name and "Bonus" not in tech["name"]:
                    tech["name"] = bonus_name
    
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
                
                # Determine bonus description
                bonus_text = tech.get("name", "")
                if "Stone" in tech["id"]:
                    bonus_text = "+200 Stone"
                elif "Worker" in tech["id"]:
                    bonus_text = "+1 Worker"
                elif "Food" in tech["id"]:
                    bonus_text = "+200 Food"
                elif "Settler" in tech["id"]:
                    bonus_text = "+1 Settler"
                elif "Borders" in tech["id"]:
                    bonus_text = "Border Growth"
                elif "Orders" in tech["id"]:
                    bonus_text = "+20 Orders"
                elif "Money" in tech["id"]:
                    bonus_text = "+200 Money"
                elif "Minister" in tech["id"]:
                    bonus_text = "+1 Minister"
                elif "Scientist" in tech["id"]:
                    bonus_text = "Free Scientist"
                elif "Civics" in tech["id"]:
                    bonus_text = "Civic Points"
                elif "Training" in tech["id"]:
                    bonus_text = "Unit Training"
                elif "Happiness" in tech["id"]:
                    bonus_text = "Happiness Boost"
                elif "Goods" in tech["id"]:
                    bonus_text = "Luxury Goods"
                elif "Merchant" in tech["id"]:
                    bonus_text = "Free Merchant"
                elif "Soldier" in tech["id"]:
                    bonus_text = "Free Court Soldier"
                # Unit bonuses
                elif any(unit in tech["id"] for unit in ["Bireme", "Chariot", "Maceman", "Onager", "Archer", 
                         "Horseman", "Horse_Archer", "Ballista", "Longbowman", "Crossbowman",
                         "Battering_Ram", "Siege_Tower", "Akkadian", "Cimmerian", "Elephant",
                         "Light_Chariot", "Mounted_Lancer", "Hoplite", "Phalangite", "Hittite",
                         "Medjay", "Beja", "Palton", "Cataphract", "Hastatus", "Legionary",
                         "DMT", "Shotelai"]):
                    # Extract unit name and format
                    if "Longbowman" in tech["id"] or "Crossbowman" in tech["id"] or "Siege_Tower" in tech["id"]:
                        bonus_text = f"+2 {tech['name'].replace('Bonus', '').strip()}"
                    else:
                        bonus_text = f"+1 {tech['name'].replace('Bonus', '').strip()}"
                
                bonus_tech = {
                    "id": tech["id"],
                    "name": tech.get("name", "Bonus"),
                    "cost": tech["cost"],
                    "parent": parent,
                    "bonus": bonus_text
                }
                
                # Add nation field if nation-specific
                if tech.get("nationValid"):
                    bonus_tech["nation"] = tech["nationValid"][0]
                    
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
            
        tree = ET.parse(file_path)
        root = tree.getroot()
        
        tech_improvements = {}
        for imp in root.findall(".//Entry"):
            imp_type = imp.find("zType")
            tech_prereq = imp.find("TechPrereq")
            if imp_type is not None and imp_type.text and tech_prereq is not None and tech_prereq.text:
                tech_id = tech_prereq.text
                imp_name = self.format_name(imp_type.text, "IMPROVEMENT_")
                if tech_id not in tech_improvements:
                    tech_improvements[tech_id] = []
                tech_improvements[tech_id].append(imp_name)
        
        for tech in self.techs:
            if tech["id"] in tech_improvements:
                tech["unlocks"]["improvements"] = tech_improvements[tech["id"]]
    
    def parse_law_unlocks(self):
        """Parse law.xml to find what laws each tech unlocks"""
        file_path = self.xml_dir / "law.xml"
        if not file_path.exists():
            print(f"Warning: {file_path} not found")
            return
            
        tree = ET.parse(file_path)
        root = tree.getroot()
        
        tech_laws = {}
        for law in root.findall(".//Entry"):
            law_type = law.find("zType")
            tech_prereq = law.find("TechPrereq")
            if law_type is not None and law_type.text and tech_prereq is not None and tech_prereq.text:
                tech_id = tech_prereq.text
                law_name = self.format_name(law_type.text, "LAW_")
                if tech_id not in tech_laws:
                    tech_laws[tech_id] = []
                tech_laws[tech_id].append(law_name)
        
        # Group opposing laws with "/"
        for tech_id, laws in tech_laws.items():
            if len(laws) == 2:
                # Assume they're opposing choices
                tech_laws[tech_id] = [f"{laws[0]}/{laws[1]}"]
        
        for tech in self.techs:
            if tech["id"] in tech_laws:
                tech["unlocks"]["laws"] = tech_laws[tech["id"]]
    
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


def generate_html(data: Dict, template_path: str = None, output_path: str = "index.html"):
    """Generate the complete HTML file from parsed data"""
    
    # Read the working template
    if template_path and Path(template_path).exists():
        with open(template_path, 'r') as f:
            html_template = f.read()
    else:
        # Use index_working.html as template
        if Path("index_working.html").exists():
            with open("index_working.html", 'r') as f:
                html_template = f.read()
        else:
            print("Error: No template found")
            return False
    
    # Format tech data for JavaScript
    tech_entries = []
    for tech in data["techs"]:
        unlocks = tech.get("unlocks", {})
        tech_entry = f"""                {{ id: "{tech['id']}", name: "{tech['name']}", cost: {tech['cost']}, column: {tech['column']}, row: {tech['row']}, prereqs: {json.dumps(tech['prereqs'])}, unlocks: {{ units: {json.dumps(unlocks.get('units', []))}, improvements: {json.dumps(unlocks.get('improvements', []))}, laws: {json.dumps(unlocks.get('laws', []))}, projects: {json.dumps(unlocks.get('projects', []))} }} }}"""
        tech_entries.append(tech_entry)
    
    # Format bonus tech data
    bonus_entries = []
    for bonus in data["bonusTechs"]:
        if bonus.get("nation"):
            bonus_entry = f"""                {{ id: "{bonus['id']}", name: "{bonus['name']}", cost: {bonus['cost']}, parent: "{bonus.get('parent', '')}", bonus: "{bonus.get('bonus', '')}", nation: "{bonus['nation']}" }}"""
        else:
            bonus_entry = f"""                {{ id: "{bonus['id']}", name: "{bonus['name']}", cost: {bonus['cost']}, parent: "{bonus.get('parent', '')}", bonus: "{bonus.get('bonus', '')}" }}"""
        bonus_entries.append(bonus_entry)
    
    # Build the JavaScript data structures
    techs_js = ",\n".join(tech_entries)
    bonus_js = ",\n".join(bonus_entries)
    
    # Replace tech data in template
    pattern = r'const techData = \{[^}]*techs:\s*\[[^\]]*\][^}]*bonusTechs:\s*\[[^\]]*\][^}]*\};'
    replacement = f"""const techData = {{
            techs: [
{techs_js}
            ],
            bonusTechs: [
{bonus_js}
            ]
        }};"""
    
    html_template = re.sub(pattern, replacement, html_template, flags=re.DOTALL)
    
    # Replace nation data
    nation_pattern = r'const nationData = \{[^}]*startingTechs:\s*\{[^}]*\}[^}]*nationSpecificBonuses:\s*\{[^}]*\}[^}]*\};'
    nation_replacement = f"""const nationData = {{
            startingTechs: {json.dumps(data['nationData']['startingTechs'], indent=16).replace('{', '{', 1)},
            nationSpecificBonuses: {json.dumps(data['nationData']['nationSpecificBonuses'], indent=16).replace('{', '{', 1)}
        }};"""
    
    html_template = re.sub(nation_pattern, nation_replacement, html_template, flags=re.DOTALL)
    
    # Write the output file
    with open(output_path, 'w') as f:
        f.write(html_template)
    
    print(f"Generated {output_path}")
    return True


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="Generate Old World Tech Tree HTML from game files")
    parser.add_argument(
        "--xml-dir",
        default="XML/Infos",
        help="Directory containing Old World XML files (default: XML/Infos)"
    )
    parser.add_argument(
        "--output",
        default="index.html",
        help="Output HTML file (default: index.html)"
    )
    parser.add_argument(
        "--template",
        help="HTML template file (uses index_working.html if not specified)"
    )
    parser.add_argument(
        "--export-json",
        help="Export parsed data to JSON file for debugging"
    )
    
    args = parser.parse_args()
    
    # Check if XML directory exists
    if not Path(args.xml_dir).exists():
        print(f"Error: XML directory {args.xml_dir} not found")
        print("Please ensure you have the Old World game files in the correct location")
        return 1
    
    # Parse the XML files
    parser = OldWorldParser(args.xml_dir)
    parser.parse_all()
    
    # Export the data
    data = parser.export_data()
    
    # Save JSON if requested
    if args.export_json:
        with open(args.export_json, 'w') as f:
            json.dump(data, f, indent=2)
        print(f"Exported data to {args.export_json}")
    
    # Generate HTML
    if generate_html(data, args.template, args.output):
        print("Tech tree generation complete!")
        return 0
    else:
        return 1


if __name__ == "__main__":
    exit(main())