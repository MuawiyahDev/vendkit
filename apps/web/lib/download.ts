export interface DownloadableCsv {
  fileName: string;
  content: string;
}

/**
 * Triggers a client-side CSV download. A UTF-8 BOM keeps non-ASCII names and
 * currency symbols readable when the file is opened directly in Excel.
 */
export function downloadCsv({ fileName, content }: DownloadableCsv): void {
  const blob = new Blob([`\uFEFF${content}`], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
