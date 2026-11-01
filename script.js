// ============================================
// Evergreen Moving Co. - page behavior
// ============================================

// JavaScript is running, so swap the "no-js" class for "js".
// (Without JavaScript, the CSS keeps the menu visible so nothing breaks.)
document.documentElement.classList.replace("no-js", "js");

// 1. Mobile menu: open and close it with the menu button.
const menuButton = document.querySelector(".menu-toggle");
const nav = document.getElementById("main-nav");

function setMenu(open) {
  nav.classList.toggle("open", open);
  menuButton.setAttribute("aria-expanded", open);
  menuButton.setAttribute("aria-label", open ? "Close menu" : "Open menu");
}

menuButton.addEventListener("click", function () {
  setMenu(!nav.classList.contains("open"));
});

// Close the menu after tapping a link, or when Escape is pressed.
nav.querySelectorAll("a").forEach(function (link) {
  link.addEventListener("click", function () {
    setMenu(false);
  });
});
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape" && nav.classList.contains("open")) {
    setMenu(false);
    menuButton.focus();
  }
});

// 2. Underline the menu link for the part of the page you're looking at.
//    Every section is watched. Sections without a menu link (like the top banner)
//    clear the underline, so an old one never stays stuck.
const allNavLinks = nav.querySelectorAll("a");

function setActive(href) {
  allNavLinks.forEach(function (link) {
    const match = href !== null && link.getAttribute("href") === href;
    link.classList.toggle("active", match);
    if (match) {
      link.setAttribute("aria-current", "true");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

// Which menu link belongs to a section: "#about" for id="about", Home for the top banner.
function linkFor(section) {
  if (section.classList.contains("hero")) return "#top";
  return section.id ? "#" + section.id : null;
}

const watcher = new IntersectionObserver(function (entries) {
  entries.forEach(function (entry) {
    if (entry.isIntersecting) {
      setActive(linkFor(entry.target));
    }
  });
}, { rootMargin: "-45% 0px -50% 0px" });

if (document.querySelector('.breadcrumb a[href="index.html#services"]')) {
  // On the service pages, keep "Services" underlined in the menu.
  setActive("index.html#services");
} else {
  // On the home page, follow the section you're looking at.
  document.querySelectorAll("main > section").forEach(function (section) {
    watcher.observe(section);
  });
}

// 3. Quote form: check the required fields, then send it by email.
//    It goes through FormSubmit to shaw.elem@gmail.com.
//    (Only the home page has the form, so skip this on other pages.)
const form = document.getElementById("quote-form");

if (form) {
  const errorBox = document.getElementById("form-error");
  const successBox = document.getElementById("form-success");
  const submitButton = document.getElementById("form-submit");

  // Don't let people pick a moving date in the past.
  // (Uses the visitor's own clock, so "today" is right in every time zone.)
  const today = new Date();
  const pad = function (n) { return String(n).padStart(2, "0"); };
  document.getElementById("date").min =
    today.getFullYear() + "-" + pad(today.getMonth() + 1) + "-" + pad(today.getDate());

  // Clear the red border as soon as someone fixes a field.
  form.querySelectorAll("[required]").forEach(function (input) {
    input.addEventListener("input", function () {
      if (input.checkValidity()) {
        input.classList.remove("invalid");
        input.removeAttribute("aria-invalid");
      }
    });
  });

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    // Check the required fields first.
    const required = form.querySelectorAll("[required]");
    let firstBad = null;
    required.forEach(function (input) {
      const ok = input.checkValidity() && input.value.trim() !== "";
      input.classList.toggle("invalid", !ok);
      if (ok) {
        input.removeAttribute("aria-invalid");
      } else {
        input.setAttribute("aria-invalid", "true");
        if (!firstBad) firstBad = input;
      }
    });

    if (firstBad) {
      errorBox.textContent = "Please fill in your name, a phone number, and a valid email.";
      successBox.hidden = true;
      firstBad.focus();
      return;
    }

    // Send it. While it's sending, the button is greyed out so it can't be double-clicked.
    errorBox.textContent = "";
    submitButton.disabled = true;
    submitButton.textContent = "Sending...";

    try {
      const response = await fetch("https://formsubmit.co/ajax/shaw.elem@gmail.com", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        // Turn the form's boxes into { name: "...", phone: "...", ... } the way FormSubmit expects
        body: JSON.stringify(Object.fromEntries(new FormData(form)))
      });
      const result = await response.json();

      if (!response.ok || String(result.success) !== "true") {
        throw new Error(result.message || "Send failed");
      }

      form.reset();
      successBox.hidden = false;
      successBox.focus();
    } catch (error) {
      errorBox.textContent = "Sorry, your request couldn't be sent. Please call us at 410-324-9898 or email shaw.elem@gmail.com.";
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Send My Quote Request";
    }
  });
}

// 4. Keep the copyright year up to date.
document.getElementById("year").textContent = new Date().getFullYear();
