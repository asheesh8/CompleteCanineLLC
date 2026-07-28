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

  /* ----------------------------------------------------------------------
     Booking request demo storage
     ---------------------------------------------------------------------- */
  var BOOKING_KEY = "ccBookingRequests";

  function readBookings() {
    try {
      var raw = window.localStorage.getItem(BOOKING_KEY);
      var parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function writeBookings(bookings) {
    try {
      window.localStorage.setItem(BOOKING_KEY, JSON.stringify(bookings));
      return true;
    } catch (e) {
      return false;
    }
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formValue(form, name) {
    var field = form.elements[name];
    if (!field || typeof field.value !== "string") return "";
    return field.value.trim();
  }

  function checkedValues(form, name) {
    return Array.prototype.slice
      .call(form.querySelectorAll('input[name="' + name + '"]:checked'))
      .map(function (field) {
        return field.value;
      });
  }

  function bookingId() {
    var day = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    var suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    return "CC-" + day + "-" + suffix;
  }

  function setDateMinimums(form) {
    var today = new Date().toISOString().slice(0, 10);
    form.querySelectorAll('input[type="date"]').forEach(function (field) {
      field.min = today;
    });
  }

  var bookingForm = document.querySelector("[data-booking-form]");
  if (bookingForm) {
    setDateMinimums(bookingForm);

    var secretPaw = document.querySelector("[data-admin-secret]");
    var secretClicks = 0;
    var secretTimer = null;
    if (secretPaw) {
      secretPaw.addEventListener("click", function () {
        secretClicks += 1;
        window.clearTimeout(secretTimer);
        if (secretClicks >= 3) {
          window.location.href = "admin.html";
          return;
        }
        secretTimer = window.setTimeout(function () {
          secretClicks = 0;
        }, 900);
      });
    }

    bookingForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!bookingForm.checkValidity()) {
        bookingForm.reportValidity();
        return;
      }

      // Grouped to match the Supabase row shape this can become later.
      var booking = {
        id: bookingId(),
        status: "new",
        created_at: new Date().toISOString(),
        service: formValue(bookingForm, "service"),
        owner: {
          name: formValue(bookingForm, "ownerName"),
          phone: formValue(bookingForm, "phone"),
          email: formValue(bookingForm, "email"),
        },
        pet: {
          name: formValue(bookingForm, "petName"),
          type: formValue(bookingForm, "petType"),
          breed_size: formValue(bookingForm, "breedSize"),
        },
        schedule: {
          start_date: formValue(bookingForm, "startDate"),
          start_time: formValue(bookingForm, "startTime"),
          end_date: formValue(bookingForm, "endDate"),
        },
        care: {
          temperament: formValue(bookingForm, "temperament"),
          vaccines_current: Boolean(
            bookingForm.querySelector('input[name="vaccinesCurrent"]:checked')
          ),
          flags: checkedValues(bookingForm, "careFlags"),
          notes: formValue(bookingForm, "notes"),
        },
      };

      var bookings = readBookings();
      bookings.unshift(booking);

      if (!writeBookings(bookings)) {
        window.alert("This browser blocked local booking storage. Please call Complete Canine instead.");
        return;
      }

      var success = bookingForm.querySelector("[data-booking-success]");
      var id = bookingForm.querySelector("[data-booking-id]");
      if (id) id.textContent = booking.id;
      if (success) success.hidden = false;
      bookingForm.reset();
      setDateMinimums(bookingForm);
    });
  }

  /* ----------------------------------------------------------------------
     Admin request board
     ---------------------------------------------------------------------- */
  var adminApp = document.querySelector("[data-admin-app]");
  if (adminApp) {
    var adminState = {
      filter: "all",
      query: "",
      selectedId: null,
    };

    var statusLabels = {
      new: "new",
      reviewing: "reviewing",
      confirmed: "confirmed",
      archived: "archived",
    };

    function statusClass(status) {
      return "status-" + (statusLabels[status] ? status : "new");
    }

    function dateLabel(date, time) {
      if (!date) return "Date pending";
      var parts = date.split("-");
      var label = parts.length === 3 ? parts[1] + "/" + parts[2] + "/" + parts[0] : date;
      return time ? label + " at " + time : label;
    }

    function bookingMatches(booking) {
      var status = booking.status || "new";
      if (adminState.filter !== "all" && status !== adminState.filter) return false;
      if (!adminState.query) return true;

      var haystack = [
        booking.id,
        booking.service,
        booking.owner && booking.owner.name,
        booking.owner && booking.owner.phone,
        booking.owner && booking.owner.email,
        booking.pet && booking.pet.name,
        booking.pet && booking.pet.type,
        booking.pet && booking.pet.breed_size,
        booking.care && booking.care.notes,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.indexOf(adminState.query) !== -1;
    }

    function findBooking(bookings, id) {
      for (var i = 0; i < bookings.length; i += 1) {
        if (bookings[i].id === id) return bookings[i];
      }
      return null;
    }

    function renderStats(bookings) {
      ["new", "reviewing", "confirmed"].forEach(function (status) {
        var node = adminApp.querySelector('[data-admin-stat="' + status + '"]');
        if (!node) return;
        node.textContent = bookings.filter(function (booking) {
          return (booking.status || "new") === status;
        }).length;
      });
    }

    function renderList(bookings, visible) {
      var list = adminApp.querySelector("[data-admin-list]");
      if (!list) return;

      if (!visible.length) {
        list.innerHTML =
          '<div class="empty-state">' +
          '<span><svg><use href="#i-paw"></use></svg></span>' +
          '<h2 class="h-2">No requests found</h2>' +
          '<p>New booking requests will appear here after the form is submitted.</p>' +
          "</div>";
        return;
      }

      list.innerHTML = visible
        .map(function (booking) {
          var status = booking.status || "new";
          var petName = booking.pet && booking.pet.name ? booking.pet.name : "Unnamed pet";
          var ownerName = booking.owner && booking.owner.name ? booking.owner.name : "No owner";
          var selected = booking.id === adminState.selectedId ? " is-selected" : "";
          return (
            '<button type="button" class="admin-ticket' +
            selected +
            '" data-admin-ticket="' +
            escapeHtml(booking.id) +
            '">' +
            '<div class="admin-ticket__top">' +
            '<span class="admin-ticket__name">' +
            escapeHtml(petName) +
            "</span>" +
            '<span class="status-pill ' +
            statusClass(status) +
            '">' +
            escapeHtml(status) +
            "</span>" +
            "</div>" +
            '<div class="admin-ticket__meta">' +
            '<svg><use href="#i-calendar"></use></svg>' +
            escapeHtml(dateLabel(booking.schedule && booking.schedule.start_date, booking.schedule && booking.schedule.start_time)) +
            "</div>" +
            '<div class="admin-ticket__meta">' +
            escapeHtml(booking.service || "Service pending") +
            " · " +
            escapeHtml(ownerName) +
            "</div>" +
            "</button>"
          );
        })
        .join("");
    }

    function renderDetail(booking) {
      var detail = adminApp.querySelector("[data-admin-detail]");
      if (!detail) return;

      if (!booking) {
        detail.innerHTML =
          '<div class="empty-state">' +
          '<span><svg><use href="#i-paw"></use></svg></span>' +
          '<h2 class="h-2">No request selected</h2>' +
          '<p>Choose a booking from the queue to see dates, contact details and care notes.</p>' +
          "</div>";
        return;
      }

      var status = booking.status || "new";
      var owner = booking.owner || {};
      var pet = booking.pet || {};
      var schedule = booking.schedule || {};
      var care = booking.care || {};
      var flags = care.flags && care.flags.length ? care.flags.join(", ") : "None listed";
      var notes = care.notes || "No notes yet.";
      var email = owner.email || "";
      var phone = owner.phone || "";

      detail.innerHTML =
        '<div class="admin-detail__head">' +
        "<div>" +
        '<div class="admin-detail__kicker">' +
        '<span class="status-pill ' +
        statusClass(status) +
        '">' +
        escapeHtml(status) +
        "</span>" +
        "<span>" +
        escapeHtml(booking.id) +
        "</span>" +
        "</div>" +
        '<h2 class="h-2">' +
        escapeHtml(pet.name || "Unnamed pet") +
        "</h2>" +
        "</div>" +
        "</div>" +
        '<div class="admin-actions" aria-label="Update status">' +
        ["new", "reviewing", "confirmed", "archived"]
          .map(function (nextStatus) {
            return (
              '<button type="button" class="admin-action' +
              (status === nextStatus ? " is-active" : "") +
              '" data-admin-status="' +
              nextStatus +
              '">' +
              escapeHtml(nextStatus) +
              "</button>"
            );
          })
          .join("") +
        "</div>" +
        '<div class="admin-detail-grid">' +
        '<div class="admin-field"><span>Owner</span><b>' +
        escapeHtml(owner.name || "Not provided") +
        "</b><p>" +
        (phone ? '<a href="tel:' + escapeHtml(phone) + '">' + escapeHtml(phone) + "</a>" : "No phone") +
        (email ? "<br>" + '<a href="mailto:' + escapeHtml(email) + '">' + escapeHtml(email) + "</a>" : "") +
        "</p></div>" +
        '<div class="admin-field"><span>Service</span><b>' +
        escapeHtml(booking.service || "Not selected") +
        "</b><p>" +
        escapeHtml(pet.type || "Pet") +
        (pet.breed_size ? " · " + escapeHtml(pet.breed_size) : "") +
        "</p></div>" +
        '<div class="admin-field"><span>Arrival</span><b>' +
        escapeHtml(dateLabel(schedule.start_date, schedule.start_time)) +
        "</b></div>" +
        '<div class="admin-field"><span>Pickup</span><b>' +
        escapeHtml(dateLabel(schedule.end_date, "")) +
        "</b></div>" +
        '<div class="admin-field"><span>Care</span><b>' +
        escapeHtml(care.temperament || "Not listed") +
        "</b><p>" +
        (care.vaccines_current ? "Vaccines marked current" : "Vaccines not confirmed") +
        "<br>" +
        escapeHtml(flags) +
        "</p></div>" +
        '<div class="admin-field"><span>Submitted</span><b>' +
        escapeHtml(new Date(booking.created_at || Date.now()).toLocaleString()) +
        "</b></div>" +
        '<div class="admin-field admin-field--full"><span>Notes</span><p>' +
        escapeHtml(notes) +
        "</p></div>" +
        "</div>";
    }

    function renderAdmin() {
      var bookings = readBookings();
      var visible = bookings.filter(bookingMatches);
      var clear = adminApp.querySelector("[data-admin-clear]");

      if (
        adminState.selectedId &&
        !visible.some(function (booking) {
          return booking.id === adminState.selectedId;
        })
      ) {
        adminState.selectedId = null;
      }
      if (!adminState.selectedId && visible.length) {
        adminState.selectedId = visible[0].id;
      }

      renderStats(bookings);
      renderList(bookings, visible);
      renderDetail(findBooking(bookings, adminState.selectedId));

      if (clear) {
        clear.disabled = !bookings.some(function (booking) {
          return booking.status === "archived";
        });
      }
    }

    adminApp.addEventListener("click", function (e) {
      var filter = e.target.closest("[data-admin-filter]");
      var ticket = e.target.closest("[data-admin-ticket]");
      var status = e.target.closest("[data-admin-status]");
      var clear = e.target.closest("[data-admin-clear]");

      if (filter) {
        adminState.filter = filter.getAttribute("data-admin-filter") || "all";
        adminApp.querySelectorAll("[data-admin-filter]").forEach(function (button) {
          button.classList.toggle("is-active", button === filter);
        });
        renderAdmin();
      }

      if (ticket) {
        adminState.selectedId = ticket.getAttribute("data-admin-ticket");
        renderAdmin();
      }

      if (status && adminState.selectedId) {
        var bookings = readBookings().map(function (booking) {
          if (booking.id === adminState.selectedId) {
            booking.status = status.getAttribute("data-admin-status") || "new";
            booking.updated_at = new Date().toISOString();
          }
          return booking;
        });
        writeBookings(bookings);
        renderAdmin();
      }

      if (clear) {
        var kept = readBookings().filter(function (booking) {
          return booking.status !== "archived";
        });
        writeBookings(kept);
        adminState.selectedId = null;
        renderAdmin();
      }
    });

    var search = adminApp.querySelector("[data-admin-search]");
    if (search) {
      search.addEventListener("input", function () {
        adminState.query = search.value.trim().toLowerCase();
        renderAdmin();
      });
    }

    window.addEventListener("storage", function (e) {
      if (e.key === BOOKING_KEY) renderAdmin();
    });

    renderAdmin();
  }
})();
