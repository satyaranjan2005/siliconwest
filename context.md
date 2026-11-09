# College Club & Event Management System — MVP Context

**Document type:** Product Requirements and Technical Context  
**Version:** 1.0  
**Status:** MVP Specification  
**Recommended stack:** Next.js, TypeScript, PostgreSQL, Prisma ORM, Tailwind CSS, Shadcn, node js

---

## 1. Project Overview

### 1.1 Description

The College Club & Event Management System is a centralized web application for managing college clubs, publishing events, and handling participant registrations.

The platform has three user roles:

1. **Super Admin** — manages the entire platform, creates clubs, and creates/assigns Club Admin accounts.
2. **Club Admin** — manages only the club or clubs assigned to them, including those clubs' events and registrations.
3. **Student / Participant** — browses public clubs and events and registers for events.

The MVP intentionally excludes coordinators, volunteers, task management, sponsorships, payments, accommodation, food management, QR attendance, certificates, judging, and team registration.

### 1.2 Objectives

- Centralize college club information.
- Give each club a place to publish its events.
- Allow Club Admins to manage their assigned clubs independently.
- Let participants discover events and register online.
- Maintain accurate registration records and prevent duplicate registrations.
- Let authorized administrators search, filter, and export participant lists.
- Protect private data and enforce strict access boundaries between clubs.

### 1.3 Product Principles

- Keep the initial release focused and easy to use.
- Enforce permissions on the server, not only in the interface.
- Make public event discovery accessible without requiring login.
- Collect only the participant information actually needed.
- Preserve historical event and registration records.
- Build the core workflow reliably before adding future modules.

---

## 2. MVP Scope

### 2.1 Included Features

- Secure administrator authentication.
- One active Super Admin role.
- Manual Club Admin account creation by the Super Admin.
- Club Admin assignment and reassignment.
- Club creation, editing, listing, and archiving.
- Public club profiles.
- Event creation, editing, publishing, unpublishing, and cancellation.
- Public event listing and detail pages.
- Individual participant registration.
- Registration deadlines and optional event capacity.
- Duplicate-registration prevention.
- Registration lists, search, filtering, and CSV export.
- Role-specific dashboards.
- Basic platform and club statistics.
- Responsive desktop and mobile layouts.
- Server-side validation and authorization.

### 2.2 Explicitly Out of Scope

Do not implement these in the first version:

- Coordinator or volunteer roles.
- Volunteer assignment and task tracking.
- Sponsorship management.
- Online payments, refunds, or invoices.
- Food coupons, accommodation, or room allocation.
- QR-code attendance or check-in.
- Certificate generation.
- Judging, scoring, or leaderboards.
- Team formation and team registration.
- Event budgets and expense management.
- Native Android or iOS applications.
- Complex event approval workflows.
- Multi-college or multi-tenant administration.
- Chat, direct messaging, or social feeds.
- Automated social media publishing.
- Advanced analytics.

These can be considered after the core club, event, and registration workflow is stable.

---

## 3. User Roles and Permissions

### 3.1 Super Admin

The Super Admin has platform-wide administrative access.

Responsibilities and permissions:

- View all clubs, events, and registrations.
- Create, edit, archive, and restore clubs.
- Create Club Admin accounts.
- Assign and reassign Club Admins to clubs.
- Deactivate or reactivate Club Admin accounts.
- View and manage all events.
- View registrations across all events.
- Export registration data.
- View platform-wide statistics.
- Correct or manage records when required.

There should be only one active Super Admin account in the initial deployment. Provision this account through a secure setup process or deployment seed—not public sign-up. Enforce the one-active-Super-Admin rule in the application and, where practical, with a database-level constraint or controlled administrative process.

### 3.2 Club Admin

A Club Admin manages only their assigned club or clubs.

Permissions:

- View assigned club details.
- Edit permitted fields of assigned clubs.
- Create events for assigned clubs.
- Edit, publish, unpublish, or cancel events belonging to assigned clubs.
- View registrations for assigned clubs' events.
- Search and filter those registrations.
- Export participant lists for authorized events.
- View club-specific statistics.

Restrictions:

- Cannot create or delete clubs.
- Cannot create or assign administrator accounts.
- Cannot promote themselves or another user to Super Admin.
- Cannot manage unassigned clubs.
- Cannot change an event's owning club to a club they do not manage.
- Cannot view or export another club's private registration data.
- Cannot alter platform-level settings.

