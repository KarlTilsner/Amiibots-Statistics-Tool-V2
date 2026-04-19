import os
import json
import requests



def main():
    print("Fetching ruleset data...")

    URL = "https://www.amiibots.com/api/rulesets/public_rulesets"

    if os.path.exists("Data/rulesets.json"):
        print("Ruleset data already exists. Skipping fetch. \n")
        return

    try:
        response = requests.get(URL)
        response.raise_for_status()
        data = response.json()

        # Filter useless data
        data_to_save = []
        for item in data["data"]:
            filtered_item = {
                "name": item["name"],
                "id": item["id"]
            }
            data_to_save.append(filtered_item)

        os.makedirs("Data", exist_ok=True)
        with open("Data/rulesets.json", "w", encoding="utf-8") as f:
            json.dump(data_to_save, f, indent=2, ensure_ascii=False)

        print("Rulesets data saved successfully. \n")

    except requests.RequestException as e:
        print(f"Error fetching rulesets data: {e} \n")