import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DataService } from '../service/data.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { AuthService } from '../service/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  providers: [DataService, AuthService],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  constructor(private authService: AuthService, private dataService: DataService, private router: Router, private http: HttpClient) { }

  login(email: string, password: string) {
    this.authService.login(email, password).subscribe(
      (response: any) => {
        Swal.fire({
          title: 'เข้าสู่ระบบสำเร็จ!',
          icon: 'success',
          confirmButtonText: 'ตกลง',
        }).then(() => {
          this.dataService.setAcId(response.user.user_id);
          this.dataService.setUserData(response.user);
          if (response.user.role === 'teacher') {
            this.router.navigate(['/profile']).then(() => {
              window.location.reload();
            });
          } else {
            this.router.navigate(['/profile']).then(() => {
              window.location.reload();
            });
          }
        });
      },
      (error) => {
        Swal.fire({
          title: 'เข้าสู่ระบบไม่สำเร็จ!',
          text: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
          icon: 'error',
          confirmButtonText: 'ตกลง',
        });
        console.error('เข้าสู่ระบบไม่สำเร็จ:', error);
      }
    );
  }
}
