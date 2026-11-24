import { test, expect } from '../../src/fixtures';
import type { Booking } from '../../src/api/hotel-api';
import { addDays, buildGuest, stayFrom, today } from '../../src/data/test-data';

/**
 * Scenario 1: date rules of a room booking (REST API).
 * Risk: a wrong date rule sells one room twice, or records a stay that cannot happen.
 * Every test books its own random window far in the future, so the tests do not depend
 * on each other or on data that the site resets every 10 minutes.
 */
test.describe('Room booking: date rules', () => {
  test('a free room can be booked and is then no longer offered for those dates - HP', async ({
    hotel,
    roomId,
    trackBooking,
  }) => {
    const guest = buildGuest();

    const booking = await hotel.bookFreeStay(roomId, guest);
    trackBooking(booking.bookingid);

    expect(booking).toMatchObject({
      bookingid: expect.any(Number),
      roomid: roomId,
      firstname: guest.firstname,
      lastname: guest.lastname,
      depositpaid: false,
    });
    expect(await hotel.availableRoomIds(booking.bookingdates)).not.toContain(roomId);
  });

  test.describe('when the room already has a booking', () => {
    let existing: Booking;

    test.beforeEach(async ({ hotel, roomId, trackBooking }) => {
      existing = await hotel.bookFreeStay(roomId, buildGuest(), 2);
      trackBooking(existing.bookingid);
    });

    test('the same dates are refused - SP', async ({ hotel, roomId }) => {
      const response = await hotel.requestBooking(roomId, existing.bookingdates, buildGuest());

      expect(response.status()).toBe(409);
    });

    test('dates that overlap by one night are refused - SP', async ({ hotel, roomId }) => {
      const overlapping = stayFrom(addDays(existing.bookingdates.checkin, 1), 2);

      const response = await hotel.requestBooking(roomId, overlapping, buildGuest());

      expect(response.status()).toBe(409);
    });

    test('a stay that starts on the check-out day is accepted - EC', async ({ hotel, roomId, trackBooking }) => {
      const backToBack = stayFrom(existing.bookingdates.checkout, 2);

      const response = await hotel.requestBooking(roomId, backToBack, buildGuest());

      expect(response.status()).toBe(201);
      trackBooking(((await response.json()) as Booking).bookingid);
    });
  });

  test('a stay with check-out before check-in is refused - SP', async ({ hotel, roomId }) => {
    const checkin = addDays(today(), 5000);

    const response = await hotel.requestBooking(roomId, { checkin, checkout: addDays(checkin, -2) }, buildGuest());

    expect(response.ok()).toBe(false);
  });

  test('a stay in the past is refused - EC', async ({ hotel, roomId, trackBooking }) => {
    test.fail(true, 'Known defect (Part 2B, finding 2): the API accepts a booking with past dates (HTTP 201)');
    const lastYear = stayFrom(addDays(today(), -365), 2);

    const response = await hotel.requestBooking(roomId, lastYear, buildGuest());

    if (response.status() === 201) {
      trackBooking(((await response.json()) as Booking).bookingid);
    }
    expect(response.status()).toBe(400);
  });
});
