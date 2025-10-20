function floorToHour(date) {
    date.setMinutes(0, 0, 0); // zero minutes, seconds, ms
    return date;
}

function toDatetimeLocalString(date) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// Current time floored to the hour, then subtract 2 hours
const endDate = floorToHour(new Date());
endDate.setHours(endDate.getHours() - 2);

// Start date is 23 hours before the end date
const startDate = new Date(endDate.getTime() - 23 * 60 * 60 * 1000);

// Set input values
document.getElementById('start-date').value = toDatetimeLocalString(startDate);
document.getElementById('end-date').value = toDatetimeLocalString(endDate);
