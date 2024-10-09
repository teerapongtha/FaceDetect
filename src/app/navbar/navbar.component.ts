import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DataService } from '../service/data.service';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { Offcanvas } from 'bootstrap';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  providers: [DataService],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit, OnDestroy {
  userData: any;
  private userDataSubscription: Subscription | undefined;

  constructor(private dataService: DataService, private http: HttpClient, private router: Router) { }

  ngOnInit() {
    this.userDataSubscription = this.dataService.getUserData().subscribe((userData) => {
      this.userData = userData;
    });
  }

  ngOnDestroy() {
    if (this.userDataSubscription) {
      this.userDataSubscription.unsubscribe();
    }
  }

  closeMenu() {
    const offcanvasElement = document.getElementById('navbarOffcanvas');
    if (offcanvasElement) {
      const offcanvas = Offcanvas.getOrCreateInstance(offcanvasElement);
      offcanvas.hide();
    }
  }

  logout() {
    localStorage.removeItem('acId');
    localStorage.removeItem('userData');
    localStorage.removeItem('Data');
    this.dataService.setAcId(null);
    this.dataService.setUserData(null);
    this.router.navigate(['/login']).then(() => {
      window.location.reload();
    });
  }
}
