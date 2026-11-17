(function () {
  "use strict";

  function setupProjectTabs() {
    const tabs = Array.from(document.querySelectorAll(".projects__tab"));
    if (!tabs.length) return;
    const list = tabs[0].parentElement;

    function moveIndicator(tab) {
      list.style.setProperty("--ind-x", `${tab.offsetLeft}px`);
      list.style.setProperty("--ind-y", `${tab.offsetTop}px`);
      list.style.setProperty("--ind-w", `${tab.offsetWidth}px`);
      list.style.setProperty("--ind-h", `${tab.offsetHeight}px`);
    }

    function activeTab() {
      return tabs.find((t) => t.classList.contains("is-active")) || tabs[0];
    }

    function selectTab(tab) {
      moveIndicator(tab);
      tabs.forEach((t) => {
        const active = t === tab;
        t.classList.toggle("is-active", active);
        t.setAttribute("aria-selected", String(active));
        t.tabIndex = active ? 0 : -1;
        const panel = document.getElementById(t.getAttribute("aria-controls"));
        if (panel) panel.hidden = !active;
      });
      tab.scrollIntoView({ block: "nearest", inline: "nearest" });
    }

    tabs.forEach((tab, i) => {
      tab.addEventListener("click", () => selectTab(tab));
      tab.addEventListener("keydown", (e) => {
        const step = {
          ArrowDown: 1,
          ArrowRight: 1,
          ArrowUp: -1,
          ArrowLeft: -1,
        }[e.key];
        if (!step) return;
        e.preventDefault();
        const next = tabs[(i + step + tabs.length) % tabs.length];
        next.focus();
        selectTab(next);
      });
    });

    moveIndicator(activeTab());
    requestAnimationFrame(() => list.classList.add("is-ready"));
    window.addEventListener("resize", () => moveIndicator(activeTab()));
    if (document.fonts) {
      document.fonts.ready.then(() => moveIndicator(activeTab()));
    }
  }

  function splitIntoChars(heading) {
    heading.setAttribute(
      "aria-label",
      heading.textContent.trim().replace(/\s+/g, " "),
    );
    const chars = [];

    function wrap(node) {
      Array.from(node.childNodes).forEach((child) => {
        if (child.nodeType === Node.ELEMENT_NODE) {
          wrap(child);
          return;
        }
        if (child.nodeType !== Node.TEXT_NODE) return;

        const fragment = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            fragment.append(" ");
            return;
          }
          const word = document.createElement("span");
          word.className = "hero__word";
          word.setAttribute("aria-hidden", "true");
          Array.from(part).forEach((letter) => {
            const char = document.createElement("span");
            char.className = "hero__char";
            char.textContent = letter;
            word.append(char);
            chars.push(char);
          });
          fragment.append(word);
        });
        child.replaceWith(fragment);
      });
    }

    wrap(heading);
    return chars;
  }

  function setupHeadlineWeight() {
    const hero = document.querySelector(".hero");
    const heading = document.querySelector(".hero__title");
    if (!hero || !heading) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const chars = splitIntoChars(heading);
    heading.classList.add("is-interactive");

    const MIN_WEIGHT = 400;
    const MAX_WEIGHT = 700;
    const RADIUS = 180;
    let centers = [];
    let frame = 0;

    function measure() {
      const box = heading.getBoundingClientRect();
      centers = chars.map((char) => {
        const r = char.getBoundingClientRect();
        return {
          x: r.left + r.width / 2 - box.left,
          y: r.top + r.height / 2 - box.top,
        };
      });
    }

    function update(clientX, clientY) {
      const box = heading.getBoundingClientRect();
      const x = clientX - box.left;
      const y = clientY - box.top;

      chars.forEach((char, i) => {
        const dist = Math.hypot(centers[i].x - x, centers[i].y - y);
        const strength = Math.max(0, 1 - dist / RADIUS);
        const weight = MIN_WEIGHT + (MAX_WEIGHT - MIN_WEIGHT) * strength;
        char.style.setProperty("--weight", Math.round(weight));
      });
    }

    function reset() {
      chars.forEach((char) => char.style.removeProperty("--weight"));
    }

    measure();
    new ResizeObserver(measure).observe(heading);
    if (document.fonts) document.fonts.ready.then(measure);

    hero.addEventListener("pointermove", (e) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => update(e.clientX, e.clientY));
    });
    hero.addEventListener("pointerleave", () => {
      cancelAnimationFrame(frame);
      reset();
    });
  }

  function setupKeyboardBang() {
    const heading = document.querySelector(".hero__title");
    const message = document.querySelector(".hero__bang");
    if (!heading || !message) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const MASH_KEYS = 6;
    const MASH_WINDOW = 700;
    const TAPS = 5;
    const TAP_WINDOW = 1500;
    const COOLDOWN = 800;

    let keyTimes = [];
    let tapTimes = [];
    let count = 0;
    let lastBang = 0;

    function bang() {
      const now = Date.now();
      if (now - lastBang < COOLDOWN) return;
      lastBang = now;
      count += 1;

      message.hidden = false;
      message.innerHTML =
        count < 5
          ? `head-on-keyboard moments: <strong>${count}</strong>`
          : `head-on-keyboard moments: <strong>${count}</strong> &mdash; …and I still love what I do.`;

      if (reduceMotion) return;
      heading.style.setProperty("--shake", `${Math.min(2 + count * 2, 14)}px`);
      heading.classList.remove("is-shaking");
      void heading.offsetWidth;
      heading.classList.add("is-shaking");
    }

    function recent(times, windowMs) {
      const now = Date.now();
      times.push(now);
      return times.filter((t) => now - t < windowMs);
    }

    document.addEventListener("keydown", (e) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target.closest("input, textarea, select, [contenteditable]"))
        return;
      if (e.key.length !== 1) return;

      keyTimes = recent(keyTimes, MASH_WINDOW);
      if (keyTimes.length >= MASH_KEYS) {
        keyTimes = [];
        bang();
      }
    });

    heading.addEventListener("click", () => {
      tapTimes = recent(tapTimes, TAP_WINDOW);
      if (tapTimes.length >= TAPS) {
        tapTimes = [];
        bang();
      }
    });

    heading.addEventListener("animationend", () => {
      heading.classList.remove("is-shaking");
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

  setupProjectTabs();
  setupHeadlineWeight();
  setupKeyboardBang();
  setupScrollReveal();
  setupSmoothScroll();
})();
