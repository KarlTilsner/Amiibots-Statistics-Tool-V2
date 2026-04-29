import gzip
import json
import os



def compress(ruleset_id):
    raw_folder = f"Raw_Matches/{ruleset_id}"
    archive_folder = f"Archive/{ruleset_id}"

    os.makedirs(archive_folder, exist_ok=True)

    files = sorted(f for f in os.listdir(raw_folder) if f.endswith(".json"))

    # Load state
    if os.path.exists('Data_Processing/state.json'):
        with open('Data_Processing/state.json', "r", encoding="utf-8") as f:
            state = json.load(f)

            last_processed_file = state.get(ruleset_id, {}).get("last_processed_file")

            if not last_processed_file:
                print("No matches processed for this ruleset")
                return
    else:
        print("No state file!")
        return

    for filename in files:
        # Only compress files that are already processed
        if last_processed_file and filename >= last_processed_file:
            continue

        input_path = os.path.join(raw_folder, filename)

        # Change extension: file.json → file.jsonl.gz
        output_name = filename.replace(".json", ".jsonl.gz")
        output_path = os.path.join(archive_folder, output_name)

        # Skip if already compressed
        if os.path.exists(output_path):
            continue

        print(f"Compressing {filename}")

        with open(input_path, "r", encoding="utf-8") as infile, \
             gzip.open(output_path, "wt", encoding="utf-8") as outfile:

            data = json.load(infile)

            # Write as JSONL (one match per line)
            for match in data:
                outfile.write(json.dumps(match) + "\n")

        # Delete file after compressing
        os.remove(input_path)



def main():
    print("\nStarting compression...")

    with open('Data/rulesets.json', "r", encoding="utf-8") as f:
        rulesets = json.load(f)

    for ruleset in rulesets:
        print(f"Compressing data for ruleset: {ruleset['name']}")
        compress(ruleset["id"])

    print("Compression complete.\n")


if __name__ == "__main__":
    main()