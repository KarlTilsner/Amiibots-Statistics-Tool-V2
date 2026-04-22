import os
import json



def load(ruleset_id):
    base_dir = f"Data/{ruleset_id}/Trainers"
    os.makedirs(base_dir, exist_ok=True)

    cache = {}

    for file in os.listdir(base_dir):
        if file.endswith(".json"):
            path = os.path.join(base_dir, file)
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
                cache[data["trainer_id"]] = data

    return cache



def update(match, cache):
    for player in ["fp1", "fp2"]:
        p = match[player]

        trainer_id = p["trainer_id"]
        amiibo_id = p["id"]

        if trainer_id not in cache:
            cache[trainer_id] = {
                "trainer_id": trainer_id,
                "trainer_name": p["trainer_name"],
                "amiibo": {}
            }

        trainer = cache[trainer_id]

        # Add/update amiibo
        trainer["amiibo"][amiibo_id] = {
            "name": p["name"],
            "character_id": p["character_id"]
        }



def save(cache, ruleset_id):
    base_dir = f"Data/{ruleset_id}/Trainers"

    for trainer_id, data in cache.items():
        path = f"{base_dir}/{trainer_id}.json"
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)