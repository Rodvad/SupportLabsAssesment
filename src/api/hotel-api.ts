import type { APIRequestContext, APIResponse } from '@playwright/test';
import { Guest, Stay, randomFutureDate, stayFrom } from '../data/test-data';

export interface Room {
  roomid: number;
  roomName: string;
}

export interface Booking {
  bookingid: number;
  roomid: number;
  firstname: string;
  lastname: string;
  depositpaid: boolean;
  bookingdates: Stay;
}

export interface MessageSummary {
  id: number;
  name: string;
  subject: string;
}

/** Everything the tests need from the Restful Booker Platform REST API, in one place. */
export class HotelApi {
  private adminToken?: string;

  constructor(private readonly request: APIRequestContext) {}

  async listRooms(): Promise<Room[]> {
    const response = await this.request.get('/api/room');
    return ((await response.json()) as { rooms: Room[] }).rooms;
  }

  /** IDs of the rooms the site offers for the given dates. */
  async availableRoomIds(stay: Stay): Promise<number[]> {
    const response = await this.request.get('/api/room', { params: { ...stay } });
    const body = (await response.json()) as { rooms: Room[] };
    return body.rooms.map((room) => room.roomid);
  }

  /** Sends a booking request and returns the raw response, so a test can also check a refusal. */
  async requestBooking(roomid: number, stay: Stay, guest: Guest): Promise<APIResponse> {
    return this.request.post('/api/booking', {
      data: { roomid, depositpaid: false, ...guest, bookingdates: stay },
    });
  }

  /**
   * Books `nights` on a window that is free, and returns the booking.
   * If the random window is taken (by another user of the shared site), it tries another one.
   */
  async bookFreeStay(roomid: number, guest: Guest, nights = 2): Promise<Booking> {
    for (let attempt = 1; attempt <= 3; attempt++) {
      const response = await this.requestBooking(roomid, stayFrom(randomFutureDate(), nights), guest);
      if (response.status() === 201) {
        return (await response.json()) as Booking;
      }
    }
    throw new Error(`Could not find a free ${nights}-night window for room ${roomid} in 3 attempts`);
  }

  async listMessages(): Promise<MessageSummary[]> {
    const response = await this.request.get('/api/message', { headers: await this.adminHeaders() });
    return ((await response.json()) as { messages: MessageSummary[] }).messages;
  }

  async deleteBooking(bookingid: number): Promise<void> {
    await this.request.delete(`/api/booking/${bookingid}`, { headers: await this.adminHeaders() });
  }

  async deleteMessage(id: number): Promise<void> {
    await this.request.delete(`/api/message/${id}`, { headers: await this.adminHeaders() });
  }

  private async adminHeaders(): Promise<Record<string, string>> {
    if (!this.adminToken) {
      // Public demo credentials of the practice site. Override them with environment variables.
      const response = await this.request.post('/api/auth/login', {
        data: {
          username: process.env.ADMIN_USER ?? 'admin',
          password: process.env.ADMIN_PASSWORD ?? 'password',
        },
      });
      this.adminToken = ((await response.json()) as { token: string }).token;
    }
    return { Cookie: `token=${this.adminToken}` };
  }
}
