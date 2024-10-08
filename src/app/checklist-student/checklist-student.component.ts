import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Checklist } from '../model/checklist.model';
import { DataService } from '../service/data.service';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-checklist-student',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  providers: [DataService],
  templateUrl: './checklist-student.component.html',
  styleUrls: ['./checklist-student.component.scss']
})
export class ChecklistStudentComponent implements OnInit {
  checklists: Checklist[] = [];
  filteredChecklists: Checklist[] = [];
  subjects: any[] = [];
  selectedSubjectId: any = '';
  currentTime: Date = new Date();
  user_id: any;
  searchTitle: string = '';
  searchDate: string = '';
  subjectTimes: { [key: string]: { time_start: string, time_end: string } } = {};
  pastAttendancesUpdated: boolean = false; // Flag to track if past attendances have been updated

  constructor(private dataService: DataService, private http: HttpClient, private route: Router) { }

  ngOnInit() {
    this.getUserData();
    this.getCurrentTime();
  }

  getUserData() {
    this.dataService.getUserData().subscribe(userData => {
      if (userData) {
        this.user_id = userData.std_id;
        this.getSubjects(this.user_id);
      } else {
        console.error('ไม่พบข้อมูลผู้ใช้');
      }
    });
  }

  getSubjects(std_id: any) {
    this.http.get<any[]>(`${this.dataService.apiUrl}/subject-student-list/${std_id}`).subscribe(
      (data) => {
        this.subjects = data;
        if (this.subjects.length === 0) {
          this.checklists = [];
          alert('คุณยังไม่ได้ลงทะเบียนวิชาใดๆ');
        } else {
          this.loadChecklist();
        }
      },
      (error) => {
        console.error('เกิดข้อผิดพลาดในการดึงรายวิชา:', error);
      }
    );
  }

