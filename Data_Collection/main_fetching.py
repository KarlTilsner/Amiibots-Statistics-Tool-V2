import json

import all_characters as ac
import fetch_rulesets as fr
import fetch_matches as fm
import fetch_leaderboard as fl
import fetch_tierlist as ft




def main():
    print("Starting data fetching... \n")
    ac.main()
    fr.main()

    with open('Data/rulesets.json', "r", encoding="utf-8") as f:
        rulesets = json.load(f)
        
    for ruleset in rulesets:
        print(f"Fetching data for ruleset: {ruleset['name']}")
        fm.main(ruleset["id"])
        fl.main(ruleset["id"])
        ft.main(ruleset["id"])
        
    print("All data fetching complete. \n")



if __name__ == "__main__":
    main()