import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DataService } from '../service/data.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../service/auth.service';
import Swal from 'sweetalert2';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { DateAdapter } from '@angular/material/core';

@Component({
  selector: 'app-checklist-create',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule, MatDatepickerModule, MatNativeDateModule, MatInputModule],
  providers: [DataService, AuthService],
  templateUrl: './checklist-create.component.html',
  styleUrls: ['./checklist-create.component.scss']
})
export class ChecklistCreateComponent implements OnInit {
  title: string = '';
  detail: string = '';
  date: Date | null = null;
  time_start: string = '';
  time_end: string = '';
  teacher_id: string = '';
  teacher_name: string = '';
  subject_id: string = '';
  subjects: any[] = [];

  constructor(
    private data: DataService, 
    private authService: AuthService, 
    private http: HttpClient, 
    private router: Router,
    private dateAdapter: DateAdapter<Date>
  ) { 
    this.dateAdapter.setLocale('th-TH');
  }

  ngOnInit(): void {
    this.getTeacherInfo();
    this.getSubjects();
  }

  getSubjects() {
    this.http.get<any[]>(`${this.data.apiUrl}/subjects/${this.teacher_id}`).subscribe((data: any) => {
      this.subjects = data;
    });
  }

  getTeacherInfo() {
    this.data.getUserData().subscribe(
      (userData) => {
        if (userData && userData.teacher_id && userData.title && userData.fname && userData.lname) {
          this.teacher_id = userData.teacher_id;
          this.teacher_name = `${userData.title} ${userData.fname} ${userData.lname}`;
        } else {
          console.error('Teacher information not available');
        }
      },
      (error) => {
        console.error(error);
      }
    );
  }

  ChecklistAdd(): void {
    const formattedDate = this.formatDate(this.date);

    const ChecklistData = {
      title: this.title,
      detail: this.detail,
      date: formattedDate,
      time_start: this.time_start,
      time_end: this.time_end,
      subject_id: this.subject_id,
      teacher_id: this.teacher_id
    };

    this.http.post<any>(this.data.apiUrl + "/checklist-add", ChecklistData).subscribe(
      (response) => {
        Swal.fire({
          title: 'เพิ่มรายการเช็คชื่อใหม่สำเร็จ',
          text: 'บันทึกข้อมูลสำเร็จ',
          icon: 'success',
          confirmButtonText: 'ตกลง'
        }).then((result) => {
          if (result.isConfirmed) {
            this.router.navigate(['/checklist-manage']);
          }
        });
      },
      (error) => {
        Swal.fire({
          title: 'เกิดข้อผิดพลาด',
          text: 'ไม่สามารถบันทึกข้อมูลได้',
          icon: 'error',
          confirmButtonText: 'ตกลง'
        });
        console.error(error);
      }
    );
  }

  formatDate(date: Date | null): string {
    if (!date) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); 
    const year = date.getFullYear();
    return `${year}-${month}-${day}`; 
  }
}
