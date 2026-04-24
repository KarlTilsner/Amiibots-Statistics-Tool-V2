document.addEventListener('DOMContentLoaded', async function () {
    // Random chance rick roll
    const rollEveryone = Math.floor(Math.random() * 250) + 1;
    console.log(rollEveryone);
    if (rollEveryone == 137) {
        window.location.href = "https://www.youtube.com/watch?v=dQw4w9WgXcQ&ab_channel=RickAstley";
    }

    let content = document.getElementById('documentHeader');

    try {
        // Header portion
        const navbarResponse = await fetch('header.html');
        const navbarContent = await navbarResponse.text();

        content.innerHTML = navbarContent;


        // Version number
        document.getElementById('versionNo').innerHTML = "v2.0.0";
    } catch (error) {
        console.error('Error loading content:', error);
    }
});