// src/utils/problemReportsModel.js

export const PROBLEM_CATEGORIES = {
  ROAD_INFRASTRUCTURE: "road-infrastructure",
  UTILITIES: "utilities",
  PUBLIC_ORDER: "public-order",
  CLEANLINESS_WASTE: "cleanliness-waste",
  APP_ISSUE: "app-issue",
  OTHER: "other",
};

export const PROBLEM_REPORT_STATUSES = {
  IN_REVIEW: "IN_REVIEW",
  RESOLVED: "RESOLVED",
  REJECTED: "REJECTED",
};

export function categoryLabel(cat) {
  switch (cat) {
    case PROBLEM_CATEGORIES.ROAD_INFRASTRUCTURE:
      return "Пътна инфраструктура";
    case PROBLEM_CATEGORIES.UTILITIES:
      return "Комунални услуги";
    case PROBLEM_CATEGORIES.PUBLIC_ORDER:
      return "Обществен ред";
    case PROBLEM_CATEGORIES.CLEANLINESS_WASTE:
      return "Чистота и отпадъци";
    case PROBLEM_CATEGORIES.APP_ISSUE:
      return "Проблем в приложението";
    case PROBLEM_CATEGORIES.OTHER:
      return "Друг проблем";
    default:
      return String(cat || "—");
  }
}

export function statusLabel(status) {
  switch (status) {
    case PROBLEM_REPORT_STATUSES.IN_REVIEW:
      return "Преглежда се";
    case PROBLEM_REPORT_STATUSES.RESOLVED:
      return "Решен";
    case PROBLEM_REPORT_STATUSES.REJECTED:
      return "Отхвърлен";
    default:
      return String(status || "—");
  }
}

export function formatDateTimeBG(isoDateTime) {
  try {
    const dt = new Date(isoDateTime);
    if (Number.isNaN(dt.getTime())) return String(isoDateTime || "");
    return dt.toLocaleString("bg-BG");
  } catch {
    return String(isoDateTime || "");
  }
}

export function normalizeCategoryFromRouteParam(param) {
  const p = String(param || "").trim();
  const all = Object.values(PROBLEM_CATEGORIES);
  return all.includes(p) ? p : null;
}