### 3.3 Student / Participant

Participants can:

- Browse public clubs.
- View club profiles and published events.
- Search and filter events.
- View event details and registration availability.
- Register for eligible events.
- View their own registrations if account-based registration is enabled.

Participants cannot:

- Access administrative dashboards.
- Create or edit clubs or events.
- View other participants' private information.
- Modify another participant's registration.

Public browsing should not require an account. Whether registration requires an account or supports guest registration is a product decision to finalize before implementation.

### 3.4 Permission Matrix

| Action | Super Admin | Club Admin | Student / Participant |
|---|---|---|---|
| View public clubs | Yes | Yes | Yes |
| Create clubs | Yes | No | No |
| Edit any club | Yes | No | No |
| Edit assigned club | Yes | Yes, permitted fields | No |
| Archive or restore clubs | Yes | No | No |
| Create Club Admin accounts | Yes | No | No |
| Assign Club Admins | Yes | No | No |
| View published events | Yes | Yes | Yes |
| Create events | Yes | Assigned clubs only | No |
| Edit/publish/cancel events | All events | Assigned clubs only | No |
| View all registrations | Yes | No | No |
| View assigned-club registrations | Yes | Yes | No |
| Export registrations | All events | Assigned clubs only | No |
| Register for an event | Optional | Optional | Yes |
| Change user roles | Yes, controlled | No | No |

**Critical rule:** Every protected server operation must verify both the user's role and resource ownership. Hiding a button in the frontend is not authorization.

---

## 4. Main User Workflows

### 4.1 Super Admin Setup

1. The initial Super Admin signs in.
2. The Super Admin creates a club.
3. The Super Admin creates a Club Admin account.
4. The Super Admin assigns that account to one or more clubs.
5. The Club Admin securely completes account setup.
6. The Club Admin signs in and sees only their assigned club data.

### 4.2 Club Admin Publishes an Event

1. The Club Admin signs in.
2. The dashboard displays their assigned club or clubs.
3. The Club Admin creates an event under an assigned club.
4. The system validates the title, dates, deadline, and capacity.
5. The event is saved as a draft.
6. The Club Admin reviews the event and publishes it.
7. The published event appears on public event pages.
8. Participants can open the event and register while registration remains open.

If the product owner later wants mandatory Super Admin approval before publication, add a separate approval workflow. It is not required for this MVP.

### 4.3 Participant Registration

1. A participant opens a published event.
2. The system displays its details and registration status.
3. The participant completes the registration form.
4. The server validates the submission.
5. The server checks publication status, deadline, capacity, eligibility, and duplicate-registration rules.
6. The registration is saved.
7. The participant sees a confirmation page.
8. A confirmation email may be sent if email delivery is configured.

Email failure must not silently invalidate a registration that was successfully saved.

### 4.4 Registration Management

1. An authorized administrator opens an event's registrations page.
2. The system verifies access to that event.
3. The administrator searches or filters registrations.
4. The administrator views relevant participant details.
5. The administrator exports the authorized results to CSV if needed.

Club Admins must never be able to access another club's registration records by changing an event ID or URL.

---

## 5. Website Pages and Navigation

### 5.1 Public Website

#### Home — `/`

- College/platform branding.
- Featured or upcoming published events.
- Recent events.
- Club directory preview.
- Search and links to browse clubs and events.
- Login link for users who need an account.

#### Club Listing — `/clubs`

- List active, publicly visible clubs.
- Search by name.
- Filter by category.
- Show club logo, name, short description, and upcoming-event count.
- Link to each club's profile.

#### Club Details — `/clubs/[slug]`

- Club name and logo.
- Description and category.
- Public contact details, if provided.
- Upcoming published events.
- Past events, if enabled.

Do not expose private administrator details by default.

#### Event Listing — `/events`

- List published events.
- Search by event title.
- Filter by club, category, and date.
- Filter upcoming and past events.
- Sort by date.
- Show event date, venue, organizing club, and registration status.

#### Event Details — `/events/[slug]`

Show:

- Title and description.
- Organizing club.
- Banner image.
- Start and end date/time.
- Venue or online event information.
- Registration deadline.
- Capacity, if set.
- Eligibility and requirements.
- Registration button and current availability.

The registration action must be disabled or replaced with an explanation when the event is a draft, cancelled, closed, or full.

#### Registration — `/events/[slug]/register`

