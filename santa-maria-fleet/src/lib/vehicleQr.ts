const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function cleanValue(value: string) {
  return value.trim().replace(/^vehicle:/i, "").trim();
}

export function normalizeVehicleQrValue(rawValue: string): string {
  const cleaned = cleanValue(rawValue);

  if (UUID_REGEX.test(cleaned)) {
    return cleaned;
  }

  try {
    const parsed = JSON.parse(cleaned);
    const candidate = parsed?.vehicleId || parsed?.id || parsed?.veiculo_id || parsed?.plate || parsed?.placa;
    if (typeof candidate === "string" && candidate.trim()) {
      return cleanValue(candidate);
    }
  } catch {
    // not json
  }

  try {
    const url = new URL(cleaned);
    const candidate = url.searchParams.get("vehicleId") || url.searchParams.get("id") || url.searchParams.get("placa");
    if (candidate) {
      return cleanValue(candidate);
    }

    const lastSegment = url.pathname.split("/").filter(Boolean).pop();
    if (lastSegment) {
      return cleanValue(lastSegment);
    }
  } catch {
    // not url
  }

  return cleaned;
}

export function isVehicleUuid(value: string) {
  return UUID_REGEX.test(value);
}

export function normalizeVehiclePlate(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}