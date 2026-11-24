import type { Locator, Page, Response } from '@playwright/test';
import type { ContactMessage } from '../data/test-data';

/** The "Send Us a Message" form on the guest home page. */
export class ContactForm {
  readonly submitButton: Locator;
  readonly messageBox: Locator;

  constructor(private readonly page: Page) {
    this.submitButton = page.getByRole('button', { name: 'Submit' });
    this.messageBox = page.getByTestId('ContactDescription');
  }

  async open(): Promise<void> {
    await this.page.goto('/#contact');
    await this.submitButton.scrollIntoViewIfNeeded();
  }

  async fill(message: ContactMessage): Promise<void> {
    await this.page.getByRole('textbox', { name: 'Name' }).fill(message.name);
    await this.page.getByRole('textbox', { name: 'Email' }).fill(message.email);
    await this.page.getByRole('textbox', { name: 'Phone' }).fill(message.phone);
    await this.page.getByRole('textbox', { name: 'Subject' }).fill(message.subject);
    await this.messageBox.fill(message.description);
  }

  /** Clicks "Submit" and returns the server's answer to the message request. */
  async submit(): Promise<Response> {
    const answer = this.page.waitForResponse(
      (response) => response.url().endsWith('/api/message') && response.request().method() === 'POST',
    );
    await this.submitButton.click();
    return answer;
  }

  confirmationFor(name: string): Locator {
    return this.page.getByRole('heading', { name: `Thanks for getting in touch ${name}!` });
  }

  /** A validation message shown by the form, found by its visible text. */
  validationError(text: string | RegExp): Locator {
    return this.page.getByText(text);
  }
}
