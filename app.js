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

  // one enquiry form, two modes: "proposal" or "appointment" (tabs, or #appointment / #proposal in the address). Validation only; nothing is sent in this preview.
  var form = document.getElementById("enquiry");
  if (form) {
    var thanks = form.querySelector(".thanks");
    var card = form.closest(".form-card");
    var tabs = card.querySelectorAll(".mode-tab");
    var setMode = function (m) {
      form.setAttribute("data-mode", m);
      tabs.forEach(function (t) { var on = t.getAttribute("data-mode") === m; t.classList.toggle("is-on", on); t.setAttribute("aria-selected", on ? "true" : "false"); });
      form.querySelectorAll("[data-for]").forEach(function (box) {
        var on = box.getAttribute("data-for") === m;
        box.hidden = !on;
        box.querySelectorAll("input, select, textarea").forEach(function (i) { i.disabled = !on; i.style.borderColor = ""; i.removeAttribute("aria-invalid"); });
      });
      card.querySelectorAll("[data-t-" + m + "]").forEach(function (el) { el.textContent = el.getAttribute("data-t-" + m); });
      thanks.classList.remove("show");
    };
    tabs.forEach(function (t) { t.addEventListener("click", function () { setMode(t.getAttribute("data-mode")); }); });
    var fromHash = function () {
      if (location.hash === "#appointment") { setMode("appointment"); var sec = document.getElementById("proposal"); if (sec) sec.scrollIntoView({ behavior: reduce ? "auto" : "smooth" }); }
      else if (location.hash === "#proposal") setMode("proposal");
    };
    window.addEventListener("hashchange", fromHash);
    document.querySelectorAll('a[href="#appointment"], a[href="#proposal"]').forEach(function (a) {
      a.addEventListener("click", function () { setMode(a.getAttribute("href") === "#appointment" ? "appointment" : "proposal"); });
    });
    fromHash();
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var missing = [];
      form.querySelectorAll("[required]").forEach(function (f) {
        if (f.disabled) return;
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
  }

  // floating WhatsApp / appointment button: opens a small panel; Escape, outside click or a choice closes it
  var waBox = document.getElementById("wafloat");
  if (waBox) {
    // "online now" from the office hours (Malaysia time, Mon-Fri 9:00 am to 6:30 pm); it shows office hours, not a live presence check
    var waStatus = document.getElementById("wa-status");
    var waState = function () {
      var parts = {};
      try {
        new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kuala_Lumpur", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false })
          .formatToParts(new Date()).forEach(function (p) { parts[p.type] = p.value; });
      } catch (e) { return; }
      var day = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(parts.weekday), mins = parseInt(parts.hour, 10) * 60 + parseInt(parts.minute, 10);
      var open = day >= 0 && day <= 4 && mins >= 540 && mins < 1110;
      var next = "Monday";
      if (day >= 0 && day <= 3 && mins >= 1110) next = "tomorrow"; else if ((day >= 0 && day <= 4) && mins < 540) next = "today"; else if (day === 4) next = "Monday";
      if (!waStatus) return;
      waStatus.classList.toggle("is-open", open); waStatus.classList.toggle("is-closed", !open);
      waBox.classList.toggle("is-online", open);
      waStatus.querySelector("b").textContent = open ? "We\u2019re online now" : "We\u2019re offline now";
      waStatus.querySelector("small").textContent = open ? "Talk to us on WhatsApp or by phone, or set an appointment."
        : "Back " + next + " at 9:00 am. Message us now and we reply within 24 hours on working days.";
    };
    waState(); setInterval(waState, 60000);
    var waBtn = waBox.querySelector(".wa-btn"), waPanel = document.getElementById("wa-panel");
    var waSet = function (open) {
      waPanel.hidden = !open; waBtn.setAttribute("aria-expanded", open ? "true" : "false"); waBox.classList.toggle("is-open", open);
    };
    waBtn.addEventListener("click", function () { waSet(waPanel.hidden); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !waPanel.hidden) { waSet(false); waBtn.focus(); } });
    document.addEventListener("click", function (e) { if (!waPanel.hidden && !waBox.contains(e.target)) waSet(false); });
    waPanel.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", function () { waSet(false); }); });
  }

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
  // (the old mobile quick bar was replaced by the Talk to us button, 2026-11-02)


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

  // client reviews: one review at a time, changing by itself every 3 seconds. It pauses while the visitor hovers, touches or focuses it,
  // while the section is off screen or the tab is hidden. No stop button (his choice). Arrows, dots, keys and swipe also work.
  // Visitors who prefer reduced motion get no automatic change. Without JavaScript all reviews simply stack in one column.
  document.querySelectorAll("[data-rslider]").forEach(function (box) {
    var slides = box.querySelectorAll(".rs-slide");
    if (slides.length < 2) return;
    var cur = 0, counter = box.querySelector("[data-cur]"), bar = box.querySelector(".rs-bar i"), dotsBox = box.querySelector(".rs-dots");
    var pauseBtn = box.querySelector(".rs-pause"), auto = box.hasAttribute("data-autoplay") && !reduce;
    var userPaused = false, hoverPaused = false, offscreen = false, hidden = false;
    var timer = null, startedAt = 0, remaining = 0, total = 0, dots = [];
    box.classList.add("is-ready");
    if (!auto && pauseBtn) pauseBtn.hidden = true;
    var dwell = function () { return 3000; };   // every review stays 3 seconds (Mamunur, 2026-11-02)
    if (dotsBox && slides.length <= 10) {
      slides.forEach(function (s, i) {
        var d = document.createElement("button"); d.type = "button"; d.className = "rs-dot"; d.setAttribute("aria-label", "Show review " + (i + 1));
        d.addEventListener("click", function () { show(i); });
        dotsBox.appendChild(d); dots.push(d);
      });
      dotsBox.removeAttribute("aria-hidden");
    }
    var barSet = function (pct, ms) {
      if (!bar) return;
      bar.style.transition = "none"; bar.style.width = pct + "%"; void bar.offsetWidth;
      if (ms) { bar.style.transition = "width " + ms + "ms linear"; bar.style.width = "100%"; }
    };
    var paused = function () { return userPaused || hoverPaused || offscreen || hidden; };
    var stop = function () {
      if (!timer) return;
      clearTimeout(timer); timer = null;
      remaining = Math.max(400, remaining - (Date.now() - startedAt));
      barSet(Math.min(100, 100 * (1 - remaining / total)), 0);
    };
    var go = function () {
      if (!auto || timer || paused()) return;
      startedAt = Date.now();
      barSet(100 * (1 - remaining / total), remaining);
      timer = setTimeout(function () { timer = null; show(cur + 1); }, remaining);
    };
    var restart = function () { stop(); total = remaining = dwell(cur); barSet(0, 0); go(); };
    var show = function (k) {
      cur = (k + slides.length) % slides.length;
      slides.forEach(function (s, i) {
        s.classList.toggle("is-active", i === cur);
        s.classList.toggle("is-before", i < cur);
        s.setAttribute("aria-hidden", i === cur ? "false" : "true");
        s.setAttribute("role", "group"); s.setAttribute("aria-roledescription", "review");
        s.setAttribute("aria-label", (i + 1) + " of " + slides.length);
      });
      dots.forEach(function (d, i) { d.classList.toggle("is-on", i === cur); });
      if (counter) counter.textContent = cur + 1;
      restart();
    };
    show(0);
    box.querySelectorAll(".rs-btn[data-dir]").forEach(function (b) {
      b.addEventListener("click", function () { show(cur + parseInt(b.getAttribute("data-dir"), 10)); });
    });
    if (pauseBtn) pauseBtn.addEventListener("click", function () {
      userPaused = !userPaused;
      pauseBtn.firstElementChild.textContent = userPaused ? "▶" : "❚❚";
      pauseBtn.setAttribute("aria-label", userPaused ? "Play automatic change" : "Pause automatic change");
      box.classList.toggle("is-paused", userPaused);
      if (userPaused) stop(); else go();
    });
    var lastTouch = 0;
    box.addEventListener("mouseenter", function () { if (Date.now() - lastTouch < 800) return; hoverPaused = true; stop(); });   // ignore the mouse events phones fake after a tap
    box.addEventListener("mouseleave", function () { hoverPaused = false; go(); });
    box.addEventListener("focusin", function (e) { if (e.target.matches && e.target.matches(":focus-visible")) { hoverPaused = true; stop(); } });   // keyboard focus only
    box.addEventListener("focusout", function () { hoverPaused = false; go(); });
    document.addEventListener("visibilitychange", function () { hidden = document.hidden; if (hidden) stop(); else go(); });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { offscreen = !en[0].isIntersecting; if (offscreen) stop(); else go(); }, { threshold: 0.25 }).observe(box);
    }
    box.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") show(cur - 1); else if (e.key === "ArrowRight") show(cur + 1);
    });
    // finger: drag the review sideways to see the next or previous one (the card follows the finger); a short drag snaps back; up/down still scrolls the page
    var x0 = null, y0 = 0, dx = 0, dragging = false;
    var release = function (go2) {
      var s = slides[cur];
      s.style.transition = ""; s.style.transform = ""; s.style.opacity = "";
      var moved = dragging && Math.abs(dx) > 60;
      x0 = null; dragging = false;
      if (moved && go2) { hoverPaused = false; show(cur + (dx < 0 ? 1 : -1)); return; }
      setTimeout(function () { hoverPaused = false; go(); }, 1200);
    };
    box.addEventListener("touchstart", function (e) { lastTouch = Date.now(); x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; dx = 0; dragging = false; hoverPaused = true; stop(); }, { passive: true });
    box.addEventListener("touchmove", function (e) {
      if (x0 === null) return;
      lastTouch = Date.now();
      dx = e.touches[0].clientX - x0;
      var dy = e.touches[0].clientY - y0;
      if (!dragging && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) dragging = true;
      if (dragging) {
        var s = slides[cur];
        s.style.transition = "none"; s.style.transform = "translateX(" + dx + "px)"; s.style.opacity = String(Math.max(0.25, 1 - Math.abs(dx) / 320));
      }
    }, { passive: true });
    box.addEventListener("touchend", function () { lastTouch = Date.now(); if (x0 !== null) release(true); }, { passive: true });
    box.addEventListener("touchcancel", function () { if (x0 !== null) release(false); }, { passive: true });
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
