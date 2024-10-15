import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { DataService } from '../service/data.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-checklist-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDatepickerModule, MatNativeDateModule, MatFormFieldModule, MatInputModule,RouterLink],
  providers: [DataService],
  templateUrl: './checklist-edit.component.html',
  styleUrls: ['./checklist-edit.component.scss']
})
export class ChecklistEditComponent implements OnInit {
  ChecklistUpdate: any = {};
  subjects: any[] = [];
  teacher_id: string = '';
  time_start: string = '';
  time_end: string = '';
  subject_time_start: string = '';
  subject_time_end: string = ''; 

  constructor(
    private dataService: DataService, 
    private http: HttpClient, 
    private route: ActivatedRoute, 
    private router: Router,
    private dateAdapter: DateAdapter<Date>
  ) { 
    this.dateAdapter.setLocale('th-TH');
  }

  ngOnInit() {
    this.route.params.subscribe((params) => {
      const itemId = params['id'];
      this.getUserData(); // Retrieve user data to get teacher_id
      this.getChecklistData(itemId);
    });
  }

  getUserData() {
    Swal.fire({
      title: 'กำลังโหลดข้อมูล...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.dataService.getUserData().subscribe(userData => {
      if (userData && userData.teacher_id) {
        this.teacher_id = userData.teacher_id;
        this.getSubjects(); // Retrieve subjects after getting teacher_id
        Swal.close(); // Close the loading popup when data is loaded
      } else {
        console.error('ไม่พบข้อมูลผู้ใช้');
        Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถดึงข้อมูลผู้ใช้ได้', 'error');
      }
    });
  }

  getChecklistData(itemId: string) {
    Swal.fire({
      title: 'กำลังโหลดข้อมูลเช็คชื่อ...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.http.get<any>(`${this.dataService.apiUrl}/checklist-data/${itemId}`).subscribe((data) => {
      this.ChecklistUpdate = data;
      if (data.date) {
        this.ChecklistUpdate.date = new Date(data.date);
      }
      Swal.close(); // Close loading when data is received
    }, (error) => {
      Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลได้', 'error');
    });
  }

  getSubjects() {
    if (this.teacher_id) {
      this.http.get<any[]>(`${this.dataService.apiUrl}/subjects/${this.teacher_id}`).subscribe((data) => {
        this.subjects = data;
      });
    }
  }

