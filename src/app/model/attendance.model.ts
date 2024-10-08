import { Time } from "@angular/common";

export interface Attendance {
    attendance_id : number;
    time_attendance: Time;
    date_attendance:Date;
    status: string;
    std_id : number;
    img_attendance: string;
    checklist_id : string;
}