import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DataService } from '../service/data.service';
import { Chart, registerables } from 'chart.js';

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  providers: [DataService],
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.scss']
})
export class ReportComponent implements OnInit {
  @ViewChild('chartCanvas') chartCanvas: ElementRef<HTMLCanvasElement> | undefined;
  subjects: any[] = [];
  reportData: any[] = [];
  filteredReportData: any[] = [];
  selectedSubjectId: string = '';
  selectedMonth: string = '';
  chart: Chart<'bar'> | undefined;
  currentMonthFlag: boolean = false; // Flag to check if the current month is selected

  months = [
    { value: '1', label: 'มกราคม' },
    { value: '2', label: 'กุมภาพันธ์' },
    { value: '3', label: 'มีนาคม' },
    { value: '4', label: 'เมษายน' },
    { value: '5', label: 'พฤษภาคม' },
    { value: '6', label: 'มิถุนายน' },
    { value: '7', label: 'กรกฎาคม' },
    { value: '8', label: 'สิงหาคม' },
    { value: '9', label: 'กันยายน' },
    { value: '10', label: 'ตุลาคม' },
    { value: '11', label: 'พฤศจิกายน' },
    { value: '12', label: 'ธันวาคม' }
  ];

  constructor(private http: HttpClient, private dataService: DataService) {}

  ngOnInit(): void {
    this.fetchSubjects();
    Chart.register(...registerables); // Register Chart.js components
  }

  fetchSubjects() {
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

  onSubjectChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    this.selectedSubjectId = selectElement.value;
    this.selectedMonth = ''; // Clear the month selection when a new subject is selected
    this.filteredReportData = []; // Clear report data until both subject and month are selected
    this.chart?.destroy(); // Clear the chart if exists
  }

  onMonthChange() {
    if (this.selectedSubjectId) {
        this.fetchReportData(); // Fetch data after both subject and month are selected
    }
}

  fetchReportData() {
    if (this.selectedSubjectId) { // Only check for subject_id
        this.http.get<any[]>(`${this.dataService.apiUrl}/report-summary/${this.selectedSubjectId}`).subscribe((data: any[]) => {
            this.reportData = data;
            this.applyFilters(); // Apply filters after fetching data
            this.updateChart();
        });
    } else {
        this.filteredReportData = [];
        if (this.chart) {
            this.chart.destroy(); // Destroy chart if incomplete selection
        }
    }
}

  applyFilters() {
    const currentYear = new Date().getFullYear();
    if (this.selectedMonth) {
        this.filteredReportData = this.reportData.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate.getMonth() + 1 === parseInt(this.selectedMonth) && entryDate.getFullYear() === currentYear;
        });
        
        // Update currentMonthFlag based on selected month
        this.currentMonthFlag = this.selectedMonth === this.getCurrentMonth();
    } else {
        this.filteredReportData = [];
    }
}

  resetFilters() {
    this.selectedMonth = ''; // Clear the month selection
    this.chart?.destroy(); // Destroy the chart
  }

  exportReport() {
    if (this.selectedSubjectId && this.selectedMonth) {
        const url = `${this.dataService.apiUrl}/export-report/${this.selectedSubjectId}/${this.selectedMonth}`;
        window.location.href = url;
    } else {
        alert('กรุณาเลือกรายวิชาก่อนทำการส่งออก');
    }
}

  formatDateThai(date: string): string {
    const months = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    const [year, month, day] = date.split('-');
    const thaiYear = +year + 543;
    const thaiMonth = months[+month - 1];
    return `${day} ${thaiMonth} ${thaiYear}`;
  }

  getMonthLabel(monthValue: string): string {
    const month = this.months.find(m => m.value === monthValue);
    return month ? month.label : '';
  }

  getCurrentMonth(): string {
    const currentMonth = new Date().getMonth() + 1;
    return currentMonth < 10 ? '0' + currentMonth : currentMonth.toString();
  }



updateChart() {
  if (!this.chartCanvas?.nativeElement || !this.filteredReportData.length) {
    console.error('Chart canvas element is not available or no data to display.');
    return;
  }

  if (this.chart) {
    this.chart.destroy(); // Destroy the previous chart instance
  }

  const labels = this.filteredReportData.map(entry => this.formatDateThai(entry.date));
  const attendedData = this.filteredReportData.map(entry => entry.total_attended);
  const absentData = this.filteredReportData.map(entry => entry.total_absent);
  const lateData = this.filteredReportData.map(entry => entry.total_late);

  this.chart = new Chart(this.chartCanvas.nativeElement, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'จำนวนการเข้าเรียน',
          data: attendedData,
          backgroundColor: '#28a745',
        },
        {
          label: 'ขาดเรียน',
          data: absentData,
          backgroundColor: '#dc3545',
        },
        {
          label: 'มาสาย',
          data: lateData,
          backgroundColor: '#ffc107',
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        tooltip: {
          callbacks: {
            label: function (tooltipItem) {
              return tooltipItem.dataset.label + ': ' + tooltipItem.formattedValue + ' คน';
            }
          }
        },
      },
      scales: {
        y: {
          title: {
            display: true,
            text: 'จำนวน (คน)', // Y axis label
            font: {
              size: 16,
            },
          },
          ticks: {
            stepSize: 1,
            callback: function(value) {
              return Math.floor(Number(value));
            }
          }
        },
        x: {
          title: {
            display: true,
            text: 'วันที่',
            font: {
              size: 16,
            },
          }
        }
      }
    }
  });
  
}
}