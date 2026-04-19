import all_characters as ac
import fetch_rulesets as fr
import fetch_matches as fm
import fetch_leaderboard as fl



def main():
    print("Starting data fetching... \n")
    ac.main()
    fr.main()
    fm.main()
    fl.main()
    print("All data fetching complete. \n")



if __name__ == "__main__":
    main()



# Handle the rulesets here eg. fm.main(ruleset)
# Update each function to accept a ruleset parameter
