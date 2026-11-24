# Part 3: Test automation (Target B, Restful Booker Platform)

Playwright tests in TypeScript against https://automationintesting.online, the practice site from Part 2B.

## Run it

Prerequisites: Node.js 18 or later (written with Node 22) and internet access. Checked on Windows 11 from a clean copy.

```
npm ci
npm test
```

`npm test` downloads Chromium on its first run, then runs the 9 tests in about 10 seconds. `npm run report` opens the HTML report.

## What I automated and why

I automated the two areas I explored in Part 2B, each at the lowest level that can find the defect.

| Scenario | Level | Tests | Why |
|---|---|---|---|
| 1. Date rules of a room booking | API | 6 | The highest risk for a hotel: one room sold twice, or a stay that cannot happen. These are rules, so the API checks them faster and more reliably than the UI. |
| 2. Guest contact form | UI + API | 3 | The only channel from guest to hotel. The test follows what the guest sees, then checks through the API that the message reached the admin inbox. |

Test titles end with their path: HP (happy path), SP (sad path) or EC (edge case).

**Not automated:** booking through the reservation page, because `GET /api/room/{id}` returned HTTP 500 during my sessions and the page did not load; the admin screens; Firefox and WebKit, to keep the load on a shared site low.

## Known defects

Two tests document defects from Part 2B. They are marked with `test.fail()` and a reason, so the run stays green: it shows 9 passed, 2 of them as expected failures (✘). When a defect is fixed, its test reports "expected to fail, but passed".

| Test | Defect |
|---|---|
| `a stay in the past is refused - EC` | The API accepts a booking with past dates (finding 2). |
| `a phone number made of letters is refused - SP` | The contact form accepts letters as a phone number (finding 3). |

## Approach

- **Three layers:** `tests/` (what is checked), `src/api` and `src/pages` (REST client and page object, the only places with URLs and locators), `src/data` (data builders). Setup and teardown are fixtures in `src/fixtures.ts`.
- **Tests create their own data:** each booking uses a random window 1 to 9 years ahead and each message a unique subject, so tests run alone, in parallel and in any order.
- **Tests clean up:** bookings are deleted after each test. Messages are deleted when the site allows it; `DELETE /api/message/{id}` currently returns HTTP 500.
- **No fixed waits:** role-based locators, web-first assertions and `expect.poll`.
- **Only fictitious data:** "Testa Fictional" and `example.com` addresses.

## Slow or unavailable site

- A check before the tests calls the site up to 3 times. If it is down, the run stops with one clear message.
- Each test is retried up to 2 times, with a trace recorded on the first retry.
- The 10-minute data reset can hit a running test. The retry starts again with new data.

## Assumptions

- I assert the status codes observed in Part 2B: 201 for a booking, 409 for a date conflict. For reversed dates I only assert "refused", because the site answers 409 where 400 would be correct.
- The admin login uses the site's public demo credentials. `ADMIN_USER`, `ADMIN_PASSWORD` and `BASE_URL` can be set as environment variables.

## Evidence of a run

`report/` holds the HTML report of my last local run. `.github/workflows/tests.yml` runs the type check and the tests on every push and pull request and uploads the report.

## With more time

- The booking flow through the reservation page, checked in the admin "Report" calendar.
- Field-length boundaries as one data-driven test, and a schema check of API responses.
- Firefox and WebKit projects, and ESLint with `no-floating-promises`.
