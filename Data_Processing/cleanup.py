import gzip
import json
import os
import sys


# Compress all raw match files and place them into a archive folder


def compress(ruleset_id):
    # Get filenames of all raw match jsons
    folder = f"Raw_Matches/{ruleset_id}"
    files = [f for f in os.listdir(folder) if f.endswith(".json")]

    # Check for a state file and load the date of the last processed match, if it exists
    if os.path.exists('Data_Processing/state.json'):
        with open('Data_Processing/state.json', "r", encoding="utf-8") as f:
            state = json.load(f)
            last_processed_file = state.get(ruleset_id, {}).get("last_processed_file")
    else:
        print("No state file!")
        return
    
    files_to_compress = []
    # Start with the earliest date in the list, check the state file for the last date that was processed
    for filename in files:
        # If we have a last processed file, skip older/equal files
        if last_processed_file and filename >= last_processed_file:
            continue
        files_to_compress.append(filename)

    # Write
    with gzip.open("matches.jsonl.gz", "at", encoding="utf-8") as f:
        for file in files_to_compress:
            f.write(json.dumps(file) + "\n")



def main():
    print("\nStarting data processing...")

    with open('Data/rulesets.json', "r", encoding="utf-8") as f:
        rulesets = json.load(f)
        
    for ruleset in rulesets:
        print(f"Processing data for ruleset: {ruleset['name']}")
        compress(ruleset["id"])

    print("All data processing complete. \n")



if __name__ == "__main__":
    main()