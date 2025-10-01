-- Add intern date range columns to user_profiles
-- Run this in Supabase SQL Editor

alter table public.user_profiles
  add column if not exists start_date date,
  add column if not exists end_date date;

comment on column public.user_profiles.start_date is 'Intern/user start date';
comment on column public.user_profiles.end_date is 'Intern/user end date';
