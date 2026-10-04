// Apply the saved theme before the first React paint. Each HTML entry point also
// sets data-theme inline, so this keeps every entry point in agreement with
// localStorage (which another tab may have changed since).
export function syncTheme() {
  try {
    const saved = localStorage.getItem("syntara-theme")
    document.documentElement.dataset.theme = saved === "light" ? "light" : "dark"
  } catch {
    document.documentElement.dataset.theme = "dark"
  }
}
