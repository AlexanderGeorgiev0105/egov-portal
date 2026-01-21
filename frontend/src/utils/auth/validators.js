// src/utils/validators.js

export function isValidEGN(value) {
  const v = String(value || "").trim();
  return /^\d{10}$/.test(v);
}

// Българските номера използват латиница от ограничен набор букви:
// A B E K M H O P C T Y X
const BG_PLATE_LETTERS = "ABEKMHOPCTYX";
const PLATE_RE = new RegExp(`^[${BG_PLATE_LETTERS}]{1,2}\\d{4}[${BG_PLATE_LETTERS}]{2}$`);

export function normalizeBulgarianRegNumber(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/-/g, "");
}

export function isValidBulgarianRegNumber(value) {
  const v = normalizeBulgarianRegNumber(value);
  return PLATE_RE.test(v);
}

export function isPdfFile(file) {
  if (!file) return false;
  const name = String(file.name || "").toLowerCase();
  const type = String(file.type || "").toLowerCase();
  return type === "application/pdf" || name.endsWith(".pdf");
}

export function validatePdfFile(file, maxBytes = 25 * 1024 * 1024) {
  if (!file) return "Файлът е задължителен.";
  if (!isPdfFile(file)) return "Позволен е само PDF файл.";
  if (Number(file.size) > Number(maxBytes)) return `Файлът е твърде голям. Максимум ${Math.round(maxBytes / (1024 * 1024))}MB.`;
  return "";
}
