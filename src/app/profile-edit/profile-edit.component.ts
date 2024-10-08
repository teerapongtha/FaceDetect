import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterModule } from '@angular/router';
import { DataService } from '../service/data.service';
import { HttpClient } from '@angular/common/http';
import { User } from '../model/user.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-profile-edit',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule, RouterModule],
  providers: [DataService],
  templateUrl: './profile-edit.component.html',
  styleUrls: ['./profile-edit.component.scss']
})
export class ProfileEditComponent implements OnInit {
  ProfileUpdate: any = {};

  constructor(private dataService: DataService, private http: HttpClient, private route: ActivatedRoute, private router: Router) { }

  ngOnInit() {
    this.route.params.subscribe((params) => {
      const userId = params['id'];
      this.fetchProfileData(userId);
    });
  }

  fetchProfileData(userId: string) {
    this.http.get(this.dataService.apiUrl + `/profile-data/${userId}`).subscribe((data: any) => {
      this.ProfileUpdate = data;
      this.ProfileUpdate.userId = userId;
    });
  }

  updateProfile(): void {
    // console.log('Updating profile with data:', this.ProfileUpdate); 
    if (this.ProfileUpdate.userId) {
      this.http.put(this.dataService.apiUrl + `/profile-edit/${this.ProfileUpdate.userId}`, this.ProfileUpdate).subscribe(() => {
        Swal.fire(
          'แก้ไขรายการสำเร็จ!',
          'รายการถูกแก้ไขแล้ว',
          'success'
        );
        this.router.navigate(['/profile']);
      });
    } else {
      console.error('User ID is undefined');
    }
  }
}
