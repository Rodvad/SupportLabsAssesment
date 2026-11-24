import { test as base, expect } from '@playwright/test';
import { HotelApi } from './api/hotel-api';
import { ContactForm } from './pages/contact-form';

interface Fixtures {
  /** REST client for the hotel site. */
  hotel: HotelApi;
  /** ID of an existing room to book. The test is skipped if the site has no rooms. */
  roomId: number;
  /** Call it with every booking a test creates: they are deleted when the test ends. */
  trackBooking: (bookingid: number) => void;
  /** Call it with the subject of every contact message a test sends: they are deleted when the test ends. */
  trackMessage: (subject: string) => void;
  /** The contact form, already open. */
  contactForm: ContactForm;
}

export const test = base.extend<Fixtures>({
  hotel: async ({ request }, use) => {
    await use(new HotelApi(request));
  },

  roomId: async ({ hotel }, use, testInfo) => {
    const rooms = await hotel.listRooms();
    testInfo.skip(rooms.length === 0, 'The site has no rooms right now (another user may have deleted them)');
    await use(rooms[0].roomid);
  },

  trackBooking: async ({ hotel }, use) => {
    const created: number[] = [];
    await use((bookingid) => created.push(bookingid));
    // Teardown: leave the shared site as we found it.
    for (const bookingid of created) {
      await hotel.deleteBooking(bookingid);
    }
  },

  trackMessage: async ({ hotel }, use) => {
    const subjects: string[] = [];
    await use((subject) => subjects.push(subject));
    // Teardown, best effort: the site also clears all messages every 10 minutes.
    if (subjects.length > 0) {
      const inbox = await hotel.listMessages();
      for (const message of inbox.filter((item) => subjects.includes(item.subject))) {
        await hotel.deleteMessage(message.id);
      }
    }
  },

  contactForm: async ({ page }, use) => {
    const form = new ContactForm(page);
    await form.open();
    await use(form);
  },
});

export { expect };
