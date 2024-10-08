import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DataService } from '../service/data.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-attendance-record',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [DataService],
  templateUrl: './attendance-record.component.html',
  styleUrls: ['./attendance-record.component.scss']
})
export class AttendanceRecordComponent implements OnInit {
  checklist: string = '';
  attendanceDetails: any[] = [];
  filteredDetails: any[] = [];
  checklistId: number | null = null;
  searchText: string = '';

  // Pagination properties
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 0;
  pages: number[] = [];
  paginatedDetails: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private dataService: DataService,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.checklistId = +params['id'];
      this.loadChecklistData();
    });
  }

  loadChecklistData() {
    const url = `${this.dataService.apiUrl}/attendance-record/${this.checklistId}`;
    this.http.get(url).subscribe(
      (data: any) => {
        this.checklist = data.title;
        this.attendanceDetails = Array.isArray(data.attendance_details) ? data.attendance_details : [];
        this.filterDetails(); // Initial filtering based on any default value (if needed)
      },
      error => {
        console.error('Error fetching attendance record:', error);
      }
    );
  }

  filterDetails() {
    const searchText = this.searchText.toLowerCase();
    this.filteredDetails = this.attendanceDetails.filter(detail => {
      const stdId = detail.std_id ? detail.std_id.toString().toLowerCase() : '';
      const stdName = detail.std_name ? detail.std_name.toLowerCase() : '';
      return stdId.includes(searchText) || stdName.includes(searchText);
    });
    this.calculatePagination();
  }

  paginateDetails() {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedDetails = this.filteredDetails.slice(startIndex, endIndex);
  }

  calculatePagination() {
    this.totalPages = Math.ceil(this.filteredDetails.length / this.pageSize);
    this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
    this.paginateDetails();
  }

  resetSearch() {
    this.searchText = '';
    this.currentPage = 1;
    this.filterDetails();
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.paginateDetails();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.paginateDetails();
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.paginateDetails();
    }
  }

  goBack() {
    this.router.navigate(['/checklist-manage']);
  }
}
