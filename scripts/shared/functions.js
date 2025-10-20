async function callLatLngAPI(place) {
    const baseURL = "https://4eg9e31cz4.execute-api.eu-north-1.amazonaws.com/dev"
    const endpoint = 'get-lat-lng'
    const res = await fetch(`${baseURL}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ place })
    });
    const data = await res.json()
    return data
}

function countryCodeToFlag(countryCode) {
    if (!countryCode || countryCode.length !== 2 || !/^[a-zA-Z]+$/.test(countryCode)) {
        return '🏳️'; // fallback
    }

    const code = countryCode.toUpperCase();
    const offset = 127397;
    return Array.from(code)
        .map(letter => String.fromCodePoint(letter.charCodeAt(0) + offset))
        .join('');
}