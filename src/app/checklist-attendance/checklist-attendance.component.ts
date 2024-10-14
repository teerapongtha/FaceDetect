import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import * as faceapi from 'face-api.js';
import { DataService } from '../service/data.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-checklist-attendance',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  providers: [DataService],
  templateUrl: './checklist-attendance.component.html',
  styleUrls: ['./checklist-attendance.component.scss']
})
export class ChecklistAttendanceComponent implements AfterViewInit, OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;

  imgStdData: any[] = [];
  verificationResult: any = null;
  attendance_id: number | null = null;
  checklistId: number | null = null;
  std_id: number | null = null;
  videoStream: MediaStream | null = null;
  date: string;
  currentTime: Date = new Date();
  

  constructor(
    private dataService: DataService,
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute
  ) {
    // Initialize date and time
    this.date = new Date().toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok' });
    this.std_id = +(this.route.snapshot.paramMap.get('std_id') ?? 0); // ดึง std_id จาก URL และแปลงเป็น number
  }
  

  ngAfterViewInit() {
    this.updateDateTime();
    this.loadFaceAPIModels();
    this.startVideo();
    this.fetchImageData();
    this.checklistId = +(this.route.snapshot.paramMap.get('id') ?? 0);
    //+ is convert string to number, ?? check value ก่อน ?? ว่าเป็น null หรือเปล่า
    console.log(this.std_id);
    
  }

  updateDateTime() {
    setInterval(() => {
      this.currentTime = new Date();
      this.date = this.currentTime.toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok' });
    }, 1000);
  }

  async loadFaceAPIModels() {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri('assets/models'),
      faceapi.nets.faceLandmark68Net.loadFromUri('assets/models'),
      faceapi.nets.faceRecognitionNet.loadFromUri('assets/models'),
      faceapi.nets.faceExpressionNet.loadFromUri('assets/models')
    ]);
    console.log('โมเดล Face API โหลดเรียบร้อยแล้ว');
  }

  startVideo() {
    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;

    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        video.srcObject = stream;
        video.play();
        this.videoStream = stream; // Save the stream for later stopping
        console.log('กล้องถ่ายรูปเริ่มทำงาน');
      })
      .catch(err => console.error('ข้อผิดพลาดในการเข้าถึงกล้อง:', err));

    video.addEventListener('loadedmetadata', () => {
      const displaySize = { width: video.videoWidth, height: video.videoHeight };
      faceapi.matchDimensions(canvas, displaySize);

      video.addEventListener('play', () => {
        setInterval(async () => {
          const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptors();

          if (detections.length > 0) {
            const resizedDetections = faceapi.resizeResults(detections, displaySize);
            // Process the detections as needed
          } else {
            console.warn('No faces detected');
          }
        }, 100);
      });
    });
  }

  fetchImageData() {
    this.http.get<any[]>(`${this.dataService.apiUrl}/face-detect-img`).subscribe(
      (data: any[]) => {
        this.imgStdData = data;
        console.log('ดึงข้อมูลภาพเรียบร้อยแล้ว');
      },
      (error) => {
        console.error('ข้อผิดพลาดในการดึงข้อมูลภาพ:', error);
      }
    );
  }

  findMatchingUser(faceDescriptor: any) {
    const maxDescriptorDistance = 0.4;
    let bestMatch: any = null;
  
    this.imgStdData.forEach((userData) => {
      if (userData.std_id == this.std_id) { // ใช้ this.std_id แทน
        const savedDescriptor = JSON.parse(userData.extract_feature);
  
        if (faceDescriptor.length === savedDescriptor.length) {
          const distance = faceapi.euclideanDistance(faceDescriptor, savedDescriptor);
          console.log(`ระยะทางไปยัง ${userData.fname} ${userData.lname}: ${distance}`);
  
          if (distance <= maxDescriptorDistance) {
            if (!bestMatch || distance < bestMatch.distance) {
              bestMatch = { userData, distance };
            }
          }
        } else {
          console.warn('ความยาวของ Descriptor ไม่ตรงกัน');
        }
      }
    });
  
    return bestMatch ? bestMatch : null;
  }
  

  async verifyFace() {
    if (!this.std_id) {
        Swal.fire({
            title: 'ข้อผิดพลาด',
            text: 'ไม่พบรหัสนักเรียน',
            icon: 'error',
            confirmButtonText: 'ตกลง'
        });
        return;
    }

    if (this.checklistId === undefined || this.checklistId === null) {
        Swal.fire({
            title: 'ข้อผิดพลาด',
            text: 'รหัสตรวจสอบไม่ถูกต้อง',
            icon: 'error',
            confirmButtonText: 'ตกลง'
        });
        return;
    }

    // ตรวจสอบว่ามีข้อมูล imgStdData หรือไม่
    if (!this.imgStdData || this.imgStdData.length === 0) {
        Swal.fire({
            title: 'ข้อผิดพลาด',
            text: 'ไม่พบข้อมูลรูปภาพนักเรียน กรุณาทำการบันทึกรูปภาพก่อน',
            icon: 'warning',
            confirmButtonText: 'ไปยังหน้าบันทึกรูปภาพ'
        }).then(() => {
            this.router.navigate(['/recognition-manage'], { queryParams: { std_id: this.std_id } });
        });
        return;
    }

    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;

    try {
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptors();

        const displaySize = { width: video.videoWidth, height: video.videoHeight };
        faceapi.matchDimensions(canvas, displaySize);
        const resizedDetections = faceapi.resizeResults(detections, displaySize);

        const faceDescriptor = resizedDetections.length > 0 ? resizedDetections[0].descriptor : null;

        if (faceDescriptor) {
            const matchingUser = this.findMatchingUser(faceDescriptor);
            if (matchingUser) {
                const userData = matchingUser.userData;
                const distance = matchingUser.distance;
                const fname = userData?.fname ?? 'ไม่ทราบ';
                const lname = userData?.lname ?? 'ไม่ทราบ';

                const currentTime = new Date();
                const timeDisplay = currentTime.toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });

                // Fetch checklist end time
                const checklistTimes = await this.http.get<any>(`${this.dataService.apiUrl}/checklist-times/${this.checklistId}`).toPromise();
                const checklistEndTime = new Date(checklistTimes?.checklistEndTime);

                let status: string;
                if (currentTime > checklistEndTime) {
                    status = 'มาสาย'; // Late
                } else {
                    status = 'มาเรียน'; // Present
                }

                this.verificationResult = {
                    fname,
                    lname,
                    distance: distance.toFixed(2), // Show distance to two decimal places
                    match: distance <= 0.6,
                    time: timeDisplay,
                    status
                };

                const imageBlob = await this.captureImageFromVideo(video);
                const formData = new FormData();
                formData.append('img_attendance', imageBlob, 'image.jpg');
                formData.append('std_id', userData.std_id.toString());
                formData.append('status', status);
                formData.append('date_attendance', currentTime.toISOString().split('T')[0]);
                formData.append('time_attendance', currentTime.toTimeString().split(' ')[0]);

                const saveResponse: any = await this.http.post(`${this.dataService.apiUrl}/checklist-attendance/${this.checklistId}`, formData).toPromise();
                this.attendance_id = saveResponse?.attendance_id || null;

                Swal.fire({
                    title: 'การตรวจสอบเสร็จสมบูรณ์',
                    html: `
                      <strong>ชื่อ:</strong> ${this.verificationResult.fname} ${this.verificationResult.lname}<br>
                      <strong>เวลา:</strong> ${this.verificationResult.time}<br>
                      <strong>ระยะทาง:</strong> ${this.verificationResult.distance} <br>
                      <strong>ผลลัพธ์:</strong> ${this.verificationResult.match ? 'ใบหน้าตรง' : 'ใบหน้าไม่ตรง'}
                    `,
                    icon: 'success',
                    confirmButtonText: 'ตกลง'
                }).then(() => {
                    this.router.navigate(['/checklist-student']).then(() => {
                        setTimeout(() => {
                            window.location.reload();
                        }, 500);
                    });
                });
            } else {
                // ดึงระยะทางทั้งหมดเพื่อคำนวณค่าเฉลี่ย
                const distances: number[] = [];

                this.imgStdData.forEach((userData) => {
                    const savedDescriptor = JSON.parse(userData.extract_feature);
                    const distance = faceapi.euclideanDistance(faceDescriptor, savedDescriptor);
                    distances.push(distance);
                });

                const averageDistance = distances.length > 0
                    ? distances.reduce((acc, val) => acc + val, 0) / distances.length
                    : null;

                Swal.fire({
                    title: 'ไม่พบผู้ใช้',
                    text: `ไม่พบผู้ใช้ที่ตรงกับใบหน้าที่ตรวจสอบ ระยะทางเฉลี่ย (distance): ${averageDistance !== null ? averageDistance.toFixed(2) : 'ไม่สามารถคำนวณได้'}`,
                    icon: 'error',
                    confirmButtonText: 'ตกลง'
                });
            }
        } else {
            Swal.fire({
                title: 'ไม่พบใบหน้า',
                text: 'ไม่พบใบหน้าที่ตรวจสอบ',
                icon: 'warning',
                confirmButtonText: 'ตกลง'
            });
        }
    } catch (error) {
        console.error('ข้อผิดพลาดในการตรวจสอบใบหน้า:', error);
        Swal.fire({
            title: 'ข้อผิดพลาด',
            text: 'เกิดข้อผิดพลาดในการตรวจสอบใบหน้า',
            icon: 'error',
            confirmButtonText: 'ตกลง'
        });
    }
}



  captureImageFromVideo(video: HTMLVideoElement): Promise<Blob> {
    return new Promise<Blob>((resolve, reject) => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to capture image'));
          }
        }, 'image/jpeg', 1.0);
      } else {
        reject(new Error('Failed to get canvas context'));
      }
    });
  }

  stopVideo() {
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(track => track.stop());
      console.log('กล้องถ่ายรูปหยุดทำงานแล้ว');
    }
  }

  ngOnDestroy() {
    this.stopVideo(); // Stop video stream when the component is destroyed
  }
}


