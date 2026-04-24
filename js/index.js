// STARTER FUNCTION
//---------------------------------------------------------------------------------------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', function () {
    window.localStorage.setItem('SortType', 'sort_by_tierlist');
    highlightSortButton('sort_by_tierlist');
    amiiboStats();
});





// SAVE SEARCH BAR DATA
//---------------------------------------------------------------------------------------------------------------------------------------------------------
function searchMemory() {
    const amiibo_id = document.querySelector('#amiibo_id').value;
    window.localStorage.setItem('saved_amiibo_id', amiibo_id);
}





// UPDATE THE STORED AMIIBO ID AND REDIRECT TO THE STATS TOOL
//---------------------------------------------------------------------------------------------------------------------------------------------------------
function updateStatsSearch(new_id) {
    console.log('updated id');
    window.localStorage.setItem('saved_amiibo_id', new_id);
    window.location.href = "./index.html";
}





// GLOBAL VARIABLES
//---------------------------------------------------------------------------------------------------------------------------------------------------------
// Data for rating history chart
const xAxis_game_count = [];

// Data for matchup chart
let matchups_tierlist_order = [];
let matchups_won = [];
let matchups_lost = [];
let matchups_winrate = [];
let matchups_sort_winrate = [];
let matchups_encounters = [];

// Chart Theme Colours
const primary_background_colour = 'rgba(255, 99, 132, 0.2)';      // red
const primary_border_colour = 'rgba(255, 99, 132, 1)';        // red
const secondary_background_colour = 'rgba(170, 200, 100, 0.2)';     // green
const secondary_border_colour = 'rgba(170, 200, 100, 1)';       // green
const tertiary_background_colour = 'rgba(0, 170, 240, 0.2)'        // blue
const tertiary_border_colour = 'rgba(0, 170, 240, 1)'          // blue
const quaternary_background_colour = 'rgba(255, 170, 0, 0.2)'        // orange
const quaternary_border_colour = 'rgba(255, 170, 0, 1)'          // orange





// Queries all character names and IDs and loads them into an object
//---------------------------------------------------------------------------------------------------------------------------------------------------------
let all_characters = [];
async function get_all_characters() {
    const query = await fetch("../Data/all_characters.json");
    const response = await query.json();
    Object.entries(response).forEach(([id, name]) => {
        all_characters.push({
            "name": name,
            "id": id
        });
    });
}