Recommended fields:

- Full name.
- Email address.
- College/institution, if required.
- Roll number/student identifier, if required.

The form must show required fields, validation errors, privacy information, submission state, and a clear result.

#### My Registrations — `/my-registrations`

This page is available if participant accounts are implemented. It shows only the signed-in participant's registrations, with event title, registration date, event date, status, and a link to the event.

### 5.2 Super Admin Dashboard

Suggested routes:

- `/admin`
- `/admin/clubs`
- `/admin/clubs/new`
- `/admin/clubs/[id]`
- `/admin/users`
- `/admin/users/new`
- `/admin/events`
- `/admin/events/[id]`
- `/admin/registrations`

Dashboard metrics:

- Active clubs.
- Published events.
- Total registrations.
- Upcoming events.
- Recent registrations.
- Quick actions to create a club or manage Club Admins.

### 5.3 Club Admin Dashboard

Suggested routes:

- `/club-admin`
- `/club-admin/club`
- `/club-admin/events`
- `/club-admin/events/new`
- `/club-admin/events/[id]`
- `/club-admin/events/[id]/registrations`

Dashboard metrics:

- Assigned club information.
- Upcoming events.
- Draft and published event counts.
- Registration totals for assigned clubs.
- Recent registrations.
- Quick action to create an event.

If an account manages multiple clubs, make the currently selected club obvious. Every server operation must still verify the user's assignment.

---

## 6. Club Management Requirements

### 6.1 Club Fields

Recommended fields:

- `id`: UUID primary key.
- `name`: Required string.
- `slug`: Unique string.
- `shortDescription`: Optional string.
- `description`: Text.
- `logoUrl`: Optional string.
- `category`: Optional string or controlled category.
- `contactEmail`: Optional public email.
- `isPublic`: Boolean.
- `isArchived`: Boolean.
- `createdAt`: Timestamp.
- `updatedAt`: Timestamp.

### 6.2 Operations

The Super Admin can create, list, search, filter, edit, archive, and restore clubs. They can also assign Club Admins.

Club Admins can edit only permitted information for assigned clubs. They cannot create clubs or change administrator assignments.

### 6.3 Validation and Lifecycle

- Club name is required.
- Slugs must be unique.
- Validate required fields on the server.
- Validate uploaded images by type and size.
- Archived clubs should not accept new events or registrations.
- Existing events and registrations should remain available for historical reporting.
- Prefer archiving over permanent deletion when historical records exist.
- A club should not be hard-deleted if doing so would destroy important records.

---

## 7. Club Admin Account Management

### 7.1 Account Creation

The Super Admin manually creates and assigns Club Admin accounts.

Recommended flow:

1. Super Admin opens user management.
2. Enters the person's name and email.
3. Selects one or more clubs.
4. The system creates an account with the `CLUB_ADMIN` role.
5. The user receives a secure invitation or account-setup link.
6. The user completes setup and signs in.
7. Access is limited to assigned clubs.

Invitation tokens must be unpredictable, single-use, time-limited, and stored securely. Do not email passwords in plain text.

### 7.2 Account Management

The Super Admin can:

- Create Club Admin accounts.
- Assign or reassign clubs.
- Deactivate and reactivate accounts.
- Initiate account recovery.
- View basic account details.

A Club Admin cannot change their own role or assign other administrators.

### 7.3 Deactivation

When an account is deactivated:

- New sessions must be denied.
- Existing sessions must be invalidated or rejected promptly.
- Protected operations must stop working.
- Historical records created by that user must remain intact.

---

## 8. Event Management Requirements

### 8.1 Event Fields

Recommended fields:

- `id`: UUID primary key.
- `clubId`: Owning club foreign key.
- `title`: Required string.
- `slug`: Unique or appropriately scoped unique string.
- `summary`: Optional short text.
- `description`: Text.
- `bannerUrl`: Optional image reference.
- `category`: Optional category.
- `venue`: Optional string when the event is online.
- `onlineMeetingUrl`: Optional URL.
- `startsAt`: Timestamp.
- `endsAt`: Timestamp.
- `registrationDeadline`: Timestamp.
- `capacity`: Optional positive integer.
- `status`: `DRAFT`, `PUBLISHED`, or `CANCELLED`.
- `createdByUserId`: Creator foreign key.
- `createdAt`: Timestamp.
- `updatedAt`: Timestamp.

### 8.2 Status Model

Publication status:

