
// Capture the script URL immediately, while the script is executing.
// document.currentScript may be null inside DOMContentLoaded.
const footerScriptURL = document.currentScript.src;

// Resolve the website root from:
// assets/js/footer.js -> website root
const siteRoot = new URL("../../", footerScriptURL);

document.addEventListener("DOMContentLoaded", async () => {

    const footerContainer = document.getElementById("site-footer");

    if (!footerContainer) return;

    try {

        // 1. Fetch the shared footer.
        const footerURL = new URL("partials/footer.html", siteRoot);

        const response = await fetch(footerURL, {
            cache: "no-cache"
        });

        if (!response.ok) {
            throw new Error(
                `Footer request failed: ${response.status} ${response.statusText}`
            );
        }

        const html = await response.text();

        // 2. Parse the HTML.
        const parser = new DOMParser();
        const parsedDocument = parser.parseFromString(
            html,
            "text/html"
        );

        const footer = parsedDocument.querySelector("footer");

        if (!footer) {
            throw new Error("No <footer> element found in footer.html");
        }

        // 3. Resolve internal links and image paths.
        footer.querySelectorAll("[href], [src]").forEach(element => {

            const attribute = element.hasAttribute("href")
                ? "href"
                : "src";

            const value = element.getAttribute(attribute);

            if (!value) return;

            // Preserve external URLs, email links, anchors and special URLs.
            if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(value)) {
                return;
            }

            element.setAttribute(
                attribute,
                new URL(value, siteRoot).href
            );

        });

        // 4. Insert the footer.
        footerContainer.replaceWith(footer);

        // 5. Update the copyright year.
        const yearElement = footer.querySelector("#year");

        if (yearElement) {
            yearElement.textContent = new Date().getFullYear();
        }

        console.log("Shared footer loaded successfully.");

    } catch (error) {

        console.error("Could not load shared footer:", error);

        footerContainer.textContent =
            "Footer could not be loaded.";

    }

});
