import { Component, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, take, takeUntil } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-services-info',
  templateUrl: './services-info.component.html',
  styleUrls: ['./services-info.component.css']
})
export class ServicesInfoComponent {
  currentUser:any;
  defaultProfile = 'https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-chat/ava3.webp';
  hoveredIndex: number = -1;
  providerData: any;
  time: any = [];
  bYears: any;
  reviewData: any
  unSubscribe$ = new Subject();
  @ViewChild('target')
  target = new ElementRef<any>('');
  constructor(private api: ApiService, private auth: AuthService, private router: Router) { }

  ngOnInit() {
    this.currentUser = JSON.parse(localStorage.getItem('userProfile') || '');
    this.providerData = JSON.parse(localStorage.getItem('serviceData') || '');
    this.time[0] = this.formatTime((this.providerData.orgDetails.openTime));
    this.time[1] = this.formatTime((this.providerData.orgDetails.closeTime));
    const date = new Date();
    const currentDate = date.getFullYear();
    this.bYears = currentDate - this.providerData.establishmentYear;

    this.loadReviews();
  }

  onStarHover(index: number): void {
    this.hoveredIndex = index;
  }

  async rating(hoveredIndex: number) {
    const rating = hoveredIndex + 1;
    const userReview = await this.api.textArea();
    
    const reviews = {
      rating: rating,
      review: userReview,
      senderId: this.currentUser.uid,
      recepientId: this.providerData.uid,
      profilePic: this.currentUser.profilePic,
      name: this.currentUser.fname + ' ' + this.currentUser.lname,
    }
    this.api.sendReviews(reviews);
  }

  formatTime(timeString: string) {
    const [hourString, minute] = timeString.split(":");
    const hour = + hourString % 24;
    return (hour % 12 || 12) + ":" + minute + (hour < 12 ? "AM" : "PM");
  }

  loadReviews() {
    this.api.getReviews(this.providerData.uid)
      .pipe(takeUntil(this.unSubscribe$))
      .subscribe(data => {
        this.reviewData = data;
      });
  }

  latest() {
    this.reviewData.reviewList.sort((a: { reviewDate: any; }, b: { reviewDate: any; }) => this.compareDates(a.reviewDate, b.reviewDate));
  }

  compareDates(a: any, b: any) {
    const monthNames = [
      "January", "February", "March", "April", "May", "June", "July",
      "August", "September", "October", "November", "December"
    ];

    const [dayA, monthA] = a.split(" ");
    const [dayB, monthB] = b.split(" ");

    const monthIndexA = monthNames.indexOf(monthA);
    const monthIndexB = monthNames.indexOf(monthB);

    if (monthIndexA > monthIndexB) return -1;
    if (monthIndexA < monthIndexB) return 1;

    if (dayA > dayB) return -1;
    if (dayA < dayB) return 1;

    return 0;
  }

  sortHighToLow() {
    this.reviewData.reviewList.sort((a: any, b: any) => {
      return b.userRating - a.userRating;
    })
  }

  scroll() {
    this.target.nativeElement.scrollIntoView();
  }

  bookAppointment(time: any) {

    const appointmentData = {
      userUid: this.currentUser.uid,
      providerName: this.providerData.orgName,
      name: this.currentUser.fname + ' ' + this.currentUser.lname,
      profilePic: this.currentUser.profilePic,
      booked: false,
      date: time.day + ' ' + time.month,
      time: time.openTime + ' - ' + time.closeTime,
      address: this.currentUser.street + ', ' + this.currentUser.street2 + ', ' + this.currentUser.city + ', ' + this.currentUser.state + ', ' + this.currentUser.zip,
      phone: this.currentUser.phone,
      email: this.currentUser.email,
      completed: false,
      cancelled: false
    }

    this.api.bookAppointment(this.providerData.uid, appointmentData)
      .pipe(takeUntil(this.unSubscribe$))
      .subscribe(data => {
        if (data === 'pending') {
          this.api.infoMessage('Your request is pending wait for confirmation.');
        }
        if (data === 'success') {
          this.api.successMessage('Your request is sent successfully! Please check your appointments for confirmation.');
        }
      });
  }

  setDateTime(event: any) {
    this.bookAppointment(event)
  }

  chat(providerData: any) {
    this.api.checkUsers.next(providerData);
    this.router.navigate(['/user/chat']);
  }

  enquire(providerData: any) {
    const user = {
      userUid: this.currentUser.uid,
      name:this.currentUser.fname + ' ' + this.currentUser.lname,
      email:this.currentUser.email,
      phone:this.currentUser.phone
    }

    this.api.enquire(this.providerData.uid,user);
  }

  ngOnDestroy() {
    this.unSubscribe$.next(null);
    this.unSubscribe$.complete();
  }
}
