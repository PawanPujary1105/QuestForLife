// Utilities
export function escapeHTML(str) {
  return (str ?? "").toString().replace(
    /[&<>\"']/g,
    (s) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "",
      })[s],
  );
}

export function formatDate(ts) {
  if (!ts) return "—";

  try {
    const d = new Date(ts);
    return d.toLocaleString("en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

export function formatDay(ts) {
  const d = new Date(ts);

  return d.toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatTime(ts) {
  const d = new Date(ts);

  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const toKey = (v) => (v ?? "").toString().trim().toLowerCase();

// Map type to badge/icon/colors
export function typeMeta(type) {
  switch ((type || "").toLowerCase()) {
    case "add":
      return {
        cls: "add",
        label: "Added",
        icon: "➕",
        bg: "#dbeafe",
        fg: "#1d4ed8",
      };

    case "watch":
      return {
        cls: "watch",
        label: "Watched",
        icon: "🎬",
        bg: "#d1fae5",
        fg: "#047857",
      };

    case "unwatch":
      return {
        cls: "unwatch",
        label: "Unwatched",
        icon: "↩",
        bg: "#fde68a",
        fg: "#b45309",
      };

    case "delete":
      return {
        cls: "delete",
        label: "Deleted",
        icon: "🗑",
        bg: "#fecaca",
        fg: "#b91c1c",
      };

    default:
      return {
        cls: "add",
        label: type,
        icon: "•",
        bg: "#e5e7eb",
        fg: "#111827",
      };
  }
}
