import { Injectable } from '@angular/core';
import { Firestore, doc, docData, getDoc } from "@angular/fire/firestore";
import { Observable, map } from 'rxjs';
import { Chat } from "src/app/interfaces/chat";

@Injectable({
  providedIn: 'root'
})
export class ChatsService{
  constructor(private firestore: Firestore){}
  
  getChatId(id: number): Observable<Chat | null>{
    const chatRef = doc(this.firestore, `chats/${id}`);
    return docData(chatRef).pipe(
      map((chat: Chat | undefined) => {
        if(chat){
          return { ...chat, numVenta: id };
        }else{
          return null
        }
      })
    );
  }
}
