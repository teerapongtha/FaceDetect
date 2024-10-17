import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import * as faceapi from 'face-api.js';
import { DataService } from '../service/data.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-face-recognition',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  providers: [DataService],
  templateUrl: './face-recognition.component.html',
  styleUrls: ['./face-recognition.component.scss']
})
export class FaceRecognitionComponent implements AfterViewInit, OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;
  @ViewChild('capturedImageContainer') capturedImageContainer!: ElementRef<HTMLDivElement>;

  userId: string | undefined;
  private stream: MediaStream | null = null;
  private modelsLoaded: boolean = false; // ตัวแปรตรวจสอบสถานะการโหลดโมเดล

  constructor(private dataService: DataService, private http: HttpClient, private router: Router) {}

  async ngAfterViewInit() {
    Swal.fire({
      title: 'กำลังโหลด...',
      text: 'กรุณารอสักครู่ กำลังเตรียมการเพิ่มรูปภาพใบหน้า',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading(); // Show loading screen
      }
    });

    try {
      await this.loadFaceAPIModels(); // Wait for models to load
      Swal.close(); // Close the loading screen once done
      this.startVideo(); // Start the video stream after models are loaded
      this.getUserId(); // Fetch the user ID
    } catch (error) {
      Swal.fire('เกิดข้อผิดพลาด!', 'ไม่สามารถโหลดโมเดลได้', 'error');
      console.error('Error loading Face API models:', error);
    }
  }

  async loadFaceAPIModels() {
    // เช็คว่าโมเดลถูกโหลดแล้วหรือยัง
    if (this.modelsLoaded) {
      return; // ถ้าโหลดแล้วไม่ต้องโหลดซ้ำ
    }
  
    const loadModel = async (model: Promise<any>) => {
      await model;
    };
  
    try {
      // โหลดโมเดลแบบขนานเพื่อให้เร็วขึ้น
      await Promise.all([
        loadModel(faceapi.nets.tinyFaceDetector.loadFromUri('assets/models')),
        loadModel(faceapi.nets.faceLandmark68Net.loadFromUri('assets/models')),
        loadModel(faceapi.nets.faceRecognitionNet.loadFromUri('assets/models')),
        loadModel(faceapi.nets.faceExpressionNet.loadFromUri('assets/models'))
      ]);
    
      this.modelsLoaded = true; // ตั้งค่าการโหลดโมเดลให้เป็นจริง
      localStorage.setItem('faceApiModelsLoaded', 'true'); // บันทึกสถานะการโหลดโมเดลใน localStorage
    } catch (error) {
      console.error('Error loading Face API models:', error);
      throw error; // โยนข้อผิดพลาดกลับ
    }
  }
  

  getUserId() {
    this.dataService.getUserData().subscribe(
      (userData: any) => {
        if (userData && userData.std_id) {
          this.userId = userData.std_id;
        } else {
          console.error('User ID not found or invalid.');
        }
      },
      (error) => {
        console.error('Error fetching user data:', error);
      }
    );
  }

  startVideo() {
    const video = this.videoElement.nativeElement;

    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        this.stream = stream; // Save the stream
        video.srcObject = stream;
      })
      .catch(err => console.error('Error accessing camera:', err));

    video.addEventListener('play', () => {
      const canvas = this.canvasElement.nativeElement;
      const displaySize = { width: video.videoWidth, height: video.videoHeight };
      faceapi.matchDimensions(canvas, displaySize);

      setInterval(async () => {
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceExpressions();

        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        const context = canvas.getContext('2d');
        if (context) {
          context.clearRect(0, 0, canvas.width, canvas.height);
          faceapi.draw.drawDetections(canvas, resizedDetections);
          faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
        }
      }, 100);
    });
  }

  async capture() {
    const video = this.videoElement.nativeElement;
    const displaySize = { width: video.videoWidth, height: video.videoHeight };
  
    const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptors();
    const resizedDetections = faceapi.resizeResults(detections, displaySize);
  
    if (resizedDetections.length > 0) {
      const detection = resizedDetections[0].detection;
      const box = detection.box;
  
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = box.width;
      canvas.height = box.height;
  
      if (context) {
        context.drawImage(video, box.x, box.y, box.width, box.height, 0, 0, box.width, box.height);
  
        const imageBlob = await new Promise<Blob>((resolve) => canvas.toBlob(resolve as any, 'image/jpeg'));
        const faceDescriptor = resizedDetections[0].descriptor;
  
        const formData = new FormData();
        formData.append('img_path', imageBlob, `${this.userId}.jpg`);
        formData.append('extract_feature', JSON.stringify(faceDescriptor));
  
        this.http.post(`${this.dataService.apiUrl}/face-detect-img-add/${this.userId}`, formData).subscribe(
          (response: any) => {
            if (response.success) {
              const url = URL.createObjectURL(imageBlob);
              const img = new Image();
              img.src = url;
              img.style.display = 'block';
              img.style.margin = '0 auto';
              img.style.border = '2px solid #000';
              this.capturedImageContainer.nativeElement.innerHTML = '';
              this.capturedImageContainer.nativeElement.appendChild(img);
  
              Swal.fire({
                title: 'เพิ่มรูปภาพใบหน้าสำเร็จ!',
                icon: 'success',
                confirmButtonText: 'ตกลง'
              }).then((result) => {
                if (result.isConfirmed) {
                  this.stopVideo(); // Stop video before navigating
                  this.router.navigate(['/recognition-manage']);
                }
              });
            } else {
              console.error('Failed to upload image:', response.error);
              Swal.fire('เกิดข้อผิดพลาด!', 'ไม่สามารถอัปโหลดรูปภาพได้', 'error');
            }
          },
          (error) => {
            console.error('Error uploading image:', error);
            Swal.fire('เกิดข้อผิดพลาด!', 'ไม่สามารถอัปโหลดรูปภาพได้', 'error');
          }
        );
      }
    } else {
      Swal.fire('ไม่พบใบหน้า', 'ไม่พบใบหน้าในภาพ', 'warning');
    }
  }
  
  goBack() {
    this.stopVideo(); // Stop video when going back
    this.router.navigate(['/recognition-manage']);
  }

  stopVideo() {
    if (this.stream) {
      const tracks = this.stream.getTracks();
      tracks.forEach(track => track.stop());
      this.stream = null;
    }
  }

  ngOnDestroy() {
    this.stopVideo(); // Ensure camera is stopped when component is destroyed
  }
}
