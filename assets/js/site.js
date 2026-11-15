/*
 * =====================================================================
 *  KLAUS MUELLER — SHARED SCRIPT (all pages)
 *  Plain JavaScript, no libraries. Contents:
 *    1. Footer year
 *    2. Mobile menu
 *    3. Scroll-reveal
 *  =====================================================================
 */

(function () {

    "use strict";

    /* ---- 1. Footer year ---- */
    var yearEl = document.getElementById("year");
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }

    /* ---- 2. Mobile menu ---- */
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.querySelector(".main-nav");
    if (toggle && nav) {
        toggle.addEventListener("click", function () {
            var open = nav.classList.toggle("open");
            toggle.setAttribute("aria-expanded", open ? "true" : "false");
        });
    }

    /* ---- 3. Scroll-reveal ---- */
    var revealEls = document.querySelectorAll("[data-reveal]");
    if ("IntersectionObserver" in window) {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (e.isIntersecting) {
                    e.target.classList.add("vis");
                    io.unobserve(e.target);
                }
            });
        }, { threshold: 0.1 });
        revealEls.forEach(function (el) {
            io.observe(el);
        });
    } else {
        revealEls.forEach(function (el) {
            el.classList.add("vis");
        });
    }
})();