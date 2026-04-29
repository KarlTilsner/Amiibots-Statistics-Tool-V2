from concurrent.futures import ThreadPoolExecutor
import json, os



def load_file(path):
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # ensure dirty flag exists (if this is set to true the file has been changed)
    data["_dirty"] = False
    return data



def load_parallel(ruleset_id):
    base_dir = f"Data/{ruleset_id}/Amiibo"
    os.makedirs(base_dir, exist_ok=True)

    files = [
        os.path.join(base_dir, f)
        for f in os.listdir(base_dir)
        if f.endswith(".json")
    ]

    all_amiibo_cache = {}
    rating_history_cache = {}

    with ThreadPoolExecutor(max_workers=8) as executor:
        for data in executor.map(load_file, files):
            amiibo_id = data["id"]
            char_id = data["character_id"]

            all_amiibo_cache[amiibo_id] = data

            matches = data.get("matches")
            if not matches:
                continue

            latest_key = next(reversed(matches))
            latest = matches[latest_key]

            rating_history_cache.setdefault(char_id, {})[amiibo_id] = {
                "trainer_name": data["trainer_name"],
                "trainer_id": data["trainer_id"],
                "amiibo_name": data["name"],
                "rating": latest["this_amiibo"]["rating"]
            }

    return all_amiibo_cache, rating_history_cache



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
                "matches": {},
                "_dirty": True  # NEW
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
        amiibo_data["_dirty"] = True

        # Update name if changed
        if amiibo_data["name"] != p["name"]:
            amiibo_data["name"] = p["name"]
            amiibo_data["_dirty"] = True



def _write_file(args):
    path, data = args

    # remove internal field before saving
    data_to_save = {k: v for k, v in data.items() if k != "_dirty"}

    with open(path, "w", encoding="utf-8") as f:
        json.dump(data_to_save, f, indent=2, ensure_ascii=False)



def save(cache, ruleset_id):
    base_dir = f"Data/{ruleset_id}/Amiibo"
    os.makedirs(base_dir, exist_ok=True)

    tasks = [
        (f"{base_dir}/{amiibo_id}.json", data)
        for amiibo_id, data in cache.items()
        if data.get("_dirty")
    ]

    if not tasks:
        print("No amiibo changes to save")
        return

    print(f"Saving {len(tasks)} updated amiibo...")

    with ThreadPoolExecutor(max_workers=8) as executor:
        executor.map(_write_file, tasks)

    # reset dirty flags
    for _, data in cache.items():
        if data.get("_dirty"):
            data["_dirty"] = False