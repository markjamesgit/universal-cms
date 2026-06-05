# Firestore Security Specification & ABAC Policies

This security specification establishes the Attribute-Based Access Control (ABAC) invariants and defines the "Dirty Dozen" malicious payloads designed to audit and verify that our system is entirely resilient to unauthorized data writing, privilege escalation, or orphan records.

## 1. Data Invariants

1. **System Deny Absolute**: By default, all read and write privileges on paths not explicitly configured must be evaluated to `false`.
2. **Identity Integrity**: No user may register a profile where their `userId` in the payload does not match their authentication UID `request.auth.uid`.
3. **Role Escalation Protection**: Users are strictly forbidden from setting their own `role` in `/users` or arbitrary roles anywhere unless validated against a secure, verified admin check or bootstrapped configuration.
4. **Relational Sync Integrity**: Bookings, Services, Staff, Customers, and other templates must be associated with active, valid businesses. Booking status updates must be restricted to the business admin owners.
5. **PII Restriction**: Standard user profiles or private customer records containing phone number/email fields must be restricted to owners (`isOwner`) or verified system administrators.
6. **Immortal Timestamps**: Fields like `createdAt` must be locked upon creation and match `request.time`.

---

## 2. The "Dirty Dozen" Payloads (Avenue of Attack & Denials)

Below are the 12 malicious payloads constructed to test all boundaries:

### P1: Spoofing User Role Change (Privilege Escalation)
A standard user attempts to elevate their own system level to `SUPER_ADMIN`.
```json
{
  "id": "malicious-user-id",
  "email": "user@gmail.com",
  "name": "Attacker",
  "role": "SUPER_ADMIN"
}
```
*Expected Result:* `PERMISSION_DENIED`

### P2: Injecting Shadow Property onto Salon (Ghost Field Injection)
An actor attempts to set `isPremium: true` or `verified: true` on their tenant salon.
```json
{
  "id": "b-1",
  "slug": "chic-cuts",
  "name": "Chic Cuts Hair Salon",
  "logo": "💇‍♀️",
  "isPremium": true,
  "hackField": "malicious"
}
```
*Expected Result:* `PERMISSION_DENIED`

### P3: Forged Booking Ownership
User tries to insert their UID as the customer email/ID while setting the pricing to `$0.00` on a `$185.00` booking session.
```json
{
  "id": "bk-hack",
  "businessId": "b-1",
  "serviceId": "s-101",
  "price": 0.00,
  "customerEmail": "attacker@gmail.com",
  "status": "confirmed"
}
```
*Expected Result:* `PERMISSION_DENIED`

### P4: Timestamp Poisoning Attack
An observer attempts to create a blog post or slot booking backdated to many years ago.
```json
{
  "id": "bl-1",
  "businessId": "b-1",
  "title": "Hacked",
  "content": "Malcontent",
  "createdAt": "1999-01-01T00:00:00Z"
}
```
*Expected Result:* `PERMISSION_DENIED`

### P5: Massive String Injection (Denial of Wallet)
Attempting to overload the database storage allocation limits by inserting an exceedingly large string as a document name/slug.
```json
{
  "id": "b-very-long-id-that-exceeds-one-thousand-characters-and-attempts-to-exhaust-system-memory-and-drive-up-read-write-operational-bills-for-the-service-provider-unibook-platform-and-cause-massive-denial-of-service",
  "slug": "chic-cuts"
}
```
*Expected Result:* `PERMISSION_DENIED`

### P6: Status Skipping / Shortcircuiting
A client directly confirms a booked reservation status update bypassing the business merchant's review loop.
```json
{
  "id": "bk-pending-id",
  "status": "confirmed"
}
```
*Expected Result:* `PERMISSION_DENIED`

### P7: Unbounded Array Exhaustion
Trying to update service specifications with active staff numbers exceeding standard operation sizes.
```json
{
  "id": "s-101",
  "staffIds": ["st-1", "st-2", "st-3", "st-4", "st-5", "st-6", "st-7", "st-8", "st-9", "st-10", "st-11"]
}
```
*Expected Result:* `PERMISSION_DENIED`

### P8: Access-Control Bypass (Self-Claiming Multi-Tenant)
Updating another salon's active SEO settings with custom hijacking redirects.
```json
{
  "id": "b-2",
  "seo": { "metaTitle": "Redirecting to malware..." }
}
```
*Expected Result:* `PERMISSION_DENIED`

### P9: Arbitrary Audit Log Insertion
An unauthenticated or basic consumer user tries to insert custom events directly into the main `auditLogs` stream.
```json
{
  "id": "log-random",
  "actor": "Anonymous Web Bot",
  "action": "CLEARED_DATABASE"
}
```
*Expected Result:* `PERMISSION_DENIED`

### P10: Orphan Record Insertion
Creating a blog post targeting a business tenant registration ID that does not exist.
```json
{
  "id": "bl-orphan",
  "businessId": "b-nonexistent",
  "title": "Orphan Article"
}
```
*Expected Result:* `PERMISSION_DENIED`

### P11: PII Leak via Blanket Reads
Attempting to fetch client profile details containing personal mobile or physical address contacts as an unauthenticated guest.
*Expected Result:* `PERMISSION_DENIED`

### P12: Post-Terminal Modification
A client attempts to edit details of a locked booking with status `cancelled` or `confirmed` to change dates after the appointment has concluded.
```json
{
  "id": "bk-past",
  "date": "2026-12-25"
}
```
*Expected Result:* `PERMISSION_DENIED`

---

## 3. Conceptual Security Test Suite

The rule testing framework enforces these permissions statically. All operations testing negative payloads assert a rejection with `PERMISSION_DENIED`. Verified administrator accounts bypass controls safely, keeping our platform secure.
