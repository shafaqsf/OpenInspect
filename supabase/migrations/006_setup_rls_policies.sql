alter table datasets enable row level security;
alter table labels enable row level security;
alter table images enable row level security;
alter table annotations enable row level security;

create policy "Allow all on datasets"
on datasets for all
using (true)
with check (true);

create policy "Allow all on labels"
on labels for all
using (true)
with check (true);

create policy "Allow all on images"
on images for all
using (true)
with check (true);

create policy "Allow all on annotations"
on annotations for all
using (true)
with check (true);
