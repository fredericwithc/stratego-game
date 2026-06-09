-- Stratego online: schema Supabase
-- Execute TUDO no SQL Editor (Dashboard → SQL → New query).
-- O bloco no final já habilita Realtime na tabela "rooms" (não use Database → Replication).

create table if not exists public.rooms (
  id text primary key,
  host_id text not null,
  fase_jogo text not null default 'configuracao',
  jogador_atual text not null default 'Vermelho',
  estado text not null default 'aguardando',
  tabuleiro jsonb not null default '{}'::jsonb,
  jogadores jsonb not null default '{}'::jsonb,
  combate jsonb,
  criada_em timestamptz not null default now()
);

-- Se a tabela já existir sem a coluna combate, rode também:
-- alter table public.rooms add column if not exists combate jsonb;

alter table public.rooms enable row level security;

drop policy if exists "rooms_select" on public.rooms;
drop policy if exists "rooms_insert" on public.rooms;
drop policy if exists "rooms_update" on public.rooms;
drop policy if exists "rooms_delete" on public.rooms;

create policy "rooms_select" on public.rooms for select using (true);
create policy "rooms_insert" on public.rooms for insert with check (true);
create policy "rooms_update" on public.rooms for update using (true);
create policy "rooms_delete" on public.rooms for delete using (true);

-- Virada de turno atômica ao clicar "Pronto"
create or replace function public.marcar_pronto(
  room_id text,
  player_id text,
  tabuleiro_patch jsonb default '{}'::jsonb
)
returns public.rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.rooms;
  jogadores jsonb;
  jogador jsonb;
begin
  select * into r from public.rooms where id = room_id for update;
  if not found then
    raise exception 'Sala não encontrada: %', room_id;
  end if;

  r.tabuleiro := coalesce(r.tabuleiro, '{}'::jsonb) || coalesce(tabuleiro_patch, '{}'::jsonb);
  jogadores := coalesce(r.jogadores, '{}'::jsonb);
  jogador := coalesce(jogadores -> player_id, '{}'::jsonb);
  jogador := jogador || jsonb_build_object('pronto', true);
  jogadores := jogadores || jsonb_build_object(player_id, jogador);
  r.jogadores := jogadores;

  if player_id = r.host_id then
    r.jogador_atual := 'Azul';
    r.fase_jogo := 'configuracao';
  else
    r.jogador_atual := 'Vermelho';
    r.fase_jogo := 'jogando';
    r.estado := 'jogando';
  end if;

  update public.rooms set
    tabuleiro = r.tabuleiro,
    jogadores = r.jogadores,
    jogador_atual = r.jogador_atual,
    fase_jogo = r.fase_jogo
  where id = room_id
  returning * into r;

  return r;
end;
$$;

grant execute on function public.marcar_pronto(text, text, jsonb) to anon, authenticated;

-- Realtime: publica a tabela "rooms" para o cliente receber postgres_changes.
-- (Replication no painel = réplicas externas, NÃO é isso.)
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'rooms'
  ) then
    alter publication supabase_realtime add table public.rooms;
  end if;
end $$;
