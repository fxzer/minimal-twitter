import selectors from "../../selectors";

export default async function changeHideViewCounts(setting) {
  const viewCounts = Array.from(document.querySelectorAll(selectors.viewCount));

  if (!viewCounts.length) return;

  if (setting === "off") {
    viewCounts.forEach((el) => {
      if (el.parentElement) {
        el.parentElement.style.display = "flex";
        // Remove aria-hidden and restore accessibility
        el.removeAttribute("aria-hidden");
        el.removeAttribute("tabindex");
      }
    });
  } else if (setting === "on") {
    viewCounts.forEach((el) => {
      if (el.parentElement) {
        el.parentElement.style.display = "none";
        // Properly hide from assistive technology and remove from tab order
        el.setAttribute("aria-hidden", "true");
        el.setAttribute("tabindex", "-1");
      }
    });
  }
}
