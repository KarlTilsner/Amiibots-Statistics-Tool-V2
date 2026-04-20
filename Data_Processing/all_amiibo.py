import os
import json



# This script will collect all unique amiibo IDs and store each of their match history 
def main(match, ruleset_id):
    print(f"Processing Amiibo from {len(match)} matches")

    os.makedirs(f"Data/{ruleset_id}/Amiibo", exist_ok=True)

    for m in match:
        for amiibo in ["fp1", "fp2"]:
            # Get the IDs of the p1 and p2 amiibo and trainer
            new_amiibo_data = {
                "character_id": m[amiibo]["character_id"],
                "id": m[amiibo]["id"],
                "name": m[amiibo]["name"],
                "trainer_id": m[amiibo]["trainer_id"],
                "trainer_name": m[amiibo]["trainer_name"],
                "matches": {}
            }

            match_result = {}

            # Create the shortened match data to be stored in the amiibo json
            for result in ["winner_info", "loser_info"]:
                if m[result]["id"] != new_amiibo_data["id"]:
                    match_result["opponent"] = {
                        "character_id": m[result]["character_id"],
                        "id": m[result]["id"],
                        "name": m[result]["name"],
                        "rating": m[result]["rating"],
                        "trainer_id": m[result]["trainer_id"],
                        "trainer_name": m[result]["trainer_name"],
                        "result": "win" if result == "winner_info" else "loss"
                    }

                if m[result]["id"] == new_amiibo_data["id"]:
                    match_result["this_amiibo"] = {
                        "rating": m[result]["rating"],
                        "rating_mu": m[result]["rating_mu"],
                        "rating_sigma": m[result]["rating_sigma"],
                        "result": "win" if result == "winner_info" else "loss"
                    }

            # Attempt to append the match to the respective amiibo ID json
            amiibo_file = f"Data/{ruleset_id}/Amiibo/{new_amiibo_data['id']}.json"
            if os.path.exists(amiibo_file):
                with open(amiibo_file, "r", encoding="utf-8") as f:
                    amiibo_data = json.load(f)

                # If the amiibo ID json does exist, check if the match is already in
                if m["created_at"] not in amiibo_data["matches"]:
                    amiibo_data["matches"][m["created_at"]] = match_result

                    # Update the name of the amiibo if it is different
                    if amiibo_data["name"] != new_amiibo_data["name"]:
                        amiibo_data["name"] = new_amiibo_data["name"]

                    with open(amiibo_file, "w", encoding="utf-8") as f:
                        json.dump(amiibo_data, f, indent=2, ensure_ascii=False)

            # If the amiibo ID json doesn't exist, create it and add the match to it
            else:
                with open(amiibo_file, "w", encoding="utf-8") as f:
                    new_amiibo_data["matches"][m["created_at"]] = match_result
                    json.dump(new_amiibo_data, f, indent=2, ensure_ascii=False)



# Store every unique amiibo and a shortened version of their match history
# Each amiibo will have a file named after their ID
# Basic details such as name, rating, trainer, etc. will be stored, along with a list of their matches