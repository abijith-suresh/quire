import { saveAs } from "file-saver";
import type { PDFOperationResult } from "../types/interfaces";

export function downloadPDF(result: PDFOperationResult): void {
  const blob = new Blob([result.data], { type: "application/pdf" });
  saveAs(blob, result.suggestedFileName);
}
