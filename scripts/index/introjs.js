if (!tutorialWatched) {
    introJs().setOptions({
        steps: [
            {
                element: document.querySelector('.search-container'),
                title: "How do I search?",
                intro: "Search the map via place name"
            },
            {
                element: document.querySelector('.search-container'),
                title: "How do I search?",
                intro: `<p>Alternatively, click anywhere on the map (please not the <b>oceans</b> - we don't have sensor readings there!)</p><video src="media/index.mp4" autoplay width="1150" />`
            },
            {
                element: document.querySelector('.comparison-btn'),
                title: "How do I compare places?",
                intro: "After you have saved multiple places, you can compare their AQIs by pressing this icon"
            }
        ]
    })
        .start()
    tutorialWatched = true
    localStorage.setItem('tutorialWatched', tutorialWatched)
}