import requests
import json
from urllib.parse import quote
from datetime import datetime

previous_cursor = None

def fetch_matches(cursor=None):
    global previous_cursor

    # URL Base values
    base_url = "https://www.amiibots.com/api/singles_matches"
    per_page = "5"
    created_at_start = "2018-11-10T00:00:00Z"
    ruleset_id = "44748ebb-e2f3-4157-90ec-029e26087ad0"

    # Construct full query string
    url = f"{base_url}?per_page={per_page}&created_at_start={quote(created_at_start)}&ruleset_id={ruleset_id}"
    if cursor:
        encoded_cursor = quote(cursor)
        url += f"&cursor={encoded_cursor}"

    # Fetch data from the API
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()

        matches = data.get("data", [])
        pagination = data.get("pagination", {})
        previous_cursor = pagination.get("cursor", {}).get("previous")

        data_to_store = {
            "data": [],
            "pagination": pagination
        }

        corrupt_matches = 0
        for match in matches:
            try:
                data_to_store["data"].append(match)

            except Exception as e:
                corrupt_matches += 1
                print(f"Corrupt match at {match.get('created_at')}: {e}")

        create_json(data_to_store, cursor)
        return

    except Exception as e:
        print("Error fetching matches:", e)



def create_json(data, cursor):
    with open(f"Data_Collection/Raw_Matches/data.json", "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    print("Data saved to data.json")

    # update state with the new cursor
    newstate = {
        "previous_cursor": previous_cursor,
        "cursor_last_scraped": cursor,
        "last_scrape_date": datetime.now().isoformat()
    }
    with open('Data_Collection/state.json', "w") as e:
        json.dump(newstate, e, indent=2)
    print(newstate)



def start_fetching():
    with open('Data_Collection/state.json', "r") as f:
        state = json.load(f)
        
        if state.get("previous_cursor"):
            fetch_matches(state["previous_cursor"])
        else:
            # Start from the beginning
            fetch_matches('Sun, 19 Jan 2020 00:03:21 GMT')

start_fetching()



# Check that there is a previous cursor in the api before storing data
# Check that there is a state file before trying to read it, if not create one with null values
# Figure out how to store data chunks in github
# add retry logic to fetch_matches in case of network errors
# add error handling for json decoding issues when fetching matches