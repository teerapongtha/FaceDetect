import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '../model/user.model';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  apiUrl = 'https://teerapong.bowlab.net/FinalProject';
  // apiUrl = 'http://localhost/FinalProject';

  private acIdSubject = new BehaviorSubject<string | null>(null);
  private userDataSubject = new BehaviorSubject<any>(null);

  constructor(private http: HttpClient) {
    const storedAcId = localStorage.getItem('acId');
    if (storedAcId) {
      this.acIdSubject.next(storedAcId);
    }

    const storedUserData = localStorage.getItem('userData');
    if (storedUserData) {
      this.userDataSubject.next(JSON.parse(storedUserData));
    }
  }

  setAcId(id: string | null) {
    this.acIdSubject.next(id);
    if (id) {
      localStorage.setItem('acId', id);
    } else {
      localStorage.removeItem('acId');
    }
  }

  getAcId(): Observable<string | null> {
    return this.acIdSubject.asObservable();
  }

  setUserData(data: any | null) {
    this.userDataSubject.next(data);
    if (data) {
      localStorage.setItem('userData', JSON.stringify(data));
    } else {
      localStorage.removeItem('userData');
    }
  }

  getUserData(): Observable<any> {
    return this.userDataSubject.asObservable();
  }

  getProfileData(id: string): Observable<User> {
    const url = `${this.apiUrl}/profile-data/${id}`;
    return this.http.get<User>(url);
  }
}
