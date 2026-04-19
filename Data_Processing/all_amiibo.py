import os
import json



# This script will collect all unique amiibo IDs and store each of their match history 
def main(match, ruleset_id):
    print(f"Processing Amiibo from {len(match)} matches")

    os.makedirs(f"Data/{ruleset_id}/Amiibo", exist_ok=True)

    return



# Store every unique amiibo and a shortened version of their match history
# Each amiibo will have a file named after their ID
# Basic details such as name, rating, trainer, etc. will be stored, along with a list of their matches