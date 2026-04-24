let all_characters = {};
let all_trainer_data = [];
let ruleset_id = null;



// GET ALL TRAINERS AND THEIR AMIIBO AND GIVE THEM A SCORE BASED ON AMIIBO RANKS
//--------------------------------------------------------------------------------------------------------------------------------------------------------- 
async function main() {
    const res = await fetch('Data/all_characters.json');
    const data = await res.json();
    all_characters = data;

    // Getting ruleset
    ruleset_id = window.localStorage.getItem("Global_Ruleset");
    console.log('Ruleset: ', ruleset_id);

    // get all amiibo
    async function get_all_amiibo() {
        const res = await fetch(`Data/${ruleset_id}/leaderboard.json`);
        const file = await res.json();
        const data = file.filter(index => index.match_selection_status !== "INACTIVE");

        console.log(data);
        return data;
    }
    const all_amiibo = await get_all_amiibo();

    // Assign rank to each amiibo based on character
    Object.keys(all_characters).map(id => {
        let rank = 1;
        all_amiibo.map(amiibo => {
            if (amiibo.playable_character_id == id) {
                amiibo.character_rank = rank;
                rank++;
            }
        });
    });

    // get all unique trainers
    const unique_trainers = [];
    all_amiibo.map(index => {
        if (!unique_trainers.some(trainer => trainer.id == index.user.id)) {
            unique_trainers.push({
                name: index.user.twitch_user_name,
                id: index.user.id
            });
        }
    });

    // create an object for each trainer with their amiibo 
    unique_trainers.map(trainer => {

        const trainer_data = {
            name: trainer.name,
            id: trainer.id,
            amiibo: []
        };

        const trainer_amiibo = [];

        all_amiibo.map(index => {
            if (trainer.id == index.user.id && index.character_rank <= 10) {
                trainer_amiibo.push({
                    name: index.name,
                    id: index.id,
                    character_rank: index.character_rank,
                    character: index.playable_character_id,
                    selection_status: index.match_selection_status
                })
            }
        });

        // Sort arrays
        trainer_amiibo.sort(function (a, b) {
            return ((a.character_rank < b.character_rank) ? -1 : ((a.character_rank == b.character_rank)) ? 0 : 1);
        });

        trainer_amiibo.map(amiibo => {
            if (!trainer_data.amiibo.some(highest_character => highest_character.character == amiibo.character)) {
                amiibo.highest = true;
                trainer_data.amiibo.push(amiibo);
            } else {
                amiibo.highest = false;
                trainer_data.amiibo.push(amiibo);
            }
        });

        all_trainer_data.push(trainer_data);
    });

    // Get the points assigned to each place
    async function get_points() {
        const url = `./points_system.json`;
        const query = await fetch(url);
        const data = await query.json();

        console.log("Got points system");
        return data;
    }
    const points_system = await get_points();

    // Give trainers their score
    all_trainer_data.map(trainer => {
        let trainer_score = 0;

        trainer.amiibo.map(amiibo => {
            if (amiibo.highest == true) {
                trainer_score += points_system[amiibo.character_rank];
            } else {
                trainer_score += 1;
            }

        });

        trainer.trainer_score = trainer_score;
    });

    // Sort arrays
    all_trainer_data.sort((a, b) => b.trainer_score - a.trainer_score);

    // Rank trainers
    let rank = 1;
    let previousScore = null;

    all_trainer_data.forEach((trainer, index) => {
        if (previousScore === trainer.trainer_score) {
            trainer.rank = rank;
        } else {
            previousScore = trainer.trainer_score;
            rank = index + 1;
            trainer.rank = rank;
        }
    });

    console.log("🚀 ~ main ~ all_trainer_data:", all_trainer_data);

    await printCharacterLeaderboard();
}
main();



// DISPLAY ALL TRAINERS WITH A SCORE ONTO THE DOM
//--------------------------------------------------------------------------------------------------------------------------------------------------------- 
async function printCharacterLeaderboard() {

    let content = document.getElementById('leaderboard');
    let list = '<div class="list_item_container">';

    let username_input = document.getElementById('trainer_name');
    let username_filter = username_input.value.toUpperCase();

    for (let i = 0; i < all_trainer_data.length; i++) {

        if (all_trainer_data[i].amiibo.length > 0 && all_trainer_data[i].name.toUpperCase().indexOf(username_filter) > -1) {
            // display character icons with their rank
            let dropdown_list = '<div class="tier_list_container" style="gap: 0px;">';
            for (let x = 0; x < all_trainer_data[i].amiibo.length; x++) {

                Object.entries(all_characters).forEach(([id, name]) => {
                    if (id == all_trainer_data[i].amiibo[x].character && all_trainer_data[i].amiibo[x].highest == true) {

                        dropdown_list += (
                            `<div class="tier_list_item" onclick="clickListItem('${id}', '${ruleset_id}')">
                                <img src="images/${name}.png" class="tier_list_image">
                                <div class="tier_list_text_box">
                                    <p class="tier_list_text">${all_trainer_data[i].amiibo[x].character_rank}</p>
                                </div>
                            </div>`
                        );

                    }
                });
            }
            dropdown_list += "</div>";

            // display trainer name and relavent info
            let uniqueAmiibo = 0;
            all_trainer_data[i].amiibo.map(amiibo => {
                if (amiibo.highest == true) {
                    uniqueAmiibo++;
                }
            });

            list += (
                `<div class="INACTIVE" style="width: 100%;">
                <div class="list_item" id="list_item_searchable">
                    <div class="list_stats_container" onclick="updateTrainerStatsTrainerID('${all_trainer_data[i].id}');">
                        <div class="list_stats">
                            <h1>${all_trainer_data[i].rank}. ${all_trainer_data[i].name}</h1>
                        </div>

                        <div class="list_stats">
                            <h2>Score:</h2>
                            <h1>${all_trainer_data[i].trainer_score} pts</h1>
                        </div>

                        <div class="list_stats">
                            <h2>Leaderboard Amiibo:</h2>
                            <h1>${all_trainer_data[i].amiibo.length}</h1>
                        </div>
                    </div>
                </div>

                <div class="trainer_rank_unique_amiibo" style="padding: 1rem; padding-top: 0;">
                    <h3>Highest Unique Characters (${uniqueAmiibo}):</h3>
                    <div>${dropdown_list}</div>
                </div>
            </div>`
            );
        }
    }

    list += "</div>";
    content.innerHTML = list;
}





// CLICKABLE AMIIBO ICONS
//--------------------------------------------------------------------------------------------------------------------------------------------------------- 
async function clickListItem(id, ruleset_id) {
    window.open(`https://www.amiibots.com/leaderboard?characterId=${id}&rulesetId=${ruleset_id}`);
}





// UPDATE TRAINER ID IN TRAINER STATS
//--------------------------------------------------------------------------------------------------------------------------------------------------------- 
async function updateTrainerStatsTrainerID(trainerID) {
    async function setStorage() {
        localStorage.setItem('trainer_stats_trainer_id', trainerID);
        localStorage.setItem('trainer_stats_ruleset_id', ruleset_id);
    }
    await setStorage();

    window.location.href = "../trainer_stats.html";
}