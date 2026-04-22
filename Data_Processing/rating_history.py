import os
import json



def load(ruleset_id):
    base_dir = f"Data/{ruleset_id}/Rating_History"
    os.makedirs(base_dir, exist_ok=True)

    cache = {}
    current_best = {}

    for file in os.listdir(base_dir):
        if file.endswith(".json"):
            path = os.path.join(base_dir, file)
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)

                char_id = data["id"]
                cache[char_id] = data

                history = data.get("rating_history", {})

                # Get latest known best (last date entry)
                if history:
                    latest_date = max(history.keys())
                    current_best[char_id] = history[latest_date]
                else:
                    current_best[char_id] = None

    return cache, current_best



def update(match, cache, all_characters, current_best):
    match_date = match["created_at"][:10]

    for side in ["winner_info", "loser_info"]:
        p = match[side]

        if p["rating_sigma"] > 2.5:
            continue

        char_id = p["character_id"]

        # Ensure structures exist
        if char_id not in cache:
            cache[char_id] = {
                "id": char_id,
                "name": all_characters[char_id],
                "rating_history": {}
            }

        if char_id not in current_best:
            current_best[char_id] = None

        # Update current best
        if (
            current_best[char_id] is None or
            p["rating"] > current_best[char_id]["rating"] or 
            p["id"] == current_best[char_id]["unique_amiibo_id"]
        ):
            current_best[char_id] = {
                "trainer_name": p["trainer_name"],
                "trainer_id": p["trainer_id"],
                "amiibo_name": p["name"],
                "unique_amiibo_id": p["id"],
                "rating": p["rating"]
            }

    # Store best for this date
    for char_id, best in current_best.items():
        if best is None:
            continue # prevents crash on fresh runs

        history = cache[char_id]["rating_history"]

        if (
            match_date not in history or
            best["rating"] >= history[match_date]["rating"]
        ):
            history[match_date] = best.copy()



def save(cache, ruleset_id):
    base_dir = f"Data/{ruleset_id}/Rating_History"

    for char_id, data in cache.items():
        path = f"{base_dir}/{data['name']} Rating History.json"

        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)