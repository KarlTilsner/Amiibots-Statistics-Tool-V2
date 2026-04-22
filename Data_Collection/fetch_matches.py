import requests
import json
from urllib.parse import quote
from datetime import datetime, timezone
import os

previous_cursor = None
cursor = 'Sun, 19 Jan 2020 00:03:21 GMT'
latest_scraped_match_date = "2001-05-16T00:00:00Z"
data_to_store = []
num_matches = 100
ruleset_id = None



def fetch_matches():
    global previous_cursor, latest_scraped_match_date

    # URL Base values
    base_url = "https://www.amiibots.com/api/singles_matches"
    per_page = f"{num_matches}"
    created_at_start = "2018-11-10T00:00:00Z"
    
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

        # Store matches in the data_to_store dictionary, handling any potential issues with corrupt matches
        skipcounter = 0
        corruptcounter = 0
        for match in matches:
            if to_iso(match["created_at"]) <= to_iso(latest_scraped_match_date):
                skipcounter += 1
                continue

            if match["winner_info"] is None and match["loser_info"] is None:
                corruptcounter += 1
                continue

            data_to_store.append(match)

        print(f">>>> Reached {skipcounter} matches that have already been scraped.")
        print(f">>>> Found {corruptcounter} matches")
        update_state()

    except Exception as e:
        print(e)



def to_iso(date_str):
    # Already ISO
    if "T" in date_str:
        dt = datetime.fromisoformat(date_str)
    
    # RFC/GMT format: "Sat, 18 Apr 2026 07:35:19 GMT"
    else:
        dt = datetime.strptime(date_str, "%a, %d %b %Y %H:%M:%S GMT")
        dt = dt.replace(tzinfo=timezone.utc)

    # Normalise to UTC ISO without microseconds
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")



def create_json():
    # Check if there are matches to save, if not skip saving and just update the state with the new cursor
    if data_to_store == []:
        print("No matches to save.")
        update_state()
        return

    # Make sure directory exists
    os.makedirs(f"Raw_Matches/{ruleset_id}", exist_ok=True)
    
    # Create a safe filename using the cursor timestamp
    dt = datetime.strptime(cursor, "%a, %d %b %Y %H:%M:%S %Z")
    safe_name = dt.strftime("%Y-%m-%d_%H-%M-%S")

    with open(f"Raw_Matches/{ruleset_id}/{safe_name}-{len(data_to_store)}.json", "w", encoding="utf-8") as f:
        json.dump(data_to_store, f, indent=2, ensure_ascii=False)
    print(f"Data saved to Raw_Matches/{ruleset_id}/{safe_name}-{len(data_to_store)}.json \n")

    update_state()



def update_state():
    global previous_cursor
    if previous_cursor is None:
        previous_cursor = cursor

    if os.path.exists('Data_Collection/state.json'):
        with open('Data_Collection/state.json', "r", encoding="utf-8") as f:
            state = json.load(f)
    else:
        state = {}

    state[ruleset_id] = {
        "previous_cursor": previous_cursor,
        "cursor_last_scraped": cursor,
        "last_scrape_date": datetime.now().isoformat(),
        "latest_scraped_match_date": to_iso(data_to_store[0]["created_at"]) if len(data_to_store) > 0 else latest_scraped_match_date
    }

    with open('Data_Collection/state.json', "w", encoding="utf-8") as e:
        json.dump(state, e, indent=2, ensure_ascii=False)



def start_fetching():
    global latest_scraped_match_date, cursor

    # Check if there is a state file and if it contains a previous cursor, if so start fetching from that cursor
    if os.path.exists('Data_Collection/state.json'):
        with open('Data_Collection/state.json', "r", encoding="utf-8") as f:
            state = json.load(f)
            
            if state.get(ruleset_id, {}).get("latest_scraped_match_date"):
                latest_scraped_match_date = state[ruleset_id]["latest_scraped_match_date"]

            if state.get(ruleset_id, {}).get("previous_cursor"):
                cursor = state[ruleset_id]["previous_cursor"]
                fetch_matches()
            else:
                # Starts from the beginning
                fetch_matches()
    else:
        # Starts from the beginning
        fetch_matches()



def main(ruleset):
    global ruleset_id, data_to_store
    ruleset_id = ruleset
    data_to_store = []

    for _ in range(50):  # Loop to fetch multiple pages of matches
        print(f"Fetching {num_matches} matches: {_ + 1}/50")
        start_fetching()

    create_json()



# add retry logic to fetch_matches in case of network errors
