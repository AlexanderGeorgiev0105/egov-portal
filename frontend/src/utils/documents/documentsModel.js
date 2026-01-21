// frontend/src/utils/documents/documentsModel.js

export const DOCUMENT_TYPES = {
  ID_CARD: "ID_CARD",
  PASSPORT: "PASSPORT",
  DRIVER_LICENSE: "DRIVER_LICENSE",
};

export const GENDERS = {
  MALE: "male",
  FEMALE: "female",
  OTHER: "other",
};

export const DOCUMENT_REQUEST_STATUSES = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
};

export const DOCUMENT_REQUEST_KINDS = {
  ADD_DOCUMENT: "ADD_DOCUMENT",
  REMOVE_DOCUMENT: "REMOVE_DOCUMENT",
};

export const DRIVER_CATEGORIES = [
  "AM",
  "A1",
  "A2",
  "A",
  "B1",
  "B",
  "BE",
  "C1",
  "C1E",
  "C",
  "CE",
  "D1",
  "D1E",
  "D",
  "DE",
  "T",
];

export const REMOVE_DOCUMENT_REASONS = [
  "Подновяване",
  "Смяна на адрес",
  "Изгубен документ",
  "Кражба",
  "Повреден документ",
  "Изтекла валидност",
  "Друго",
];

export function documentTypeLabel(type) {
  switch (type) {
    case DOCUMENT_TYPES.ID_CARD:
      return "Лична карта";
    case DOCUMENT_TYPES.PASSPORT:
      return "Паспорт";
    case DOCUMENT_TYPES.DRIVER_LICENSE:
      return "Шофьорска книжка";
    default:
      return type || "—";
  }
}

export function genderLabel(g) {
  switch (g) {
    case GENDERS.MALE:
      return "Мъж";
    case GENDERS.FEMALE:
      return "Жена";
    case GENDERS.OTHER:
      return "Друго";
    default:
      return g || "—";
  }
}

export function requestStatusLabel(status) {
  switch (status) {
    case DOCUMENT_REQUEST_STATUSES.PENDING:
      return "Чака проверка";
    case DOCUMENT_REQUEST_STATUSES.APPROVED:
      return "Одобрена";
    case DOCUMENT_REQUEST_STATUSES.REJECTED:
      return "Отказана";
    default:
      return status || "—";
  }
}

export function kindLabel(kind) {
  switch (kind) {
    case DOCUMENT_REQUEST_KINDS.ADD_DOCUMENT:
      return "Добавяне";
    case DOCUMENT_REQUEST_KINDS.REMOVE_DOCUMENT:
      return "Премахване";
    default:
      return kind || "—";
  }
}

export function isExpired(validUntil) {
  if (!validUntil) return false;
  try {
    const d = new Date(validUntil + "T00:00:00");
    if (Number.isNaN(d.getTime())) return false;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return d < startOfToday;
  } catch {
    return false;
  }
}

export function formatDateBG(isoDate) {
  if (!isoDate) return "—";
  try {
    const d = new Date(isoDate + "T00:00:00");
    return d.toLocaleDateString("bg-BG");
  } catch {
    return isoDate;
  }
}
