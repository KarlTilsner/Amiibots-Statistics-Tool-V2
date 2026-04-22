document.addEventListener('DOMContentLoaded', async function () {
    const res = await fetch('Data/rulesets.json');
    const data = await res.json();

    // Check for ruleset and update dropdown, if no ruleset, initialise one
    const LS_RULESET = window.localStorage.getItem('Global_Ruleset');

    if (!LS_RULESET) {
        window.localStorage.setItem('Global_Ruleset', data[0].id)
        location.reload();
    }

    // quick ruleset lookup
    const nameById = Object.fromEntries(
        data.map(item => [item.id, item.name])
    );

    document.getElementById("defaultRulesetOption").innerText = nameById[LS_RULESET]

    const dropdown = document.getElementById("selectRulesetDropdown");

    data.forEach(index => {
        const newOption = document.createElement("option");
        newOption.value = index.name;
        newOption.id = index.id;
        newOption.className = 'dropdownMenuOption';
        newOption.textContent = index.name;

        dropdown.appendChild(newOption);
    });
})



async function changeRuleset(selection) {
    const newRuleset = selection.options[selection.selectedIndex].id;
    window.localStorage.setItem('Global_Ruleset', newRuleset)
    location.reload();
}


