import { toast } from 'sonner';
import * as XLSX from 'xlsx';
/**
 * Triggers a browser download for the given data as an Excel (.xlsx) file.
 * @param data The array of objects to export.
 * @param headers An object mapping data keys to user-friendly header names.
 * @param fileName The name of the file to be downloaded (without extension).
 */
export function exportToExcel(data: any[], headers: Record<string, string>, fileName: string) {
  try {
    // Map the data to use the user-friendly headers as keys
    const mappedData = data.map(row => {
      const newRow: { [key: string]: any } = {};
      for (const key in headers) {
        if (Object.prototype.hasOwnProperty.call(row, key)) {
          newRow[headers[key]] = row[key];
        }
      }
      return newRow;
    });
    // Create a worksheet from the mapped JSON data
    const worksheet = XLSX.utils.json_to_sheet(mappedData);
    // Create a new workbook
    const workbook = XLSX.utils.book_new();
    // Append the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Projects');
    // Write the workbook and trigger the download
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
    toast.success('Excel report generated successfully!');
  } catch (error) {
    console.error("Error generating Excel report:", error);
    toast.error('Failed to generate report.');
  }
}