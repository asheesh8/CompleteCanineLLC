/* ==========================================================================
   Complete Canine — interactions

   Deliberately contains NO scroll code: no smooth-scroll library, no
   scroll listeners, no scroll-triggered reveals, no parallax. Each page is
   a single screen and deeper content is reached by tabs.
   ========================================================================== */
(function () {
  "use strict";

  /* ----------------------------------------------------------------------
     Tabs — the navigation model that replaces scrolling
     ---------------------------------------------------------------------- */
  document.querySelectorAll("[data-tabs]").forEach(function (root) {
    var tabs = Array.prototype.slice.call(root.querySelectorAll("[role=tab]"));
    var panels = Array.prototype.slice.call(
      root.querySelectorAll("[role=tabpanel]")
    );
    if (!tabs.length) return;

    function select(idx, focus) {
      tabs.forEach(function (tab, i) {
        var on = i === idx;
        tab.setAttribute("aria-selected", on ? "true" : "false");
        tab.setAttribute("tabindex", on ? "0" : "-1");
      });
      panels.forEach(function (panel, i) {
        panel.classList.toggle("is-active", i === idx);
        panel.hidden = i !== idx;
      });
      if (focus) tabs[idx].focus();

      // reflect in the URL so a tab can be linked to and survives reload
      var id = tabs[idx].getAttribute("data-tab");
      if (id && window.history && history.replaceState) {
        history.replaceState(null, "", "#" + id);
      }
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () {
        select(i);
      });
      tab.addEventListener("keydown", function (e) {
        var next = null;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (i + 1) % tabs.length;
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = tabs.length - 1;
        if (next === null) return;
        e.preventDefault();
        select(next, true);
      });
    });

    // open the tab named in the URL hash, else the first
    var wanted = decodeURIComponent(window.location.hash.replace("#", ""));
    var start = 0;
    tabs.forEach(function (tab, i) {
      if (wanted && tab.getAttribute("data-tab") === wanted) start = i;
    });
    select(start);
  });

  /* ----------------------------------------------------------------------
     Mobile drawer
     ---------------------------------------------------------------------- */
  var burger = document.querySelector(".burger");
  var drawer = document.querySelector(".drawer");

  function closeDrawer() {
    if (!drawer) return;
    drawer.classList.remove("is-open");
    burger.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
  }

  if (burger && drawer) {
    burger.addEventListener("click", function () {
      var open = drawer.classList.toggle("is-open");
      burger.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    drawer.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", closeDrawer);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeDrawer();
    });
  }

  /* ----------------------------------------------------------------------
     Current year
     ---------------------------------------------------------------------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
