-- =============================================
-- LegalRAG — Postgres Schema (Supabase)
-- Canonical version. Paste into Supabase SQL Editor.
-- See: ../Startup Legal compliance RAG Platform/docs/database/schema.md
-- =============================================

-- USERS handled by Supabase Auth (auth.users)

-- profiles (1:1 with auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  company_type text check (company_type in
    ('private_limited','llp','sole_prop','partnership','opc')),
  jurisdiction text default 'IN',
  created_at timestamptz default now()
);

-- documents (uploaded PDFs + public corpus)
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,  -- nullable for is_public
  name text not null,
  storage_path text,
  size_bytes int,
  page_count int,
  chunk_count int default 0,
  status text default 'processing' check (status in ('processing','ready','failed')),
  is_public boolean default false,                            -- pre-seeded corpus = true
  created_at timestamptz default now()
);
create index on public.documents(user_id);
create index on public.documents(is_public) where is_public = true;

-- chats
create table public.chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text default 'New chat',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index on public.chats(user_id, updated_at desc);

-- messages
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  citations jsonb,                  -- [{doc_id, doc_name, page, snippet?}]
  created_at timestamptz default now()
);
create index on public.messages(chat_id, created_at);

-- compliance_items (static + user-completion)
create table public.compliance_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  category text,                    -- 'incorporation','tax','employment','annual'
  due_date date,
  completed boolean default false,
  created_at timestamptz default now()
);
create index on public.compliance_items(user_id, completed);

-- ingest_jobs (per ADR-012: track each PDF ingestion's stage-by-stage state)
-- Synchronous in MVP, but the table is here from day one so the same code
-- powers a future async job runner.
create table public.ingest_jobs (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,    -- nullable for is_public seed
  status text not null default 'pending'
    check (status in ('pending','parsing','chunking','embedding','upserting','ready','failed')),
  progress jsonb,                  -- {pagesParsed, chunksTotal, chunksEmbedded, chunksUpserted}
  error text,
  attempts int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index on public.ingest_jobs(document_id);
create index on public.ingest_jobs(status);

-- =============================================
-- ROW-LEVEL SECURITY (CRITICAL)
-- =============================================

alter table public.profiles         enable row level security;
alter table public.documents        enable row level security;
alter table public.chats            enable row level security;
alter table public.messages         enable row level security;
alter table public.compliance_items enable row level security;
alter table public.ingest_jobs      enable row level security;

create policy "own profile" on public.profiles
  for all using (auth.uid() = id);

create policy "own or public docs (read)" on public.documents
  for select using (auth.uid() = user_id or is_public = true);
create policy "own docs (insert)" on public.documents
  for insert with check (auth.uid() = user_id);
create policy "own docs (update/delete)" on public.documents
  for update using (auth.uid() = user_id);
create policy "own docs (delete)" on public.documents
  for delete using (auth.uid() = user_id);

create policy "own chats" on public.chats
  for all using (auth.uid() = user_id);

create policy "own messages" on public.messages
  for all using (
    exists (select 1 from public.chats c where c.id = chat_id and c.user_id = auth.uid())
  );

create policy "own compliance" on public.compliance_items
  for all using (auth.uid() = user_id);

-- ingest_jobs are scoped via the parent document's RLS
create policy "own ingest jobs" on public.ingest_jobs
  for all using (
    exists (
      select 1 from public.documents d
      where d.id = document_id
        and (d.user_id = auth.uid() or d.is_public = true)
    )
  );

-- =============================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- =============================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
