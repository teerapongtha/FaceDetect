import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { DataService } from '../service/data.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-forget-password',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  providers: [DataService],
  templateUrl: './forget-password.component.html',
  styleUrls: ['./forget-password.component.scss']
})
export class ForgetPasswordComponent {
  email: string = '';
  errorMessage: string = '';
  successMessage: string = '';

  constructor(private dataService: DataService, private http: HttpClient, private router: Router) { }

  onSubmit(): void {
    // แสดง Swal สำหรับการโหลด
    const loadingSwal = Swal.fire({
      title: 'กำลังดำเนินการ...',
      text: 'กรุณารอสักครู่',
      icon: 'info',
      showConfirmButton: false,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    this.http.post(
      `${this.dataService.apiUrl}/request-password-reset`,
      JSON.stringify({ email: this.email }),
      { headers }
    )
    .pipe(
      catchError((error) => {
        Swal.close(); // ปิด Swal loading

        this.errorMessage = 'ไม่สามารถส่งลิงก์รีเซ็ตรหัสผ่านได้ กรุณาลองอีกครั้ง';
        console.error(error); // Log error for debugging
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: this.errorMessage,
          confirmButtonText: 'ตกลง',
          customClass: {
            title: 'text-danger',
            confirmButton: 'btn-primary'
          }
        });
        return of(null);
      })
    )
    .subscribe((response: any) => {
      Swal.close(); // ปิด Swal loading
    
      if (response?.status === 'success') {
        this.successMessage = 'ทำการส่งลิงก์รีเซ็ตรหัสผ่านไปที่อีเมลของคุณแล้ว';
        Swal.fire({
          icon: 'success',
          title: 'สำเร็จ',
          text: this.successMessage,
          confirmButtonText: 'ตกลง',
          customClass: {
            title: 'text-success',
            confirmButton: 'btn-primary'
          }
        });
        this.email = ''; // Clear the input field
        this.router.navigate(['/login']);
      } else {
        this.errorMessage = response?.message || 'กรุณาระบุ email ให้ถูกต้อง';
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: this.errorMessage,
          confirmButtonText: 'ตกลง',
          customClass: {
            title: 'text-danger',
            confirmButton: 'btn-primary'
          }
        });
      }
    });
    
  }
}
