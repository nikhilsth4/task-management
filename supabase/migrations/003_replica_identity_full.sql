-- Required for Realtime UPDATE/DELETE events when filtering by non-primary-key columns (user_id)
alter table tasks replica identity full;
alter table projects replica identity full;
