import os
import json



def load(ruleset_id):
    base_dir = f"Data/{ruleset_id}/Rating_History"
    os.makedirs(base_dir, exist_ok=True)

    cache = {}

    for file in os.listdir(base_dir):
        if file.endswith(".json"):
            with open(os.path.join(base_dir, file), "r", encoding="utf-8") as f:
                data = json.load(f)
                cache[data["id"]] = data

    return cache



def update(match, cache, all_characters, ratings_cache):
    match_date = match["created_at"][:10]
    updated_chars = set()

    for side in ["winner_info", "loser_info"]:
        p = match[side]

        if p["rating_sigma"] > 2.5:
            continue

        char_id = p["character_id"]
        amiibo_id = p["id"]

        updated_chars.add(char_id)

        cache.setdefault(char_id, {
            "id": char_id,
            "name": all_characters[char_id],
            "rating_history": {}
        })

        ratings_cache.setdefault(char_id, {})

        ratings_cache[char_id][amiibo_id] = {
            "trainer_name": p["trainer_name"],
            "trainer_id": p["trainer_id"],
            "amiibo_name": p["name"],
            "rating": p["rating"]
        }

    for char_id in updated_chars:
        amiibos = ratings_cache[char_id]

        best_id = max(amiibos, key=lambda a: amiibos[a]["rating"])
        best = amiibos[best_id]

        cache[char_id]["rating_history"][match_date] = {
            "trainer_name": best["trainer_name"],
            "trainer_id": best["trainer_id"],
            "amiibo_name": best["amiibo_name"],
            "unique_amiibo_id": best_id,
            "rating": best["rating"]
        }



def save(cache, ruleset_id):
    base_dir = f"Data/{ruleset_id}/Rating_History"

    for char_id, data in cache.items():
        path = f"{base_dir}/{data['name']} Rating History.json"

        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)