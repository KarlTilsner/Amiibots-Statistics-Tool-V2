# This script will collect all unique trainer IDs and store the IDs of all amiibo associated with each trainer ID

def main(match):
    # Get the IDs of the p1 and p2 amiibo
    # Attempt to append the IDs to the respective trainer ID json
    # If the trainer ID json doesn't exist, create it and add the amiibo ID to it
    # If the trainer ID json does exist, check if the amiibo ID is already in
    # If the amiibo ID is already in, update the name of the amiibo if it is different
    print(f"Processing match: {len(match['data'])}")

    return