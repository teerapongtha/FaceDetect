import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DataService } from '../service/data.service';
import { HttpClient } from '@angular/common/http';
import { Chart, registerables } from 'chart.js';

@Component({
  selector: 'app-report-student',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  providers: [DataService],
  templateUrl: './report-student.component.html',
  styleUrls: ['./report-student.component.scss']
})
export class ReportStudentComponent implements OnInit {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  userId: string = '';
  subjects: any[] = [];
  selectedSubjectId: string = '';
  attendanceRecords: any[] = [];
  attendanceSummary: { present: number, late: number, absent: number } = { present: 0, late: 0, absent: 0 };
  selectedMonth: string = '';
  chart: Chart<'bar'> | undefined;
  displayDateInfo: string = '';
  filteredAttendanceRecords: any[] = [];
  selectedDate: string = '';

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
    this.getUserData();
    Chart.register(...registerables); // Register Chart.js components
    this.selectedMonth = ''; // Set to an empty string to allow user selection
    this.selectedDate = '';
  }
  
  getUserData() {
    this.dataService.getUserData().subscribe(userData => {
      if (userData) {
        this.userId = userData.std_id;
        this.getSubjects(this.userId);
      } else {
        console.error('ไม่พบข้อมูลผู้ใช้');
      }
    });
  }

  getSubjects(userId: string) {
    this.http.get<any[]>(`${this.dataService.apiUrl}/subject-student-list/${userId}`).subscribe(
      data => {
        this.subjects = data;
      },
      error => {
        console.error('Error fetching subjects:', error);
      }
    );
  }

  filterData() {
    const currentYear = new Date().getFullYear();

    if (this.selectedDate) {
      this.selectedMonth = ''; // Reset month selection when a date is selected
      this.filteredAttendanceRecords = this.attendanceRecords.filter(record => record.date === this.selectedDate);
      this.displayDateInfo = `วันที่: ${this.formatDateThai(this.selectedDate)}`;
    } else if (this.selectedMonth) {
      this.filteredAttendanceRecords = this.attendanceRecords.filter(record => {
        const entryDate = new Date(record.date);
        return entryDate.getMonth() + 1 === parseInt(this.selectedMonth) && entryDate.getFullYear() === currentYear;
      });
      this.displayDateInfo = `เดือน: ${this.formatMonthThai(`${currentYear}-${this.selectedMonth}`)} ปี: ${currentYear + 543}`;
    } else {
      this.filteredAttendanceRecords = this.attendanceRecords.filter(record => {
        const entryDate = new Date(record.date);
        return entryDate.getFullYear() === currentYear;
      });
      this.displayDateInfo = `ปี: ${currentYear + 543}`;
    }
    this.calculateAttendanceSummary();
    this.updateChart(); // Update chart whenever data is filtered
  }

  resetFilters() {
    this.selectedDate = '';
    this.selectedMonth = '';
    this.filterData();
  }

  onSubjectChange() {
    if (this.selectedSubjectId) {
      this.updatePastAttendances();
      this.filterData(); // Refresh data if both a subject and month are selected
    }
  }

  getAttendanceRecords(stdId: string, subjectId: string) {
    this.http.get<any[]>(`${this.dataService.apiUrl}/report-student/${stdId}/${subjectId}`).subscribe(
      data => {
        this.attendanceRecords = data;
        this.filterData(); // Call filterData after fetching records
      },
      error => {
        console.error('Error fetching attendance records:', error);
      }
    );
  }

  getMonthLabel(monthValue: string): string {
    const month = this.months.find(m => m.value === monthValue);
    return month ? month.label : '';
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
  
    // Aggregate data by month and status with dates
    const monthsData: { [key: string]: { present: string[], late: string[], absent: string[] } } = this.filteredAttendanceRecords.reduce((acc, record) => {
      const date = new Date(record.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`; // Format as YYYY-MM
  
      if (!acc[monthKey]) {
        acc[monthKey] = { present: [], late: [], absent: [] };
      }
  
      if (record.status === 'มาเรียน') {
        acc[monthKey].present.push(record.date);
      } else if (record.status === 'มาสาย') {
        acc[monthKey].late.push(record.date);
      } else if (record.status === 'ขาดเรียน') {
        acc[monthKey].absent.push(record.date);
      }
  
      return acc;
    }, {} as { [key: string]: { present: string[], late: string[], absent: string[] } });
  
    const months = Object.keys(monthsData);
    const presentCounts = months.map(month => monthsData[month].present.length);
    const absentCounts = months.map(month => monthsData[month].absent.length);
    const lateCounts = months.map(month => monthsData[month].late.length);
  
    this.chart = new Chart(this.chartCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: months.map(month => this.formatMonthThai(month)),
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
  
                let info = `เดือน: ${this.formatMonthThai(month)}`;
                if (status === 'จำนวนที่มาเรียน') {
                  info += ` - มาเรียน: ${data.present.length} วัน: ${data.present.map(date => this.formatDateThai(date)).join(', ')}`;
                } else if (status === 'จำนวนที่ขาดเรียน') {
                  info += ` - ขาดเรียน: ${data.absent.length} วัน: ${data.absent.map(date => this.formatDateThai(date)).join(', ')}`;
                } else if (status === 'จำนวนที่มาสาย') {
                  info += ` - มาสาย: ${data.late.length} วัน: ${data.late.map(date => this.formatDateThai(date)).join(', ')}`;
                }
                return info;
              }
            }
          }
        }
      }
    });
  }

//   updateChart() {
//     if (!this.chartCanvas?.nativeElement) {
//         console.error('Chart canvas element is not available.');
//         return;
//     }

//     if (this.chart) {
//         this.chart.destroy(); // Destroy the previous chart instance
//     }

//     // Aggregate data by month and status with dates
//     const monthsData: { [key: string]: { present: string[], late: string[], absent: string[] } } = this.filteredAttendanceRecords.reduce((acc, record) => {
//         const date = new Date(record.date);
//         const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`; // Format as YYYY-MM

//         if (!acc[monthKey]) {
//             acc[monthKey] = { present: [], late: [], absent: [] };
//         }

//         if (record.status === 'มาเรียน') {
//             acc[monthKey].present.push(record.date);
//         } else if (record.status === 'มาสาย') {
//             acc[monthKey].late.push(record.date);
//         } else if (record.status === 'ขาดเรียน') {
//             acc[monthKey].absent.push(record.date);
//         }

//         return acc;
//     }, {} as { [key: string]: { present: string[], late: string[], absent: string[] } });

//     const months = Object.keys(monthsData);
//     const presentCounts = months.map(month => monthsData[month].present.length);
//     const absentCounts = months.map(month => monthsData[month].absent.length);
//     const lateCounts = months.map(month => monthsData[month].late.length);

//     this.chart = new Chart(this.chartCanvas.nativeElement, {
//         type: 'bar',
//         data: {
//             labels: months.map(month => this.formatMonthThai(month)),
//             datasets: [
//                 {
//                     label: 'จำนวนที่มาเรียน',
//                     data: presentCounts,
//                     backgroundColor: '#28a745',
//                     borderColor: 'rgba(54, 162, 235, 1)',
//                     borderWidth: 1
//                 },
//                 {
//                     label: 'จำนวนที่ขาดเรียน',
//                     data: absentCounts,
//                     backgroundColor: '#dc3545',
//                     borderColor: 'rgba(255, 99, 132, 1)',
//                     borderWidth: 1
//                 },
//                 {
//                     label: 'จำนวนที่มาสาย',
//                     data: lateCounts,
//                     backgroundColor: '#ffc107',
//                     borderColor: 'rgba(255, 206, 86, 1)',
//                     borderWidth: 1
//                 }
//             ]
//         },
//         options: {
//             responsive: true,
//             plugins: {
//                 tooltip: {
//                     callbacks: {
//                         label: (context) => {
//                             const month = months[context.dataIndex];
//                             const data = monthsData[month];
//                             const status = context.dataset.label;

//                             let info = `เดือน: ${this.formatMonthThai(month)}`;
//                             if (status === 'จำนวนที่มาเรียน') {
//                                 info += ` - มาเรียน: ${data.present.length} วัน: ${data.present.map(date => this.formatDateThai(date)).join(', ')}`;
//                             } else if (status === 'จำนวนที่ขาดเรียน') {
//                                 info += ` - ขาดเรียน: ${data.absent.length} วัน: ${data.absent.map(date => this.formatDateThai(date)).join(', ')}`;
//                             } else if (status === 'จำนวนที่มาสาย') {
//                                 info += ` - มาสาย: ${data.late.length} วัน: ${data.late.map(date => this.formatDateThai(date)).join(', ')}`;
//                             }
//                             return info;
//                         }
//                     }
//                 }
//             },
//             scales: {
//                 y: {
//                     ticks: {
//                         stepSize: 1, // กำหนดให้ค่าบนแกน Y แสดงทีละ 1
//                         callback: (value) => {
//                             return Math.floor(Number(value)); // แสดงเป็นจำนวนเต็ม
//                         }
//                     }
//                 }
//             }
//         }
//     });
// }

  formatMonthThai(month: string): string {
    const [year, monthNum] = month.split('-');
    return `${this.getMonthLabel(monthNum)} ${parseInt(year) + 543}`; // Convert to Buddhist calendar
  }

  formatDateThai(dateString: string): string {
    const date = new Date(dateString);
    return `${date.getDate()} ${this.getMonthLabel(('0' + (date.getMonth() + 1)).slice(-2))} ${date.getFullYear() + 543}`; // Convert to Buddhist calendar
  }

  updatePastAttendances() {
    if (this.selectedSubjectId) {
      this.getAttendanceRecords(this.userId, this.selectedSubjectId);
    }
  }
}
