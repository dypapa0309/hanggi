-- ========================================
-- 한끼비서 Supabase 스키마
-- SQL Editor에서 전체 실행하세요
-- ========================================

-- 타입 정의 (이미 있으면 무시)
do $$ begin
  create type merchant_status as enum ('pending_review', 'awaiting_payment_check', 'active', 'inactive');
exception when duplicate_object then null; end $$;

do $$ begin
  create type onboarding_status as enum (
    'lead_created', 'contract_viewed', 'payment_pending',
    'payment_verified', 'store_approved', 'store_live'
  );
exception when duplicate_object then null; end $$;

-- 영업 리드
create table if not exists sales_leads (
  id uuid primary key default gen_random_uuid(),
  owner_name text not null,
  phone text,
  source text default 'field_qr',
  memo text,
  created_at timestamptz default now()
);

-- 사장님 모집 페이지 확장 필드 (이미 있으면 무시)
alter table sales_leads add column if not exists store_name text;
alter table sales_leads add column if not exists address text;
alter table sales_leads add column if not exists contract_term text;
alter table sales_leads add column if not exists main_menu text;
alter table sales_leads add column if not exists extra_menus jsonb;
alter table sales_leads add column if not exists agreed_to_contract boolean default false;
alter table sales_leads add column if not exists contract_version text;
alter table sales_leads add column if not exists agreed_at timestamptz;
alter table sales_leads add column if not exists sms_delivery_status text;
alter table sales_leads add column if not exists sms_sent_at timestamptz;

-- 영업 파트너 리드
create table if not exists partner_leads (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text not null,
  phone text not null,
  address text,
  sales_region text,
  commission_rate numeric(5,2) default 30.00,
  agreed_to_contract boolean default false,
  contract_version text,
  agreed_at timestamptz,
  source text default 'partner_landing',
  memo text,
  created_at timestamptz default now()
);

-- 사장님 계정
create table if not exists merchant_accounts (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references sales_leads(id) on delete set null,
  email text unique,
  owner_name text not null,
  phone text,
  status onboarding_status default 'lead_created',
  created_at timestamptz default now()
);

-- 매장
create table if not exists stores (
  id uuid primary key default gen_random_uuid(),
  merchant_account_id uuid references merchant_accounts(id) on delete cascade,
  name text not null,
  address text not null,
  latitude double precision not null,
  longitude double precision not null,
  merchant_status merchant_status default 'pending_review',
  onboarding_status onboarding_status default 'lead_created',
  is_subscribed boolean default false,
  bank_name text,
  bank_account text,
  created_at timestamptz default now()
);

-- 매장 메뉴
create table if not exists store_menus (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references stores(id) on delete cascade,
  meal_id text not null,       -- 앱 menus.json의 id와 매핑
  meal_name text not null,
  price integer not null,
  available boolean default true,
  created_at timestamptz default now()
);

-- 추천 이벤트 로그 (클릭/확정 추적)
create table if not exists consumer_recommendation_events (
  id uuid primary key default gen_random_uuid(),
  meal_id text not null,
  store_id uuid references stores(id) on delete set null,
  latitude double precision,
  longitude double precision,
  event_type text not null,  -- 'shown' | 'selected'
  created_at timestamptz default now()
);

-- RLS 활성화
alter table sales_leads enable row level security;
alter table partner_leads enable row level security;
alter table stores enable row level security;
alter table store_menus enable row level security;
alter table consumer_recommendation_events enable row level security;

-- anon 영업 리드 insert 허용 (현장 QR 가입용)
do $$ begin
  create policy "anon can insert sales leads"
    on sales_leads for insert
    with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "anon can insert partner leads"
    on partner_leads for insert
    with check (true);
exception when duplicate_object then null; end $$;

-- anon 읽기 허용 (active 매장만)
do $$ begin
  create policy "active stores readable by all"
    on stores for select
    using (merchant_status = 'active');
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "store_menus readable by all"
    on store_menus for select
    using (available = true);
exception when duplicate_object then null; end $$;

-- anon 이벤트 로그 insert 허용
do $$ begin
  create policy "insert recommendation events"
    on consumer_recommendation_events for insert
    with check (true);
exception when duplicate_object then null; end $$;

-- ========================================
-- 테스트용 더미 데이터 (개발용, 나중에 삭제)
-- ========================================

insert into merchant_accounts (email, owner_name, phone, status)
values ('test@hanggi.dev', '테스트사장', '010-0000-0000', 'store_live')
on conflict (email) do nothing;

insert into stores (
  merchant_account_id, name, address,
  latitude, longitude,
  merchant_status, onboarding_status, is_subscribed
)
select
  id,
  '한끼비서 테스트 식당',
  '서울 강남구 테헤란로 123',
  37.4981, 127.0276,
  'active', 'store_live', true
from merchant_accounts
where email = 'test@hanggi.dev'
on conflict do nothing;

insert into store_menus (store_id, meal_id, meal_name, price, available)
select
  s.id, 'tofu_stew', '순두부찌개', 9000, true
from stores s
join merchant_accounts m on m.id = s.merchant_account_id
where m.email = 'test@hanggi.dev'
on conflict do nothing;

insert into store_menus (store_id, meal_id, meal_name, price, available)
select
  s.id, 'bibimbap', '비빔밥', 10000, true
from stores s
join merchant_accounts m on m.id = s.merchant_account_id
where m.email = 'test@hanggi.dev'
on conflict do nothing;
