import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DataService } from '../service/data.service';
import { HttpClient, HttpHeaders } from '@angular/common/http'; // Add HttpHeaders
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-student-add',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  providers: [DataService],
  templateUrl: './student-add.component.html',
  styleUrls: ['./student-add.component.scss']
})
export class StudentAddComponent implements OnInit {
  std_id: string = '';
  title: string = '';
  fname: string = '';
  lname: string = '';
  email: string = '';
  subject_id: string = '';
  subjects: any[] = [];
  passwordBeforeHash: string = '';
  teacher_id: string = ''; // Store teacher_id

  constructor(private dataService: DataService, private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.getUserData();
  }

  // Get user data to retrieve teacher_id
  getUserData() {
    this.dataService.getUserData().subscribe(userData => {
      if (userData) {
        this.teacher_id = userData.teacher_id;
        this.getSubjects();
      } else {
        console.error('ไม่พบข้อมูลผู้ใช้');
      }
    });
  }

  // Get subjects based on teacher_id
  getSubjects() {
    if (this.teacher_id) {
      this.http.get<any[]>(`${this.dataService.apiUrl}/subjects/${this.teacher_id}`).subscribe(
        (data) => {
          this.subjects = data;
        },
        (error) => {
          console.error('เกิดข้อผิดพลาดในการดึงรายวิชา:', error);
        }
      );
    }
  }

  StudentAdd(): void {
    const studentData = {
      std_id: this.std_id,
      title: this.title,
      fname: this.fname,
      lname: this.lname,
      email: this.email,
      subject_id: this.subject_id,
    };
  
    Swal.fire({
      title: 'กำลังบันทึกข้อมูล...',
      text: 'กรุณารอสักครู่',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
  
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
  
    this.http.post<any>(this.dataService.apiUrl + "/student-add", JSON.stringify(studentData), { headers }).subscribe(
      (response) => {
        Swal.close();
        if (response.is_existing_student) {
          this.sendEmail(null, true); // No need to send password for existing student
        } else {
          this.passwordBeforeHash = response.password_before_hash;
          this.sendEmail(this.passwordBeforeHash, false); // Send new student password
        }
      },
      (error) => {
        Swal.close();
        if (error.status === 400 && error.error?.error === 'นิสิตนี้ได้ลงทะเบียนในวิชานี้แล้ว') {
          Swal.fire({
            title: 'เกิดข้อผิดพลาด',
            text: 'นิสิตนี้ได้ลงทะเบียนในวิชานี้แล้ว',
            icon: 'error',
            confirmButtonText: 'ตกลง'
          });
        } else {
          Swal.fire({
            title: 'เกิดข้อผิดพลาด',
            text: error.error ? error.error : 'ไม่สามารถบันทึกข้อมูลได้',
            icon: 'error',
            confirmButtonText: 'ตกลง'
          });
        }
        console.error(error);
      }
    );
  }
  

// Send email with student information
sendEmail(password: string | null, isExistingStudent: boolean): void {
  let messageContent;

  if (isExistingStudent) {
    // Email content for existing students
    messageContent = `
      <p>สวัสดี,</p>
      <p>การลงทะเบียนในวิชาของคุณเสร็จสมบูรณ์ ข้อมูลมีดังนี้:</p>
      <ul>
        <li><strong>รหัสนิสิต:</strong> ${this.std_id}</li>
        <li><strong>ชื่อ:</strong> ${this.title} ${this.fname} ${this.lname}</li>
        <li><strong>อีเมล:</strong> ${this.email}</li>
        <li><strong>รหัสผ่าน:</strong> รหัสผ่านเดิมที่มีอยู่ในระบบ</li>
      </ul>
      <p>ขอแสดงความนับถือ,</p>
      <p>ทีมงาน FaceDetection</p>
    `;
  } else {
    // Email content for new students
    messageContent = `
      <p>สวัสดี,</p>
      <p>การลงทะเบียนของคุณเสร็จสมบูรณ์แล้ว ข้อมูลมีดังนี้:</p>
      <ul>
        <li><strong>รหัสนิสิต:</strong> ${this.std_id}</li>
        <li><strong>ชื่อ:</strong> ${this.title} ${this.fname} ${this.lname}</li>
        <li><strong>อีเมล:</strong> ${this.email}</li>
        <li><strong>รหัสผ่าน:</strong> ${password}</li>
      </ul>
      <p>กรุณาเปลี่ยนรหัสผ่านหลังจากการเข้าสู่ระบบครั้งแรก</p>
      <p>ขอแสดงความนับถือ,</p>
      <p>ทีมงาน FaceDetection</p>
    `;
  }

  const emailData = {
    to: this.email,
    subject: 'Information Student',
    message: messageContent,
    isHtml: true // Send as HTML email
  };

  this.http.post<any>(`${this.dataService.apiUrl}/send-email`, emailData, {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  }).subscribe(
    (response) => {
      Swal.close();
      if (response.status === 'success') {
        Swal.fire({
          title: 'เพิ่มข้อมูลนิสิตสำเร็จ',
          text: 'ข้อมูลนิสิตถูกบันทึกและส่งไปยังอีเมลเรียบร้อยแล้ว',
          icon: 'success',
          confirmButtonText: 'ตกลง'
        }).then((result) => {
          if (result.isConfirmed) {
            this.router.navigate(['/student-manage']);
          }
        });
      } else {
        Swal.fire({
          title: 'เกิดข้อผิดพลาด',
          text: 'ไม่สามารถส่งอีเมลได้',
          icon: 'error',
          confirmButtonText: 'ตกลง'
        });
      }
    },
    (error) => {
      Swal.close();
      Swal.fire({
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถส่งอีเมลได้',
        icon: 'error',
        confirmButtonText: 'ตกลง'
      });
      console.error('Error sending email:', error);
    }
  );
}


}
