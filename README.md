# Identity

Digital business card and portfolio platform. The frontend is React + Vite; the
Express/MySQL API lives in the sibling `~/IDB` directory.

## Run locally

1. Configure and start the backend by following `~/IDB/README.md`.
2. In this project, copy `.env.example` to `.env` and set `VITE_API_BASE_URL`.
3. Run the frontend:

   ```sh
   npm install
   npm run dev
   ```

## Current implementation

- The editor creates an account or signs in, saves profile drafts to the API,
  publishes or makes the profile private, and previews changes.
- After sign-in or registration, users land on a dashboard with profile status,
  completion progress, public-link actions, resume management, account settings,
  and a path back to the editor.
- Resume creation is prefilled from profile details and supports 20 templates,
  20 preset colors plus a custom color, experience, education, skill and language
  levels, and a download menu for high-resolution PDF or Word exports that retain
  the selected preview's styling and images. Word exports preserve each page as an
  image for visual fidelity.
- Account settings support updating the sign-in email, changing the password
  with the current password, and permanently deleting the account.
- Public profiles load from the API at `#/u/<username>`; `#/u/demo` remains a
  static example.
- Authentication cookies contain short-lived access tokens and rotating refresh
  tokens. Profile editing is account-scoped by the API.
- Translations are maintained in `src/i18n.js` (English, French, Kinyarwanda).
- Pages are lazy loaded; fonts use `display=swap`.

The MVP does not yet include social links, multiple profile templates or profile
views, analytics, or user-selected visibility for individual fields. The current
publish/private control applies to the profile as a whole.
