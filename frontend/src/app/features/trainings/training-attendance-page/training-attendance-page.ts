import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';

type AttendanceStatus = 'PRESENT' | 'EXCUSED' | 'ABSENT';
type TrainingStatus = 'COMPLETED' | 'CANCELLED';
type TeamMemberRole = 'PLAYER' | 'COACH' | 'ASSISTANT_COACH';

interface TrainingDetails {
  id: string;
  trainingDate: string;
  weekday: string;
  teamName: string;
  timeRange: string;
  location: string;
  status: TrainingStatus;
}

interface TrainingParticipantEntry {
  personId: string;
  firstName: string;
  lastName: string;
  role: TeamMemberRole;
  attendanceStatus: AttendanceStatus;
}

@Component({
  selector: 'app-training-attendance-page',
  imports: [
    RouterLink,
    ButtonModule,
    CardModule,
    TagModule
  ],
  templateUrl: './training-attendance-page.html',
  styleUrl: './training-attendance-page.scss'
})
export class TrainingAttendancePage {
  private readonly route = inject(ActivatedRoute);

  readonly trainingId = this.route.snapshot.paramMap.get('id') ?? '';

  readonly training: TrainingDetails = {
    id: this.trainingId,
    trainingDate: '24.05.2026',
    weekday: 'Sonntag',
    teamName: 'Minis',
    timeRange: '10:00 - 11:30',
    location: 'Realschulhalle',
    status: 'COMPLETED'
  };

  readonly participants: TrainingParticipantEntry[] = [
    {
      personId: 'person-1',
      firstName: 'Max',
      lastName: 'Müller',
      role: 'PLAYER',
      attendanceStatus: 'ABSENT'
    },
    {
      personId: 'person-2',
      firstName: 'Lena',
      lastName: 'Schmidt',
      role: 'PLAYER',
      attendanceStatus: 'ABSENT'
    },
    {
      personId: 'person-3',
      firstName: 'Tom',
      lastName: 'Becker',
      role: 'PLAYER',
      attendanceStatus: 'ABSENT'
    },
    {
      personId: 'person-4',
      firstName: 'Mia',
      lastName: 'Wagner',
      role: 'PLAYER',
      attendanceStatus: 'ABSENT'
    },
    {
      personId: 'person-5',
      firstName: 'Thomas',
      lastName: 'Müller',
      role: 'COACH',
      attendanceStatus: 'PRESENT'
    },
    {
      personId: 'person-6',
      firstName: 'Anna',
      lastName: 'Schmidt',
      role: 'ASSISTANT_COACH',
      attendanceStatus: 'PRESENT'
    }
  ];

  get playerParticipants(): TrainingParticipantEntry[] {
    return this.participants.filter(participant => participant.role === 'PLAYER');
  }

  get trainerParticipants(): TrainingParticipantEntry[] {
    return this.participants.filter(participant => participant.role !== 'PLAYER');
  }

  get presentPlayersCount(): number {
    return this.playerParticipants.filter(participant => participant.attendanceStatus === 'PRESENT').length;
  }

  get excusedPlayersCount(): number {
    return this.playerParticipants.filter(participant => participant.attendanceStatus === 'EXCUSED').length;
  }

  get absentPlayersCount(): number {
    return this.playerParticipants.filter(participant => participant.attendanceStatus === 'ABSENT').length;
  }

  get presentTrainersCount(): number {
    return this.trainerParticipants.filter(participant => participant.attendanceStatus === 'PRESENT').length;
  }

  get excusedTrainersCount(): number {
    return this.trainerParticipants.filter(participant => participant.attendanceStatus === 'EXCUSED').length;
  }

  get absentTrainersCount(): number {
    return this.trainerParticipants.filter(participant => participant.attendanceStatus === 'ABSENT').length;
  }

  setAttendance(participant: TrainingParticipantEntry, attendanceStatus: AttendanceStatus): void {
    participant.attendanceStatus = attendanceStatus;
  }

  saveAttendance(): void {
    console.log('Attendance saved for training:', this.trainingId, this.participants);
  }

  getAttendanceLabel(status: AttendanceStatus): string {
    switch (status) {
      case 'PRESENT':
        return 'Anwesend';
      case 'EXCUSED':
        return 'Entschuldigt';
      case 'ABSENT':
        return 'Unentschuldigt';
    }
  }

  getAttendanceSeverity(status: AttendanceStatus): 'success' | 'warn' | 'danger' {
    switch (status) {
      case 'PRESENT':
        return 'success';
      case 'EXCUSED':
        return 'warn';
      case 'ABSENT':
        return 'danger';
    }
  }

  getRoleLabel(role: TeamMemberRole): string {
    switch (role) {
      case 'PLAYER':
        return 'Teilnehmer';
      case 'COACH':
        return 'Trainer';
      case 'ASSISTANT_COACH':
        return 'Helfer';
    }
  }

  getTrainingStatusLabel(status: TrainingStatus): string {
    return status === 'COMPLETED' ? 'Stattgefunden' : 'Ausgefallen';
  }

  getTrainingStatusSeverity(status: TrainingStatus): 'success' | 'danger' {
    return status === 'COMPLETED' ? 'success' : 'danger';
  }
}
