import { test, expect } from '../../src/fixtures';
import { buildContactMessage } from '../../src/data/test-data';

/**
 * Scenario 2: the guest contact form (UI), checked end to end against the admin inbox.
 * Risk: the form is the only way a guest reaches the hotel. A message that is lost,
 * or that carries unusable contact details, cannot be answered.
 */
test.describe('Contact form', () => {
  test('a guest sends a message and the hotel receives it - HP', async ({ contactForm, hotel, trackMessage }) => {
    const message = buildContactMessage();
    trackMessage(message.subject);

    await contactForm.fill(message);
    await contactForm.submit();

    await expect(contactForm.confirmationFor(message.name)).toBeVisible();
    await expect
      .poll(async () => (await hotel.listMessages()).map((received) => received.subject), {
        message: 'the message should appear in the admin inbox',
      })
      .toContain(message.subject);
  });

  test('an empty form is refused and every required field is named - SP', async ({ contactForm }) => {
    await contactForm.submit();

    for (const field of ['Name', 'Email', 'Phone', 'Subject', 'Message']) {
      await expect(contactForm.validationError(`${field} may not be blank`)).toBeVisible();
    }
    await expect(contactForm.submitButton).toBeVisible();
  });

  test('a phone number made of letters is refused - SP', async ({ contactForm, trackMessage }) => {
    test.fail(true, 'Known defect (Part 2B, finding 3): the form accepts letters as a phone number');
    const message = buildContactMessage({ phone: 'abcdefghijk' });
    trackMessage(message.subject);

    await contactForm.fill(message);
    const answer = await contactForm.submit();

    expect(answer.status()).toBe(400);
    await expect(contactForm.validationError(/phone/i).first()).toBeVisible();
  });
});
