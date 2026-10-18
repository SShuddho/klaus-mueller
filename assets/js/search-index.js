/* =====================================================================
   SITE SEARCH INDEX  —  edit this file to change what search finds.
   One block per searchable item. Copy an existing block, change it, and
   keep the comma after the closing brace (except after the last one).

     title    : what appears in bold in the results
     type     : small label above the title (Research, People, Teaching, Page, News ...)
     url      : path from the TOP of the site, e.g. "research/FAIR.html".
                Full web addresses (https://...) also work.
     keywords : extra words people might type (not shown)
     body     : one-line description shown under the title
   ===================================================================== */
window.SITE_SEARCH_INDEX = [
  { title: "Research", type: "Page", url: "research/index.html",
    keywords: "research publications projects areas papers",
    body: "Research areas, projects and publications." },

  { title: "Visual analytics", type: "Research", url: "research/visualAnalytics.html",
    keywords: "visual analytics visualization data science storytelling explainable ai infovis hci projects",
    body: "Visualization, visual data science, visual storytelling, explainable AI, infovis, HCI." },
  { title: "Human-centered responsible AI", type: "Research", url: "research/FAIR.html",
    keywords: "fairness bias belief modeling personalized communication responsible ai",
    body: "Fairness, bias, belief modeling, and personalized communication." },
  { title: "Computational imaging", type: "Research", url: "research/ct.html",
    keywords: "ct computed tomography medical imaging low-dose gan gpu",
    body: "Computed tomography, low-dose, GAN-synthesis, GPU-acceleration." },
  { title: "Volume visualization", type: "Research", url: "research/volvis.html",
    keywords: "volume rendering medical scientific visualization geo-reference",
    body: "Medical and scientific visualization, multivalued data w/geo-reference." },
  { title: "Virtual reality", type: "Research", url: "research/vr.html",
    keywords: "vr ar mixed reality augmented display walls immersive",
    body: "Virtual, augmented, mixed reality, display walls, immersive visualization." },
  { title: "Cognitive computer graphics", type: "Research", url: "research/computerGraphics.html",
    keywords: "color texture perception cognition semiotics graphics",
    body: "Color, texture, details, points, perception, cognition, semiotics." },
  { title: "Filters and grids", type: "Research", url: "research/filters.html",
    keywords: "sampling lattices hexagonal body-centered n-d",
    body: "Sampling, hexagonal and body-centered lattices, extensions to N-D." },
  { title: "Eyetracking", type: "Research", url: "research/eyetrack.html",
    keywords: "eye tracking gaze",
    body: "Visualization for eye tracking data, acquisition, applications." },
  { title: "Natural phenomena", type: "Research", url: "research/naturalPhenomena.html",
    keywords: "simulation urban security gpu",
    body: "Simulation, urban security applications, GPU-acceleration." },
  { title: "Face recognition", type: "Research", url: "research/faceReco.html",
    keywords: "face recognition",
    body: "No longer an active research topic." },

  { title: "People", type: "Page", url: "people/index.html",
    keywords: "students phd ms alumni postdocs vai lab group",
    body: "Current PhD students and alumni of the VAI Lab." },
  { title: "Teaching", type: "Page", url: "teaching/index.html",
    keywords: "courses cse classes visualization medical imaging hci data science gpu",
    body: "Courses taught at Stony Brook University and SUNY Korea." },
  { title: "News", type: "Page", url: "news.html",
    keywords: "news recent developments announcements",
    body: "Recent developments and announcements." },
  { title: "About", type: "Page", url: "about.html",
    keywords: "about bio biography personal contact",
    body: "Short biography, CV and personal pages." },
  { title: "Curriculum vitae", type: "Page", url: "cv.html",
    keywords: "cv resume vita awards appointments service education books tutorials invited talks",
    body: "Education, appointments, awards, service, books, tutorials and invited talks." },

  { title: "Google Scholar", type: "Link", url: "https://scholar.google.com/citations?user=uya_Zb4AAAAJ&hl=en&oi=ao",
    keywords: "publications citations scholar",
    body: "All publications and citation counts." },
  { title: "Visual Analytics and Imaging (VAI) Lab", type: "Link", url: "http://www3.cs.stonybrook.edu/~vai",
    keywords: "vai lab laboratory",
    body: "Research lab directed by Klaus Mueller." },
  { title: "Brookhaven National Laboratory", type: "Link", url: "https://www.bnl.gov/",
    keywords: "brookhaven bnl senior scientist computational science initiative",
    body: "Senior Scientist, Brookhaven National Laboratory." },
  { title: "Stony Brook University", type: "Link", url: "https://www.stonybrook.edu/",
    keywords: "stony brook university computer science professor",
    body: "Professor, Department of Computer Science, Stony Brook University." }
];
