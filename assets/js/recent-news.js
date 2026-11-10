document.addEventListener("DOMContentLoaded", async () => {

    const recentNewsList = document.getElementById("recent-news-list");

    // Stop if this element does not exist on the current page.
    if (!recentNewsList) return;

    try {

        // 1. Fetch news.html
        const response = await fetch("./news.html", {
            cache: "no-cache"
        });

        if (!response.ok) {
            throw new Error(`Could not load news.html: ${response.status}`);
        }

        const html = await response.text();

        // 2. Parse the fetched HTML
        const parser = new DOMParser();
        const newsDocument = parser.parseFromString(html, "text/html");

        // 3. Find all individual news entries
        const newsEntries = newsDocument.querySelectorAll(
            ".news-feed > li"
        );

        // 4. Select the three most recent entries
        const recentEntries = Array.from(newsEntries).slice(0, 4);

        // Clear the loading message
        recentNewsList.replaceChildren();

        // 5. Create the homepage presentation
        recentEntries.forEach(entry => {

            // Extract the date
            const sourceDate = entry.querySelector(".date");

            // Extract the introductory paragraph
            const sourceSummary = entry.querySelector("div > p");

            // Create a new homepage list item
            const listItem = document.createElement("li");

            // Add the date
            const dateElement = document.createElement("span");
            dateElement.className = "date";
            dateElement.textContent = sourceDate
                ? sourceDate.textContent.trim()
                : "";

            // Add the summary
            const summaryElement = document.createElement("span");

            if (sourceSummary) {

                // Clone the paragraph's contents.
                // This preserves links inside the summary.
                sourceSummary.childNodes.forEach(node => {
                    summaryElement.appendChild(node.cloneNode(true));
                });

            } else {
                summaryElement.textContent = entry.textContent.trim();
            }

            // Assemble the homepage entry
            listItem.append(dateElement, summaryElement);

            // Insert it into the homepage
            recentNewsList.appendChild(listItem);

        });

        // Handle an empty news feed
        if (recentEntries.length === 0) {
            recentNewsList.textContent = "No recent news available.";
        }

    } catch (error) {

        console.error("Error loading recent news:", error);

        recentNewsList.textContent =
            "News could not be loaded. Please visit the News page.";

    }

});

