import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DataService } from '../service/data.service';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-subject-edit',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  providers: [DataService],
  templateUrl: './subject-edit.component.html',
  styleUrls: ['./subject-edit.component.scss']
})
export class SubjectEditComponent implements OnInit {
  SubjectUpdate: any = {};
  time_start: any;
  time_end: any;

  constructor(private dataService: DataService, private http: HttpClient, private route: ActivatedRoute, private router: Router) { }

  ngOnInit() {
    this.route.params.subscribe((params) => {
      const itemId = params['id'];

      this.http.get(this.dataService.apiUrl + `/subject-data/${itemId}`).subscribe((data: any) => {
        this.SubjectUpdate = data;
        this.time_start = this.SubjectUpdate.time_start; // เก็บเวลาเริ่มต้น
        this.time_end = this.SubjectUpdate.time_end;     // เก็บเวลาสิ้นสุด
      });
    });
  }

  updateSubject() {
    // ตรวจสอบว่าเวลาเริ่มต้นไม่เกินหรือเท่ากับเวลาสิ้นสุด
    if (this.time_start >= this.time_end) {
      Swal.fire({
        title: 'เกิดข้อผิดพลาด',
        text: 'เวลาเริ่มต้นห้ามเกินหรือเท่ากับเวลาสิ้นสุด',
        icon: 'error',
        confirmButtonText: 'ตกลง'
      });
      return;
    }

    // ส่งข้อมูลการอัปเดตไปยัง API
    this.http.put(this.dataService.apiUrl + `/subject-update/${this.SubjectUpdate.subject_id}`, this.SubjectUpdate).subscribe(() => {
      Swal.fire(
        'แก้ไขข้อมูลรายวิชาสำเร็จ!',
        'success'
      );
      this.router.navigate(['/subject-manage']);
    });
  }
}
