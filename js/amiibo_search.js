// STARTER FUNCTION
//--------------------------------------------------------------------------------------------------------------------------------------------------------- 
window.onload = function () {
    nameSearchTool();
};





// UPDATE THE STORED AMIIBO ID AND REDIRECT TO THE STATS TOOL
//---------------------------------------------------------------------------------------------------------------------------------------------------------
function updateStatsSearch(new_id) {
    console.log('updated id');
    window.localStorage.setItem('saved_amiibo_id', new_id);
    window.location.href = "index.html";
}





// Queries all character names and IDs and pushed them into arrays
//---------------------------------------------------------------------------------------------------------------------------------------------------------
let all_characters = [];
async function get_all_characters() {
    const res = await fetch('Data/all_characters.json');
    const data = await res.json();

    return data;
}





// NAME SEARCH TOOL
//---------------------------------------------------------------------------------------------------------------------------------------------------------
const all_amiibo_data = [];

async function nameSearchTool() {
    // Getting ruleset
    let ruleset_id = window.localStorage.getItem("Global_Ruleset");

    all_characters = await get_all_characters();

    // Get data from api to be displayed    
    const res = await fetch(`Data/${ruleset_id}/leaderboard.json`);
    const data = await res.json();
    data.map(index => {
        all_amiibo_data.push({
            'trainer_name': index.user.twitch_user_name,
            'amiibo_name': index.name,
            'amiibo_id': index.id,
            'character_id': index.playable_character_id,
            'rating': index.rating,
            'matches': index.wins + index.losses,
            'overall_rank': 0,
            'character_rank': 0,
            'match_selection_status': index.match_selection_status
        });
    }
    );

    // Find overall ranks for every amiibo
    let overall_rank = 0;
    for (let i = 0; i < all_amiibo_data.length; i++) {
        if (all_amiibo_data[i].match_selection_status != 'INACTIVE') {
            overall_rank++;
            all_amiibo_data[i].overall_rank = overall_rank;
        }
    }

    // Find character ranks for every amiibo
    for (let i = 0; i < all_characters.length; i++) {
        let character_rank = 1;
        for (let x = 0; x < all_amiibo_data.length; x++) {
            if (all_characters[i].id == all_amiibo_data[x].character_id && all_amiibo_data[x].match_selection_status != 'INACTIVE') {
                all_amiibo_data[x].character_rank = character_rank;
                character_rank++;
            }
        }
    }

    nameSearchBar();
}





//                                                              NAME SEARCH TOOL SEARCH BAR FUNCTION
//---------------------------------------------------------------------------------------------------------------------------------------------------------
function nameSearchBar() {

    // Get keyboard input
    let input = document.getElementById('search_amiibo_name');
    let filter = input.value.toUpperCase();
    let username_input = document.getElementById('search_trainer_name');
    let username_filter = username_input.value.toUpperCase();

    let content = document.getElementById('amiibo_list');
    let list = '<div class="flex_list_container">';
    let amiibo_count = 0;
    let status = 'no status';
    let characterIcon = 'no icon';


    all_amiibo_data.map(index => {
        if (((index.amiibo_name).toUpperCase().indexOf(filter) > -1) && ((index.trainer_name).toUpperCase().indexOf(username_filter) > -1)) {
            amiibo_count++;
            status = 'reset';
            characterIcon = 'Blank Icon.png';

            if (index.match_selection_status == 'ACTIVE') { status = 'ACTIVE'; }
            if (index.match_selection_status == 'STANDBY') { status = 'STANDBY'; }
            if (index.match_selection_status == 'INACTIVE') { status = 'INACTIVE'; }

            // Match current character with icon
            characterIcon = `${all_characters[index.character_id]}.png`

            // Put image onto the listed item when amiibots is fixed
            list += (
                `<div class="list_item ${status}" id="list_item_searchable" onclick="updateStatsSearch('${index.amiibo_id}'), addAmiiboToSearchHistory('${index.trainer_name}', '${index.amiibo_name}', '${index.amiibo_id}', '${index.character_id}', '${window.localStorage.getItem("Global_Ruleset")}', '${new Date()}')">

                <img src="./images/${characterIcon}" class="list_image">

                <div class="list_stats_grid_container">
                    <div class="list_stats amiibo_trainer_name_title">
                        <h2>${index.trainer_name}</h2>
                        <h1>${index.amiibo_name}</h1>
                    </div>
                </div>

                <div class="list_stats_container">
                    <div class="list_stats">
                        <h2>Rating:</h2>
                        <h1>${index.rating.toFixed(2)}</h1>
                    </div>

                    <div class="list_stats">
                        <h2>Matches:</h2>
                        <h1>${index.matches}</h1>
                    </div>

                    <div class="list_stats">
                        <h2>Rank (Overall):</h2>
                        <h1>${index.overall_rank}</h1>
                    </div>

                    <div class="list_stats">
                        <h2>Rank (Character):</h2>
                        <h1>${index.character_rank}</h1>
                    </div>

                    <div class="list_stats mobile_remove">
                        <h2>Status:</h2>   
                        <h1>${index.match_selection_status}</h1>
                    </div>

                </div>

            </div>`
            );
        }
    });
    list += "</div>";
    content.innerHTML = list;

    document.getElementById('amiibo_count').innerText = (`Amiibo found: ${amiibo_count}`);


}