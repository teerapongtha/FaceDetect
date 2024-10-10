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
  imports: [RouterLink, CommonModule,FormsModule],
  providers: [DataService],
  templateUrl: './subject-edit.component.html',
  styleUrl: './subject-edit.component.scss'
})
export class SubjectEditComponent implements OnInit {
  SubjectUpdate: any = {};

  constructor(private dataService: DataService, private http: HttpClient, private route: ActivatedRoute, private router: Router) { }

  ngOnInit() {
    this.route.params.subscribe((params) => {
      const itemId = params['id'];

      this.http.get(this.dataService.apiUrl + `/subject-data/${itemId}`).subscribe((data: any) => {
        this.SubjectUpdate = data;
      });
    });
  }

  updateSubject() {
    this.http.put(this.dataService.apiUrl + `/subject-update/${this.SubjectUpdate.subject_id}`, this.SubjectUpdate).subscribe(() => {
      Swal.fire(
        'แก้ไขข้อมูลรายวิชาสำเร็จ!',
        'รายการถูกแก้ไขแล้ว',
        'success'
      );
      this.router.navigate(['/subject-manage']);
    });
  }
}
