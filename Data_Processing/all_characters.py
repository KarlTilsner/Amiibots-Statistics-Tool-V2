import os
import json
import requests



def main():
    URL = "https://www.amiibots.com/api/utility/get_all_characters"

    if os.path.exists("Data/all_characters.json"):
        print("All characters data already exists. Skipping fetch.")
        return

    try:
        response = requests.get(URL)
        response.raise_for_status()
        data = response.json()

        os.makedirs("Data", exist_ok=True)

        with open("Data/all_characters.json", "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

        print("All characters data saved successfully. \n")

    except requests.RequestException as e:
        print(f"Error fetching all characters data: {e} \n")