- `DRAFT`
- `PUBLISHED`
- `CANCELLED`

Other display states can be derived from dates and registration state:

- Upcoming.
- Ongoing.
- Completed.
- Registration closed.
- Full.

Avoid storing redundant statuses that can become inconsistent.

### 8.3 Event Operations

The Super Admin can manage all events. A Club Admin can manage only events belonging to assigned clubs.

Operations include create, edit, save as draft, publish, unpublish, cancel, list, view, and export registrations.

### 8.4 Validation

- Title is required.
- Owning club must exist and be active.
- Start time must precede end time.
- Registration deadline must not be after event start time.
- Capacity, if provided, must be a positive integer.
- Required details must be present before publication.
- Validate online URLs if supplied.
- Draft and cancelled events must not accept registrations.
- Club Admins cannot change ownership to an unassigned club.
- Important changes to published events must be reflected on the public page.

If an event has registrations, rescheduling or cancellation must preserve the registrations and provide clear status information.

### 8.5 Capacity

Capacity is optional. If omitted, there is no fixed participant limit.

When capacity is configured, the server must reject registrations once the number of active registrations reaches capacity. Capacity checks must be safe under concurrent requests; a frontend-only check is insufficient.

If capacity is reduced below the current number of active registrations, the system must not delete or silently cancel existing registrations. Prevent the change or require an explicit, carefully designed administrative workflow.

### 8.6 Timezone

Store event timestamps consistently, preferably in UTC. Display them in the college's configured timezone, normally `Asia/Kolkata` for an Indian college. Interpret deadlines using the server's trusted clock and a consistent timezone policy.

---

## 9. Registration Management Requirements

### 9.1 Registration Model

The initial MVP supports individual registrations only. Team registration, group tickets, and payments are excluded.

Recommended fields:

- `id`: UUID primary key.
- `eventId`: Event foreign key.
- `participantUserId`: Optional User foreign key if guest registration is supported.
- `participantName`: Required string.
- `participantEmail`: Normalized email.
- `collegeName`: Optional string.
- `rollNumber`: Optional string.
- `status`: `CONFIRMED` or `CANCELLED`.
- `registeredAt`: Timestamp.
- `updatedAt`: Timestamp.

If participant accounts are used, link the registration to the account while retaining a snapshot of the submitted details when needed for historical accuracy.

### 9.2 Registration Workflow

The server must verify all of the following before accepting a registration:

- The event exists.
- The event is published.
- The event is not cancelled.
- The registration deadline has not passed.
- Capacity has not been reached, if configured.
- The participant meets any event-specific eligibility rules.
- The participant has not already registered according to the chosen identity policy.

Only then should the system create the registration and return confirmation.

### 9.3 Duplicate Prevention

For account-based registration, enforce a database unique constraint on `(eventId, participantUserId)` when the participant user ID is non-null.

For guest registration, define a clear identity policy, such as normalized email address per event, and enforce it consistently. A database-level constraint or equivalent concurrency-safe design should protect against simultaneous duplicate submissions.

Email matching does not prove that two addresses belong to the same person. Do not treat guest email matching as verified identity.

If the schema supports both guest and account registration, design constraints for both paths deliberately rather than relying only on application checks.

### 9.4 Concurrency and Capacity

Two users may attempt to claim the last seat simultaneously. The server must use a transaction-safe approach, such as row locking or another proven atomic reservation strategy, so capacity cannot be exceeded due to a race condition.

Cancelled registrations should free capacity according to a clearly defined policy. Database constraints and transactions should protect critical invariants.

### 9.5 Registration Management UI

Authorized administrators can:

- View registrations for an event.
- Search by name, email, or roll number.
- Filter by status.
- View registration timestamps.
- Export CSV files.

The Super Admin can access all events' registrations. Club Admins can access only assigned clubs' registrations.

CSV exports must contain only fields and records the requesting administrator is authorized to access.

### 9.6 Registration Cancellation

If included in the MVP:

- Participants may cancel only their own eligible registrations.
- Administrators may cancel registrations only within their authorization scope.
- Cancellation preserves the record.
- Capacity is recalculated consistently.
- Cancelled registrations do not count as active confirmed registrations.
- Reconfirmation must follow the same capacity and eligibility checks as a new registration.

If participant self-service cancellation is not required, defer it and let authorized administrators manage status.

### 9.7 Email Confirmation

