import os
import json
import requests



def main(ruleset_id):
    print("Fetching tierlist data...")

    URL = f"https://www.amiibots.com/api/tier_list/first_dataset_of_given_month?ruleset_id={ruleset_id}"

    try:
        response = requests.get(URL)
        response.raise_for_status()
        data = response.json()

        # Save the filtered data to a json file
        os.makedirs(f"Data/{ruleset_id}", exist_ok=True)
        with open(f"Data/{ruleset_id}/tierlist.json", "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

        print("Tierlist data saved/updated successfully. \n")

    except requests.RequestException as e:
        print(f"Error fetching tierlist data: {e} \n")