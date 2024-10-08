import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Checklist } from '../model/checklist.model';
import { DataService } from '../service/data.service';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-checklist-manage',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  providers: [DataService],
  templateUrl: './checklist-manage.component.html',
  styleUrls: ['./checklist-manage.component.scss']
})
export class ChecklistManageComponent implements OnInit {
  checklists: Checklist[] = [];
  filteredChecklists: Checklist[] = [];
  subjects: any[] = [];
  selectedSubjectId: any = '';
  searchTitle: string = '';
  searchDate: string = '';
  currentTime: Date = new Date();
  user_id!: number;

  constructor(private dataService: DataService, private http: HttpClient, private route: Router) { }

  ngOnInit() {
    this.loadUserData();
    this.getCurrentTime();
  }

  loadUserData() {
    this.dataService.getUserData().subscribe(userData => {
      if (userData) {
        this.user_id = userData.teacher_id; 
        if (this.user_id) {
          this.getSubjects();
        } else {
          console.error('ไม่พบ user_id ในข้อมูลผู้ใช้');
        }
      } else {
        console.error('ไม่พบข้อมูลผู้ใช้');
      }
    });
  }

  getSubjects() {
    this.http.get<any[]>(`${this.dataService.apiUrl}/subjects/${this.user_id}`).subscribe(
      (data) => {
        this.subjects = data;
      },
      (error) => {
        console.error('Error fetching subjects:', error);
      }
    );
  }

  loadChecklist() {
    // ถ้าไม่ได้เลือกวิชา, ไม่ต้องโหลดข้อมูล
    if (!this.selectedSubjectId) {
      this.checklists = [];
      this.filteredChecklists = [];
      return;
    }
    
    const url = `${this.dataService.apiUrl}/checklist-data/subject/${this.selectedSubjectId}`;

    this.http.get<Checklist[]>(url).subscribe(
      (data) => {
        this.checklists = data;
        this.filterChecklists();
      },
      (error) => {
        console.error('Error fetching checklists:', error);
      }
    );
  }

  filterChecklists() {
    this.filteredChecklists = this.checklists.filter(checklist => {
      const matchesTitle = this.searchTitle ? checklist.title.toLowerCase().includes(this.searchTitle.toLowerCase()) : true;
      const matchesDate = this.searchDate ? checklist.date === this.searchDate : true;
      return matchesTitle && matchesDate;
    });
  }

  onSubjectChange(event: any) {
    this.selectedSubjectId = event.target.value;
    this.loadChecklist();  // Load checklists whenever the subject changes
  }

  searchChecklist() {
    this.filterChecklists();
  }

  DeleteChecklist(checklist_id: number) {
    Swal.fire({
      title: 'คุณแน่ใจที่จะลบรายการนี้หรือไม่?',
      text: 'การกระทำนี้ไม่สามารถยกเลิกได้!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ใช่, ลบรายการนี้',
      cancelButtonText: 'ยกเลิก'
    }).then((result) => {
      if (result.isConfirmed) {
        this.http.delete(this.dataService.apiUrl + `/checklist-delete/${checklist_id}`).subscribe(
          () => {
            this.loadChecklist();
            Swal.fire(
              'ลบรายการสำเร็จ!',
              'รายการถูกลบแล้ว',
              'success'
            );
          },
          (error) => {
            console.error('เกิดข้อผิดพลาดในการลบรายการ: ', error);
          }
        );
      }
    });
  }

  UpdateChecklist(checklist: Checklist) {
    this.route.navigate(['/checklist-update', checklist.checklist_id]);
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

  getCurrentTime() {
    setInterval(() => {
      this.currentTime = new Date();
    }, 1000);
  }

  resetSearch() {
    this.searchTitle = '';
    this.searchDate = '';
    this.filterChecklists();
  }
}
