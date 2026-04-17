import os
import json



# This script will collect all unique amiibo IDs and store each of their match history 
def main(match):
    print(f"Processing Amiibo from {len(match['data'])} matches")

    os.makedirs("Data/Amiibo", exist_ok=True)

    return