// HANDLES QUICK STATS, RATING HISTORY, CHARACTER MATCHUPS, AND MATCH HISTORY
//---------------------------------------------------------------------------------------------------------------------------------------------------------
async function amiiboStats() {
    await get_all_characters();

    // Read the ID submitted in the text box and put it into LocalStorage for later
    const amiibo_id = window.localStorage.getItem('saved_amiibo_id');
    let trainer_name = null;
    let amiibo_name = null;
    let amiibo_ruleset = null;
    let character_id = null;
    let rating_mu = null;

    // Storage for each part of the tool
    const all_matches_data = []; // stores all matches for the specified character
    let ratingHistory = []; // stores graph data for rating history and highest rating

    // Destroy the page if ben searches his amiibo
    if (amiibo_id == '26680dc4-8cbd-4de5-ab92-f6e018f63f73') {
        const rollBen = Math.floor(Math.random() * 10) + 1;
        console.log(rollBen);
        if (rollBen == 7) {
            window.location.href = "https://www.youtube.com/watch?v=dQw4w9WgXcQ&ab_channel=RickAstley";
        }
    }





    // EXTRACTS ALL RELAVENT DATA FOR EACH TOOL
    //---------------------------------------------------------------------------------------------------------------------------------------------------------

    // Get rulesets
    const ruleset_file = await fetch("../Data/rulesets.json");
    const rulesets = await ruleset_file.json();

    // Fetch all possible files
    let ruleset_id = null;
    const responses = await Promise.all(
        rulesets.map(async (r) => {
            const res = await fetch(`../Data/${r.id}/Amiibo/${amiibo_id}.json`);

            if (!res.ok) return null;

            if (res.ok) ruleset_id = r.id;

            return await res.json();
        })
    );

    // Remove failed fetches
    const response = responses.filter(Boolean)[0];

    Object.entries(response.matches).forEach(([date, match]) => {
        match.created_at = date;
        all_matches_data.push(match);
    });

    // Sort by date
    all_matches_data.sort((a, b) => b.created_at.localeCompare(a.created_at));

    const latest_match_date = Object.keys(response.matches).reduce((max, key) =>
        key > max ? key : max
    );

    let highest_rating = [{
        "highest_rating": 0,
        "match": 0
    }];

    async function extractMatchData() {
        let matchCount = 0;

        // This will delete all elements on the page and produce an error message if the amiibo has no games
        try {
            matchCount = Object.values(response.matches).length;
            amiibo_ruleset = ruleset_id;
        } catch (error) {
            const elementsToRemove = document.querySelectorAll('#remove_child_if_no_matches');
            elementsToRemove.forEach(element => {
                element.remove();
            });
            document.querySelector('main').innerHTML += '<h1 class="container" style="text-align: center;">AMIIBO HAS NO DATA</h1>';
        }

        // Get latest trainer name and rating_mu
        trainer_name = response.trainer_name;
        rating_mu = response.matches[latest_match_date].this_amiibo.rating_mu;

        // Take data from the API and store it into the correct objects
        const file = Object.values(all_matches_data).map(
            async function (index) {
                // Data for rating history
                amiibo_name = response.name;

                if (index.this_amiibo.rating > highest_rating[0].highest_rating) {
                    highest_rating = [{
                        "highest_rating": index.this_amiibo.rating,
                        "match": matchCount
                    }];
                }

                ratingHistory.push({
                    "rating_history": (index.this_amiibo.rating).toFixed(2),
                    "highest_rating": 0,
                    "rating_sigma": (index.this_amiibo.rating_sigma).toFixed(2),
                    "rating_mu": (index.this_amiibo.rating_mu).toFixed(2),
                    "match": matchCount
                });

                // increase this to record what match we are on
                matchCount--;
            }
        );
    }
    await extractMatchData();





    // RATING HISTORY CODE
    //---------------------------------------------------------------------------------------------------------------------------------------------------------
    async function processAmiiboStats() {
        // Push initial stats of the amiibo for rating history
        character_id = response.character_id;
        ratingHistory.push({
            "rating_history": 0,
            "highest_rating": 0,
            "rating_sigma": 8.33,
            "rating_mu": 25,
            "match": 0
        });


        // Reverse the order of the rating history and update the highest rating in the data structure
        let temp = [];
        for (let i = ratingHistory.length - 1; i >= 0; i--) {
            if (ratingHistory[i].match == highest_rating[0].match) {
                ratingHistory[i].highest_rating = (highest_rating[0].highest_rating).toFixed(2);
            }
            temp.push(ratingHistory[i]);
        }
        ratingHistory = temp;
    }
    await processAmiiboStats();


    // Manages datasets for the rating history chart
    async function ratingHistoryDatasets() {
        const datasets = [];
        let newDataset;

        // Push match count into array for chart
        for (let i = 0; i < ratingHistory.length; i++) {
            xAxis_game_count.push(ratingHistory[i].match);
        }

        // Push rating history
        const ratingHistory_rating = [];
        for (let i = 0; i < ratingHistory.length; i++) {
            ratingHistory_rating.push(Number(ratingHistory[i].rating_history));
        }

        // Push highest rating
        const ratingHistory_highestRating = [];
        for (let i = 0; i < ratingHistory.length; i++) {
            ratingHistory_highestRating.push(ratingHistory[i].highest_rating);
        }

        // Push rating sigma
        const ratingHistory_ratingSigma = [];
        for (let i = 0; i < ratingHistory.length; i++) {
            ratingHistory_ratingSigma.push(ratingHistory[i].rating_sigma);
        }

        // Push rating mu
        const ratingHistory_rating_mu = [];
        for (let i = 0; i < ratingHistory.length; i++) {
            ratingHistory_rating_mu.push(ratingHistory[i].rating_mu);
        }

        // Create and push datasets
        newDataset = {
            label: 'Rating History',
            data: ratingHistory_rating,
            backgroundColor: primary_background_colour,
            borderColor: primary_border_colour,
            fill: true,
            borderWidth: 1,
            pointRadius: 1,
            pointHoverRadius: 1,
        };
        datasets.push(newDataset);
        newDataset = {};

        const barWidth = ((xAxis_game_count.length) / 100) * 0.35;
        newDataset = {
            label: `Highest Rating`,
            data: ratingHistory_highestRating,
            backgroundColor: secondary_background_colour,
            borderColor: secondary_border_colour,
            fill: true,
            borderWidth: 2,
            barPercentage: barWidth,
            type: 'bar',
        };
        datasets.push(newDataset);
        newDataset = {};

        newDataset = {
            label: 'Rating Sigma',
            data: ratingHistory_ratingSigma,
            borderColor: quaternary_border_colour,
            fill: true,
            borderWidth: 1,
            pointRadius: 1,
            pointHoverRadius: 1,
        };
        datasets.push(newDataset);
        newDataset = {};

        newDataset = {
            label: 'Rating mu',
            data: ratingHistory_rating_mu,
            borderColor: tertiary_border_colour,
            fill: true,
            borderWidth: 1,
            pointRadius: 1,
            pointHoverRadius: 1,
        };
        datasets.push(newDataset);
        newDataset = {};

        drawRatingHistory(datasets);
    }
    await ratingHistoryDatasets();





    // MINI LEADERBOARD, AMIIBO RANK, AND OPPONENT FREQUENCY CODE
    //---------------------------------------------------------------------------------------------------------------------------------------------------------
    const rank_worker = new Worker('./js/worker_index_rank.js');

    const worker_message = {
        amiibo_id: amiibo_id,
        amiibo_ruleset: amiibo_ruleset,
        character_id: character_id,
        rating_mu: rating_mu
    }

    rank_worker.postMessage(worker_message);

    // Update DOM elements whenever this information gets back
    rank_worker.onmessage = function (amiibo_rank_data) {

        const overall_leaderboard = amiibo_rank_data.data.overall_leaderboard;
        const character_leaderboard = amiibo_rank_data.data.character_leaderboard;

        function printOverallLeaderboard() {
            // Print every amiibo onto the screen
            let content = document.getElementById('overall_rank_mini_leaderboard');
            let list = '<div class="list_item_container">';

            for (let i = 0; i < overall_leaderboard.length; i++) {
                for (let x = 0; x < all_characters.length; x++) {
                    let characterIcon = 0;

                    if (all_characters[x].id == overall_leaderboard[i].character_id) {

                        // Match current character with icon
                        characterIcon = (`${all_characters[x].name}.png`);

                        // Put image onto the listed item when amiibots is fixed
                        list += (
                            `<div class="list_item ${overall_leaderboard[i].character_highlight}" id="list_item_searchable" onclick="updateStatsSearch('${overall_leaderboard[i].amiibo_id}'), addAmiiboToSearchHistory('${overall_leaderboard[i].trainer_name}', '${overall_leaderboard[i].amiibo_name}', '${overall_leaderboard[i].amiibo_id}', '${overall_leaderboard[i].character_id}', '${amiibo_ruleset}', '${new Date()}')">

                            <img src="./images/${characterIcon}" class="list_image">

                            <div class="list_stats_grid_container">
                                <div class="list_stats amiibo_trainer_name_title">
                                    <h2>${overall_leaderboard[i].trainer_name}</h2>
                                    <h1>${overall_leaderboard[i].amiibo_name}</h1>
                                </div>
                            </div>

                            <div class="list_stats_container">
                                <div class="list_stats">
                                    <h2>Rating:</h2>
                                    <h1>${overall_leaderboard[i].rating.toFixed(2)}</h1>
                                </div>

                                <div class="list_stats mobile_remove">
                                    <h2>Rating Diff:</h2>
                                    <h1>${Math.abs(overall_leaderboard[i].rating_difference).toFixed(2)}</h1>
                                </div>

                                <div class="list_stats">
                                    <h2>Rank:</h2>   
                                    <h1>${overall_leaderboard[i].rank}</h1>
                                </div>
                            </div>

                        </div>`
                        );
                    }
                }
            }
            list += "</div>";
            content.innerHTML = list;
        }
        printOverallLeaderboard();



        function printCharacterLeaderboard() {
            // Print every amiibo onto the screen
            let content = document.getElementById('character_rank_mini_leaderboard');
            let list = '<div class="list_item_container">';

            for (let i = 0; i < character_leaderboard.length; i++) {
                for (let x = 0; x < all_characters.length; x++) {
                    let characterIcon = 0;

                    if (all_characters[x].id == character_leaderboard[i].character_id) {

                        // Match current character with icon
                        characterIcon = (`${all_characters[x].name}.png`);

                        // Put image onto the listed item when amiibots is fixed
                        list += (
                            `<div class="list_item ${character_leaderboard[i].character_highlight}" id="list_item_searchable" onclick="updateStatsSearch('${character_leaderboard[i].amiibo_id}', addAmiiboToSearchHistory('${character_leaderboard[i].trainer_name}', '${character_leaderboard[i].amiibo_name}', '${character_leaderboard[i].amiibo_id}', '${character_leaderboard[i].character_id}', '${amiibo_ruleset}', '${new Date()}'))">
                            <img src="./images/${characterIcon}" class="list_image">

                            <div class="list_stats_grid_container">
                                <div class="list_stats amiibo_trainer_name_title">
                                    <h2>${character_leaderboard[i].trainer_name}</h2>
                                    <h1>${character_leaderboard[i].amiibo_name}</h1>
                                </div>
                            </div>

                            <div class="list_stats_container">
                                <div class="list_stats">
                                    <h2>Rating:</h2>
                                    <h1>${character_leaderboard[i].rating.toFixed(2)}</h1>
                                </div>

                                <div class="list_stats mobile_remove">
                                    <h2>Rating Diff:</h2>
                                    <h1>${Math.abs(character_leaderboard[i].rating_difference).toFixed(2)}</h1>
                                </div>

                                <div class="list_stats">
                                    <h2>Rank:</h2>   
                                    <h1>${character_leaderboard[i].rank}</h1>
                                </div>
                            </div>

                        </div>`
                        );
                    }
                }
            }
            list += "</div>";
            content.innerHTML = list;
        }
        printCharacterLeaderboard();



        function prinOpponentFrequency() {
            const opponent_frequency_data = amiibo_rank_data.data.opponent_frequency;
            opponent_frequency_data.sort((a, b) => b.rating_mu - a.rating_mu);

            const opponent_frequency = [];

            // count up the number of each character within matchup range and collect all possible opponents sorted by character
            all_characters.map(character => {
                let frequency = 0;
                const temp = [];
                opponent_frequency_data.map(opponent => {
                    if (character.id == opponent.playable_character_id && amiibo_id != opponent.id) {
                        frequency++;
                        temp.push(opponent);
                    }
                });

                // Store the frequency of the opponent and data of surrounding opponents
                const opponent = {
                    name: character.name,
                    id: character.id,
                    frequency: frequency,
                    data: temp
                }
                opponent_frequency.push(opponent);
            });
            document.getElementById('surrounding_amiibo_title').innerText = `Surrounding Amiibo: ${opponent_frequency_data.length - 1}`;

            // Sort arrays
            opponent_frequency.sort((a, b) => b.frequency - a.frequency);

            console.log(opponent_frequency);

            // Display all surrounding amiibo and their frequency
            let content = document.getElementById('opponent_frequency_graph');
            opponent_frequency.map(opponent => {
                if (opponent.frequency > 0) {
                    content.innerHTML += (
                        `<div class="tier_list_item" onclick="displaySurroundingOpponents('${opponent.id}')">
                            <img src="images/${opponent.name}.png" class="tier_list_image">

                            <div class="surrounding_amiibo_text_box">
                                <p class="tier_list_text">${opponent.frequency}</p>
                                <p class="tier_list_text">${(opponent.frequency / (opponent_frequency_data.length - 1) * 100).toFixed(2)}%</p>
                            </div>
                        </div>`
                    );
                }
            });


            // Create divs for all surrounding opponents
            content = document.getElementById('surrounding_amiibo');
            let list = `<div class="flex_list_container">`;
            opponent_frequency.map(opponent => {

                if (opponent.frequency > 0) {
                    list += `<div class="flex_list_container" id="${opponent.id}" style="display: none;">`;
                    opponent.data.map(index => {
                        list += (
                            `<div class="list_item ${index.match_selection_status}" id="list_item_searchable" onclick="updateStatsSearch('${index.id}', addAmiiboToSearchHistory('${index.user.twitch_user_name}', '${index.name}', '${index.id}', '${index.playable_character_id}', '${amiibo_ruleset}', '${new Date()}'))">
                                <img src="./images/${opponent.name}.png" class="list_image">
    
                                <div class="list_stats_grid_container">
                                    <div class="list_stats amiibo_trainer_name_title">
                                        <h2>${index.user.twitch_user_name}</h2>
                                        <h1>${index.name}</h1>
                                    </div>
                                </div>
    
                                <div class="list_stats_container">
                                    <div class="list_stats">
                                        <h2>Rating_mu:</h2>
                                        <h1>${index.rating_mu.toFixed(2)}</h1>
                                    </div>
    
                                    <div class="list_stats">
                                        <h2>Matches:</h2>   
                                        <h1>${index.total_matches}</h1>
                                    </div>
    
                                    <div class="list_stats">
                                        <h2>Status:</h2>   
                                        <h1>${index.match_selection_status}</h1>
                                    </div>
                                </div>
    
                            </div>`
                        );
                    });
                    list += `</div>`;
                }

            });
            list += `</div>`;
            content.innerHTML = list;

        }
        prinOpponentFrequency();
    }





    // AMIIBO MATCHUPS CODE
    //---------------------------------------------------------------------------------------------------------------------------------------------------------
    const matchups_worker = new Worker('./js/worker_index_matchups.js');

    const matchups_worker_message = {
        "amiibo_id": amiibo_id,
        "amiibo_ruleset": amiibo_ruleset,
        "character_id": character_id,
        "all_matches_data": all_matches_data
    };

    matchups_worker.postMessage(matchups_worker_message);

    // Update DOM elements whenever this information gets back
    matchups_worker.onmessage = function (matchups_data) {
        const graph_height = ((matchups_data.data.matchups_winrate.length * 20) + 200);
        document.getElementById('matchups').setAttribute("style", `height:${graph_height}px`);

        matchups_won = matchups_data.data.matchups_won;
        matchups_lost = matchups_data.data.matchups_lost;
        matchups_winrate = matchups_data.data.matchups_winrate;
        matchups_tierlist_order = matchups_data.data.matchups_tierlist_order;
        matchups_sort_winrate = matchups_data.data.matchups_sort_winrate;
        matchups_encounters = matchups_data.data.matchups_encounters;

        const datasets = [
            {
                label: `Wins`,
                data: matchups_data.data.matchups_won,
                backgroundColor: secondary_background_colour,
                borderColor: secondary_border_colour,
                fill: true,
                borderWidth: 1
            },
            {
                label: `Losses`,
                data: matchups_data.data.matchups_lost,
                backgroundColor: primary_background_colour,
                borderColor: primary_border_colour,
                fill: true,
                borderWidth: 1
            }
        ];

        highlightSortButton('sort_by_tierlist');
        drawMatchupChart(datasets);
    }





    // FULL MATCH HISTORY CODE
    //---------------------------------------------------------------------------------------------------------------------------------------------------------
    // 'your_rating': all_matches_data[i].winner_info.rating,

    function fullMatchHistory() {
        // Sort opponent match data for the match card
        const full_match_history = [];
        for (let i = 0; i < all_matches_data.length; i++) {

            let match_win = null
            if (all_matches_data[i].this_amiibo.result == "win") { match_win = true } else match_win = false;

            full_match_history.push({
                'character_id': all_matches_data[i].opponent.character_id,
                'opponent_id': all_matches_data[i].opponent.id,
                'name': all_matches_data[i].opponent.name,
                'trainer_name': all_matches_data[i].opponent.trainer_name,

                'opponent_rating': all_matches_data[i].opponent.rating,
                'your_rating': all_matches_data[i].this_amiibo.rating,

                'match_number': all_matches_data.length - i,
                'match_win': match_win,
            });
        }

        // Get longest winstreak
        let LongestWinstreak = 0;
        let currentWinstreak = 0;
        for (let i = 0; i < full_match_history.length; i++) {
            if (full_match_history[i].match_win == true) {
                currentWinstreak++;
                if (currentWinstreak > LongestWinstreak) {
                    LongestWinstreak = currentWinstreak;
                }
            } else currentWinstreak = 0;

        }

        document.getElementById('amiibo_longest_winstreak').innerText += ` ${LongestWinstreak}`;

        // Fix any null values
        for (let i = 0; i < full_match_history.length; i++) {
            if (full_match_history[i].your_rating == null) {
                full_match_history[i].your_rating = 0;
            }

            if (full_match_history[i].opponent_rating == null) {
                full_match_history[i].opponent_rating = 0;
            }
        }


        // List all matches onto page
        let content = document.getElementById('amiibo_list');
        let list = '<div class="flex_list_container">';
        for (let i = 0; i < full_match_history.length; i++) {

            // Match current character with icon
            let characterIcon = 'Blank Icon.png';
            for (let x = 0; x < all_characters.length; x++) {
                if (all_characters[x].id == full_match_history[i].character_id) {
                    characterIcon = (`${all_characters[x].name}.png`)
                }
            }

            if (amiibo_id == '26680dc4-8cbd-4de5-ab92-f6e018f63f73') {
                // Broken code for ben
                list += (
                    `<div class="list_item_short match_win_${full_match_history[i].match_win}" id="list_item_searchable">
                        <img src="images/${characterIcon}" class="list_image">
                        <div class="list_stats">
                            <i>Trainer Name:</i>        <b>${full_match_history[i].trainer_name}</b> </br>
                            <i>Amiibo Name:</i>         <b>${full_match_history[i].name}</b> </br>
                            <i>Opponent Rating:</i>     ${(full_match_history[i].opponent_rating).toFixed(2)} </br>
                            <i>Your Rating Change</i>   ${full_match_history[i].rating_change} </br>
                        </div>
                    </div>`
                );
            } else {
                // Normal code for everyone else
                list += (
                    `<div class="list_item match_win_${full_match_history[i].match_win}" id="list_item_searchable" onclick="updateStatsSearch('${full_match_history[i].opponent_id}', addAmiiboToSearchHistory('${full_match_history[i].trainer_name}', '${full_match_history[i].name}', '${full_match_history[i].opponent_id}', '${full_match_history[i].character_id}', '${amiibo_ruleset}', '${new Date()}'))">
                        <img src="./images/${characterIcon}" class="list_image">

                        <div class="list_stats_grid_container">
                            <div class="list_stats amiibo_trainer_name_title">
                                <h2>${full_match_history[i].trainer_name}</h2>
                                <h1>${full_match_history[i].name}</h1>
                            </div>
                        </div>

                        <div class="list_stats_container">
                            <div class="list_stats">
                                <h2>Opponent Rating:</h2>
                                <h1>${full_match_history[i].opponent_rating.toFixed(2)}</h1>
                            </div>

                            <div class="list_stats">
                                <h2>Your Rating:</h2>
                                <h1>${full_match_history[i].your_rating.toFixed(2)}</h1>
                            </div>

                            <div class="list_stats mobile_remove">
                                <h2>Match: ${full_match_history[i].match_number}</h2>
                            </div>
                        </div>

                    </div>`
                );
            }

        }
        list += "</div>";
        content.innerHTML = list;

    }
    fullMatchHistory();





    // Update DOM elements and charts to display data
    document.getElementById('rating_history_chart_title').innerText += ` ${amiibo_name}`;
    document.getElementById('matchup_chart_title').innerText += ` ${amiibo_name}`;
    document.getElementById('match_history').innerText = `${amiibo_name}'s ${document.getElementById('match_history').innerText}`;

    document.getElementById('amiibo_rating').innerText += ` ${ratingHistory[ratingHistory.length - 1].rating_history}`;
    document.getElementById('amiibo_highest_rating').innerText += ` ${highest_rating[0].highest_rating.toFixed(2)}`;
    document.getElementById('amiibo_rating_mu').innerText += ` ${ratingHistory[ratingHistory.length - 1].rating_mu}`;
    document.getElementById('amiibo_rating_sigma').innerText += ` ${ratingHistory[ratingHistory.length - 1].rating_sigma}`;

    addAmiiboToSearchHistory(`${trainer_name}`, `${amiibo_name}`, `${amiibo_id}`, `${character_id}`, `${amiibo_ruleset}`, `${new Date()}`);
}





