import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, take, BehaviorSubject } from 'rxjs';
import Swal from 'sweetalert2';
import { appointment, payment, review } from '../model/model';

interface appointmentData {
  userUid: string,
  name: string,
  booked: boolean,
  time: string,
  address: string,
  completed: boolean
}

@Injectable({
  providedIn: 'root'
})

export class ApiService {

  checkUsers = new BehaviorSubject<any>(null);

  url = 'http://localhost:3000/';

  constructor(private http: HttpClient) { }

  sendData(data: any, id: string | null) {
    this.http.post(this.url + 'provider/editProfile', { data, id }).subscribe();
  }

  sendReviews(data: any) {
    this.http.post(this.url + 'review/addReviews', data).subscribe();
  }

  async textArea(): Promise<string> {
    const { value: text } = await Swal.fire({
      input: 'textarea',
      inputLabel: 'Review',
      inputPlaceholder: 'Type your message here...',
      inputAttributes: {
        'aria-label': 'Type your message here'
      },
      showCancelButton: true
    })

    return new Promise((resolve, reject) => {
      if (text) {
        resolve(text);
      }
    });
  }

  successMessage(message: string) {
    Swal.fire(
      'Great!',
      message,
      'success'
    );
  }

  infoMessage(message: string) {
    Swal.fire(
      'Please be patient',
      message,
      'info'
    );
  }

  rejectMessage(message: string) {
    Swal.fire(
      'Sorry',
      message,
      'error'
    )
  }

  getStates() {
    return this.http.get<[]>('http://localhost:3000/admin/states');
  }

  getServices() {
    return this.http.get<[]>('http://localhost:3000/admin/services');

  }
  getProviderInfo(id: string) {
    return this.http.get(this.url + 'provider/getUser/' + id);
  }

  getReviews(id: string): Observable<review> {
    return this.http.get<review>(this.url + `review/getReviews?id=${id}`);
  }

  bookAppointment(id: string, appointmentData: appointmentData) {
    return this.http.post(this.url + 'appointment/bookAppointment', { id, appointmentData });
  }

  getAppointments(id = '', userUid = ''): Observable<appointment | null> {
    return this.http.get<appointment | null>(this.url + `appointment/getAppointments?id=${id}&userUid=${userUid}`);
  }

  getBill(id: string) {
    return this.http.get(this.url + `payment/getBill?id=${id}`);
  }

  getFullTransaction(id: string): Observable<payment> {
    return this.http.get<payment>(this.url + `payment/getFullTransaction?id=${id}`);
  }

  getEnquiries(id: string) {
    return this.http.get(this.url + `provider/enquiries?id=${id}`);
  }

  editAppointment(id: string, docId: string, data: {}) {
    this.http.post(this.url + 'appointment/editAppointment', { id, docId, data }).pipe(take(1)).subscribe();
  }

  editUserprofile(formData:any,id:string){
    this.http.put(this.url + 'user/editProfile',{formData,id}).subscribe();
  }

  setBill(providerData: any, generatedBill: any) {
    return this.http.post(this.url + 'payment/addTransaction', { providerData, generatedBill });
  }

  enquire(id: string, user: { userUid: string, name: string, email: string, phone: Number }) {
    this.http.post(this.url + 'user/enquire', { id, user }).pipe(take(1))
      .subscribe(data => {
        if (data === 'success') {
          this.successMessage('An enquiry has been placed');
        }
      });
  }

  removeEnquiry(deleteObj: { providerUid: string, userUid: string }) {
    return this.http.post(this.url + 'provider/deleteEnquiry', { deleteObj });
  }
}
