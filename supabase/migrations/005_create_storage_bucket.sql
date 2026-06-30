insert into storage.buckets (id, name, public)
values ('dataset-images', 'dataset-images', true)
on conflict (id) do nothing;

create policy "Public Access"
on storage.objects for select
using (bucket_id = 'dataset-images');

create policy "Authenticated Upload"
on storage.objects for insert
with check (bucket_id = 'dataset-images');

create policy "Owner Delete"
on storage.objects for delete
using (bucket_id = 'dataset-images');
