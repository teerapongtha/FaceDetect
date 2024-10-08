import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import * as faceapi from 'face-api.js';
import { DataService } from '../service/data.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-face-detect',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  providers: [DataService],
  templateUrl: './face-detect.component.html',
  styleUrls: ['./face-detect.component.scss']
})
export class FaceDetectComponent implements AfterViewInit, OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;

  imgStdData: any[] = [];
  verificationResult: any = null;
  stdId: string | null = null;
  private videoStream: MediaStream | null = null;

  constructor(
    private dataService: DataService,
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  getUserData() {
    this.dataService.getUserData().subscribe(userData => {
      if (userData) {
        this.stdId = userData.std_id;
      } else {
        console.error('ไม่พบข้อมูลผู้ใช้');
      }
    });
  }

  ngAfterViewInit() {
    this.route.paramMap.subscribe(params => {
      this.stdId = params.get('std_id');
      if (this.stdId) {
        this.loadFaceAPIModels().then(() => {
          this.startVideo();
          this.fetchImageData();
        });
      }
    });
  }

  async loadFaceAPIModels() {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri('assets/models'),
      faceapi.nets.faceLandmark68Net.loadFromUri('assets/models'),
      faceapi.nets.faceRecognitionNet.loadFromUri('assets/models'),
      faceapi.nets.faceExpressionNet.loadFromUri('assets/models')
    ]);
  }

  startVideo() {
    const video = this.videoElement.nativeElement;

    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        this.videoStream = stream; // Store the stream
        video.srcObject = stream;
      })
      .catch(err => console.error('เกิดข้อผิดพลาดในการเข้าถึงกล้อง:', err));

    video.addEventListener('play', () => {
      const canvas = this.canvasElement.nativeElement;
      const displaySize = { width: video.width, height: video.height };
      faceapi.matchDimensions(canvas, displaySize);

      setInterval(async () => {
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptors();

        const resizedDetections = faceapi.resizeResults(detections, displaySize);
      }, 100);
    });
  }

  fetchImageData() {
    if (this.stdId) {
      this.http.get<any[]>(`${this.dataService.apiUrl}/face-detect-verify/${this.stdId}`).subscribe(
        (data: any[]) => {
          this.imgStdData = data;

          if (this.imgStdData.length === 0 || !this.imgStdData[0].extract_feature) {
            Swal.fire({
              title: 'ไม่พบข้อมูล',
              text: 'กรุณาทำการบันทึกรูปภาพก่อนทำการตรวจสอบ',
              icon: 'warning',
              confirmButtonText: 'ตกลง'
            }).then(() => {
              this.router.navigate(['/recognition-manage']);
            });
          }
        },
        (error) => {
          console.error('เกิดข้อผิดพลาดในการดึงข้อมูลรูปภาพ:', error);
        }
      );
    }
  }

  findMatchingUser(faceDescriptor: any) {
    let bestMatch: any = null;
    let minDistance = Infinity;

    this.imgStdData.forEach((userData) => {
      const savedDescriptor = JSON.parse(userData.extract_feature);
      if (faceDescriptor.length === savedDescriptor.length) {
        const distance = faceapi.euclideanDistance(faceDescriptor, savedDescriptor);
        //เพิ่ม check treshold -> distance < 0.4
        if (distance < minDistance && distance < 0.4) {
          minDistance = distance;
          bestMatch = { userData, distance };
        }
      }
    });

    return bestMatch ? bestMatch : null;
  }

  async verifyFace() {
    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;

    const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptors();

    const resizedDetections = faceapi.resizeResults(detections, faceapi.matchDimensions(canvas, { width: video.width, height: video.height }));
    const faceDescriptor = resizedDetections.length > 0 ? resizedDetections[0].descriptor : null;

    let verificationResult;

    if (faceDescriptor) {
      const matchingUser = this.findMatchingUser(faceDescriptor);
      if (matchingUser) {
        const userData = matchingUser.userData;
        const distance = matchingUser.distance;
        const fname = userData?.fname ?? 'ไม่พบชื่อ';
        const lname = userData?.lname ?? 'ไม่พบนามสกุล';

        verificationResult = {
          fname,
          lname,
          distance: distance.toFixed(2),
          match: true
        };
      } else {
        verificationResult = { fname: 'ไม่พบชื่อ', lname: 'ไม่พบนามสกุล', distance: 'N/A', match: false };
      }
    } else {
      verificationResult = { fname: 'ไม่พบชื่อ', lname: 'ไม่พบนามสกุล', distance: 'N/A', match: false };
    }

    // Display result using SweetAlert2
    Swal.fire({
      title: 'ผลการตรวจสอบ',
      html: `
        <p><strong>ชื่อ:</strong> ${verificationResult.fname} ${verificationResult.lname}</p>
        <p><strong>ระยะทาง:</strong> ${verificationResult.distance}</p>
        <p><strong>ผลลัพธ์:</strong> ${verificationResult.match ? 'ใบหน้าตรง' : 'ใบหน้าไม่ตรง'}</p>
      `,
      icon: verificationResult.match ? 'success' : 'error',
      confirmButtonText: 'ตกลง'
    }).then((result) => {
      if (result.isConfirmed) {
        this.stopVideo(); // Stop video on confirm
        this.router.navigate(['/recognition-manage']);
      }
    });
  }

  stopVideo() {
    const video = this.videoElement.nativeElement;
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(track => track.stop()); // Stop all video tracks
      this.videoStream = null; // Clear the stream
    }
    video.srcObject = null; // Clear the video source
  }

  goBack() {
    this.stopVideo(); // Stop video when navigating back
    this.router.navigate(['/recognition-manage']);
  }

  ngOnDestroy() {
    this.stopVideo(); // Ensure video is stopped when component is destroyed
  }
}
