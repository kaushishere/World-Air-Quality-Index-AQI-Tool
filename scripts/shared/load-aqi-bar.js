async function loadAqiBar() {
    const response = await fetch('aqi-info-bar.html');
    const headerHTML = await response.text();
    document.getElementById('nav').innerHTML = headerHTML;
}

document.addEventListener('DOMContentLoaded', loadAqiBar)