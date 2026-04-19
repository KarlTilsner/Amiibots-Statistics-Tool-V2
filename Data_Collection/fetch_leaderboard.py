import os
import json
import requests



def main(ruleset_id):
    print("Fetching leaderboard data...")

    URL = f"https://www.amiibots.com/api/amiibo?per_page=2204355&ruleset_id={ruleset_id}"

    try:
        response = requests.get(URL)
        response.raise_for_status()
        data = response.json()

        # Filter useless data
        data_to_save = []
        for item in data["data"]:
            filtered_item = {
                "name": item["name"],
                "id": item["id"],
                "playable_character_id": item["playable_character_id"],

                "wins": item["wins"],
                "losses": item["losses"],

                "rating": item["rating"],
                "rating_mu": item["rating_mu"],
                
                "match_selection_status": item["match_selection_status"],
                
                "user": {
                    "id": item["user"]["id"],
                    "twitch_user_name": item["user"]["twitch_user_name"]
                },
            }
            data_to_save.append(filtered_item)

        # Save the filtered data to a json file
        os.makedirs(f"Data/{ruleset_id}", exist_ok=True)
        with open(f"Data/{ruleset_id}/leaderboard.json", "w", encoding="utf-8") as f:
            json.dump(data_to_save, f, indent=2, ensure_ascii=False)

        print("Leaderboard data saved/updated successfully. \n")

    except requests.RequestException as e:
        print(f"Error fetching leaderboard data: {e} \n")