import { HttpClient } from '@angular/common/http';
import { Component, ViewChild } from '@angular/core';
import { Observable, concatAll, take, map, merge, startWith, switchMap, toArray } from 'rxjs';
import { message } from 'src/app/model/model';
import { ApiService } from 'src/app/services/api.service';
import { AuthService } from 'src/app/services/auth.service';
import { ChatService } from 'src/app/services/chat.service';

@Component({
  selector: 'app-provider-chat',
  templateUrl: './provider-chat.component.html',
  styleUrls: ['./provider-chat.component.css']
})
export class ProviderChatComponent {
  @ViewChild('scrollDiv') scrollDiv: any;

  newMessage = '';
  data1$ = new Observable<any>();
  data2$ = new Observable<any>();
  data = new Observable<any>();
  allUsersdata$ = new Observable<any>();
  uid: any;
  userMessageList: Observable<any> = new Observable<any>();
  allMessages: message[] = [];
  userIdList: string[] = [];
  dateTime = new Date();
  currentUser!: string | null;
  currentUserView!: string;
  user:any

  constructor(private auth: AuthService, private chatService: ChatService, private http: HttpClient, private api: ApiService) { }

  ngOnInit() {
    this.user = JSON.parse(localStorage.getItem('userProfile') || '');
    this.chatService.getNewMessage().subscribe((data: any) => {
      const dateTime = this.getDateTime();
      const receivedMessage = {
        message: data.message,
        date: dateTime.date,
        time: dateTime.time,
        messageType: data.messageType
      }

      if (this.uid === data.sender) {
        this.allMessages.push(receivedMessage);
        this.scrollDown();
      }
    });

    // const user = JSON.parse(localStorage.getItem('userProfile') || '');
    this.data = this.userMessageList = this.http.post('http://localhost:3000/message/getMessages', { 'uid': this.user.uid })
    this.data.subscribe(data => {
      if (data) {
        this.loadMessage(this.userMessageList);
        this.checkNewUsers()
      } else {
        this.checkNewUsers(false)
      }
    }
    )

  }

  sendMessage() {
    if (this.uid) {
      const dateTime = this.getDateTime();
      const sentMessage = {
        message: this.newMessage,
        date: dateTime.date,
        time: dateTime.time,
        messageType: 'sent'
      }
      this.allMessages.push(sentMessage);
      this.chatService.sendMessage(this.newMessage, this.uid, 'user');
      this.newMessage = '';
      this.scrollDown();
    }
  }

  getDateTime() {
    const date = this.dateTime.toLocaleString('default', { month: 'long', day: '2-digit' });
    const time = this.dateTime.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })
    return { date: date, time: time }
  }

  loadMessage(userMessageList: Observable<any>) {
    this.data1$ = this.userMessageList.pipe(
      map(data => data.messages.map((item: { receiverUid: any; }) => item.receiverUid)),
      switchMap(userIdList => this.http.post('http://localhost:3000/user/getUsers', { 'users': userIdList })
      )
    )

    this.data2$ = this.userMessageList.pipe(
      map(data => data.messages.map((item: { receiverUid: any; }) => item.receiverUid)),
      switchMap(userIdList => this.http.post('http://localhost:3000/provider/getUsersList', { 'users': userIdList }))
    )

    this.allUsersdata$ = this.data = merge(this.data1$, this.data2$).pipe(concatAll(), toArray());
  }

  async getAllMessages(selectedUser: any) {
    this.uid = selectedUser.uid;
    this.userMessageList
      .subscribe((data: any) => {
        const checkUser =
          data?.messages
            .filter((users: { receiverUid: string; }) => users.receiverUid === selectedUser.uid)
            .filter((user: { messageList: string | any[]; }) => user.messageList.length > 0)
        if (checkUser.length > 0) {
          this.allMessages = checkUser.map(((user: { messageList: any; }) => user.messageList))[0];
        } else {
          this.allMessages = [];
        }

        this.scrollDown();
      });
  }

  checkNewUsers(check = true) {
    const newUser = this.api.checkUsers.getValue();
    if (newUser && check) {
      this.data.pipe(take(1)).subscribe(data => {
        const ck = data.filter((c: any) => c.uid === newUser.uid)
        if (ck.length > 0) {
          return;
        } else {
          this.insertNewUser(newUser);
        }
      }
      )
    }

    if (newUser && !check) {
      this.allUsersdata$ = this.allUsersdata$.pipe(startWith([newUser]));
    }
    this.api.checkUsers.next(null);
  }

  insertNewUser(newUser:any){
    this.allUsersdata$ = this.data.pipe(startWith([newUser]), concatAll(), toArray());
  }

  scrollDown() {
    setTimeout(() => {
      this.scrollDiv.nativeElement.scrollTop = this.scrollDiv.nativeElement.scrollHeight;
    }, 0);
  }
}
