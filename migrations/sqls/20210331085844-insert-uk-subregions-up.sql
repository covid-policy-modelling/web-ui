UPDATE regions SET name = 'United Kingdom' where id = 'GB';
INSERT INTO regions (id, parent_id, name, created_at, updated_at) VALUES
  ('GB-ENG', 'GB', 'England', NOW(), NOW()),
  ('GB-NIR', 'GB', 'Northern Ireland', NOW(), NOW()),
  ('GB-SCT', 'GB', 'Scotland', NOW(), NOW()),
  ('GB-WLS', 'GB', 'Wales', NOW(), NOW()),
  ('GB-LND', 'GB', 'London', NOW(), NOW()),
  ('GB-SW', 'GB', 'South West', NOW(), NOW()),
  ('GB-SE', 'GB', 'South East', NOW(), NOW()),
  ('GB-EE', 'GB', 'East of England', NOW(), NOW()),
  ('GB-MDL', 'GB', 'Midlands', NOW(), NOW()),
  ('GB-NE', 'GB', 'North East and Yorkshire', NOW(), NOW()),
  ('GB-NW', 'GB', 'North West', NOW(), NOW());
