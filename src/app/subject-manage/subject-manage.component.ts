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
  paginatedSubjects: any[] = [];
  searchQuery: string = '';
  selectedYear: string = '';
  user_id: any;
  currentPage: number = 1;
  itemsPerPage: number = 5;
  totalPages: number = 0;
  uniqueYears: string[] = [];

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
        this.extractUniqueYears();
        this.updatePagination();
      },
      (error) => {
        console.error('เกิดข้อผิดพลาดในการดึงข้อมูลรายวิชา:', error);
      }
    );
  }

  extractUniqueYears() {
    const yearsSet = new Set(this.subjects.map(subject => subject.year));
    this.uniqueYears = Array.from(yearsSet);
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
            Swal.fire('ลบรายวิชาสำเร็จ!', 'success');
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
    (subject.subject_name.toLowerCase().includes(query) || 
     subject.subject_engname.toLowerCase().includes(query) || 
     String(subject.id_subject).toLowerCase().includes(query)) // รวมการค้นหาผ่าน subject_engname
  );
  this.updatePagination();
}

  

  formatTime(time: string): string {
    const [hours, minutes] = time.split(':');
    return `${hours}:${minutes}`;
  }

  resetSearch() {
    this.searchQuery = '';
    this.selectedYear = '';
    this.filteredSubjects = this.subjects; // Reinitialize filteredSubjects
    this.updatePagination(); // Update pagination after reset
  }

  // Pagination Logic
  updatePagination() {
    this.totalPages = Math.ceil(this.filteredSubjects.length / this.itemsPerPage);
    this.changePage(this.currentPage); // Reset to current page
  }

  changePage(page: number) {
    if (page < 1 || page > this.totalPages) return; // Prevent out-of-bounds
    this.currentPage = page;
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedSubjects = this.filteredSubjects.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get pages() {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }
}
