import os
import json



# This script will collect all unique amiibo IDs and store each of their match history 
def main(match, ruleset_id):
    print(f"Processing Amiibo from {len(match)} matches")

    os.makedirs(f"Data/{ruleset_id}/Amiibo", exist_ok=True)

    return



# Null match handling