import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DataService } from '../service/data.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-recognition-manage',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  providers: [DataService],
  templateUrl: './recognition-manage.component.html',
  styleUrls: ['./recognition-manage.component.scss']
})
export class RecognitionManageComponent implements OnInit {
  userDataStudent: any[] = [];
  userId: string | undefined;

  constructor(private dataService: DataService, private http: HttpClient, private route :Router) { }

  ngOnInit(): void {
    this.getUserId();
  }

  getUserId(): void {
    this.dataService.getUserData().subscribe(
      (userData: any) => {
        if (userData && userData.std_id) {
          this.userId = userData.std_id;
          this.fetchUserData();
        } else {
          console.error('User ID not found or invalid.');
        }
      },
      (error) => {
        console.error('Error fetching user data:', error);
      }
    );
  }

  fetchUserData(): void {
    if (!this.userId) {
      console.error('User ID is not defined.');
      return;
    }
  
    this.http.get<any[]>(`${this.dataService.apiUrl}/face-detect-img/${this.userId}`)
      .subscribe(
        data => {
          // Append a unique query string to prevent caching
          this.userDataStudent = data.map(item => {
            item.img_path += `?t=${new Date().getTime()}`;
            return item;
          });
        },
        error => {
          console.error('Error fetching data:', error);
        }
      );
  }
  

  deleteImage(imageId: number): void {
    Swal.fire({
      title: 'คุณแน่ใจหรือไม่?',
      text: 'คุณต้องการลบรูปภาพนี้หรือไม่?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'ใช่, ลบ!',
      cancelButtonText: 'ยกเลิก'
    }).then((result) => {
      if (result.isConfirmed) {
        this.http.delete(`${this.dataService.apiUrl}/face-detect-img-delete/${imageId}`)
          .subscribe(
            () => {
              Swal.fire(
                'ลบเรียบร้อย!',
                'รูปภาพถูกลบแล้ว',
                'success'
              ).then(() => {
                this.fetchUserData();
                location.reload();
              });
            },
            error => {
              console.error('Error deleting image:', error);
              Swal.fire(
                'เกิดข้อผิดพลาด!',
                'ไม่สามารถลบรูปภาพได้',
                'error'
              );
            }
          );
      }
    });
  }
  
  deleteAllImages(): void {
    Swal.fire({
      title: 'คุณแน่ใจหรือไม่?',
      text: 'คุณต้องการลบรูปภาพทั้งหมดหรือไม่?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'ใช่, ลบทั้งหมด!',
      cancelButtonText: 'ยกเลิก'
    }).then((result) => {
      if (result.isConfirmed && this.userId) {
        this.http.delete(`${this.dataService.apiUrl}/face-detect-img-delete-all/${this.userId}`)
          .subscribe(
            () => {
              Swal.fire(
                'ลบเรียบร้อย!',
                'รูปภาพทั้งหมดถูกลบแล้ว',
                'success'
              ).then(() => {
                this.fetchUserData();
                location.reload();
              });
            },
            error => {
              console.error('Error deleting all images:', error);
              Swal.fire(
                'เกิดข้อผิดพลาด!',
                'ไม่สามารถลบรูปภาพทั้งหมดได้',
                'error'
              );
            }
          );
      }
    });
  }
  

  navigateToFaceDetect(): void {
    this.route.navigate(['/face-detect', this.userId]);
  }
}
