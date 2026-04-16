import requests
import json
from urllib.parse import quote
from datetime import datetime
import os

previous_cursor = None

def fetch_matches(cursor=None):
    global previous_cursor

    # URL Base values
    base_url = "https://www.amiibots.com/api/singles_matches"
    per_page = "1000"
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

        # Data structure to store matches and pagination info
        data_to_store = {
            "data": [],
            "pagination": pagination
        }

        # Store matches in the data_to_store dictionary, handling any potential issues with corrupt matches
        for match in matches:
            try:
                data_to_store["data"].append(match)
            except Exception as e:
                print(f"Possible corrupt match/s: {e}")

        create_json(data_to_store, cursor)
        return

    except Exception as e:
        print("Error fetching matches:", e)



def create_json(data, cursor):
    dt = datetime.strptime(cursor, "%a, %d %b %Y %H:%M:%S %Z")
    safe_name = dt.strftime("%Y-%m-%d_%H-%M-%S")

    with open(f"Data_Collection/Raw_Matches/{safe_name}.json", "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    print(f"Data saved to {safe_name}.json \n")

    # update state with the new cursor
    newstate = {
        "previous_cursor": previous_cursor,
        "cursor_last_scraped": cursor,
        "last_scrape_date": datetime.now().isoformat()
    }
    with open('Data_Collection/state.json', "w") as e:
        json.dump(newstate, e, indent=2)



def start_fetching():
    # Check if there is a state file and if it contains a previous cursor, if so start fetching from that cursor
    if os.path.exists('Data_Collection/state.json'):
        with open('Data_Collection/state.json', "r") as f:
            state = json.load(f)
            
            if state.get("previous_cursor"):
                fetch_matches(state["previous_cursor"])
            else:
                # Start from the beginning
                fetch_matches('Sun, 19 Jan 2020 00:03:21 GMT')
    else:
        # Start from the beginning
        fetch_matches('Sun, 19 Jan 2020 00:03:21 GMT')

start_fetching()



# Check that there is a previous cursor in the api before storing data
# add retry logic to fetch_matches in case of network errors
# add error handling for json decoding issues when fetching matches (Matches with null values might be fine, can remove them later during processing)