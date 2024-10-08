import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DataService } from '../service/data.service';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { User } from '../model/user.model';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  providers: [DataService],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  users: User[] = [];

  constructor(private dataService: DataService, private router: Router) { }

  ngOnInit(): void {
    this.getProfile();
  }

  getProfile() {
    this.dataService.getUserData().subscribe(
      (userData: any) => {
        if (userData) {
          const userId = userData.std_id || userData.teacher_id;
          if (userId) {
            this.dataService.getProfileData(userId).subscribe(
              (data: any) => {
                this.users = [data];
              },
              (error) => {
                console.error('Error fetching user data:', error);
              }
            );
          } else {
            console.error('User ID not found in userData');
          }
        } else {
          console.error('No user data found');
        }
      },
      (error) => {
        console.error('Error fetching userData:', error);
      }
    );
  }

  updateProfile() {
    if (this.users.length > 0) {
      const user = this.users[0];
      const userId = user['std_id'] || user['teacher_id'];
      if (userId) {
        this.router.navigate(['/profile-update', userId]);
      } else {
        console.error('User ID is undefined');
      }
    } else {
      console.error('No user data available');
    }
  }
  
  updateProfileIMG() {
    if (this.users.length > 0) {
      const user = this.users[0];
      const userId = user['std_id'] || user['teacher_id'];
      if (userId) {
        this.router.navigate(['/profile-editIMG', userId]);
      } else {
        console.error('User ID is undefined');
      }
    } else {
      console.error('No user data available');
    }
  }
}
