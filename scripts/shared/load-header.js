async function loadHeader() {
    const response = await fetch('header.html');
    const headerHTML = await response.text();
    document.getElementById('header').innerHTML = headerHTML;

    // Highlight active link
    const currentPage = window.location.pathname.split('/').pop(); // e.g. "current.html"
    const links = document.querySelectorAll('.middle-section a');

    links.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (href === 'index.html' && currentPage === '')) {
            link.classList.add('active');
        }
    });
}

document.addEventListener('DOMContentLoaded', loadHeader);
