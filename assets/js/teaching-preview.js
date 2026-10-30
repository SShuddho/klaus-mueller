
document.addEventListener("DOMContentLoaded", async () => {

    const teachingList = document.getElementById("teaching-preview-list");

    // Stop if the container does not exist.
    if (!teachingList) return;

    // Number of courses to display on the homepage.
    const MAX_COURSES = 3;

    try {

        // 1. Fetch the Teaching page.
        const teachingPageUrl = new URL(
            "./teaching/index.html",
            window.location.href
        );

        const response = await fetch(teachingPageUrl, {
            cache: "no-cache"
        });

        if (!response.ok) {
            throw new Error(`Could not load Teaching page: ${response.status}`);
        }

        const html = await response.text();

        // 2. Parse the HTML.
        const parser = new DOMParser();
        const teachingDocument = parser.parseFromString(html, "text/html");

        // 3. Find all course rows.
        const courseRows = teachingDocument.querySelectorAll(
            ".table-wrap table tbody tr"
        );

        // 4. Select the first three courses.
        const selectedCourses = Array.from(courseRows).slice(
            0,
            MAX_COURSES
        );

        // Clear the loading message.
        teachingList.replaceChildren();

        // 5. Generate the homepage presentation.
        selectedCourses.forEach(row => {

            const cells = row.querySelectorAll("td");

            // Extract course code.
            const courseCode = cells[0]?.textContent.trim() || "";

            // Extract course title and link.
            const sourceLink = cells[1]?.querySelector("a");

            const courseTitle = sourceLink
                ? sourceLink.textContent.trim()
                : cells[1]?.textContent.trim() || "Untitled";

            // Extract optional subtitle.
            const subtitle = cells[1]
                ?.querySelector(".sub")
                ?.textContent.trim() || "";

            // Create a course container.
            const courseItem = document.createElement("div");

            courseItem.className = "teaching-preview-item";

            // Course title.
            const titleElement = document.createElement("a");

            titleElement.className = "feature-title";
            titleElement.textContent = courseTitle;

            // Resolve the link relative to teaching/index.html.
            if (sourceLink?.getAttribute("href")) {
                titleElement.href = new URL(
                    sourceLink.getAttribute("href"),
                    teachingPageUrl
                ).href;
            }

            // Course code.
            const codeElement = document.createElement("p");

            codeElement.className = "feature-meta";
            codeElement.textContent = courseCode;

            // Add the extracted information.
            courseItem.append(titleElement, codeElement);

            // Optional course description.
            if (subtitle) {

                const descriptionElement = document.createElement("p");

                descriptionElement.className = "feature-desc";
                descriptionElement.textContent = subtitle;

                courseItem.appendChild(descriptionElement);
            }

            teachingList.appendChild(courseItem);

        });

        // Handle an empty course table.
        if (selectedCourses.length === 0) {
            teachingList.textContent = "No courses available.";
        }

    } catch (error) {

        console.error("Error loading Teaching page:", error);

        teachingList.textContent =
            "Courses could not be loaded. Please visit the Teaching page.";

    }

});