Email confirmation is useful but should be decoupled from the registration transaction. A registration that commits successfully should remain valid if email delivery fails. Record delivery failures and provide a retry path where practical.

---

## 10. Recommended Database Model

Use PostgreSQL with Prisma ORM. The following describes the logical schema; exact Prisma syntax and database types can be finalized during implementation.

### 10.1 `User`

Purpose: Administrator and participant accounts.

Fields:

- `id`: UUID primary key.
- `name`: String.
- `email`: Unique normalized email.
- `passwordHash`: Nullable if an external authentication provider manages credentials.
- `role`: Enum `SUPER_ADMIN`, `CLUB_ADMIN`, `STUDENT`.
- `isActive`: Boolean.
- `createdAt`: Timestamp.
- `updatedAt`: Timestamp.

Relations:

- Club Admin assignments.
- Events created by the user.
- Participant registrations.

Never store plain-text passwords.

### 10.2 `Club`

Purpose: Club information.

Fields:

- `id`
- `name`
- `slug`
- `shortDescription`
- `description`
- `logoUrl`
- `category`
- `contactEmail`
- `isPublic`
- `isArchived`
- `createdAt`
- `updatedAt`

Relations:

- Club Admin assignments.
- Events.

### 10.3 `ClubAdminAssignment`

Purpose: Assign Club Admins to clubs.

Fields:

- `id`
- `userId`: User foreign key.
- `clubId`: Club foreign key.
- `assignedAt`
- `assignedByUserId`: User foreign key for the Super Admin who made the assignment.

Constraints:

- Unique `(userId, clubId)`.
- Only a user with the `CLUB_ADMIN` role may have a Club Admin assignment.
- Only the Super Admin can create or remove assignments.

This table supports one or more clubs per Club Admin without redesigning the schema.

### 10.4 `Event`

Purpose: Event information.

Fields:

- `id`
- `clubId`
- `title`
- `slug`
- `summary`
- `description`
- `bannerUrl`
- `category`
- `venue`
- `onlineMeetingUrl`
- `startsAt`
- `endsAt`
- `registrationDeadline`
- `capacity`
- `status`
- `createdByUserId`
- `createdAt`
- `updatedAt`

Relations:

- One owning club.
- One creator.
- Many registrations.

### 10.5 `Registration`

Purpose: Participant registration for an event.

Fields:

- `id`
- `eventId`
- `participantUserId` (nullable for guest registration)
- `participantName`
- `participantEmail`
- `collegeName`
- `rollNumber`
- `status`
- `registeredAt`
- `updatedAt`

Constraints and indexes:

- Unique event/participant pair for account-based registration.
- A deliberate database-level duplicate policy for guest registrations.
- Indexes on event ID, participant user ID, normalized email, status, and registration timestamp as needed.

### 10.6 Relationships

- One Club has many Events.
- One User may have many Club Admin assignments.
- One Club has many Club Admin assignments.
- One Event has many Registrations.
- One User may have many Registrations.
- One User may create many Events.

### 10.7 Database Integrity

- Use foreign keys and appropriate deletion rules.
- Enforce unique emails and slugs.
- Add indexes for common filters.
- Use transactions for critical multi-step writes.
- Avoid cascading deletes that destroy historical records.
- Prefer archive/status changes over destructive deletion.
- Use version-controlled migrations.

---

## 11. Authentication and Authorization

### 11.1 Authentication

Required capabilities:

- Sign in and sign out for administrators.
- Secure account setup/invitation.
- Account recovery.
- Protected administrative routes.
- Server-side session verification.
- Secure cookie handling.
- Rate limiting on authentication endpoints.
- Session invalidation after account deactivation.

Public browsing should not require login. The participant registration method—guest or account-based—must be chosen before implementation.

### 11.2 Centralized Authorization Helpers

Implement centralized server-side checks, with names such as:

- `requireAuthenticatedUser()`
- `requireSuperAdmin()`
- `requireClubAdmin()`
- `canManageClub(userId, clubId)`
- `canManageEvent(userId, eventId)`
- `canViewRegistrations(userId, eventId)`

These are conceptual names; adapt them to the selected authentication framework.

Every protected API route, Route Handler, Server Action, and data mutation must enforce authorization.

### 11.3 Ownership Verification

For a Club Admin updating an event:

1. Authenticate the requester.
2. Load the event from the database.
3. Determine its owning club.
4. Verify the requester is assigned to that club.
5. Validate the submitted fields.
6. Apply the update only after authorization succeeds.

