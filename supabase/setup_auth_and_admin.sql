-- ========================================
-- 1. profiles 表（用户角色）
-- ========================================
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamp with time zone default now()
);

alter table profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on profiles for select
  to anon, authenticated
  using (true);

-- ========================================
-- 2. 用户注册时自动创建 profile，第一个用户自动成为 admin
-- ========================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    new.email,
    case
      when (select count(*) from public.profiles where role = 'admin') = 0
      then 'admin'
      else 'user'
    end
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ========================================
-- 3. places 表 RLS：所有人可读，admin 可写
-- ========================================
-- 确保 RLS 已开启
alter table places enable row level security;

-- 删除可能冲突的旧 policy
drop policy if exists "Places are viewable by everyone" on places;
drop policy if exists "Allow admin full access on places" on places;

-- SELECT：匿名和登录用户都可以读
create policy "Places are viewable by everyone"
  on places for select
  to anon, authenticated
  using (true);

-- INSERT/UPDATE/DELETE：仅 admin
create policy "Allow admin full access on places"
  on places for all
  to authenticated
  using (auth.uid() in (select id from profiles where role = 'admin'))
  with check (auth.uid() in (select id from profiles where role = 'admin'));

-- ========================================
-- 4. reviews 表 RLS（如果已存在则覆盖）
-- ========================================
alter table reviews enable row level security;

drop policy if exists "允许任何人读取评论" on reviews;
drop policy if exists "允许任何人插入评论" on reviews;

create policy "Reviews are viewable by everyone"
  on reviews for select
  to anon, authenticated
  using (true);

create policy "Allow anyone to insert reviews"
  on reviews for insert
  to anon, authenticated
  with check (true);
