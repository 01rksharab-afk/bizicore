export interface CsvColumn {
  key: string;
  label: string;
}

/**
 * Exports data as a CSV file and triggers a browser download.
 *
 * @param filename  - Desired file name (without .csv extension)
 * @param columns   - Column definitions: key and display label
 * @param data      - Array of records to export
 */
export function exportToCsv(
  filename: string,
  columns: CsvColumn[],
  data: Record<string, unknown>[],
): void {
  // Build header row
  const header = columns.map((c) => escapeCsvValue(c.label)).join(",");

  // Build data rows
  const rows = data.map((row) =>
    columns
      .map((col) => {
        const value = row[col.key];
        return escapeCsvValue(value != null ? String(value) : "");
      })
      .join(","),
  );

  const csvContent = [header, ...rows].join("\r\n");

  // Create and trigger download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up object URL after download
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Escapes a value for safe inclusion in CSV.
 * Wraps in double-quotes if it contains commas, quotes, or newlines.
 */
function escapeCsvValue(value: string): string {
  if (
    value.includes(",") ||
    value.includes('"') ||
    value.includes("\n") ||
    value.includes("\r")
  ) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
