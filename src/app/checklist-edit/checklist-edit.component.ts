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
    this.dataService.getUserData().subscribe(userData => {
      if (userData && userData.teacher_id) {
        this.teacher_id = userData.teacher_id;
        this.getSubjects(); // Retrieve subjects after getting teacher_id
      } else {
        console.error('ไม่พบข้อมูลผู้ใช้');
      }
    });
  }

  getChecklistData(itemId: string) {
    this.http.get<any>(`${this.dataService.apiUrl}/checklist-data/${itemId}`).subscribe((data) => {
      this.ChecklistUpdate = data;
      // Convert date from API format to Date object
      if (data.date) {
        this.ChecklistUpdate.date = new Date(data.date);
      }
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
    // Convert Date object to 'YYYY-MM-DD' format
    if (this.ChecklistUpdate.date instanceof Date) {
      // Use a helper function to correctly handle date formatting
      this.ChecklistUpdate.date = this.formatDate(this.ChecklistUpdate.date);
    }
  
    // Check if date conversion was successful
    if (typeof this.ChecklistUpdate.date === 'string' && this.ChecklistUpdate.date.length === 10) {
      this.http.put(`${this.dataService.apiUrl}/checklist-update/${this.ChecklistUpdate.checklist_id}`, this.ChecklistUpdate).subscribe(
        () => {
          Swal.fire(
            'แก้ไขรายการสำเร็จ!',
            'รายการถูกแก้ไขแล้ว',
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

  // Helper function to format date as 'YYYY-MM-DD'
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
