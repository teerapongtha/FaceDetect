import { Time } from "@angular/common";

export interface Subject {
    id_subject: number;
    subject_name: string;
    subject_engname: string;
    time_start: string;
    time_end: string;
    title: string;
    fname: string;
    lname: string;
    section: string; // Add these fields
    semester: string;
    year: string;
  }
  
