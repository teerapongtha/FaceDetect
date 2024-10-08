import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DataService } from '../service/data.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-student-import',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  providers: [DataService],
  templateUrl: './student-import.component.html',
  styleUrls: ['./student-import.component.scss']
})
export class StudentImportComponent {
  fileInput: any;
  isLoading = false;

  constructor(private dataService: DataService, private http: HttpClient, private router: Router) {}

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      // ข้อมูลไฟล์ไม่ได้ใช้งานในจุดนี้
    };
    reader.readAsDataURL(file);
  }

  uploadFile() {
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput.files && fileInput.files.length > 0) {
      const file: File = fileInput.files[0];
      const formData = new FormData();
      formData.append('file', file);

      this.isLoading = true;

      this.http.post<any>(this.dataService.apiUrl + "/student-import", formData).subscribe(
        response => {
          if (response.imported_data) {
            // ส่งอีเมล
            const emailRequests = response.imported_data.map((student: any) => this.sendEmail(student));
            Promise.all(emailRequests).then(() => {
              this.isLoading = false; // ซ่อนการโหลด
              Swal.fire('สำเร็จ', 'นำเข้าข้อมูลและส่งอีเมลสำเร็จ!', 'success').then(() => {
                this.router.navigate(['/student-manage']);
              });
            }).catch(() => {
              this.isLoading = false; // ซ่อนการโหลด
              Swal.fire('ข้อผิดพลาด', 'บางอีเมลไม่สามารถส่งได้', 'error');
            });
          } else {
            this.isLoading = false; // ซ่อนการโหลด
            Swal.fire('ข้อผิดพลาด', 'ไม่พบข้อมูลที่นำเข้า', 'error');
          }
        },
        error => {
          this.isLoading = false; // ซ่อนการโหลด
          Swal.fire('ข้อผิดพลาด', 'การนำเข้าล้มเหลว โปรดลองใหม่อีกครั้ง', 'error');
        }
      );
    }
  }

  sendEmail(student: any): Promise<void> {
    const emailData = {
      to: student.email,
      subject: 'Information Student',
      message: `
        <p>สวัสดี,</p>
        <p>ข้อมูลการลงทะเบียนนิสิตใหม่:</p>
        <ul>
          <li>รหัสนิสิต: ${student.std_id}</li>
          <li><strong>ชื่อ:</strong> ${student.title} ${student.fname} ${student.lname}</li>
          <li><strong>อีเมล:</strong> ${student.email}</li>
          <li>รหัสผ่าน: ${student.password}</li>
        </ul>
        <p>กรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก</p>
        <p>ขอแสดงความนับถือ,</p>
        <p>ทีมงานระบบ</p>
      `
    };

    return this.http.post<any>(this.dataService.apiUrl + "/send-email", emailData).toPromise().then(response => {
      if (response.status !== 'success') {
        throw new Error(`ไม่สามารถส่งอีเมลไปยัง ${student.email}`);
      }
    }).catch(error => {
      console.error('Failed to send email:', error);
      Swal.fire('ข้อผิดพลาด', `ไม่สามารถส่งอีเมลไปยัง ${student.email}`, 'error');
    });
  }
}
