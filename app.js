/* TU Holidays corporate — independent concept. Plain JS, no libraries. Preview only: the form sends nothing. */
(function () {
  var root = document.documentElement;
  var header = document.querySelector(".site-header");

  // header shadow after scroll
  function onScroll() { header.classList.toggle("scrolled", window.scrollY > 8); }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // mobile menu
  var btn = document.querySelector(".menu-btn");
  btn.addEventListener("click", function () {
    var open = header.classList.toggle("nav-open");
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  });
  document.querySelectorAll(".nav a").forEach(function (a) {
    a.addEventListener("click", function () { header.classList.remove("nav-open"); btn.setAttribute("aria-expanded", "false"); });
  });

  // scroll reveal: content is visible by default; hidden only while motion-ready and not yet in view
  var items = document.querySelectorAll("[data-reveal]");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if ("IntersectionObserver" in window && !reduce) {
    root.classList.add("motion-ready");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  }

  // enquiry form: validation only; nothing is sent in this preview
  var form = document.getElementById("enquiry");
  var thanks = document.getElementById("thanks");
  if (form) form.addEventListener("submit", function (e) {
    e.preventDefault();
    var missing = [];
    form.querySelectorAll("[required]").forEach(function (f) {
      var ok = f.type === "checkbox" ? f.checked : f.value.trim() !== "";
      if (f.type === "email" && ok) ok = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.value);
      f.setAttribute("aria-invalid", ok ? "false" : "true");
      f.style.borderColor = ok ? "" : "#b3261e";
      if (!ok) missing.push(f);
    });
    thanks.classList.add("show");
    if (missing.length) {
      thanks.textContent = "Please complete the highlighted fields.";
      missing[0].focus();
      return;
    }
    thanks.textContent = "Thank you. This is a design preview, so nothing was sent.";
  });

  // hero planner: carry the choices into the proposal form, then jump to it
  var planner = document.getElementById("planner");
  if (planner) {
    planner.addEventListener("submit", function (e) {
      e.preventDefault();
      var chosen = planner.querySelector('input[name="trip"]:checked');
      var size = planner.querySelector('select[name="size"]').value;
      if (chosen) document.getElementById("f-type").value = chosen.value;
      if (size) document.getElementById("f-size").value = size;
      document.getElementById("proposal").scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
      setTimeout(function () { document.getElementById("f-name").focus({ preventScroll: true }); }, reduce ? 0 : 700);
    });
  }

  // mobile action bar: appears after the hero, hides while the proposal form is on screen
  var mbar = document.getElementById("mbar");
  var propEl = document.getElementById("proposal");
  var propVisible = false;
  function mbarUpdate() { mbar.classList.toggle("show", window.scrollY > 520 && !propVisible); }
  if (propEl && "IntersectionObserver" in window) {
    new IntersectionObserver(function (en) { propVisible = en[0].isIntersecting; mbarUpdate(); }, { threshold: 0.15 }).observe(propEl);
  }
  window.addEventListener("scroll", mbarUpdate, { passive: true });
  mbarUpdate();

  // photo sliders (home hero, trip photos): next photograph every 3 seconds, no controls. Each pauses on hover/focus and while the
  // tab is hidden; visitors who prefer reduced motion keep the first photograph. Sliders start 0.7 s apart so they never change in step.
  document.querySelectorAll("[data-slider]").forEach(function (box, n) {
    var slides = box.querySelectorAll(".hslide, .sl-slide");
    if (slides.length < 2 || reduce) return;
    var cur = 0, timer = null;
    var go = function (k) {
      slides[cur].classList.remove("is-active"); slides[cur].setAttribute("aria-hidden", "true");
      cur = k % slides.length;
      slides[cur].classList.add("is-active"); slides[cur].removeAttribute("aria-hidden");
    };
    var play = function () { if (!timer) timer = setInterval(function () { go(cur + 1); }, 3000); };
    var stop = function () { clearInterval(timer); timer = null; };
    box.addEventListener("mouseenter", stop); box.addEventListener("mouseleave", play);
    box.addEventListener("focusin", stop); box.addEventListener("focusout", play);
    document.addEventListener("visibilitychange", function () { if (document.hidden) stop(); else play(); });
    setTimeout(play, n * 700);
  });

  // client-logo strip: static centred row while the logos fit; when they do not, a slow looping rail (pauses on hover, off for reduced motion)
  var rail = document.querySelector(".logo-rail");
  if (rail && !reduce) {
    var track = rail.querySelector(".logo-track");
    var originals = Array.prototype.slice.call(track.children);
    var fitRail = function () {
      Array.prototype.slice.call(track.querySelectorAll("[data-clone]")).forEach(function (n) { track.removeChild(n); });
      rail.classList.remove("is-marquee");
      var w = originals.reduce(function (s, li) { return s + li.getBoundingClientRect().width; }, 0) + 16 * (originals.length - 1);
      // the logos fit on the centred row: static.  Too many for the row: slow looping rail.
      if (w > rail.clientWidth + 1) {
        originals.forEach(function (li) { var c = li.cloneNode(true); c.setAttribute("aria-hidden", "true"); c.setAttribute("data-clone", ""); track.appendChild(c); });
        rail.style.setProperty("--n", originals.length);
        rail.classList.add("is-marquee");
      }
    };
    fitRail();
    var rt = null;
    window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(fitRail, 200); });
    window.addEventListener("load", fitRail);
  }
})();
