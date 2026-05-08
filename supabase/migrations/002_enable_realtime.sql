-- Enable Realtime for tasks and projects tables
alter publication supabase_realtime add table tasks;
alter publication supabase_realtime add table projects;
