window.onload = function () {
    trainerStats();
}



async function updateTrainerID() {
    const trainerID = document.getElementById('trainer_id').value;

    function isValidUUID(uuid) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
    }

    if (trainerID != '' && trainerID != null && isValidUUID(trainerID) == true || trainerID == 'None') {
        localStorage.setItem('trainer_stats_trainer_id', trainerID);
        location.reload();
    } else {
        alert("trainer_id can not be blank and must be a valid uuid string");
    }
}



async function getRulesets() {
    const res = await fetch('Data/rulesets.json');
    const data = await res.json();
    const nameById = Object.fromEntries(
        data.map(item => [item.id, item.name])
    );
    return nameById;
}



async function trainerStats() {
    const ruleset_names = await getRulesets();

    // Get ruleset_id to search for
    const ruleset_id = window.localStorage.getItem("Global_Ruleset");
    document.getElementById('status_ruleset_id').innerText = ruleset_names[ruleset_id];

    // Get trainer_id to search for
    async function getTrainerID() {
        if (localStorage.getItem('trainer_stats_trainer_id') != null) {
            return localStorage.getItem('trainer_stats_trainer_id');
        }

        alert("No 'trainer_id'. Please enter a trainer_id");
    }
    const trainerID = await getTrainerID();
    document.getElementById('status_trainer_id').innerText = trainerID;

    let all_characters = {};

    // Chart Theme Colours
    const primary_background_colour = 'rgba(255, 99, 132, 0.2)';      // red
    const primary_border_colour = 'rgba(255, 99, 132, 1)';        // red
    const secondary_background_colour = 'rgba(170, 200, 100, 0.2)';     // green
    const secondary_border_colour = 'rgba(170, 200, 100, 1)';       // green



    // ALL DATA CORRESPONDING TO THE /AMIIBO ENDPOINT
    //--------------------------------------------------------------------------------------------------------------------------------------------------------- 
    async function trainerRankStats() {

        let all_trainer_data = [];

        // get all character names and ids
        async function getCharacters() {
            const query = await fetch(`./Data/all_characters.json`);
            return await query.json();
        }

        all_characters = await getCharacters();

        // get all amiibo
        async function get_all_amiibo() {
            document.getElementById('status_all_amiibo').innerText = 'Searching';
            const query = await fetch(`./Data/${ruleset_id}/leaderboard.json`);
            const response = await query.json();

            // Filter all amiibo
            const all_amiibo_data = [];
            response.map(index => {
                if (index.match_selection_status != "INACTIVE") {
                    all_amiibo_data.push(index)
                }
            });

            // Filter trainer amiibo
            const trainer_amiibo_data = [];
            response.map(index => {
                if (index.user.id == trainerID) {
                    trainer_amiibo_data.push(index);
                }
            });

            return [all_amiibo_data, trainer_amiibo_data];
        }
        const [all_amiibo, trainer_amiibo] = await get_all_amiibo();

        if (trainer_amiibo.length == 0) {
            console.log(`Trainer '${trainerID}' has no valid Amiibo in '${ruleset_names[ruleset_id]}'`);
            document.getElementById('status_all_amiibo').innerText = `Failed: Trainer '${trainerID}' has no valid Amiibo in '${ruleset_names[ruleset_id]}'`;
            alert(`Trainer '${trainerID}' has no valid Amiibo in '${ruleset_names[ruleset_id]}'`);

            return false;
        } else document.getElementById('status_all_amiibo').innerText = 'Loading';

        // rank each amiibo
        Object.entries(all_characters).forEach(([id, name]) => {
            let rank = 1;
            all_amiibo.forEach(amiibo => {
                if (id == amiibo.playable_character_id) {
                    amiibo.character_rank = rank;
                    rank++
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

            const trainer_amiibo_temp = [];

            all_amiibo.map(index => {
                if (trainer.id == index.user.id && index.character_rank <= 10) {
                    trainer_amiibo_temp.push({
                        name: index.name,
                        id: index.id,
                        character_rank: index.character_rank,
                        character: index.playable_character_id,
                        selection_status: index.match_selection_status
                    })
                }
            });

            // Sort arrays
            trainer_amiibo_temp.sort(function (a, b) {
                return ((a.character_rank < b.character_rank) ? -1 : ((a.character_rank == b.character_rank)) ? 0 : 1);
            });

            trainer_amiibo_temp.map(amiibo => {
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
            const query = await fetch(`./points_system.json`);
            const data = await query.json();
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



        // DISPLAY ALL TRAINERS WITH A SCORE ONTO THE DOM
        //--------------------------------------------------------------------------------------------------------------------------------------------------------- 
        async function printCharacterLeaderboard() {

            let content = document.getElementById('trainer_rank_stats');
            let list = '<div class="list_item_container">';

            all_trainer_data.forEach(trainer => {
                if (trainer.amiibo.length > 0 && trainer.id == trainerID) {
                    // display character icons with their rank
                    let dropdown_list = '<div class="tier_list_container" style="gap: 0px;">';
                    trainer.amiibo.forEach(amiibo => {
                        Object.entries(all_characters).forEach(([id, name]) => {
                            if (id == amiibo.character && amiibo.highest == true) {
                                dropdown_list += (
                                    `<div class="tier_list_item" onclick="clickListItem('${id}', '${ruleset_id}')">
                                        <img src="images/${name}.png" class="tier_list_image">
                                        <div class="tier_list_text_box">
                                            <p class="tier_list_text">${amiibo.character_rank}</p>
                                        </div>
                                    </div>`
                                );
                            }
                        });
                    });

                    // display trainer name and relavent info
                    let uniqueAmiibo = 0;
                    trainer.amiibo.map(amiibo => {
                        if (amiibo.highest == true) {
                            uniqueAmiibo++;
                        }
                    });

                    list += (
                        `<div style="width: 100%;">
                        <div class="trainer_list_item" id="list_item_searchable">
                            <div class="list_stats_container">
                                <div class="list_stats">
                                    <h1>${trainer.rank}. ${trainer.name}</h1>
                                </div>

                                <div class="list_stats">
                                    <h2>Score:</h2>
                                    <h1>${trainer.trainer_score} pts</h1>
                                </div>

                                <div class="list_stats">
                                    <h2>Leaderboard Amiibo:</h2>
                                    <h1>${trainer.amiibo.length}</h1>
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
            });

            list += "</div>";
            content.innerHTML = list;
            document.getElementById('status_all_amiibo').innerText = 'Done';
            removeStatusTab();
        }

        await printCharacterLeaderboard();



        // DISPLAY ALL OF A TRAINERS VALID AMIIBO
        //---------------------------------------------------------------------------------------------------------------------------------------------------------
        async function printValidTrainerAmiibo() {
            let content = document.getElementById('trainer_amiibo_list');
            let list = '<div class="flex_list_container">';
            let status = 'no status';
            let characterIcon = 'no icon';

            trainer_amiibo.map(index => {
                status = 'reset';

                if (index.match_selection_status == 'ACTIVE') { status = 'ACTIVE'; }
                if (index.match_selection_status == 'STANDBY') { status = 'STANDBY'; }
                if (index.match_selection_status == 'INACTIVE') {
                    status = 'INACTIVE';
                    index.character_rank = 'None';
                }

                // Put image onto the listed item when amiibots is fixed
                list += (
                    `<div class="list_item ${status}" id="list_item_searchable" onclick="updateStatsSearch('${index.id}'), addAmiiboToSearchHistory('${index.user.twitch_user_name}', '${index.name}', '${index.id}', '${index.playable_character_id}', '${window.localStorage.getItem("Global_Ruleset")}', '${new Date()}')">

                    <img src="./images/${all_characters[index.playable_character_id]}.png" class="list_image">

                    <div class="list_stats_grid_container">
                        <div class="list_stats amiibo_trainer_name_title">
                            <h1>${index.name}</h1>
                        </div>
                    </div>

                    <div class="list_stats_container">
                        <div class="list_stats">
                            <h2>Rating:</h2>
                            <h1>${index.rating.toFixed(2)}</h1>
                        </div>

                        <div class="list_stats">
                            <h2>Win Rate:</h2>
                            <h1>${((index.wins / (index.wins + index.losses)) * 100).toFixed(2)}%</h1>
                        </div>

                        <div class="list_stats mobile_remove">
                            <h2>Wins:</h2>
                            <h1>${index.wins}</h1>
                        </div>

                        <div class="list_stats mobile_remove">
                            <h2>Losses:</h2>
                            <h1>${index.losses}</h1>
                        </div>

                        <div class="list_stats">
                            <h2>Rank:</h2>   
                            <h1>${index.character_rank}</h1>
                        </div>

                    </div>

                </div>`
                );
            });

            list += "</div>";
            content.innerHTML = list;
            document.getElementById('trainer_amiibo_count').innerText = (`Valid Amiibo: ${trainer_amiibo.length}`);
        }

        await printValidTrainerAmiibo();



        // GET THE AVERAGE RATING OF THE TRAINER
        //---------------------------------------------------------------------------------------------------------------------------------------------------------
        async function trainerRatingStats() {
            // Average rating all 
            let average_rating_all = 0;
            trainer_amiibo.map(index => {
                average_rating_all += index.rating;
            });
            average_rating_all = average_rating_all / trainer_amiibo.length;

            document.getElementById('trainer_average_rating_all').innerText = `Average Rating (All): ${average_rating_all.toFixed(2)}`;

            // Average rating active and standby
            let average_rating_active_standby = 0;
            let active_counter = 0;
            trainer_amiibo.map(index => {
                if (index.match_selection_status != 'INACTIVE') {
                    average_rating_active_standby += index.rating;
                    active_counter++;
                }
            });
            average_rating_active_standby = average_rating_active_standby / active_counter;

            document.getElementById('trainer_average_rating_active_standby').innerText = `Average Rating (Active/Standby): ${average_rating_active_standby.toFixed(2)}`;
        }

        await trainerRatingStats();
    }



    // ALL DATA CORRESPONDING TO THE /SINGLES_MATCHES ENDPOINT
    //---------------------------------------------------------------------------------------------------------------------------------------------------------
    async function allMatchesStatistics() {
        document.getElementById('status_trainer_data').innerText = 'Loading';

        // Load all amiibo matches into an object
        async function getAllAmiiboMatches() {
            // Get list of all trainer amiibo
            async function getAmiiboList() {
                const query = await fetch(`./Data/${ruleset_id}/Trainers/${trainerID}.json`);
                // Error if trainer has no matches
                if (!query.ok) {
                    console.log(`Trainer '${trainerID}' has no data in '${ruleset_names[ruleset_id]}'`);
                    document.getElementById('status_trainer_data').innerText = `Failed: Trainer '${trainerID} ' has no data in '${ruleset_names[ruleset_id]}'`;
                    alert(`Trainer '${trainerID}' has no data in '${ruleset_names[ruleset_id]}'`);
                }
                return await query.json();
            }
            const all_amiibo = await getAmiiboList();

            // Load all amiibo files and store them
            const data = {};


            let latest_match_date = null;
            let first_match_date = null;
            async function dates(matchKeys) {
                // ISO strings → string comparison works
                const latest_match = matchKeys.reduce((max, key) =>
                    key > max ? key : max
                );

                const first_match = matchKeys.reduce((min, key) =>
                    key < min ? key : min
                );

                if (!latest_match_date || latest_match > latest_match_date) {
                    latest_match_date = latest_match;
                }

                if (!first_match_date || first_match < first_match_date) {
                    first_match_date = first_match;
                }
            }

            let wins = 0;
            let losses = 0;
            function matchesAndWinrate(amiiboMatches) {
                // Get winrate
                Object.values(amiiboMatches.matches).forEach(match => {
                    if (match.this_amiibo.result == "win") {
                        wins++;
                    } else losses++
                });


                const winrate = (wins / (wins + losses)) * 100;
                document.getElementById('trainer_winrate').innerText = `Win Rate: ${winrate.toFixed(2)}%`;

                // Display total matches
                document.getElementById('trainer_matches').innerText = `Matches: ${wins + losses}`;
            }



            for (const id of Object.keys(all_amiibo.amiibo)) {
                const res = await fetch(`./Data/${ruleset_id}/Amiibo/${id}.json`);
                if (!res.ok) continue;
                const AmiiboJSON = await res.json();
                const matchKeys = Object.keys(AmiiboJSON.matches || {});
                if (matchKeys.length === 0) continue;

                await dates(matchKeys);
                await matchesAndWinrate(AmiiboJSON);



                data[id] = AmiiboJSON;
            }

            return [data, latest_match_date, first_match_date];
        }
        const [all_matches_data, latest_match_date, first_match_date] = await getAllAmiiboMatches();
        document.getElementById('status_trainer_data').innerText = 'Processing';

        // Get trainer name
        async function getTrainerNames() {
            const query = await fetch(`./Data/${ruleset_id}/unique_trainers.json`);
            return await query.json();
        }
        const allTrainerNames = await getTrainerNames();
        const trainerName = allTrainerNames[trainerID];

        // GENERAL STATISTICS TAB
        //---------------------------------------------------------------------------------------------------------------------------------------------------------
        function generalStatistics() {

            // First match date
            function getDateSince(dateString) {
                let date = new Date(dateString);

                // Define an array of month names
                let months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

                // Get the day, month, and year
                let day = date.getDate();
                let month = months[date.getMonth()];
                let year = date.getFullYear();

                // Format the date
                return `${day} ${month} ${year}`;
            }
            document.getElementById('trainer_first_match').innerText = `First Match: ${getDateSince(first_match_date)}`;
            document.getElementById('trainer_last_match').innerText = `Last Match: ${getDateSince(latest_match_date)}`;



            // Get favourite character
            function favouriteCharacters() {
                const characterTally = {};

                // Create an empty tally with all character IDs
                Object.keys(all_characters).forEach(id => {
                    characterTally[id] = 0;
                });

                // Add to the tally
                Object.entries(all_matches_data).forEach(([amiibo_id, amiibo_data]) => {
                    const amiiboMatches = Object.entries(amiibo_data.matches).length;

                    characterTally[amiibo_data.character_id] += amiiboMatches;
                });

                // Convert the object to an array of [key, value] pairs
                let dataArray = Object.entries(characterTally);

                // Sort the array based on the values
                dataArray.sort((a, b) => b[1] - a[1]);

                // Transform the sorted array into an array of objects
                let sortedArray = dataArray.map(([id, count]) => ({ id, count }));

                // Extract the first 5 elements
                const top5Array = sortedArray.slice(0, 5);

                let list = '<div class="tier_list_container" style="gap: 0px;">';
                top5Array.map(index => {
                    Object.entries(all_characters).forEach(([id, name]) => {
                        if (index.id == id) {

                            list += (
                                `<div class="tier_list_item">
                                    <img src="images/${name}.png" class="tier_list_image">
                                    <div class="tier_list_text_box">
                                        <p class="tier_list_text">${index.count}</p>
                                    </div>
                                </div>`
                            );

                        }
                    });
                });
                list += "</div>";
                document.getElementById('trainer_favourite_characters').innerHTML = list;
            }
            favouriteCharacters();



            // Get top 5 most faced opponents
            function trainerMostFacedOpponents() {
                const opponentTally = {};

                Object.values(all_matches_data).forEach(amiibo => {
                    Object.values(amiibo.matches).forEach(match => {
                        if (!opponentTally[match.opponent.trainer_id]) {
                            opponentTally[match.opponent.trainer_id] = {
                                trainer_id: match.opponent.trainer_id,
                                win: 0,
                                loss: 0
                            }
                        }

                        if (match.this_amiibo.result == "win") {
                            opponentTally[match.opponent.trainer_id].win++;
                        }

                        if (match.this_amiibo.result == "loss") {
                            opponentTally[match.opponent.trainer_id].loss++;
                        }
                    });
                });

                // Convert the object to an array of entries
                let dataArray = Object.entries(opponentTally);

                // Sort the array based on the total of wins and losses
                dataArray.sort((a, b) => {
                    let totalA = a[1].win + a[1].loss;
                    let totalB = b[1].win + b[1].loss;
                    return totalB - totalA;
                });

                // Transform the sorted array into an array of objects
                let sortedArray = dataArray.map(([id, stats]) => ({
                    win: stats.win,
                    loss: stats.loss,
                    trainer_id: stats.trainer_id
                }));

                // Extract the first 5 elements
                const top5Array = sortedArray.slice(0, 5);

                // Get trainer names
                top5Array.forEach(trainer => {
                    trainer.trainer_name = allTrainerNames[trainer.trainer_id];
                });

                let list = '<div class="tier_list_container" style="gap: 2rem;">';
                top5Array.map(index => {
                    list += (
                        `<div>
                            <h2 style="margin: 0;">${index.trainer_name}</h2>
                            <p style="margin: 0;">Win/Loss: ${index.win}/${index.loss}</p>
                        </div>`
                    );
                });
                list += "</div>";
                document.getElementById('trainer_most_faced_opponents').innerHTML = list;
            }
            trainerMostFacedOpponents();



            // Get win and lose streaks
            function trainerStreaks() {
                // Search through every amiibo and collect their streaks
                Object.entries(all_matches_data).forEach(([amiibo_id, amiibo_data]) => {
                    let LongestWinstreak = 0;
                    let currentWinstreak = 0;

                    let LongestLosestreak = 0;
                    let currentLosestreak = 0;

                    Object.values(amiibo_data.matches).forEach(match => {
                        if (match.this_amiibo.result == "win") {
                            currentWinstreak++;
                            currentLosestreak = 0;
                            if (currentWinstreak > LongestWinstreak) {
                                LongestWinstreak = currentWinstreak;
                            }
                        }

                        if (match.this_amiibo.result == "loss") {
                            currentLosestreak++;
                            currentWinstreak = 0;
                            if (currentLosestreak > LongestLosestreak) {
                                LongestLosestreak = currentLosestreak;
                            }
                        }

                    });

                    all_matches_data[amiibo_id].winstreak = LongestWinstreak;
                    all_matches_data[amiibo_id].losestreak = LongestLosestreak;
                });

                let winstreak = Object.values(all_matches_data).reduce((max, amiibo) => (amiibo.winstreak > max.winstreak ? amiibo : max), Object.values(all_matches_data)[0]);
                let losestreak = Object.values(all_matches_data).reduce((max, amiibo) => (amiibo.losestreak > max.losestreak ? amiibo : max), Object.values(all_matches_data)[0]);

                // Match winstreak character with icon
                let winstreakIcon = all_characters[winstreak.character_id];
                const list_winstreak =
                    `<div class="flex_list_container" style="padding: 0 1rem;">
                    <div class="list_item">

                        <img src="./images/${winstreakIcon}.png" class="list_image">

                        <div>
                            <div style="padding-left: 1rem;">
                                <h1>${winstreak.name}</h1>
                                <h2>${winstreak.winstreak}</h2>
                            </div>
                        </div>

                    </div>
                </div>`;
                document.getElementById('trainer_longest_winstreak').innerHTML = list_winstreak;

                // Match losestreak character with icon
                let losestreakIcon = all_characters[losestreak.character_id];
                const list_losestreak =
                    `<div class="flex_list_container" style="padding: 0 1rem;">
                    <div class="list_item">

                        <img src="./images/${losestreakIcon}.png" class="list_image">

                        <div>
                            <div style="padding-left: 1rem;">
                                <h1>${losestreak.name}</h1>
                                <h2>${losestreak.losestreak}</h2>
                            </div>
                        </div>

                    </div>
                </div>`;
                document.getElementById('trainer_longest_losestreak').innerHTML = list_losestreak;
            }
            trainerStreaks();

        }
        generalStatistics();



        // ALL AMIIBO RUNS CHART
        //---------------------------------------------------------------------------------------------------------------------------------------------------------
        function allAmiiboRuns() {
            // Determine which amiibo has the most games
            let highest = 0;
            Object.values(all_matches_data).forEach(amiibo => {
                const matchCount = Object.entries(amiibo.matches).length;
                if (matchCount > highest) {
                    highest = matchCount;
                }
            });

            // Create array for xAxis
            const xAxis_game_count = [];
            for (let i = 0; i < highest; i++) {
                xAxis_game_count.push(i);
            }

            // Generate datasets for each run
            const datasets = [];
            let z = 0;

            Object.values(all_matches_data).forEach(amiibo => {
                const rating_history = [0]
                Object.values(amiibo.matches).forEach(match => {
                    rating_history.push(match.this_amiibo.rating);
                });

                // Create and push datasets
                datasets.push({
                    label: `${amiibo.name} (${all_characters[amiibo.character_id]})`,
                    data: rating_history,
                    borderColor: `rgba(${Math.min(255, z * (255 / Object.values(all_matches_data).length))}, ${Math.max(0, 255 - z * (255 / Object.values(all_matches_data).length))}, 255, 1)`,
                    fill: false,
                    borderWidth: 0.5,
                    pointRadius: 0.5,
                    pointHoverRadius: 1,
                });

                z++;
            });

            //Draw chart onto a canvas
            function RatingHistoryChart() {
                new Chart(document.getElementById('rating_history_chart_canvas'), {
                    type: 'line',
                    data: {
                        labels: xAxis_game_count, // X-Axis (number of games)
                        datasets: datasets, // Use the provided datasets array
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false // This hides the legend
                            },
                            tooltip: {
                                enabled: true // This keeps the tooltips enabled
                            }
                        },
                        scales: {
                            x: {
                                grid: {
                                    display: false,
                                },
                                title: {
                                    display: true,
                                    text: 'Match Number',
                                },
                            },
                            y: {
                                beginAtZero: true,
                                grid: {
                                    color: 'rgba(200, 200, 200, 0.2)',
                                },
                                title: {
                                    display: true,
                                    text: 'Rating Over Time',
                                },
                            },
                        },
                    },
                });
            }
            RatingHistoryChart();

        }
        allAmiiboRuns();



        // TRAINER VS TRAINER MATCHUPS
        //---------------------------------------------------------------------------------------------------------------------------------------------------------
        function trainerMatchups() {
            // Get all unique trainers
            const opponents = {};
            Object.values(all_matches_data).forEach(amiibo => {
                Object.values(amiibo.matches).forEach(match => {
                    if (!opponents[match.opponent.trainer_id]) {
                        opponents[match.opponent.trainer_id] = {
                            trainer_id: match.opponent.trainer_id,
                            win: 0,
                            loss: 0
                        }
                    }

                    if (match.this_amiibo.result == "win") {
                        opponents[match.opponent.trainer_id].win++;
                    }

                    if (match.this_amiibo.result == "loss") {
                        opponents[match.opponent.trainer_id].loss++;
                    }
                });
            });

            // Sort the array based on the total of wins and losses
            const sortedOpponents = Object.values(opponents).sort((a, b) => {
                const totalA = a.win + a.loss;
                const totalB = b.win + b.loss;

                return totalB - totalA; // highest → lowest
            });

            // Calculate winrates
            sortedOpponents.map(opponent => {
                opponent.winrate = ((opponent.win / (opponent.win + opponent.loss)) * 100).toFixed(2);
            });

            const wins = [];
            const losses = [];
            const labels = [];

            let graph_height_multiplier = 0;

            // Create data for the chart
            if (sortedOpponents.length > 50) {
                for (let i = 0; i < 50; i++) {
                    wins.push(sortedOpponents[i].win);
                    losses.push(sortedOpponents[i].loss);
                    labels.push(`${allTrainerNames[sortedOpponents[i].trainer_id]} (${sortedOpponents[i].winrate}%)`);
                }
                graph_height_multiplier = 50;

            } else {
                for (let i = 0; i < sortedOpponents.length; i++) {
                    wins.push(sortedOpponents[i].wins);
                    losses.push(sortedOpponents[i].losses);
                    labels.push(`${sortedOpponents[i].trainer_name} (${sortedOpponents[i].winrate}%)`);
                }
                graph_height_multiplier = sortedOpponents.length;
            }

            const graph_height = ((graph_height_multiplier * 20) + 200);
            document.getElementById('trainer_matchups').setAttribute("style", `height:${graph_height}px`);

            const datasets = [
                {
                    label: `Wins`,
                    data: wins,
                    backgroundColor: secondary_background_colour,
                    borderColor: secondary_border_colour,
                    fill: true,
                    borderWidth: 1
                },
                {
                    label: `Losses`,
                    data: losses,
                    backgroundColor: primary_background_colour,
                    borderColor: primary_border_colour,
                    fill: true,
                    borderWidth: 1
                }
            ];

            function trainerMatchupChart() {
                new Chart(document.getElementById('trainer_matchups_chart_canvas'), {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: datasets
                    },
                    options: {
                        indexAxis: 'y',
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            x: {
                                stacked: true,
                                title: {
                                    display: true,
                                    text: 'Times Defeated'
                                },
                            },
                            y: {
                                stacked: true,
                            },
                        }
                    },
                    plugins: [
                        ChartDataLabels
                    ],
                    labels: {
                        fontColor: 'rgba(170, 200, 100, 1)',
                    }
                });
            }
            trainerMatchupChart();

            document.getElementById('trainer_matchups_chart_title').innerText = `${trainerName} vs Trainers Matchup`;
        }
        trainerMatchups();



        // TRAINER VS CHARACTER MATCHUPS
        //---------------------------------------------------------------------------------------------------------------------------------------------------------
        function characterMatchups() {
            // Get all unique characters
            const opponents = [];
            Object.entries(all_characters).forEach(([id, name]) => {
                opponents.push({
                    character_id: id,
                    character_name: name,
                    wins: 0,
                    losses: 0
                });
            });

            // Get wins and losses
            opponents.forEach(opponent => {
                Object.values(all_matches_data).map(amiibo_data => {
                    Object.values(amiibo_data.matches).map(match => {
                        if (match.opponent.character_id == opponent.character_id && match.this_amiibo.result == "win") {
                            opponent.wins++;
                        }
                        if (match.opponent.character_id == opponent.character_id && match.this_amiibo.result == "loss") {
                            opponent.losses++;
                        }
                    });

                });
            });

            // Sort the array based on the total of wins and losses
            opponents.sort((a, b) => {
                let totalA = a.wins + a.losses;
                let totalB = b.wins + b.losses;
                return totalB - totalA;
            });

            // Calculate winrates
            opponents.map(opponent => {
                opponent.winrate = ((opponent.wins / (opponent.wins + opponent.losses)) * 100).toFixed(2);
            });

            const wins = [];
            const losses = [];
            const labels = [];

            let graph_height_multiplier = 0;

            // Create data for the chart
            for (let i = 0; i < opponents.length; i++) {
                wins.push(opponents[i].wins);
                losses.push(opponents[i].losses);
                labels.push(`${opponents[i].character_name} (${opponents[i].winrate}%)`);
            }
            graph_height_multiplier = opponents.length;

            const graph_height = ((graph_height_multiplier * 20) + 200);
            document.getElementById('character_matchups').setAttribute("style", `height:${graph_height}px`);

            const datasets = [
                {
                    label: `Wins`,
                    data: wins,
                    backgroundColor: secondary_background_colour,
                    borderColor: secondary_border_colour,
                    fill: true,
                    borderWidth: 1
                },
                {
                    label: `Losses`,
                    data: losses,
                    backgroundColor: primary_background_colour,
                    borderColor: primary_border_colour,
                    fill: true,
                    borderWidth: 1
                }
            ];

            function trainerMatchupChart() {
                new Chart(document.getElementById('character_matchups_chart_canvas'), {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: datasets
                    },
                    options: {
                        indexAxis: 'y',
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            x: {
                                stacked: true,
                                title: {
                                    display: true,
                                    text: 'Times Defeated'
                                },
                            },
                            y: {
                                stacked: true,
                            },
                        }
                    },
                    plugins: [
                        ChartDataLabels
                    ],
                    labels: {
                        fontColor: 'rgba(170, 200, 100, 1)',
                    }
                });
            }
            trainerMatchupChart();

            document.getElementById('character_matchups_chart_title').innerText = `${trainerName} vs Characters Matchup`;
        }
        characterMatchups();



        // TRAINER VS CHARACTER MATCHUPS
        //---------------------------------------------------------------------------------------------------------------------------------------------------------
        function amiiboMatchups() {

            // Get all unique trainers
            const opponents = [];
            Object.values(all_matches_data).forEach(amiibo_data => {
                Object.values(amiibo_data.matches).map(index => {
                    if (!opponents.some(opponent => opponent.id == index.opponent.id)) {
                        opponents.push({
                            id: index.opponent.id,
                            name: index.opponent.name,
                            wins: 0,
                            losses: 0
                        });
                    }
                });

            });

            // Get wins and losses
            opponents.forEach(opponent => {
                Object.values(all_matches_data).forEach(amiibo_data => {
                    Object.values(amiibo_data.matches).map(match => {
                        if (opponent.id == match.opponent.id && match.this_amiibo.result == "loss") {
                            opponent.losses++;
                        }

                        if (opponent.id == match.opponent.id && match.this_amiibo.result == "win") {
                            opponent.wins++;
                        }
                    });

                });
            });

            // Sort the array based on the total of wins and losses
            opponents.sort((a, b) => {
                let totalA = a.wins + a.losses;
                let totalB = b.wins + b.losses;
                return totalB - totalA;
            });

            // Calculate winrates
            opponents.map(opponent => {
                opponent.winrate = ((opponent.wins / (opponent.wins + opponent.losses)) * 100).toFixed(2);
            });

            const wins = [];
            const losses = [];
            const labels = [];

            let graph_height_multiplier = 0;

            // Create data for the chart
            if (opponents.length > 50) {
                for (let i = 0; i < 50; i++) {
                    wins.push(opponents[i].wins);
                    losses.push(opponents[i].losses);
                    labels.push(`${opponents[i].name} (${opponents[i].winrate}%)`);
                }
                graph_height_multiplier = 50;

            } else {
                for (let i = 0; i < opponents.length; i++) {
                    wins.push(opponents[i].wins);
                    losses.push(opponents[i].losses);
                    labels.push(`${opponents[i].name} (${opponents[i].winrate}%)`);
                }
                graph_height_multiplier = opponents.length;
            }

            const graph_height = ((graph_height_multiplier * 20) + 200);
            document.getElementById('amiibo_matchups').setAttribute("style", `height:${graph_height}px`);

            const datasets = [
                {
                    label: `Wins`,
                    data: wins,
                    backgroundColor: secondary_background_colour,
                    borderColor: secondary_border_colour,
                    fill: true,
                    borderWidth: 1
                },
                {
                    label: `Losses`,
                    data: losses,
                    backgroundColor: primary_background_colour,
                    borderColor: primary_border_colour,
                    fill: true,
                    borderWidth: 1
                }
            ];

            function trainerMatchupChart() {
                new Chart(document.getElementById('amiibo_matchups_chart_canvas'), {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: datasets
                    },
                    options: {
                        indexAxis: 'y',
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            x: {
                                stacked: true,
                                title: {
                                    display: true,
                                    text: 'Times Defeated'
                                },
                            },
                            y: {
                                stacked: true,
                            },
                        }
                    },
                    plugins: [
                        ChartDataLabels
                    ],
                    labels: {
                        fontColor: 'rgba(170, 200, 100, 1)',
                    }
                });
            }
            trainerMatchupChart();

            document.getElementById('amiibo_matchups_chart_title').innerText = `${trainerName} vs Amiibo Matchup`;
        }
        amiiboMatchups();



        // FULL MATCH HISTORY
        //---------------------------------------------------------------------------------------------------------------------------------------------------------
        function matchHistory() {
            console.log("Printing match history");
            // Sort match data for the match card
            const full_match_history = [];

            Object.values(all_matches_data).forEach(amiibo_data => {
                Object.entries(amiibo_data.matches).forEach(([date, match]) => {
                    let result = false
                    if (match.this_amiibo.result == "win") { result = true }
                    full_match_history.push({
                        'character_id': match.opponent.character_id,
                        'opponent_id': match.opponent.id,
                        'name': match.opponent.name,
                        'trainer_name': match.opponent.trainer_name,

                        'opponent_rating': match.opponent.rating,
                        'your_rating': match.this_amiibo.rating,
                        // 'your_current_rating': match.this_amiibo.rating,
                        // 'rating_change': all_matches_data[i].winner_info.rating_change,

                        'your_trainer_name': amiibo_data.trainer_name,
                        'your_amiibo_name': amiibo_data.name,
                        'your_character_id': amiibo_data.character_id,

                        // 'match_number': all_matches_data.length - i,
                        // 'match_selection': all_matches_data[i].match_metadata.fp1_selection,
                        'match_win': result
                    });
                });
            });

            // Fix any null values
            for (let i = 0; i < full_match_history.length; i++) {
                if (full_match_history[i].your_rating == null) {
                    full_match_history[i].your_rating = 0;
                }

                if (full_match_history[i].opponent_rating == null) {
                    full_match_history[i].opponent_rating = 0;
                }
            }

            console.log(full_match_history);

            // List all matches onto page
            let content = document.getElementById('amiibo_list');
            let list = '<div class="flex_list_container">';
            for (let i = 0; i < full_match_history.length; i++) { // full_match_history.length TEMPORARILY LIMITED TO 200 MATCHES TO REMOVE LAG, ADD A PAGINATION SYSTEM --------------------------------------------------------------------------------------------------------------------

                // Match current character with icon
                let characterIcon = 'reset';
                let yourCharacterIcon = 'reset';
                for (let x = 0; x < all_characters.length; x++) {
                    // Get opponent amiibo icon
                    if (all_characters[x].id == full_match_history[i].character_id) {
                        characterIcon = (`${all_characters[x].name}.png`)
                    }

                    // Get trainer amiibo icon
                    if (all_characters[x].id == full_match_history[i].your_character_id) {
                        yourCharacterIcon = (`${all_characters[x].name}.png`)
                    }
                }

                list += (
                    `<div class="list_item match_win_${full_match_history[i].match_win}" id="list_item_searchable">
                        <img src="./images/${yourCharacterIcon}" class="list_image">

                        <div class="list_stats_container">
                            <div class="list_stats_grid_container">
                                <div class="list_stats amiibo_trainer_name_title">
                                    <h2>${full_match_history[i].your_trainer_name}</h2>
                                    <h1>${full_match_history[i].your_amiibo_name}</h1>
                                </div>
                            </div>

                            <div class="list_stats">
                                <h2>Rating:</h2>
                                <h1>${full_match_history[i].your_rating.toFixed(2)}</h1>
                            </div>

                            <div class="list_stats_vs">
                                <h1 style="text-align: center;">VS</h1>
                            </div>

                            <div class="list_stats">
                                <h2 style="text-align: right; margin-right: 2rem;">Rating:</h2>   
                                <h1 style="text-align: right; margin-right: 2rem;">${full_match_history[i].opponent_rating.toFixed(2)}</h1>
                            </div>

                            <div class="list_stats_grid_container">
                                <div class="list_stats amiibo_trainer_name_title">
                                    <h2 style="text-align: right; margin-right: 2rem;">${full_match_history[i].trainer_name}</h2>
                                    <h1 style="text-align: right; margin-right: 2rem;">${full_match_history[i].name}</h1>
                                </div>
                            </div>

                            <img src="./images/${characterIcon}" class="list_image">
                        </div>

                    </div>`
                );
            }
            list += "</div>";
            content.innerHTML = list;
        }
        // matchHistory();

        document.getElementById('status_trainer_data').innerText = 'Done';
        removeStatusTab();
    }

    await trainerRankStats();
    await allMatchesStatistics();
}



// CLICKABLE AMIIBO ICONS
//--------------------------------------------------------------------------------------------------------------------------------------------------------- 
async function clickListItem(id, ruleset_id) {
    window.open(`https://www.amiibots.com/leaderboard?characterId=${id}&rulesetId=${ruleset_id}`);
};



// LOADING STATUS REMOVER
//--------------------------------------------------------------------------------------------------------------------------------------------------------- 
function removeStatusTab() {
    const amiiboLoading = document.getElementById('status_all_amiibo').innerText
    const trainerLoading = document.getElementById('status_trainer_data').innerText

    if (amiiboLoading == 'Done' && trainerLoading == 'Done') {
        document.getElementById('loading_status').remove();
    }
}