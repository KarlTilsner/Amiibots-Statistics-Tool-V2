import Data_Processing.all_trainers as all_trainers

def main():
    # Get filenames of all raw match jsons
    # Sort those by their date
    # Start with the earliest date in the list, check the state file for the last date that was processed
    # If the date of the match is later than the last processed date, begin processing the list of matches until all are done
    # Update the state file with the date of the last processed match
    pass