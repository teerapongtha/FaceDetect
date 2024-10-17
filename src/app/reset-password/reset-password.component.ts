import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { catchError, of } from 'rxjs';
import { DataService } from '../service/data.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  providers: [DataService],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent {
  newPassword: string = '';
  token: string = '';
  errorMessage: string = '';
  successMessage: string = '';

  constructor(private dataService: DataService, private http: HttpClient, private router: Router, private route: ActivatedRoute) {
    this.token = this.route.snapshot.queryParams['token'] || '';
  }

  onSubmit(): void {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    this.http.post(
      `${this.dataService.apiUrl}/reset-password`,
      JSON.stringify({ token: this.token, new_password: this.newPassword }),
      { headers }
    )
    .pipe(
      catchError((error) => {
        this.errorMessage = 'ไม่สามารถรีเซ็ตรหัสผ่านได้ กรุณาลองอีกครั้ง';
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
      if (response?.status === 'success') {
        this.successMessage = 'รีเซ็ตรหัสผ่านสำเร็จ';
        Swal.fire({
          icon: 'success',
          title: 'แก้ไขรหัสผ่านสำเร็จ',
          text: this.successMessage,
          confirmButtonText: 'ตกลง',
          customClass: {
            title: 'text-success',
            confirmButton: 'btn-primary'
          }
        });
        this.newPassword = ''; // Clear the input field
        this.router.navigate(['/login']);
      } else {
        this.errorMessage = response?.message || 'เกิดข้อผิดพลาดที่ไม่คาดคิด';
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