// CREATE NEW CANVASES TO RENDER GRAPHS ON
//--------------------------------------------------------------------------------------------------------------------------------------------------------- 
function drawRatingHistory(datasets) {
    document.getElementById('rating_history').innerHTML = '<canvas id="rating_history_chart_canvas"></canvas>';
    RatingHistoryChart(datasets);
}

async function drawMatchupChart(datasets) {
    await document.getElementById('matchups_chart_canvas').remove();
    document.getElementById('matchups').innerHTML = '<canvas id="matchups_chart_canvas"></canvas>';
    characterMatchupChart(datasets);
}





// HIGHLIGHT SORT BUTTON
//--------------------------------------------------------------------------------------------------------------------------------------------------------- 
function highlightSortButton(button_id) {
    let sort_type = window.localStorage.getItem('SortType');
    document.getElementById(`${sort_type}`).removeAttribute("style", `background-color: rgba(220, 220, 220 , 0.3)`);

    document.getElementById(`${button_id}`).setAttribute("style", `background-color: rgba(220, 220, 220 , 0.3)`);
    window.localStorage.setItem('SortType', `${button_id}`);
}





// SORT MATCHUP CHART
//---------------------------------------------------------------------------------------------------------------------------------------------------------
function sortMatchupChartData(sortType) {
    if (sortType === 'tierlist') {
        // Sort array from lowest to highest
        // Combine arrays
        let combineSort = [];
        for (let i = 0; i < matchups_winrate.length; i++) {
            combineSort.push({
                'name': matchups_winrate[i],
                'lostTo': matchups_lost[i],
                'wonTo': matchups_won[i],
                'winRate': Number(matchups_sort_winrate[i]),
                'order': Number(matchups_tierlist_order[i]),
                'encounters': Number(matchups_encounters[i])
            });
        }

        // Sort arrays
        combineSort.sort(function (a, b) {
            return ((a.order < b.order) ? -1 : ((a.order == b.order)) ? 0 : 1);
        });

        // Seperate data into arrays
        for (let i = 0; i < combineSort.length; i++) {
            matchups_winrate[i] = combineSort[i].name;
            matchups_lost[i] = combineSort[i].lostTo;
            matchups_won[i] = combineSort[i].wonTo;
            matchups_sort_winrate[i] = Number(combineSort[i].winRate);
            matchups_tierlist_order[i] = Number(combineSort[i].order);
            matchups_encounters[i] = Number(combineSort[i].encounters);
        }

        console.log('Sorted by tierlist');
    }


    if (sortType === 'winRate') {
        // Sort array from lowest to highest
        // Combine arrays
        let combineSort = [];
        for (let i = 0; i < matchups_winrate.length; i++) {
            combineSort.push({
                'name': matchups_winrate[i],
                'lostTo': matchups_lost[i],
                'wonTo': matchups_won[i],
                'winRate': Number(matchups_sort_winrate[i]),
                'order': Number(matchups_tierlist_order[i]),
                'encounters': Number(matchups_encounters[i])
            });
        }

        // Sort arrays
        combineSort.sort(function (a, b) {
            return ((a.winRate > b.winRate) ? -1 : ((a.winRate == b.winRate)) ? 0 : 1);
        });

        // Seperate data into arrays
        for (let i = 0; i < combineSort.length; i++) {
            matchups_winrate[i] = combineSort[i].name;
            matchups_lost[i] = combineSort[i].lostTo;
            matchups_won[i] = combineSort[i].wonTo;
            matchups_sort_winrate[i] = Number(combineSort[i].winRate);
            matchups_tierlist_order[i] = Number(combineSort[i].order);
            matchups_encounters[i] = Number(combineSort[i].encounters);
        }

        console.log('Sorted by winrate');
    }


    if (sortType === 'numberOfEncounters') {
        // Sort array from lowest to highest
        // Combine arrays
        let combineSort = [];
        for (let i = 0; i < matchups_winrate.length; i++) {
            combineSort.push({
                'name': matchups_winrate[i],
                'lostTo': matchups_lost[i],
                'wonTo': matchups_won[i],
                'winRate': Number(matchups_sort_winrate[i]),
                'order': Number(matchups_tierlist_order[i]),
                'encounters': Number(matchups_encounters[i])
            });
        }

        // Sort arrays
        combineSort.sort(function (a, b) {
            return ((a.encounters > b.encounters) ? -1 : ((a.encounters == b.encounters)) ? 0 : 1);
        });

        // Seperate data into arrays
        for (let i = 0; i < combineSort.length; i++) {
            matchups_winrate[i] = combineSort[i].name;
            matchups_lost[i] = combineSort[i].lostTo;
            matchups_won[i] = combineSort[i].wonTo;
            matchups_sort_winrate[i] = Number(combineSort[i].winRate);
            matchups_tierlist_order[i] = Number(combineSort[i].order);
            matchups_encounters[i] = Number(combineSort[i].encounters);
        }

        console.log('Sorted by number of encounters');
    }


    const datasets = [
        {
            label: `Defeated`,
            data: matchups_won,
            backgroundColor: secondary_background_colour,
            borderColor: secondary_border_colour,
            fill: true,
            borderWidth: 1
        },
        {
            label: `Lost to`,
            data: matchups_lost,
            backgroundColor: primary_background_colour,
            borderColor: primary_border_colour,
            fill: true,
            borderWidth: 1
        }
    ];

    drawMatchupChart(datasets);
}





// Make hidden tab show all surrounding opponents for the selected character
function displaySurroundingOpponents(selected_character_id) {
    // Close any other character that may be open
    all_characters.map(character => {
        try {
            document.getElementById(character.id).style.display = "none";
        } catch (error) {
            console.log(error);
        }
    });

    // Open the selected character
    document.getElementById('surrounding_amiibo').style.display = "block";
    document.getElementById(selected_character_id).style.display = "flex";
}