document.addEventListener('DOMContentLoaded', function() {
    const currentYear = new Date().getFullYear();
    const footerText = `© ${currentYear} Coldsea Team 保留所有权利`;
    const footerElement = document.getElementById('copyyear');
    
    if (footerElement) {
        footerElement.textContent = footerText;
    }
});