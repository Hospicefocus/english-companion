-- English Companion: secure cross-device progress sync
-- Run this script once in Supabase Dashboard > SQL Editor.
create table if not exists public.english_completions (
  user_id uuid not null references auth.users(id) on delete cascade,
  study_date date not null,
  activity_index smallint not null check (activity_index between 0 and 4),
  created_at timestamptz not null default now(),
  primary key (user_id, study_date, activity_index)
);
create table if not exists public.english_legacy_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  minutes integer not null default 0 check (minutes >= 0),
  activities integer not null default 0 check (activities >= 0),
  days jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);
create table if not exists public.english_lesson_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  study_date date not null,
  done jsonb not null default '[]'::jsonb,
  answers jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, study_date)
);
alter table public.english_completions enable row level security;
alter table public.english_legacy_progress enable row level security;
alter table public.english_lesson_progress enable row level security;
drop policy if exists "Users can read their own completions" on public.english_completions;
create policy "Users can read their own completions" on public.english_completions for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Users can insert their own completions" on public.english_completions;
create policy "Users can insert their own completions" on public.english_completions for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Users can delete their own completions" on public.english_completions;
create policy "Users can delete their own completions" on public.english_completions for delete to authenticated using (auth.uid() = user_id);
drop policy if exists "Users can read their own legacy progress" on public.english_legacy_progress;
create policy "Users can read their own legacy progress" on public.english_legacy_progress for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Users can insert their own legacy progress" on public.english_legacy_progress;
create policy "Users can insert their own legacy progress" on public.english_legacy_progress for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Users can update their own legacy progress" on public.english_legacy_progress;
create policy "Users can update their own legacy progress" on public.english_legacy_progress for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users can delete their own legacy progress" on public.english_legacy_progress;
create policy "Users can delete their own legacy progress" on public.english_legacy_progress for delete to authenticated using (auth.uid() = user_id);
drop policy if exists "Users can read their own lesson progress" on public.english_lesson_progress;
create policy "Users can read their own lesson progress" on public.english_lesson_progress for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Users can insert their own lesson progress" on public.english_lesson_progress;
create policy "Users can insert their own lesson progress" on public.english_lesson_progress for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Users can update their own lesson progress" on public.english_lesson_progress;
create policy "Users can update their own lesson progress" on public.english_lesson_progress for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
