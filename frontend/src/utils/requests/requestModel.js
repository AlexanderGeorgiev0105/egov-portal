export const REQUEST_STATUSES = {
    SUBMITTED: "SUBMITTED",
    PROCESSING: "PROCESSING",
    APPROVED: "APPROVED",
    REJECTED: "REJECTED",
    CANCELLED: "CANCELLED",
  };
  
  export function getStatusLabel(status) {
    switch (status) {
      case REQUEST_STATUSES.SUBMITTED:
        return "Подадена";
      case REQUEST_STATUSES.PROCESSING:
        return "В обработка";
      case REQUEST_STATUSES.APPROVED:
        return "Одобрена";
      case REQUEST_STATUSES.REJECTED:
        return "Отказана";
      case REQUEST_STATUSES.CANCELLED:
        return "Отказана от потребителя";
      default:
        return status;
    }
  }
  
  // Проста функция за уникално ID (за demo е достатъчно)
  export function generateRequestId() {
    return `req_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  }
  
  // Форматиране на дата за таблицата
  export function formatDateTime(isoString) {
    try {
      const d = new Date(isoString);
      return d.toLocaleString();
    } catch {
      return isoString;
    }
  }
  
  /**
   * Request shape (пример):
   * {
   *   id: "req_...",
   *   createdAt: "2025-12-17T10:00:00.000Z",
   *   status: "SUBMITTED",
   *   service: { id: "hlth-1", title: "..." },
   *   applicant: { fullName: "...", egn: "..." },
   *   details: "..."
   * }
   */
  export function buildRequest({ service, fullName, egn, details }) {
    return {
      id: generateRequestId(),
      createdAt: new Date().toISOString(),
      status: REQUEST_STATUSES.SUBMITTED,
      service: {
        id: service.id,
        title: service.title,
      },
      applicant: {
        fullName: fullName.trim(),
        egn: egn.trim(),
      },
      details: (details || "").trim(),
    };
  }
  export function canUserCancel(status) {
    return status === REQUEST_STATUSES.SUBMITTED;
  }
  
  export function canAdminProcess(status) {
    return status === REQUEST_STATUSES.SUBMITTED;
  }
  
  export function canAdminApproveOrReject(status) {
    return status === REQUEST_STATUSES.PROCESSING;
  }
  
  