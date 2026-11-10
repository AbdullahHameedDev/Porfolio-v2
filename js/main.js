(function () {
  "use strict";

  function setupProjectFilter() {
    const filters = document.querySelectorAll(".work__filter");
    const cards = document.querySelectorAll(".work__card");
    if (!filters.length || !cards.length) return;

    function cardMatches(card, filter) {
      if (filter === "all") return true;
      const tags = (card.getAttribute("data-tags") || "").split(/\s+/);
      return tags.includes(filter);
    }

    function applyFilter(filter) {
      cards.forEach((card) => {
        const show = cardMatches(card, filter);
        card.classList.toggle("work__card--hidden", !show);
      });
    }

    filters.forEach((btn) => {
      btn.addEventListener("click", () => {
        const filter = btn.getAttribute("data-filter");
        if (!filter) return;

        filters.forEach((f) => {
          const active = f === btn;
          f.classList.toggle("work__filter--active", active);
          f.setAttribute("aria-selected", String(active));
        });

        applyFilter(filter);
      });
    });
  }

  function setupScrollReveal() {
    const sections = document.querySelectorAll(".reveal");
    if (!sections.length) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      sections.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { root: null, threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );

    sections.forEach((el) => observer.observe(el));
  }

  function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", (e) => {
        const id = anchor.getAttribute("href");
        if (!id || id === "#") return;

        const target = document.querySelector(id);
        if (!target) return;

        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        history.pushState(null, "", id);
      });
    });
  }

  const hero = document.querySelector(".hero.reveal");
  if (hero) hero.classList.add("is-visible");

  setupProjectFilter();
  setupScrollReveal();
  setupSmoothScroll();
})();
