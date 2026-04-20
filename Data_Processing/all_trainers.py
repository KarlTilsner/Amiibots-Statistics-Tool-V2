import os
import json



# This script will collect all unique trainer IDs and store the IDs of all amiibo associated with each trainer ID
def main(match, ruleset_id):
    print(f"Processing Trainers from {len(match)} matches")

    os.makedirs(f"Data/{ruleset_id}/Trainers", exist_ok=True)

    for m in match:
        for player in ["fp1", "fp2"]:
            # Get the IDs of the p1 and p2 amiibo and trainer
            trainer_id = m[player]["trainer_id"]
            trainer_name = m[player]["trainer_name"]
            amiibo_id = m[player]["id"]
            amiibo_name = m[player]["name"]
            character_id = m[player]["character_id"]

            # Attempt to append the IDs to the respective trainer ID json
            trainer_file = f"Data/{ruleset_id}/Trainers/{trainer_id}.json"
            if os.path.exists(trainer_file):
                with open(trainer_file, "r", encoding="utf-8") as f:
                    trainer_data = json.load(f)

                # If the trainer ID json does exist, check if the amiibo ID is already in
                if amiibo_id not in trainer_data["amiibo"]:
                    trainer_data["amiibo"][amiibo_id] = {
                        "name": amiibo_name,
                        "character_id": character_id
                    }
                    with open(trainer_file, "w", encoding="utf-8") as f:
                        json.dump(trainer_data, f, indent=2, ensure_ascii=False)

                # If the amiibo ID is already in, update the name of the amiibo if it is different
                else:
                    if trainer_data["amiibo"][amiibo_id]["name"] != amiibo_name:
                        trainer_data["amiibo"][amiibo_id] = {
                            "name": amiibo_name,
                            "character_id": character_id
                        }
                        with open(trainer_file, "w", encoding="utf-8") as f:
                            json.dump(trainer_data, f, indent=2, ensure_ascii=False)

            # If the trainer ID json doesn't exist, create it and add the amiibo ID to it
            else:
                new_trainer_data = {
                    "trainer_id": trainer_id,
                    "trainer_name": trainer_name,
                    "amiibo": {
                        amiibo_id: {
                            "name": amiibo_name,
                            "character_id": character_id
                        }
                    }
                }
                with open(trainer_file, "w", encoding="utf-8") as f:
                    json.dump(new_trainer_data, f, indent=2, ensure_ascii=False)