export interface Checklist {
    checklist_id: number;
    title: string;
    detail: string;
    date: string;
    time_start: string;
    time_end: string;
    subject_time_start: string;
    subject_time_end: string;
    teacher_id: number;
    subject_id: number;
    status?: string; // Optional status field
}