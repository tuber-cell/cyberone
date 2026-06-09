-- ============================================================
-- CyberOne — Supabase Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── Users table ──────────────────────────────────────────────
create table if not exists public.users (
  id          uuid primary key default uuid_generate_v4(),
  email       text unique not null,
  password_hash text not null,
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null
);

-- Index for fast email lookups
create index if not exists users_email_idx on public.users(email);

-- ── Scans table ──────────────────────────────────────────────
create table if not exists public.scans (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references public.users(id) on delete cascade not null,
  target      text not null,
  results_json jsonb not null default '{}',
  created_at  timestamptz default now() not null
);

-- Index for fast user scan lookups
create index if not exists scans_user_id_idx on public.scans(user_id);
create index if not exists scans_created_at_idx on public.scans(created_at desc);

-- ── Row Level Security ────────────────────────────────────────
-- Users table: locked down (service role only)
alter table public.users enable row level security;
create policy "Service role only" on public.users
  using (false);

-- Scans table: users can only see their own (service role bypasses)
alter table public.scans enable row level security;
create policy "Users see own scans" on public.scans
  for select using (false);

-- ── Auto-update updated_at ────────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger handle_users_updated_at
  before update on public.users
  for each row execute function public.handle_updated_at();
