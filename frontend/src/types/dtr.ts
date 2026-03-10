export type DTRStatus = 'Present' | 'Absent' | 'Leave' | 'Holiday';

export interface DailyTimeRecord {
  dtr_id: number;
  user_id: string; // uuid
  date: Date;
  clock_in_time: Date;
  clock_out_time?: Date;
  hours_rendered: number;
  status: DTRStatus;
  daily_activity_summary?: string;
}