  loadChecklist() {
    if (!this.selectedSubjectId) {
      this.checklists = [];
      this.filteredChecklists = [];
      return;
    }
  
    // แสดง loading message
    Swal.fire({
      title: 'กรุณารอซักครู่',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
  
    // อัปเดตข้อมูลเช็คชื่อย้อนหลังก่อนโหลดเช็คชื่อ
    this.updatePastAttendances().then(() => {
      // โหลดข้อมูล checklist หลังจากการบันทึกเสร็จสิ้น
      this.http.get<any>(`${this.dataService.apiUrl}/subject-time/${this.selectedSubjectId}`).subscribe(
        (times) => {
          this.subjectTimes[this.selectedSubjectId] = times;
          const url = `${this.dataService.apiUrl}/checklist-data/student/${this.user_id}/subject/${this.selectedSubjectId}`;
  
          this.http.get<Checklist[]>(url).subscribe(
            (data) => {
              this.checklists = data; // แสดงข้อมูลเช็คชื่อทั้งหมด
              this.applySearch(); // ทำการกรองตามการค้นหาถ้ามี
              Swal.close(); // ปิด loading message
            },
            (error) => {
              console.error('เกิดข้อผิดพลาดในการดึงข้อมูลเช็คชื่อ:', error);
              if (error.status === 404) {
                this.checklists = [];
                this.filteredChecklists = [];
              }
              Swal.close(); // ปิด loading message
            }
          );
        },
        (error) => {
          console.error('เกิดข้อผิดพลาดในการดึงเวลา:', error);
          Swal.close(); // ปิด loading message
        }
      );
    });
  }

  onSubjectChange(event: any) {
    this.selectedSubjectId = event.target.value;
    this.loadChecklist();

    // Update past attendances only when a new subject is selected
    this.updatePastAttendances();
  }

  searchChecklist() {
    this.applySearch();
  }

  getSubjectName(subject_id: any): string {
    const subject = this.subjects.find(s => s.subject_id === subject_id);
    return subject ? subject.subject_name : '';
  }

  formatDateThai(date: string): string {
    const months = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    const [year, month, day] = date.split('-').map(Number);
    const thaiYear = year + 543;
    const thaiMonth = months[month - 1];
    return `${day} ${thaiMonth} ${thaiYear}`;
  }

  getCurrentDate(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getCurrentDateThai(): string {
    const date = new Date();
    const months = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    const thaiYear = date.getFullYear() + 543; // แปลงปี
    const thaiMonth = months[date.getMonth()];
    const day = date.getDate();
    return `${day} ${thaiMonth} ${thaiYear}`;
  }

  getCurrentTime() {
    setInterval(() => {
      this.currentTime = new Date();
    }, 1000);
  }

  applySearch() {
    this.filteredChecklists = this.checklists.filter(checklist => {
      const matchesTitle = checklist.title.toLowerCase().includes(this.searchTitle.toLowerCase());
      const matchesDate = this.searchDate ? checklist.date === this.searchDate : true;
      return matchesTitle && matchesDate;
    });
  }

  resetSearch() {
    this.searchTitle = '';
    this.searchDate = '';
    this.applySearch();
  }

  checkAttendance(checklist: Checklist, std_id: any) {
    const currentDate = new Date();
    const checklistDate = new Date(checklist.date);
    const subjectTimes = this.subjectTimes[this.selectedSubjectId] || {};
  
    if (currentDate.toDateString() !== checklistDate.toDateString()) {
      if (currentDate < checklistDate) {
        Swal.fire({
          icon: 'warning',
          title: 'ไม่สามารถเช็คชื่อได้',
          text: 'ยังไม่ถึงวันที่เช็คชื่อ'
        });
        return;
      } else if (currentDate > checklistDate) {
        Swal.fire({
          icon: 'warning',
          title: 'ไม่สามารถเช็คชื่อได้',
          text: 'วันที่เช็คชื่อได้ผ่านมาแล้ว'
        }).then(() => {
          this.loadChecklist();
        });
        return;
      }
    }
  
    const currentTimeStr = currentDate.toLocaleTimeString('th-TH', { hour12: false });
    const timeStart = subjectTimes.time_start;
    const timeEnd = subjectTimes.time_end;
  
    if (currentTimeStr < timeStart) {
      Swal.fire({
        icon: 'warning',
        title: 'ยังไม่ถึงเวลาเช็คชื่อ',
        text: 'กรุณารอจนถึงเวลาเริ่มเรียน'
      });
      return;
    }
  
    if (currentTimeStr > timeEnd) {
      Swal.fire({
        icon: 'error',
        title: 'หมดเวลาเช็คชื่อ',
        text: 'คุณจะถูกบันทึกเป็นขาดเรียน'
      }).then(() => {
        this.recordAttendance(checklist.checklist_id, 'ขาดเรียน');
      });
      return;
    }
  
    this.route.navigate(['/checklist-attendance', checklist.checklist_id, { std_id }]);
  }

  recordAttendance(checklistId: number, status: string) {
    this.http.post(`${this.dataService.apiUrl}/update-attendance`, {
      checklist_id: checklistId,
      std_id: this.user_id,
      status: status
    }).subscribe(
      () => {
        console.log('บันทึกสำเร็จ'); // Log success message
        this.loadChecklist();
      },
      (error) => {
        console.error('เกิดข้อผิดพลาดในการบันทึกข้อมูลเช็คชื่อ:', error); // Log error message
      }
    );
  }

  updatePastAttendances(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.post(`${this.dataService.apiUrl}/update-past-attendance`, {
        std_id: this.user_id,
        subject_id: this.selectedSubjectId
      }).subscribe(
        () => {
          console.log('อัปเดตข้อมูลเช็คชื่อย้อนหลังสำเร็จ'); // Log success message
          resolve(); // คืนค่า resolve เมื่อบันทึกเสร็จ
        },
        (error) => {
          console.error('เกิดข้อผิดพลาดในการอัปเดตข้อมูลเช็คชื่อย้อนหลัง:', error); // Log error message
          reject(error); // คืนค่า reject เมื่อเกิดข้อผิดพลาด
        }
      );
    });
  }
}
