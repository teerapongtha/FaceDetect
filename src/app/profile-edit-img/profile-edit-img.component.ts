import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import Swal from 'sweetalert2';
import { DataService } from '../service/data.service';

@Component({
  selector: 'app-profile-edit-img',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  providers: [DataService],
  templateUrl: './profile-edit-img.component.html',
  styleUrls: ['./profile-edit-img.component.scss']
})
export class ProfileEditIMGComponent {
  selectedFile: File | null = null;
  userId: string | null = null;
  isLoading = false;

  constructor(private dataService: DataService, private http: HttpClient, private route: ActivatedRoute, private router: Router) {
    this.route.paramMap.subscribe(params => {
      this.userId = params.get('id');
    });
  }

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0];
  }

  uploadFile(): void {
    if (!this.selectedFile) {
      Swal.fire('เกิดข้อผิดพลาด!', 'กรุณาเลือกไฟล์ที่ต้องการอัปโหลด.', 'error');
      return;
    }

    const formData: FormData = new FormData();
    formData.append('img_profiles', this.selectedFile, this.selectedFile.name);

    this.isLoading = true;

    this.http.post<any>(this.dataService.apiUrl + `/update-img_profile/${this.userId}`, formData).subscribe(
      (response) => {
        this.isLoading = false;
        if (response.success) {
          Swal.fire('สำเร็จ!', 'อัปโหลดรูปโปรไฟล์สำเร็จ.', 'success');
          this.router.navigate(['/profile']);
        } else {
          Swal.fire('เกิดข้อผิดพลาด!', 'ไม่สามารถอัปโหลดรูปโปรไฟล์ได้.', 'error');
        }
      },
      (error) => {
        this.isLoading = false;
        console.error('Error uploading profile image:', error);
        Swal.fire('เกิดข้อผิดพลาด!', 'ไม่สามารถอัปโหลดรูปโปรไฟล์ได้.', 'error');
      }
    );
  }
}
