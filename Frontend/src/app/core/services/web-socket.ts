import { Injectable } from "@angular/core";
import { Subject } from "rxjs";

export interface WebSocketMessage {
  ticketId: string;
  data: any;
}

@Injectable({
  providedIn: "root",
})
export class WebSocketService {
  private sockets = new Map<string, WebSocket>();
  private readonly _messages$ = new Subject<WebSocketMessage>();
  readonly messages$ = this._messages$.asObservable();

  connect(ticketId: string, url: string): void {
    if (this.sockets.has(ticketId)) return;

    const socket = new WebSocket(url);
    this.sockets.set(ticketId, socket);

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this._messages$.next({ ticketId, data });
      } catch (e) {
        console.error("Failed to parse WebSocket message", e);
      }
    };

    socket.onclose = () => {
      this.sockets.delete(ticketId);
    };

    socket.onerror = (error) => {
      console.error(`WebSocket Error for ticket ${ticketId}:`, error);
      this.sockets.delete(ticketId);
    };
  }

  disconnect(ticketId: string): void {
    const socket = this.sockets.get(ticketId);
    if (socket) {
      socket.close();
      this.sockets.delete(ticketId);
    }
  }
}
