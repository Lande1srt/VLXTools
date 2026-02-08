document.addEventListener('DOMContentLoaded', function() {
    const currentYear = new Date().getFullYear();
    const footerText = `© ${currentYear} <a href="https://github.com/landeyucc" target="_blank">@landeyucc</a>&nbsp;All rights reserved. <br/ >Powered by <a href="https://coldsea.vip/" target="_blank"><span style="font-family: 'Frizon', sans-serif;">Coldsea</span></a>&nbsp;Team.`;
    const footerElement = document.getElementById('copyyear');
    
    if (footerElement) {
        footerElement.innerHTML = footerText;
    }
});