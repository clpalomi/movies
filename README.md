# Movies I watched

Personal movie watch log for `movies.claudiopalominos.com`.

## Supabase setup for the movie database

The public site loads movies from two places:

- `data/movies.json` for the movies that already exist in this repository.
- The Supabase `movies` database table for new movies added from the admin UI.

Visitors can always read and filter the combined list. Only the configured admin email can log in and insert new movies or upload poster images.

1. Create a Supabase project.
2. In **Authentication → Providers → Email**, enable email magic links. Disable public sign-ups after creating your admin user, or keep sign-ups closed and invite/create only your admin account.
3. In **Authentication → Users**, create or invite the single admin user with your email.
4. In **Authentication → URL Configuration**, add your deployed site URL, for example:
   - `https://movies.claudiopalominos.com`
   - your GitHub Pages preview URL, if you use one for testing
5. In **SQL Editor**, create the `movies` table:

```sql
create table public.movies (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  title text not null,
  year integer,
  slug text,
  director jsonb not null default '[]'::jsonb,
  imdb_id text,
  poster text,
  genres jsonb not null default '[]'::jsonb,
  "cast" jsonb not null default '[]'::jsonb,
  runtime_min integer,
  watched_date date,
  location text,
  rating numeric,
  tags jsonb not null default '[]'::jsonb,
  notes text,
  blog jsonb
);

alter table public.movies enable row level security;
```

6. Add row-level security policies for public reads and admin-only inserts. Replace `YOUR_EMAIL@example.com` with your real email:

```sql
create policy "Public movie reads"
on public.movies for select
using (true);

create policy "Only Claudio inserts movies"
on public.movies for insert
to authenticated
with check (auth.jwt() ->> 'email' = 'YOUR_EMAIL@example.com');
```

7. In **Storage**, create a public bucket named `movie-posters`.
8. In **SQL Editor**, add policies that allow anyone to read poster files, but only your authenticated email to upload or update them. Replace `YOUR_EMAIL@example.com` with your real email:

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

9. In **Project Settings → API**, copy your Project URL and anon public key.
10. In `index.html`, replace these placeholders with your project values:

```js
const SUPABASE_URL = 'https://YOUR_PROJECT_REF.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
const ADMIN_EMAIL = 'YOUR_EMAIL@example.com';
const MOVIES_TABLE = 'movies';
```

11. Deploy the site. Visitors will see movies from `data/movies.json` plus any rows in Supabase. Log in with the approved admin email, click **Add movie**, optionally upload a poster, then click **Add movie to Supabase**.

> The email check in the browser is only for hiding the admin interface. The Supabase RLS policies above are the real protection that prevents other users from writing movies or uploading images.
