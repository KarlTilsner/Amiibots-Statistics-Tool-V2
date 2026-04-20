import os
import json


def main(data, ruleset_id):
    print("Processing matchups...")

    os.makedirs(f"Data/{ruleset_id}", exist_ok=True)

    with open(f"Data/all_characters.json", "r", encoding="utf-8") as f:
        all_characters = json.load(f)

    # Check if the matchups file exists and load it
    matchups_file_dir = f"Data/{ruleset_id}/matchups.json"
    if os.path.exists(matchups_file_dir):
        with open(matchups_file_dir, "r", encoding="utf-8") as f:
            matchups = json.load(f)
    else:
        matchups = {}

    for match in data:
        for amiibo in ["winner_info", "loser_info"]:

            if match[amiibo]["character_id"] not in matchups:
                matchups[match[amiibo]["character_id"]] = {
                    "id": match[amiibo]["character_id"],
                    "name": all_characters[match[amiibo]["character_id"]],
                    "data": {}
                }

            opponent = "loser_info" if amiibo == "winner_info" else "winner_info"
            opponent_id = match[opponent]["character_id"]

            if opponent_id not in matchups[match[amiibo]["character_id"]]["data"]:
                matchups[match[amiibo]["character_id"]]["data"][opponent_id] = {
                    "id": opponent_id,
                    "name": all_characters[opponent_id],
                    "wins": 0,
                    "losses": 0
                }

            if amiibo == "winner_info":
                matchups[match[amiibo]["character_id"]]["data"][opponent_id]["wins"] += 1
            else:
                matchups[match[amiibo]["character_id"]]["data"][opponent_id]["losses"] += 1
    
    # Save the matchups to a JSON file
    with open(matchups_file_dir, "w", encoding="utf-8") as f:
        json.dump(matchups, f, indent=2, ensure_ascii=False)