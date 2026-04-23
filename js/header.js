document.addEventListener('DOMContentLoaded', async function () {

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