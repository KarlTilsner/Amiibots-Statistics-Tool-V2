import all_trainers as all_trainers
import all_amiibo as all_amiibo
import simple_list as simple_list
import matchups as matchups
import rating_history as rating_history
import json
from urllib.parse import quote
from datetime import datetime
import os



def process_files(ruleset_id):
    folder = f"Raw_Matches/{ruleset_id}"
    files = sorted(f for f in os.listdir(folder) if f.endswith(".json"))

    # Load state
    if os.path.exists('Data_Processing/state.json'):
        with open('Data_Processing/state.json', "r", encoding="utf-8") as f:
            state = json.load(f)
    else:
        state = {}

    last_processed_file = state.get(ruleset_id, {}).get("last_processed_file")

    # Check how many files can be processed
    files_to_process = [
        f for f in files
        if not last_processed_file or f > last_processed_file
    ]

    # Exit early if no files can be processed
    if not files_to_process:
        print("No new files to process — skipping cache load")
        return

    print(f"{len(files_to_process)} new file(s) to process")

    # Load caches
    print("Loading all_trainers cache")
    trainer_cache = all_trainers.load(ruleset_id)
    
    print("Loading all_amiibo cache")
    amiibo_cache, ratings_cache = all_amiibo.load_parallel(ruleset_id)

    print("Loading matchups cache")
    matchup_cache = matchups.load(ruleset_id)

    print("Loading rating_history cache")
    rating_cache = rating_history.load(ruleset_id)

    with open("Data/all_characters.json", "r", encoding="utf-8") as f:
        all_characters = json.load(f)

    # Process files
    for filename in files_to_process:
        print(f"Processing {filename}")

        with open(os.path.join(folder, filename), "r", encoding="utf-8") as file:
            data = json.load(file)

        simple_list.main(data, ruleset_id)

        for match in data:
            all_trainers.update(match, trainer_cache)
            all_amiibo.update(match, amiibo_cache)
            matchups.update(match, matchup_cache, all_characters)
            rating_history.update(match, rating_cache, all_characters, ratings_cache)

        last_processed_file = filename

    # Save
    print("Saving...")
    all_trainers.save(trainer_cache, ruleset_id)
    all_amiibo.save(amiibo_cache, ruleset_id)
    matchups.save(matchup_cache, ruleset_id)
    rating_history.save(rating_cache, ruleset_id)

    # Update state
    with open('Data_Processing/state.json', "w", encoding="utf-8") as f:
        state[ruleset_id] = {
            "last_processed_file": last_processed_file
        }
        json.dump(state, f, indent=2, ensure_ascii=False)



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