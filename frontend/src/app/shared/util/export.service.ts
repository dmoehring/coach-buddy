import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpResponse } from '@angular/common/http';

import { ExportsService } from '../../api/api/exports.service';
import { fileNameFrom, saveBlob } from './download';

// The generated client would otherwise ask for JSON, which the CSV endpoints answer with 406.
const CSV_ACCEPT = { httpHeaderAccept: 'text/csv;charset=UTF-8' as const };

/**
 * Downloads the CSV exports. The endpoints need the bearer token, so the file can't
 * just be opened via a link — it is fetched through HttpClient and saved as a blob.
 */
@Injectable({ providedIn: 'root' })
export class CsvExportService {
  private readonly exportsApi = inject(ExportsService);

  readonly busy = signal(false);
  readonly error = signal<string | null>(null);

  members(teamId?: string, activeOnly = true): void {
    this.run(
      this.exportsApi.apiV1ExportsMembersGet(activeOnly, teamId, 'response', false, CSV_ACCEPT),
      'mitglieder.csv'
    );
  }

  trainingParticipants(trainingId: string, onlyPresent = true): void {
    this.run(
      this.exportsApi.apiV1ExportsTrainingsIdParticipantsGet(trainingId, onlyPresent, 'response', false, CSV_ACCEPT),
      'teilnehmer.csv'
    );
  }

  teamAttendance(teamId: string): void {
    this.run(
      this.exportsApi.apiV1ExportsTeamsIdAttendanceGet(teamId, 'response', false, CSV_ACCEPT),
      'anwesenheit.csv'
    );
  }

  private run(request: Observable<HttpResponse<Blob>>, fallbackName: string): void {
    this.busy.set(true);
    this.error.set(null);

    request.subscribe({
      next: response => {
        if (response.body) {
          saveBlob(response.body, fileNameFrom(response, fallbackName));
        }
        this.busy.set(false);
      },
      error: error => {
        console.error('Export failed:', error);
        this.error.set('Der Export konnte nicht erstellt werden.');
        this.busy.set(false);
      }
    });
  }
}
