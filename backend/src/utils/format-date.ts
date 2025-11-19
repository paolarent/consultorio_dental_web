export function formatFechaLocal(dateValue: Date | string): string {
    if (!dateValue) return "";

    // convertir a string seguro en formato ISO
    const iso = typeof dateValue === "string"
        ? dateValue
        : dateValue.toISOString();

    // extraer (YYYY-MM-DD)
    const [year, month, day] = iso.substring(0, 10).split("-").map(Number);

    // construir la fecha *local* sin zona
    const localDate = new Date(year, month - 1, day);

    return localDate.toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    }).replace(".", "");
}
