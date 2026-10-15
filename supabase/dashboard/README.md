# Paste-ready edge functions

Each `.ts` file here is one edge function in a single file, ready to paste into the
Supabase dashboard. Deploying this way needs no command line, no access token and no
secrets: Supabase gives every function the project's address and keys on its own.

1. Supabase project → **Edge Functions** → **Deploy a new function** → **Via Editor**.
2. Replace everything in the editor with the whole file (on GitHub: **Copy raw file**).
3. Name the function exactly like the file, without `.ts` (for example `stamp`),
   **before** deploying: the name becomes its address (`…/functions/v1/stamp`),
   which the app calls. Renaming it later changes only its label, so a function
   deployed under the editor's suggested name has to be deleted and deployed again.
4. Click **Deploy function**. Leave JWT verification on. On the Edge Functions
   page, the URL column must end with `/functions/v1/<name>`.

`SUPABASE_SETUP.md` ("Deploy the server functions from your browser") says which
function turns on which feature and how to check each one works.

These files are **generated** from `supabase/functions/` (the source of truth, which
`supabase functions deploy` reads) by `npm run functions:dashboard`, which copies each
`../_shared` helper in verbatim. Never edit them by hand: change the source and run
the script again. `src/lib/dashboardCopy.test.ts` fails when a copy is out of date.
