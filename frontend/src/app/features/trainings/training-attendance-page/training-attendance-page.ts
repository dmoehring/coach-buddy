import { Component, computed, effect, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';

import { TeamMembershipsService } from '../../../api/api/team-memberships.service';
import { TrainingParticipantsService } from '../../../api/api/training-participants.service';
import { TrainingsService } from '../../../api/api/trainings.service';
import { AttendanceStatus } from '../../../api/model/attendance-status';
import { TeamMemberRole } from '../../../api/model/team-member-role';
import { TrainingStatus } from '../../../api/model/training-status';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { CsvExportService } from '../../../shared/util/export.service';
import {
  ROLE_LABELS,
  formatDate,
  initials,
  isGameDay,
  personName,
  timeRange,
  trainingLink,
  trainingTitle,
  weekday
} from '../../../shared/util/format';
import { AttendanceToggle } from '../components/attendance-toggle/attendance-toggle';
import { AttendanceEntry, AttendanceSession } from '../attendance-session';

@Component({
  selector: 'app-training-attendance-page',
  imports: [RouterLink, ButtonModule, PageHeader, AttendanceToggle],
  templateUrl: './training-attendance-page.html',
  styleUrl: './training-attendance-page.scss'
})
export class TrainingAttendancePage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly csv = inject(CsvExportService);

  readonly trainingId = this.route.snapshot.paramMap.get('id') ?? '';
  readonly returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/trainings';

  readonly session = new AttendanceSession(
    {
      trainings: inject(TrainingsService),
      memberships: inject(TeamMembershipsService),
      participants: inject(TrainingParticipantsService)
    },
    this.trainingId
  );

  readonly Cancelled = TrainingStatus.Cancelled;

  readonly present = computed(() => AttendanceSession.countByStatus(this.session.players(), AttendanceStatus.Present));
  readonly excused = computed(() => AttendanceSession.countByStatus(this.session.players(), AttendanceStatus.Excused));
  readonly absent = computed(() => AttendanceSession.countByStatus(this.session.players(), AttendanceStatus.Absent));
  readonly open = computed(() => AttendanceSession.countByStatus(this.session.players(), null));
  readonly staffPresent = computed(() => AttendanceSession.countByStatus(this.session.staff(), AttendanceStatus.Present));

  readonly title = computed(() => {
    const training = this.session.training();

    return training ? trainingTitle(training) : 'Anwesenheit';
  });

  readonly subtitle = computed(() => {
    const training = this.session.training();

    if (!training) {
      return null;
    }

    const when = `${weekday(training.trainingDate)}, ${formatDate(training.trainingDate)}`;

    return [when, timeRange(training.startTime, training.endTime), training.location]
      .filter(Boolean)
      .join(' · ');
  });

  constructor() {
    // Game days have their own page with the extra fields; follow links that still point here.
    effect(() => {
      const training = this.session.training();

      if (training && isGameDay(training)) {
        this.router.navigate(trainingLink(training), { replaceUrl: true, queryParamsHandling: 'preserve' });
      }
    });
  }

  exportParticipants(): void {
    this.csv.trainingParticipants(this.trainingId);
  }

  select(entry: AttendanceEntry, status: AttendanceStatus): void {
    this.session.setStatus(entry, status);
  }

  markAllPresent(): void {
    this.session.markUnrecordedPresent(this.session.entries());
  }

  name(entry: AttendanceEntry): string {
    return personName(entry.person);
  }

  initials(entry: AttendanceEntry): string {
    return initials(entry.person);
  }

  roleLabel(role: TeamMemberRole): string {
    return ROLE_LABELS[role];
  }
}
