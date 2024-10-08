import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DataService } from './data.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private http: HttpClient, private dataService: DataService) { }

  login(email: string, password: string): Observable<any> {
    const data = { email, password };
    return this.http.post<any>(`${this.dataService.apiUrl}/login`, data);
  }
}
