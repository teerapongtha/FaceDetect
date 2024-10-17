import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DataService } from '../service/data.service';
import { HttpClient } from '@angular/common/http';
import { Chart, registerables } from 'chart.js';

@Component({
  selector: 'app-report-personal-detail',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  providers: [DataService],
  templateUrl: './report-personal-detail.component.html',
  styleUrls: ['./report-personal-detail.component.scss']
})
export class ReportPersonalDetailComponent implements OnInit, AfterViewInit {
  @ViewChild('chartCanvas') chartCanvas: ElementRef<HTMLCanvasElement> | undefined;
  studentId: string = '';
  subjectId: string = '';
  studentDetails: any = {};
  attendanceRecords: any[] = [];
  filteredAttendanceRecords: any[] = [];
  attendanceSummary: { present: number, late: number, absent: number } = { present: 0, late: 0, absent: 0 };
  selectedMonth: string = '';
  chart: Chart<'bar'> | undefined;

  months = [
    { value: '01', label: 'มกราคม' },
    { value: '02', label: 'กุมภาพันธ์' },
    { value: '03', label: 'มีนาคม' },
    { value: '04', label: 'เมษายน' },
    { value: '05', label: 'พฤษภาคม' },
    { value: '06', label: 'มิถุนายน' },
    { value: '07', label: 'กรกฎาคม' },
    { value: '08', label: 'สิงหาคม' },
    { value: '09', label: 'กันยายน' },
    { value: '10', label: 'ตุลาคม' },
    { value: '11', label: 'พฤศจิกายน' },
    { value: '12', label: 'ธันวาคม' }
  ];

  constructor(private route: ActivatedRoute, private http: HttpClient, private dataService: DataService) {}

  ngOnInit() {
    this.studentId = this.route.snapshot.paramMap.get('studentId') || '';
    this.subjectId = this.route.snapshot.paramMap.get('subjectId') || '';
    if (this.studentId && this.subjectId) {
      this.getStudentDetails();
      this.getAttendanceRecords();
    }
    Chart.register(...registerables); // Register Chart.js components
  }

  ngAfterViewInit() {
    this.updateChart(); // Ensure chart is updated after view initialization
  }

  getStudentDetails() {
    this.http.get<any>(`${this.dataService.apiUrl}/student-data/${this.studentId}`).subscribe(
      data => {
        this.studentDetails = data;
      },
      error => {
        console.error('Error fetching student details:', error);
      }
    );
  }

  getMonthLabel(monthValue: string): string {
    const month = this.months.find(m => m.value === monthValue);
    return month ? month.label : '';
  }

  getAttendanceRecords() {
    this.http.get<any[]>(`${this.dataService.apiUrl}/report-personal/${this.studentId}/${this.subjectId}`).subscribe(
      data => {
        this.attendanceRecords = data;
        this.filterData(); // Filter data right after fetching
      },
      error => {
        console.error('Error fetching attendance records:', error);
      }
    );
  }

  filterData() {
    const currentYear = new Date().getFullYear();

    if (this.selectedMonth) {
        this.filteredAttendanceRecords = this.attendanceRecords.filter(record => {
            const entryDate = new Date(record.date);
            return entryDate.getMonth() + 1 === parseInt(this.selectedMonth) && entryDate.getFullYear() === currentYear;
        });
    } else {
        this.filteredAttendanceRecords = []; // No records to display if no month is selected
    }

    this.calculateAttendanceSummary();
    this.updateChart();
}

resetFilters() {
    this.selectedMonth = ''; // Reset to show no month selected
    this.filteredAttendanceRecords = []; // No records to display
    this.attendanceSummary = { present: 0, late: 0, absent: 0 }; // Reset summary
    this.updateChart(); // Update chart to reflect cleared data
}


  calculateAttendanceSummary() {
    this.attendanceSummary.present = this.filteredAttendanceRecords.filter(record => record.status === 'มาเรียน').length;
    this.attendanceSummary.late = this.filteredAttendanceRecords.filter(record => record.status === 'มาสาย').length;
    this.attendanceSummary.absent = this.filteredAttendanceRecords.filter(record => record.status === 'ขาดเรียน').length;
  }


  updateChart() {
    if (!this.chartCanvas?.nativeElement) {
      console.error('Chart canvas element is not available.');
      return;
    }
  
    if (this.chart) {
      this.chart.destroy(); // Destroy the previous chart instance
    }
  
    const monthsData = this.filteredAttendanceRecords.reduce((acc, record) => {
      const date = new Date(record.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`; // Format as YYYY-MM
  
      if (!acc[monthKey]) {
        acc[monthKey] = { present: 0, late: 0, absent: 0, dates: [] };
      }
  
      if (record.status === 'มาเรียน') {
        acc[monthKey].present++;
      } else if (record.status === 'มาสาย') {
        acc[monthKey].late++;
      } else if (record.status === 'ขาดเรียน') {
        acc[monthKey].absent++;
        acc[monthKey].dates.push(record.date); // Collect dates for absent records
      }
  
      return acc;
    }, {} as { [key: string]: { present: number, late: number, absent: number, dates: string[] } });
  
    const months = Object.keys(monthsData);
    const presentCounts = months.map(month => monthsData[month].present);
    const absentCounts = months.map(month => monthsData[month].absent);
    const lateCounts = months.map(month => monthsData[month].late);
  
    this.chart = new Chart(this.chartCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: months.map(month => this.formatMonthThai(month.split('-')[1])),
        datasets: [
          {
            label: 'จำนวนที่มาเรียน',
            data: presentCounts,
            backgroundColor: '#28a745',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          },
          {
            label: 'จำนวนที่ขาดเรียน',
            data: absentCounts,
            backgroundColor: '#dc3545',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1
          },
          {
            label: 'จำนวนที่มาสาย',
            data: lateCounts,
            backgroundColor: '#ffc107',
            borderColor: 'rgba(255, 206, 86, 1)',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          tooltip: {
            callbacks: {
              label: (context) => {
                const month = months[context.dataIndex];
                const data = monthsData[month];
                const status = context.dataset.label;
  
                let info = `เดือน: ${this.formatMonthThai(month.split('-')[1])}`;
                if (status === 'จำนวนที่มาเรียน') {
                  info += ` - มาเรียน: ${data.present} วัน`;
                  info += ` (${data.dates.map((date: string) => this.formatDateThai(date)).join(', ')})`; // Format dates
                } else if (status === 'จำนวนที่ขาดเรียน') {
                  info += ` - ขาดเรียน: ${data.absent} วัน`;
                  info += ` (${data.dates.map((date: string) => this.formatDateThai(date)).join(', ')})`; // Format dates
                } else if (status === 'จำนวนที่มาสาย') {
                  info += ` - มาสาย: ${data.late} วัน`;
                  info += ` (${data.dates.map((date: string) => this.formatDateThai(date)).join(', ')})`; // Format dates
                }
                return info;
              }
            }
          }
        },
        scales: {
          y: {
            title: {
              display: true,
              text: 'จำนวน (วัน)', // Y axis label
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
              text: 'สถานะ',
              font: {
                size: 16,
              },
            }
          }
        }
      }
    });
  }

  
  formatDateThai(date: string): string {
    const [year, month, day] = date.split('-');
    const thaiYear = parseInt(year, 10) + 543;
    return `${parseInt(day, 10)} ${this.formatMonthThai(month)} ${thaiYear}`;
  }

  formatMonthThai(month: string): string {
    const monthNames = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    return monthNames[parseInt(month) - 1];
  }
}
