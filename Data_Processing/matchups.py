import os
import json



def load(ruleset_id):
    path = f"Data/{ruleset_id}/matchups.json"

    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)

    return {}



def update(match, cache, all_characters):
    winner = match["winner_info"]
    loser = match["loser_info"]

    for this, opponent, is_win in [
        (winner, loser, True),
        (loser, winner, False)
    ]:
        char_id = this["character_id"]
        opp_id = opponent["character_id"]

        if char_id not in cache:
            cache[char_id] = {
                "id": char_id,
                "name": all_characters[char_id],
                "data": {}
            }

        if opp_id not in cache[char_id]["data"]:
            cache[char_id]["data"][opp_id] = {
                "id": opp_id,
                "name": all_characters[opp_id],
                "wins": 0,
                "losses": 0
            }

        if is_win:
            cache[char_id]["data"][opp_id]["wins"] += 1
        else:
            cache[char_id]["data"][opp_id]["losses"] += 1



def save(cache, ruleset_id):
    path = f"Data/{ruleset_id}/matchups.json"

    with open(path, "w", encoding="utf-8") as f:
        json.dump(cache, f, indent=2, ensure_ascii=False)