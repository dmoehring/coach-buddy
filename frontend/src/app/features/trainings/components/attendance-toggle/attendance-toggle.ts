import { Component, input, output } from '@angular/core';

import { AttendanceStatus } from '../../../../api/model/attendance-status';

interface Option {
  status: AttendanceStatus;
  label: string;
  title: string;
  icon: string;
  tone: 'present' | 'excused' | 'absent';
}

/** Three-way "dabei / entschuldigt / fehlt" switch used for every person on an attendance list. */
@Component({
  selector: 'app-attendance-toggle',
  templateUrl: './attendance-toggle.html',
  styleUrl: './attendance-toggle.scss'
})
export class AttendanceToggle {
  readonly status = input<AttendanceStatus | null>(null);
  readonly name = input('');
  readonly selected = output<AttendanceStatus>();

  readonly options: Option[] = [
    { status: AttendanceStatus.Present, label: 'Dabei', title: 'Anwesend', icon: 'pi pi-check', tone: 'present' },
    { status: AttendanceStatus.Excused, label: 'Entschuldigt', title: 'Entschuldigt', icon: 'pi pi-info-circle', tone: 'excused' },
    { status: AttendanceStatus.Absent, label: 'Fehlt', title: 'Unentschuldigt abwesend', icon: 'pi pi-times', tone: 'absent' }
  ];
}
