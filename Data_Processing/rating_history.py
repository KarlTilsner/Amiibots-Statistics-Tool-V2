import json
import os



# Seperate the date into yymmdd, for each DAY determine the highest rated amiibo for each character
# Store the character, trainer, rating
# Use the date as the key and always look for the highest rated amiibo for that date



def main(data, ruleset_id):
    print("Processing rating history...")

    os.makedirs(f"Data/{ruleset_id}/Rating_History", exist_ok=True)

    with open(f"Data/all_characters.json", "r", encoding="utf-8") as f:
        all_characters = json.load(f)

    for match in data:
        for amiibo in ["winner_info", "loser_info"]:

            # Skip the amiibo if its sigma is too high
            if match[amiibo]["rating_sigma"] > 2.5:
                continue

            # Simplify variables
            this_amiibo_character_id = match[amiibo]["character_id"]
            this_amiibo_character_name = all_characters[this_amiibo_character_id]

            # Check if the rating history file exists and load it
            rating_history_file_dir = f"Data/{ruleset_id}/Rating_History/{this_amiibo_character_name} Rating History.json"
            if os.path.exists(rating_history_file_dir):
                with open(rating_history_file_dir, "r", encoding="utf-8") as f:
                    rating_history = json.load(f)
            else:
                rating_history = {
                    "id": this_amiibo_character_id,
                    "name": this_amiibo_character_name,
                    "rating_history": {}
                }

            # Get the date the match was created at
            match_date = match["created_at"][:10]

            # Compare current amiibo to the previous highest amiibo rating and keep the higher rating
            if match_date in rating_history.get("rating_history", {}):
                if match[amiibo]["rating"] > rating_history["rating_history"][match_date]["rating"]:
                    rating_history["rating_history"][match_date] = {
                        "trainer_name": match[amiibo]["trainer_name"],
                        "trainer_id": match[amiibo]["trainer_id"],
                        "amiibo_name": match[amiibo]["name"],
                        "unique_amiibo_id": match[amiibo]["id"],
                        "rating": match[amiibo]["rating"]
                    }
            
            # If a history doesn't exist, initialise it
            else:
                rating_history["rating_history"][match_date] = {
                    "trainer_name": match[amiibo]["trainer_name"],
                    "trainer_id": match[amiibo]["trainer_id"],
                    "amiibo_name": match[amiibo]["name"],
                    "unique_amiibo_id": match[amiibo]["id"],
                    "rating": match[amiibo]["rating"]
                }

            # Save the rating history to a JSON file
            with open(rating_history_file_dir, "w", encoding="utf-8") as f:
                json.dump(rating_history, f, indent=2, ensure_ascii=False)