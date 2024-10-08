import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DataService } from '../service/data.service';
import { Student } from '../model/student.model';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-subject-detail',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  providers: [DataService],
  templateUrl: './subject-detail.component.html',
  styleUrls: ['./subject-detail.component.scss']
})
export class SubjectDetailComponent implements OnInit {
  subject: any = {};
  students: Student[] = [];
  filteredStudents: Student[] = [];
  paginatedStudents: Student[] = [];
  totalStudents: number = 0;
  searchQuery: string = '';
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 0;
  subjectId: string = '';
  location: any;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private dataService: DataService,
    private router : Router
  ) {}

  ngOnInit() {
    this.subjectId = this.route.snapshot.paramMap.get('subjectId') || '';
    this.loadSubjectDetails();
    this.loadStudents();
  }

  loadSubjectDetails() {
    if (this.subjectId) {
      this.http.get<any>(`${this.dataService.apiUrl}/subject-student/${this.subjectId}`).subscribe(
        (data) => {
          this.subject = data.subject;
        },
        (error) => {
          console.error('เกิดข้อผิดพลาดในการดึงข้อมูลวิชา:', error);
        }
      );
    }
  }

  loadStudents() {
    if (this.subjectId) {
      this.http.get<any>(`${this.dataService.apiUrl}/subject-student/${this.subjectId}`).subscribe(
        (data) => {
          this.students = data.students;
          this.totalStudents = this.students.length;
          this.totalPages = Math.ceil(this.totalStudents / this.pageSize);
          this.filterStudents(); // Apply initial filter and pagination
        },
        (error) => {
          console.error('เกิดข้อผิดพลาดในการดึงข้อมูลนิสิต:', error);
        }
      );
    }
  }

  filterStudents() {
    const query = this.searchQuery.toLowerCase();
    this.filteredStudents = this.students.filter(student => {
      const studentIdMatches = student.std_id?.toString().toLowerCase().includes(query);
      const studentNameMatches = `${student.title}${student.fname} ${student.lname}`.toLowerCase().includes(query);
      
      return studentIdMatches || studentNameMatches;
    });
    
    this.totalStudents = this.filteredStudents.length;
    this.totalPages = Math.ceil(this.totalStudents / this.pageSize);
    this.updatePagination();
  }

  resetSearch() {
    this.searchQuery = '';
    this.filterStudents();
  }

  updatePagination() {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedStudents = this.filteredStudents.slice(startIndex, endIndex);
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  goToPage(page: number) {
    if (page > 0 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  goBack(): void {
    this.router.navigate(['/subject-manage']);
  }
}
