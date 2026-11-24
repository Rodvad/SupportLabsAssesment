import { randomInt, randomUUID } from 'node:crypto';

export interface Stay {
  checkin: string;
  checkout: string;
}

export interface Guest {
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
}

export interface ContactMessage {
  name: string;
  email: string;
  phone: string;
  subject: string;
  description: string;
}

/** Short unique suffix, so every run creates data that no other run or user has. */
export function uniqueId(): string {
  return randomUUID().slice(0, 8);
}

/** Fictitious guest. The e-mail uses example.com, a domain reserved for documentation. */
export function buildGuest(overrides: Partial<Guest> = {}): Guest {
  return {
    firstname: 'Testa',
    lastname: 'Fictional',
    email: `testa.${uniqueId()}@example.com`,
    phone: '01234567890',
    ...overrides,
  };
}

export function buildContactMessage(overrides: Partial<ContactMessage> = {}): ContactMessage {
  const id = uniqueId();
  return {
    name: 'Testa Fictional',
    email: `testa.${id}@example.com`,
    phone: '01234567890',
    subject: `Automated check ${id}`,
    description: 'Fictitious message created by an automated test.',
    ...overrides,
  };
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** The date `days` after `isoDate` (a negative value goes back), as YYYY-MM-DD. */
export function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return toIsoDate(date);
}

export function today(): string {
  return toIsoDate(new Date());
}

/**
 * A random check-in date between about 1 and 9 years from now.
 * The wide range makes a clash with another test, or with another user of the shared site, very unlikely.
 */
export function randomFutureDate(): string {
  return addDays(today(), randomInt(400, 3400));
}

export function stayFrom(checkin: string, nights: number): Stay {
  return { checkin, checkout: addDays(checkin, nights) };
}
