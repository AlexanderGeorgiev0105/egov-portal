const KEY = "demo_properties_v1";

export function loadProperties() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveProperties(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function addProperty(property) {
  const current = loadProperties();
  const updated = [property, ...current];
  saveProperties(updated);
  return updated;
}

export function removeProperty(propertyId) {
  const current = loadProperties();
  const updated = current.filter((p) => p.id !== propertyId);
  saveProperties(updated);
  return updated;
}

export function loadPropertiesByUser(userId) {
  return loadProperties().filter((p) => p.userId === userId);
}

export function clearAllProperties() {
  localStorage.removeItem(KEY);
}
