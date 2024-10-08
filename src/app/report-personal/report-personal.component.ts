import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DataService } from '../service/data.service';

@Component({
  selector: 'app-report-personal',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  providers: [DataService],
  templateUrl: './report-personal.component.html',
  styleUrls: ['./report-personal.component.scss']
})
export class ReportPersonalComponent implements OnInit {
  subjects: any[] = [];
  students: any[] = [];
  filteredStudents: any[] = [];
  pagedStudents: any[] = [];
  selectedSubjectId: string = '';
  searchTerm: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;
  pages: number[] = [];

  constructor(private http: HttpClient, private dataService: DataService) {}

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

  onSubjectChange() {
    if (this.selectedSubjectId) {
      this.getStudentsBySubject(this.selectedSubjectId);
    } else {
      this.students = [];
      this.filteredStudents = [];
      this.updatePagination();
    }
  }

  getStudentsBySubject(subjectId: string) {
    this.http.get<any[]>(`${this.dataService.apiUrl}/student-data/subject/${subjectId}`).subscribe(
      (data) => {
        this.students = data;
        this.filterDetails();
      },
      (error) => {
        console.error('Error fetching students:', error);
      }
    );
  }

  filterDetails() {
    const searchText = this.searchTerm.toLowerCase();
    this.filteredStudents = this.students.filter(student => {
      const stdId = student.std_id ? student.std_id.toString().toLowerCase() : '';
      const stdName = student.fname ? (student.fname + ' ' + student.lname).toLowerCase() : '';
      return stdId.includes(searchText) || stdName.includes(searchText);
    });
    this.updatePagination();
  }

  resetSearch() {
    this.searchTerm = '';
    this.filterDetails();
    this.updatePagination();
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredStudents.length / this.itemsPerPage);
    this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
    this.changePage(1);
  }

  changePage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.pagedStudents = this.filteredStudents.slice(start, end);
  }

  exportReport() {
    if (this.selectedSubjectId) {
        const url = `${this.dataService.apiUrl}/export-report-personal/${this.selectedSubjectId}`;
        window.location.href = url;
    } else {
        alert('กรุณาเลือกรายวิชาก่อนทำการส่งออก');
    }
}
}
