import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Student } from '../model/student.model';
import { DataService } from '../service/data.service';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-student-manage',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  providers: [DataService],
  templateUrl: './student-manage.component.html',
  styleUrls: ['./student-manage.component.scss']
})
export class StudentManageComponent implements OnInit {
  students: Student[] = [];
  filteredStudents: Student[] = [];
  totalStudents: number = 0;
  subjects: any[] = [];
  selectedSubjectId: any = '';
  searchQuery: string = '';

  // Pagination properties
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 0;
  pages: number[] = [];
  paginatedStudents: Student[] = [];

  constructor(private dataService: DataService, private http: HttpClient, private router: Router) { }

  ngOnInit() {
    this.getSubjects();
  }

  getSubjects() {
    this.dataService.getUserData().subscribe(userData => {
      if (userData) {
        const user_id = userData.teacher_id;
        this.http.get<any[]>(`${this.dataService.apiUrl}/subjects/${user_id}`).subscribe(
          (data) => {
            this.subjects = data;
          },
          (error) => {
            console.error('Error fetching subjects:', error);
          }
        );
      } else {
        console.error('ไม่พบข้อมูลผู้ใช้');
      }
    });
  }

  onSubjectChange(event: any) {
    this.selectedSubjectId = event.target.value;
    this.loadData();
  }

  onSearchClick() {
    this.loadData();
  }

  loadData() {
    if (!this.selectedSubjectId) {
      this.students = [];
      this.filteredStudents = [];
      this.totalStudents = 0;
      this.totalPages = 0;
      return;
    }

    let url = `${this.dataService.apiUrl}/student-data/subject/${this.selectedSubjectId}`;
    
    if (this.searchQuery) {
      const encodedQuery = encodeURIComponent(this.searchQuery);
      url += `?query=${encodedQuery}`;
    }

    this.http.get<Student[]>(url).subscribe(
      (data: Student[]) => {
        this.students = data;
        this.filterStudents();
        this.calculatePagination();
      },
      (error) => {
        console.error('Error fetching students:', error);
      }
    );
  }

  filterStudents() {
    if (!this.searchQuery) {
      this.filteredStudents = this.students;
    } else {
      const query = this.searchQuery.toLowerCase();
      this.filteredStudents = this.students.filter(student =>
        student.std_id.toString().toLowerCase().includes(query) ||
        `${student.fname} ${student.lname}`.toLowerCase().includes(query)
      );
    }
    this.calculatePagination();
  }

  paginateStudents() {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedStudents = this.filteredStudents.slice(startIndex, endIndex);
  }

  calculatePagination() {
    this.totalStudents = this.filteredStudents.length;
    this.totalPages = Math.ceil(this.totalStudents / this.pageSize);
    this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
    this.paginateStudents();
  }

  onResetClick() {
    this.searchQuery = '';
    this.currentPage = 1;
    this.loadData();
  }

  updateStudent(student: Student) {
    this.router.navigate(['/student-update', student.std_id]);
  }
  
  deleteStudent(studentId: string) {
    Swal.fire({
        title: 'ยืนยันการลบ',
        text: "คุณแน่ใจว่าต้องการลบข้อมูลนิสิตนี้ในวิชานี้?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'ใช่, ลบ!',
        cancelButtonText: 'ยกเลิก'
    }).then((result) => {
        if (result.isConfirmed) {
            this.http.delete(`${this.dataService.apiUrl}/student-delete/${studentId}/${this.selectedSubjectId}`).subscribe(
                () => {
                    Swal.fire('ลบสำเร็จ!', 'ข้อมูลนิสิตถูกลบเรียบร้อยแล้ว.', 'success');
                    this.loadData(); // Reload the data to refresh the view
                },
                (error) => {
                    const errorMessage = error.error?.error || 'เกิดข้อผิดพลาดในการลบข้อมูล';
                    Swal.fire('เกิดข้อผิดพลาด!', errorMessage, 'error');
                }
            );
        }
    });
}




  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.paginateStudents();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.paginateStudents();
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.paginateStudents();
    }
  }
}
