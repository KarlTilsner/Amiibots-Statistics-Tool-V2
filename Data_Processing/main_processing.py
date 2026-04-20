import all_trainers as all_trainers
import all_amiibo as all_amiibo
import simple_list as simple_list
import matchups as matchups
import json
from urllib.parse import quote
from datetime import datetime
import os



def run_functions(folder, filename, ruleset_id):
    print(f"Opening file: {filename}")
    with open(os.path.join(folder, filename), "r", encoding="utf-8") as file:
        data = json.load(file)

        print(f"Processing {len(data)} matches")

        # Call the functions to process the matches
        all_trainers.main(data, ruleset_id)
        all_amiibo.main(data, ruleset_id)
        simple_list.main(data, ruleset_id)
        matchups.main(data, ruleset_id)

        print(f"Finished processing file: {filename}\n")



def process_files(ruleset_id):
    # Get filenames of all raw match jsons
    folder = f"Raw_Matches/{ruleset_id}"
    files = [f for f in os.listdir(folder) if f.endswith(".json")]

    # Sort those by their date/filename
    files.sort()

    last_processed_file = None

    # Check for a state file and load the date of the last processed match, if it exists
    if os.path.exists('Data_Processing/state.json'):
        with open('Data_Processing/state.json', "r", encoding="utf-8") as f:
            state = json.load(f)
            last_processed_file = state.get(ruleset_id, {}).get("last_processed_file")
    else:
        state = {}

    # Start with the earliest date in the list, check the state file for the last date that was processed
    for filename in files:
        # If we have a last processed file, skip older/equal files
        if last_processed_file and filename <= last_processed_file:
            continue
        
        run_functions(folder, filename, ruleset_id)

        # Update last processed file
        last_processed_file = filename

    # Update the state file with the date of the last processed match
    with open('Data_Processing/state.json', "w", encoding="utf-8") as f:
        state[ruleset_id] = {
            "last_processed_file": last_processed_file,
            "last_processed_date": datetime.now().isoformat()
        }
        json.dump(state, f , indent=2, ensure_ascii=False)



def main():
    print("\nStarting data processing...")

    with open('Data/rulesets.json', "r", encoding="utf-8") as f:
        rulesets = json.load(f)
        
    for ruleset in rulesets:
        print(f"Processing data for ruleset: {ruleset['name']}")
        process_files(ruleset["id"])

    print("All data processing complete. \n")



if __name__ == "__main__":
    main()