  UpdateChecklist() {
    // ตรวจสอบว่าเวลาเริ่มต้นไม่เกินเวลาสิ้นสุด
    if (this.ChecklistUpdate.time_start >= this.ChecklistUpdate.time_end) {
      Swal.fire({
          title: 'เกิดข้อผิดพลาด',
          text: 'เวลาเริ่มต้นการเช็คชื่อห้ามเกินหรือเท่ากับเวลาสิ้นสุด',
          icon: 'error',
          confirmButtonText: 'ตกลง'
      });
      return;
    }

    if (this.ChecklistUpdate.subject_time_start >= this.ChecklistUpdate.subject_time_end) {
      Swal.fire({
          title: 'เกิดข้อผิดพลาด',
          text: 'เวลาเริ่มต้นวิชาห้ามเกินหรือเท่ากับเวลาสิ้นสุดวิชา',
          icon: 'error',
          confirmButtonText: 'ตกลง'
      });
      return;
    }

    // Convert Date object to 'YYYY-MM-DD' format
    if (this.ChecklistUpdate.date instanceof Date) {
      this.ChecklistUpdate.date = this.formatDate(this.ChecklistUpdate.date);
    }

    if (typeof this.ChecklistUpdate.date === 'string' && this.ChecklistUpdate.date.length === 10) {
      Swal.fire({
        title: 'กำลังบันทึกข้อมูล...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      this.http.put(`${this.dataService.apiUrl}/checklist-update/${this.ChecklistUpdate.checklist_id}`, this.ChecklistUpdate).subscribe(
        () => {
          Swal.fire(
            'แก้ไขข้อมูลรายการเช็คชื่อสำเร็จ!',
            'ข้อมูลถูกแก้ไขแล้ว',
            'success'
          ).then(() => {
            this.router.navigate(['/checklist-manage']);
          });
        },
        (error) => {
          Swal.fire(
            'เกิดข้อผิดพลาด',
            'ไม่สามารถแก้ไขรายการได้',
            'error'
          );
        }
      );
    } else {
      Swal.fire(
        'วันที่ไม่ถูกต้อง',
        'กรุณาตรวจสอบวันที่ที่เลือก',
        'warning'
      );
    }
}

// UpdateChecklist() {
//   const today = new Date();
//   today.setHours(0, 0, 0, 0); // ตั้งเวลาของวันนี้เป็น 00:00:00 เพื่อตรวจสอบเฉพาะวันที่

//   // ตรวจสอบว่าไม่สามารถเลือกวันที่ย้อนหลังได้
//   if (this.ChecklistUpdate.date instanceof Date) {
//     // ตรวจสอบวันที่ห้ามย้อนหลัง แต่สามารถเป็นวันนี้ได้
//     const selectedDate = new Date(this.ChecklistUpdate.date);
//     selectedDate.setHours(0, 0, 0, 0);

//     if (selectedDate < today) {
//       Swal.fire({
//         title: 'วันที่ไม่ถูกต้อง',
//         text: 'ไม่สามารถเลือกวันที่ย้อนหลังได้',
//         icon: 'error',
//         confirmButtonText: 'ตกลง'
//       });
//       return;
//     }
//   }

//   // ตรวจสอบว่าเวลาเริ่มต้นไม่เกินเวลาสิ้นสุด
//   if (this.ChecklistUpdate.time_start >= this.ChecklistUpdate.time_end) {
//     Swal.fire({
//         title: 'เกิดข้อผิดพลาด',
//         text: 'เวลาเริ่มต้นการเช็คชื่อห้ามเกินหรือเท่ากับเวลาสิ้นสุด',
//         icon: 'error',
//         confirmButtonText: 'ตกลง'
//     });
//     return;
//   }

//   if (this.ChecklistUpdate.subject_time_start >= this.ChecklistUpdate.subject_time_end) {
//     Swal.fire({
//         title: 'เกิดข้อผิดพลาด',
//         text: 'เวลาเริ่มต้นวิชาห้ามเกินหรือเท่ากับเวลาสิ้นสุดวิชา',
//         icon: 'error',
//         confirmButtonText: 'ตกลง'
//     });
//     return;
//   }

//   // Convert Date object to 'YYYY-MM-DD' format
//   if (this.ChecklistUpdate.date instanceof Date) {
//     this.ChecklistUpdate.date = this.formatDate(this.ChecklistUpdate.date);
//   }

//   if (typeof this.ChecklistUpdate.date === 'string' && this.ChecklistUpdate.date.length === 10) {
//     Swal.fire({
//       title: 'กำลังบันทึกข้อมูล...',
//       allowOutsideClick: false,
//       didOpen: () => {
//         Swal.showLoading();
//       }
//     });

//     this.http.put(`${this.dataService.apiUrl}/checklist-update/${this.ChecklistUpdate.checklist_id}`, this.ChecklistUpdate).subscribe(
//       () => {
//         Swal.fire(
//           'แก้ไขข้อมูลรายการเช็คชื่อสำเร็จ!',
//           'ข้อมูลถูกแก้ไขแล้ว',
//           'success'
//         ).then(() => {
//           this.router.navigate(['/checklist-manage']);
//         });
//       },
//       (error) => {
//         Swal.fire(
//           'เกิดข้อผิดพลาด',
//           'ไม่สามารถแก้ไขรายการได้',
//           'error'
//         );
//       }
//     );
//   } else {
//     Swal.fire(
//       'วันที่ไม่ถูกต้อง',
//       'กรุณาตรวจสอบวันที่ที่เลือก',
//       'warning'
//     );
//   }
// }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
