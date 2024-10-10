import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DataService } from '../service/data.service';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-subject-manage',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  providers: [DataService],
  templateUrl: './subject-manage.component.html',
  styleUrls: ['./subject-manage.component.scss']
})
export class SubjectManageComponent implements OnInit {
  subjects: any[] = [];
  filteredSubjects: any[] = [];
  searchQuery: string = '';
  user_id: any;

  constructor(
    private dataService: DataService,
    private http: HttpClient,
    private route: Router
  ) {}

  ngOnInit() {
    this.loadUserData();
  }

  loadUserData() {
    this.dataService.getUserData().subscribe(userData => {
      if (userData) {
        this.user_id = userData.std_id || userData.teacher_id;
        if (this.user_id) {
          this.loadSubject();
        } else {
          console.error('ไม่พบ user_id ในข้อมูลผู้ใช้');
        }
      } else {
        console.error('ไม่พบข้อมูลผู้ใช้');
      }
    });
  }

  loadSubject() {
    this.http.get(`${this.dataService.apiUrl}/subjects/${this.user_id}`).subscribe(
      (data: any) => {
        this.subjects = data;
        this.filteredSubjects = data; // Initialize filteredSubjects
      },
      (error) => {
        console.error('เกิดข้อผิดพลาดในการดึงข้อมูลรายวิชา:', error);
      }
    );
  }

  deleteSubject(subject_id: number) {
    Swal.fire({
      title: 'คุณแน่ใจหรือว่าต้องการลบรายวิชานี้?',
      text: 'การกระทำนี้ไม่สามารถยกเลิกได้!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ใช่, ลบเลย!',
      cancelButtonText: 'ยกเลิก'
    }).then((result) => {
      if (result.isConfirmed) {
        this.http.delete(`${this.dataService.apiUrl}/subject-delete/${subject_id}`).subscribe(
          () => {
            this.loadSubject();
            Swal.fire('ลบสำเร็จ!', 'รายวิชาถูกลบแล้ว.', 'success');
          },
          (error) => {
            console.error('เกิดข้อผิดพลาดในการลบรายวิชา:', error);
          }
        );
      }
    });
  }

  updateSubject(subject: any) {
    this.route.navigate(['/subject-update', subject.subject_id]);
  }

  filterSubjects() {
    const query = this.searchQuery.toLowerCase();
    this.filteredSubjects = this.subjects.filter(subject =>
      subject.subject_name.toLowerCase().includes(query) ||
      String(subject.id_subject).toLowerCase().includes(query) // Ensure id_subject is a string
    );
  }

  resetSearch() {
    this.searchQuery = '';
    this.filterSubjects(); // Reapply the filter with cleared search fields
  }
  
}
