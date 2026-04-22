import os
import json



def load(ruleset_id):
    base_dir = f"Data/{ruleset_id}/Amiibo"
    os.makedirs(base_dir, exist_ok=True)

    cache = {}

    for file in os.listdir(base_dir):
        if file.endswith(".json"):
            path = os.path.join(base_dir, file)
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
                cache[data["id"]] = data

    return cache



def update(match, cache):
    created_at = match["created_at"]

    winner = match["winner_info"]
    loser = match["loser_info"]

    for p in [match["fp1"], match["fp2"]]:
        amiibo_id = p["id"]

        # Initialise if new
        if amiibo_id not in cache:
            cache[amiibo_id] = {
                "character_id": p["character_id"],
                "id": amiibo_id,
                "name": p["name"],
                "trainer_id": p["trainer_id"],
                "trainer_name": p["trainer_name"],
                "matches": {}
            }

        amiibo_data = cache[amiibo_id]

        # Skip duplicate match
        if created_at in amiibo_data["matches"]:
            continue

        # Determine perspective
        if winner["id"] == amiibo_id:
            this = winner
            opponent = loser
            result = "win"
        else:
            this = loser
            opponent = winner
            result = "loss"

        match_result = {
            "this_amiibo": {
                "rating": this["rating"],
                "rating_mu": this["rating_mu"],
                "rating_sigma": this["rating_sigma"],
                "result": result
            },
            "opponent": {
                "character_id": opponent["character_id"],
                "id": opponent["id"],
                "name": opponent["name"],
                "rating": opponent["rating"],
                "trainer_id": opponent["trainer_id"],
                "trainer_name": opponent["trainer_name"],
                "result": "loss" if result == "win" else "win"
            }
        }

        # Store match
        amiibo_data["matches"][created_at] = match_result

        # Update name if changed
        if amiibo_data["name"] != p["name"]:
            amiibo_data["name"] = p["name"]



def save(cache, ruleset_id):
    base_dir = f"Data/{ruleset_id}/Amiibo"

    for amiibo_id, data in cache.items():
        path = f"{base_dir}/{amiibo_id}.json"

        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)