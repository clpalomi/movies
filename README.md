# Movies I watched

Personal movie watch log for `movies.claudiopalominos.com`.

## Supabase setup for private movie uploads

The public site still reads movie metadata from `data/movies.json`, but the admin-only helper can upload poster images to Supabase Storage and generate a JSON entry whose `poster` field uses the public Supabase image URL. This keeps images out of GitHub.

1. Create a new Supabase project.
2. In **Authentication → Providers → Email**, enable email magic links. Disable public sign-ups after creating your own admin user, or keep sign-ups closed and invite/create only your admin account.
3. In **Authentication → Users**, create or invite the single admin user with your email.
4. In **Authentication → URL Configuration**, add your deployed site URL, for example:
   - `https://movies.claudiopalominos.com`
   - your GitHub Pages preview URL, if you use one for testing
5. In **Storage**, create a public bucket named `movie-posters`.
6. In **SQL Editor**, add policies that allow anyone to read poster files, but only your authenticated email to upload or update them. Replace `YOUR_EMAIL@example.com` with your real email:

```sql
create policy "Public poster reads"
on storage.objects for select
using (bucket_id = 'movie-posters');

create policy "Only Claudio uploads posters"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'movie-posters'
  and auth.jwt() ->> 'email' = 'YOUR_EMAIL@example.com'
);

create policy "Only Claudio updates posters"
on storage.objects for update
to authenticated
using (
  bucket_id = 'movie-posters'
  and auth.jwt() ->> 'email' = 'YOUR_EMAIL@example.com'
)
with check (
  bucket_id = 'movie-posters'
  and auth.jwt() ->> 'email' = 'YOUR_EMAIL@example.com'
);
```

7. In **Project Settings → API**, copy your Project URL and anon public key.
8. In `index.html`, replace these placeholders with your project values:

```js
const SUPABASE_URL = 'https://YOUR_PROJECT_REF.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
const ADMIN_EMAIL = 'YOUR_EMAIL@example.com';
```

9. Deploy the site. Click **Login**, request a magic link with your approved email, then use **Add movie** to upload a poster and copy the generated JSON into `data/movies.json`.

> The email check in the browser is only for hiding the admin interface. The Storage policies above are the real protection that prevents other users from uploading images.
