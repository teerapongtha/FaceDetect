import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { DataService } from '../service/data.service';

@Component({
  selector: 'app-student-edit',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  providers: [DataService],
  templateUrl: './student-edit.component.html',
  styleUrl: './student-edit.component.scss'
})
export class StudentEditComponent implements OnInit {
  StudentUpdate: any = {};
  originalData: any = {};

  constructor(private dataService: DataService, private http: HttpClient, private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.route.params.subscribe((params) => {
      const itemId = params['id'];

      this.http.get(this.dataService.apiUrl + `/student-data/${itemId}`).subscribe((data: any) => {
        this.StudentUpdate = data;
        this.originalData = { ...data };  // เก็บข้อมูลต้นฉบับไว้
      });
    });
  }

  isFormChanged(): boolean {
    return JSON.stringify(this.StudentUpdate) !== JSON.stringify(this.originalData);
  }

  updateStudent() {
    const updatedData = {
      title: this.StudentUpdate.title || undefined,
      fname: this.StudentUpdate.fname || undefined,
      lname: this.StudentUpdate.lname || undefined,
      email: this.StudentUpdate.email || undefined
    };

    this.http.put(this.dataService.apiUrl + `/student-edit/${this.StudentUpdate.std_id}`, updatedData).subscribe(() => {
      Swal.fire(
        'แก้ไขข้อมูลนิสิตสำเร็จ!',
        'success'
      );
      this.router.navigate(['/student-manage']);
    });
  }
}
