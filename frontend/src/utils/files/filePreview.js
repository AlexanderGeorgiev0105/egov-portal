// src/utils/files/filePreview.js

export function openBlobInNewTab(blob, filename = "file") {
  if (!blob) throw new Error("Липсва файл.");

  const url = URL.createObjectURL(blob);
  const w = window.open(url, "_blank", "noopener,noreferrer");

  // If popup blocked, fallback to same tab
  if (!w) {
    window.location.href = url;
  }

  // revoke later to allow the browser to load it
  setTimeout(() => {
    try {
      URL.revokeObjectURL(url);
    } catch {}
  }, 60_000);

  return { url, filename };
}