Never trust client-provided `role`, `clubId`, or ownership information without server-side verification.

---

## 12. API / Server Operations

The application may use Next.js Route Handlers, Server Actions, or a combination. These are required capabilities, not mandatory endpoint names.

### Authentication

- Sign in.
- Sign out.
- Recover account access.
- Complete invitation/account setup.

### Clubs

- List public clubs.
- Retrieve public club details.
- Create, update, archive, and restore clubs.
- List Club Admin assignments.
- Assign and unassign Club Admins.

### Events

- List published events.
- Retrieve event details.
- Create and update events.
- Publish and unpublish events.
- Cancel events.
- List events by club.

### Registrations

- Create a registration.
- List registrations for an authorized event.
- Retrieve an authorized registration.
- Cancel an eligible registration if cancellation is enabled.
- Export registrations.
- View registration statistics.

Public operations must return only public fields. Administrative operations require authentication and authorization. Registration operations must verify event status, deadlines, capacity, and duplicate rules.

---

## 13. User Interface Requirements

### 13.1 General Design

- Modern, professional college administration style.
- Responsive desktop and mobile layouts.
- Consistent typography, spacing, and colors.
- Clear navigation and page titles.
- Accessible forms and controls.
- Visible loading, empty, success, and error states.
- Confirmation dialogs for destructive actions.
- Clear status labels that do not rely on color alone.

### 13.2 Administrative Layout

- Sidebar on larger screens.
- Collapsible navigation on smaller screens.
- Breadcrumbs and page titles.
- Primary action buttons.
- Search and filters.
- Data tables with pagination.
- Responsive layouts for smaller devices.

### 13.3 Forms

Every form should include:

- Clear labels.
- Required-field indicators.
- Inline validation.
- Server-error handling.
- Disabled submit state while saving.
- Protection against accidental repeated submissions.
- Clear success feedback.

### 13.4 Tables

Club, event, and registration tables should support relevant search, filters, sorting, pagination, loading indicators, empty states, and permission-aware actions.

---

## 14. Security and Privacy Requirements

### 14.1 Access Control

- Enforce role checks on the server.
- Verify Club Admin ownership on every mutation and private read.
- Prevent horizontal privilege escalation between clubs.
- Prevent vertical privilege escalation to Super Admin.
- Restrict registration data to authorized administrators and the relevant participant.
- Validate authorization independently on each request.

### 14.2 Input Security

- Validate input with a schema library such as Zod.
- Normalize email addresses consistently.
- Validate uploaded file type and size.
- Use safe ORM operations and parameterized queries.
- Avoid unsafe raw SQL.
- Render user-generated text safely.
- Do not render untrusted HTML without appropriate sanitization.

### 14.3 Session Security

- Use HTTP-only, secure cookies where applicable.
- Configure appropriate SameSite behavior.
- Use HTTPS in production.
- Apply CSRF protections where required by the chosen architecture.
- Rate-limit authentication and sensitive operations.
- Revoke access promptly when an account is deactivated.

### 14.4 Privacy

- Collect only necessary participant information.
- Do not publish participant email addresses.
- Protect CSV exports.
- Avoid placing personal data in URLs.
- Restrict administrative data access.
- Define a retention policy.
- Provide a privacy notice describing the use of collected data.

### 14.5 Audit Logging

For sensitive operations, consider an audit log with:

- Actor user ID.
- Action type.
- Resource type and ID.
- Timestamp.
- Relevant change metadata.

Prioritize role changes, Club Admin assignments, event cancellation, and administrator deactivation. A full audit-log interface can be deferred, but production auditability is recommended.

---

## 15. Non-Functional Requirements

### Performance

- Paginate large registration lists.
- Avoid loading all records at once.
- Index commonly filtered fields.
- Avoid unnecessary database queries.
- Optimize images.
- Cache public content appropriately.
- Invalidate caches when relevant records change.

### Reliability

- Use transactions for critical operations.
- Handle database and email failures gracefully.
- Preserve historical records.
- Prevent duplicate registrations.
- Enforce capacity safely under concurrent requests.

### Maintainability

- Use TypeScript.
- Organize code by feature/domain.
- Separate business logic from UI components.
- Centralize validation and authorization.
- Maintain consistent error handling.
- Version database migrations.
- Document environment variables and deployment.

