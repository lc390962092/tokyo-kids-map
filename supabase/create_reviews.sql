-- 创建家长评论表 + RLS 策略（匿名可读写）
-- 在 Supabase Dashboard → SQL Editor → New query 里粘贴执行

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references places(id) on delete cascade,
  nickname text not null default '匿名家长',
  rating integer not null check (rating between 1 and 5),
  comment text not null check (length(comment) <= 300),
  created_at timestamp with time zone default now()
);

-- 开启 RLS
alter table reviews enable row level security;

-- 允许任何人读取评论
create policy "允许任何人读取评论"
  on reviews for select
  to anon, authenticated
  using (true);

-- 允许任何人插入评论（匿名评论）
create policy "允许任何人插入评论"
  on reviews for insert
  to anon, authenticated
  with check (true);
