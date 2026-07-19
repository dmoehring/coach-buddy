export type TrainingStatus = 'COMPLETED' | 'CANCELLED';

export interface DashboardMetric {
  label: string;
  value: string;
  description: string;
  icon: string;
}

export interface DashboardTraining {
  date: string;
  weekday: string;
  team: string;
  location: string;
  status: TrainingStatus;
  present: number;
  excused: number;
  absent: number;
}

export interface DashboardQuickAction {
  label: string;
  description: string;
  icon: string;
  route: string;
  primary?: boolean;
}
