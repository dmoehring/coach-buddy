import { HttpResponse } from '@angular/common/http';

/** Saves a blob as a file via a temporary link. */
export function saveBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/** Reads the file name from `Content-Disposition: attachment; filename="x.csv"`. */
export function fileNameFrom(response: HttpResponse<Blob>, fallback: string): string {
  const header = response.headers.get('Content-Disposition') ?? '';
  const match = /filename="?([^";]+)"?/i.exec(header);

  return match?.[1] ?? fallback;
}
