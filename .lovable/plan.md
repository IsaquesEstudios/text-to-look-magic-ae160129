

## Plan: Create Public Account Deletion Request Page

### What
A public page at `/excluir-conta` with:
- Discovery logo
- Explanation of the deletion process (what happens, timeline)
- Email input form to submit a deletion request
- Confirmation message after submission
- Bilingual support (PT/EN)

### Implementation

**1. Create `src/pages/ExcluirConta.tsx`**
- Public page (no auth required)
- Discovery logo at top
- Card with explanation of the process:
  - What data will be deleted
  - Timeline (up to 30 days)
  - How the user will be notified
- Simple form: email input + submit button
- On submit: insert into a new `account_deletion_requests` table and show success message
- Clean, professional design matching the app's style

**2. Create database table `account_deletion_requests`**
- Columns: `id`, `email`, `status` (default 'pending'), `created_at`
- RLS: public INSERT (no auth needed), admin SELECT

**3. Add route to `src/routes.tsx`**
- Add `/excluir-conta` as a public route pointing to the new page

### Delete Account URL for Google Play
The final URL will be: `https://text-to-look-magic.lovable.app/excluir-conta`