### Accessibility

- Use semantic HTML.
- Support keyboard navigation.
- Provide visible focus states.
- Maintain readable contrast.
- Associate labels with form inputs.
- Do not communicate state through color alone.

### Deployment

- Keep secrets in environment variables.
- Use separate development and production databases.
- Run migrations through a controlled deployment process.
- Configure automated backups.
- Use a supported PostgreSQL deployment.
- Configure application logs and error monitoring.

---

## 16. Edge Cases to Handle

1. Registration submitted after the deadline.
2. Registration submitted for a draft event.
3. Registration submitted for a cancelled event.
4. Capacity reached just before submission.
5. Two participants attempt to claim the final seat simultaneously.
6. Duplicate form submission.
7. Participant attempts to register more than once.
8. Invalid email or required participant information.
9. Event cancelled after participants have registered.
10. Event rescheduled after participants have registered.
11. Club archived while it has upcoming events.
12. Club Admin loses access while signed in.
13. Club Admin attempts to edit another club's event.
14. Email delivery fails after registration is saved.
15. Database failure during registration.
16. Unauthorized CSV export attempt.
17. Capacity reduced below existing active registrations.
18. Cancelled registration attempts to become confirmed again.
19. Registration deadline changes while a participant has an event page open.
20. Participant submits a stale form after registration closes.
21. A Club Admin is reassigned while editing an event.
22. A club is archived while an administrator is creating an event.

The server must return consistent outcomes and preserve database integrity. The UI should explain rejection reasons where appropriate.

---

## 17. Development Roadmap

### Phase 1 — Foundation

- Initialize Next.js, TypeScript, and Tailwind CSS.
- Configure PostgreSQL and Prisma.
- Set up migrations.
- Implement authentication and session handling.
- Define user roles.
- Provision the initial Super Admin.
- Build shared layouts and navigation.

**Deliverable:** Secure authentication and role-aware application structure.

### Phase 2 — Club Management

- Implement the Club model.
- Build club listing and details pages.
- Build Super Admin club management.
- Implement create, edit, archive, and restore.
- Implement Club Admin assignment.
- Enforce server-side permissions.

**Deliverable:** Super Admin can manage clubs and assign Club Admins securely.

### Phase 3 — Event Management

- Implement the Event model.
- Build public event listing and detail pages.
- Build event creation and editing forms.
- Implement draft/published/cancelled states.
- Implement deadlines and capacity.
- Implement cancellation behavior.
- Enforce club ownership.

**Deliverable:** Administrators can manage events within their permissions.

### Phase 4 — Registration

- Implement the Registration model.
- Build the registration form.
- Validate eligibility on the server.
- Prevent duplicate registrations.
- Implement concurrency-safe capacity enforcement.
- Build registration lists and filters.
- Implement CSV export.
- Add confirmation feedback and optional email delivery.

**Deliverable:** Participants can register and authorized administrators can manage registrations.

### Phase 5 — Dashboard and Polish

- Add platform and club statistics.
- Add empty, loading, success, and error states.
- Improve responsiveness and accessibility.
- Add audit logging for sensitive actions.
- Review privacy and security.
- Optimize queries and public-page caching.

**Deliverable:** Polished MVP ready for acceptance testing.

### Phase 6 — Testing and Deployment

- Run unit tests.
- Run integration tests.
- Run authorization tests.
- Run end-to-end tests.
- Verify production migrations.
- Configure backups and environment variables.
- Verify HTTPS.
- Test recovery and account deactivation.
- Complete a security review.

**Deliverable:** Deployable application with documented operational procedures.

---

## 18. Testing Requirements

### Authentication Tests

- Valid administrators can sign in.
- Invalid credentials are rejected.
- Inactive users cannot access protected operations.
- Students cannot access administrative dashboards.
- Club Admins cannot promote themselves to Super Admin.

### Club Tests

- Super Admin can create and edit clubs.
- Club Admin cannot create clubs.
- Club Admin can edit only permitted fields of assigned clubs.
- Duplicate slugs are rejected.
- Archived clubs cannot accept new events.

### Event Tests

- Authorized users can create events.
- Club Admin cannot create events for unassigned clubs.
- Invalid dates are rejected.
- Draft events are not publicly visible.
- Cancelled events cannot accept registrations.
- Capacity must be positive when specified.

### Registration Tests

