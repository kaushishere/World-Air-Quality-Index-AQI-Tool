// update table
const savedPlacesJSON = localStorage.getItem('savedPlaces')
let savedPlaces = savedPlacesJSON ? JSON.parse(savedPlacesJSON) : []
const table = document.getElementById("aqiTable");

// event listener: clear cart
document.querySelector('.clear-cart-btn').addEventListener('click', () => {
    savedPlaces = []
    updatePage()
})

document.querySelector('.export-btn').addEventListener('click', () => {
    const table = document.getElementById('aqiTable');
    let csvContent = '';

    const rows = table.querySelectorAll('tr');
    let desiredIndexes = [];

    rows.forEach((row, rowIndex) => {
        const cells = row.querySelectorAll('th, td');

        // On the header row, find indexes for the desired columns
        if (rowIndex === 0) {
            cells.forEach((cell, i) => {
                const header = cell.textContent.trim();
                if (
                    header.startsWith('Place') ||
                    header.startsWith('Current AQI') ||
                    header.startsWith('Dominant Pollutant')
                ) {
                    desiredIndexes.push(i);
                }
            });
        }

        const rowData = Array.from(cells)
            .filter((_, i) => desiredIndexes.includes(i))
            .map(cell => {
                const text = cell.innerText || cell.textContent;
                return `"${text.replace(/"/g, '""')}"`;
            })
            .join(',');

        csvContent += rowData + '\n';
    });

    // Trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'saved-places.csv');
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});



// sort by
const headers = table.querySelectorAll("th");
let sortDirection = {};

headers.forEach((header, index) => {
    header.addEventListener("click", () => {
        const type = header.dataset.type;
        const tbody = table.querySelector("tbody");
        const rows = Array.from(tbody.querySelectorAll("tr"));
        const ascending = !sortDirection[index];

        rows.sort((a, b) => {
            const cellA = a.children[index].textContent.trim();
            const cellB = b.children[index].textContent.trim();

            if (type === "number") {
                return ascending ? cellA - cellB : cellB - cellA;
            } else {
                return ascending
                    ? cellA.localeCompare(cellB)
                    : cellB.localeCompare(cellA);
            }
        });

        // Update sort direction
        sortDirection = {}; // reset all directions
        sortDirection[index] = ascending;

        // Remove sort classes
        headers.forEach(h => h.classList.remove("sort-asc", "sort-desc"));
        header.classList.add(ascending ? "sort-asc" : "sort-desc");

        // Re-append sorted rows
        tbody.innerHTML = "";
        rows.forEach(row => tbody.appendChild(row));
    });
});

function updatePage() {
    localStorage.setItem('savedPlaces', JSON.stringify(savedPlaces))
    htmlContent = ''
    savedPlaces.forEach((place, index) => {
        const { flagHTML, cityName, aqiColor, aqi, dominantPollutant } = place
        html = `
                <tr>
                    <td>${flagHTML}</td>
                    <td>${cityName}</td>
                    <td style="background-color:${aqiColor};">${aqi}</td>
                    <td>${dominantPollutant}</td>
                    <td><button class="delete-btn"><i class="fa-solid fa-trash" onclick="
                    savedPlaces.splice(${index},1)
                    updatePage()
                    "></i></button></td>
                </tr>
            `
        htmlContent += html
    })
    const tableBody = table.querySelector('tbody')
    tableBody.innerHTML = htmlContent
}

updatePage()