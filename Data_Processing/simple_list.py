import json
import os



def main(data, ruleset_id):
    print("Processing simple lists")

    os.makedirs(f"Data/{ruleset_id}", exist_ok=True)  

    # Check if the list files exist
    amiibo_file = f"Data/{ruleset_id}/all_amiibo.json"
    if os.path.exists(amiibo_file):
        with open(amiibo_file, "r", encoding="utf-8") as f:
            unique_amiibo = json.load(f)
    else:
        unique_amiibo = {}

    trainer_file = f"Data/{ruleset_id}/all_trainers.json"
    if os.path.exists(trainer_file):
        with open(trainer_file, "r", encoding="utf-8") as f:
            unique_trainers = json.load(f)
    else:
        unique_trainers = {}

    # Loop through each match in the data
    for match in data:
        for player in ["winner_info", "loser_info"]:
            unique_amiibo[match[player]["id"]] = {
                "name": match[player]["name"],
                "rating": match[player]["rating"],
                "character_id": match[player]["character_id"],
                "trainer_id": match[player]["trainer_id"],
                "trainer_name": match[player]["trainer_name"]
            }

            unique_trainers[match[player]["trainer_id"]] = match[player]["trainer_name"]

    # Save the unique trainers and amiibo to JSON files
    with open(f"Data/{ruleset_id}/unique_amiibo.json", "w", encoding="utf-8") as f:
        json.dump(unique_amiibo, f, indent=2, ensure_ascii=False)

    with open(f"Data/{ruleset_id}/unique_trainers.json", "w", encoding="utf-8") as f:
        json.dump(unique_trainers, f, indent=2, ensure_ascii=False)