- Eligible participants can register.
- Duplicate registrations are rejected.
- Registration after the deadline is rejected.
- Cancelled and draft events reject registrations.
- Capacity is enforced under concurrent requests.
- Participants cannot access another participant's private data.
- CSV exports include only authorized records.
- Email failure does not silently remove a successful registration.

### Authorization Tests

Attempt unauthorized operations by modifying:

- URL resource IDs.
- Request-body `clubId` values.
- Event IDs.
- User role values.
- Registration IDs.
- Query filters used for exports.

The server must reject unauthorized requests even if the frontend has been manipulated.

---

## 19. Acceptance Criteria

### Authentication and Roles

- [ ] Super Admin can securely access the administrative dashboard.
- [ ] Super Admin can create and assign Club Admin accounts.
- [ ] Club Admins cannot change their own role.
- [ ] Students cannot access administrative functionality.
- [ ] Inactive accounts cannot access protected operations.

### Club Management

- [ ] Super Admin can create, edit, archive, and restore clubs.
- [ ] Public club pages display appropriate information.
- [ ] Club Admins can edit only permitted information for assigned clubs.
- [ ] Club Admin assignments are enforced on the server.

### Event Management

- [ ] Authorized users can create and edit events.
- [ ] Events are linked to an existing club.
- [ ] Published events appear on the public website.
- [ ] Draft events remain private.
- [ ] Cancelled events do not accept registrations.
- [ ] Deadlines and capacities are enforced.

### Registration

- [ ] Participants can register for eligible events.
- [ ] Required fields are validated.
- [ ] Duplicate registrations are prevented.
- [ ] Capacity is enforced safely.
- [ ] Participants receive a clear success or error result.
- [ ] Authorized administrators can view registrations.
- [ ] Registration data can be exported to CSV.
- [ ] Club Admins cannot access another club's private registrations.

### User Experience

- [ ] Public and administrative pages work on desktop and mobile.
- [ ] Forms show clear validation errors.
- [ ] Loading, empty, success, and failure states are implemented.
- [ ] Navigation is consistent and understandable.

### Production Readiness

- [ ] Database migrations are version-controlled.
- [ ] Secrets are not exposed to the client.
- [ ] Authorization tests pass.
- [ ] Critical registration and concurrency cases are tested.
- [ ] Production backups are configured.
- [ ] Deployment instructions are documented.

---

## 20. Decisions to Finalize Before Implementation

### 20.1 Participant Registration Method

Choose one:

**Option A — Guest registration**
- Participants register using a form without creating accounts.
- Simpler for an initial MVP.
- Requires a clear duplicate-registration policy.
- Does not provide a secure personal dashboard unless additional verification is implemented.

**Option B — Account-based registration**
- Participants sign in before registering.
- Makes “My Registrations” and identity-linked duplicate prevention easier.
- Adds authentication and account-support complexity.

Public browsing should remain available without login either way.

### 20.2 Club Admin Assignment

Recommended default:

- Super Admin creates accounts.
- Super Admin assigns one or more clubs.
- Club Admins cannot assign other administrators.
- Assignment changes take effect promptly.

### 20.3 Club Membership

A full club member directory is optional and can be excluded from the initial release. The platform can manage clubs and their events without tracking every club member.

### 20.4 Event Approval

Recommended default:

- Club Admins may publish events for their assigned clubs.
- Super Admin can manage all events.
- No separate approval workflow in the first release.

### 20.5 Registration Cancellation

Decide whether participants can cancel their own registrations. If unnecessary initially, let authorized administrators manage registration status.

### 20.6 Email Notifications

Email confirmations are useful but should be a separate delivery concern. A temporary email outage must not corrupt registration data.

---

## 21. Final Product Definition

The College Club & Event Management System MVP is a role-based web application that centralizes college club information, event publication, and participant registration.

It includes:

- One Super Admin role with platform-wide authority.
- Club Admin accounts created and assigned by the Super Admin.
- Student/Participant access for browsing and registration.
- Club management.
- Event management.
- Registration management.
- Role-specific dashboards.
- Secure server-side authorization.
- PostgreSQL persistence using Prisma.
- Responsive public and administrative interfaces.

The first release should prioritize correctness, clear permissions, reliable registration, and ease of use. Add operational modules only after the core workflow has been validated.

**Primary implementation goal:** The Super Admin manages clubs and administrator assignments; Club Admins manage only their assigned clubs and events; participants discover and register for published events without accessing administrative data.
