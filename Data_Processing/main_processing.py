import all_trainers as all_trainers
import all_amiibo as all_amiibo
import json
from urllib.parse import quote
from datetime import datetime
import os



# Get filenames of all raw match jsons
folder = "Data_Collection/Raw_Matches"
files = [f for f in os.listdir(folder) if f.endswith(".json")]



def run_functions(f):
    print(f"Opening file: {f}")
    with open(os.path.join(folder, f), "r", encoding="utf-8") as file:
        data = json.load(file)

        # Call the functions to process the matches
        all_trainers.main(data)
        all_amiibo.main(data)



def main():
    # Sort those by their date/filename
    files.sort()

    last_processed_file = None

    # Check for a state file and load the date of the last processed match, if it exists
    if os.path.exists('Data_Processing/state.json'):
        with open('Data_Processing/state.json', "r", encoding="utf-8") as f:
            state = json.load(f)
            last_processed_file = state.get("last_processed_file")

    # Start with the earliest date in the list, check the state file for the last date that was processed
    for filename in files:
        # If we have a last processed file, skip older/equal files
        if last_processed_file and filename <= last_processed_file:
            continue
        
        print(f"Processing: {filename}")
        run_functions(filename)

        # Update last processed file
        last_processed_file = filename

    # Update the state file with the date of the last processed match
    with open('Data_Processing/state.json', "w", encoding="utf-8") as f:
        newstate = {
            "last_processed_file": last_processed_file,
            "last_processed_date": datetime.now().isoformat()
        }
        json.dump(newstate, f , indent=2, ensure_ascii=False)

main()