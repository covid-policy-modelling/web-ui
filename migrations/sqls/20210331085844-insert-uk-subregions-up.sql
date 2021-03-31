UPDATE regions SET name = 'United Kingdom' where id = 'GB';
INSERT INTO regions (id, parent_id, name, created_at, updated_at) VALUES
  ('GB-ENG', 'GB', 'England', NOW(), NOW()),
  ('GB-NIR', 'GB', 'Northern Ireland', NOW(), NOW()),
  ('GB-SCT', 'GB', 'Scotland', NOW(), NOW()),
  ('GB-WLS', 'GB', 'Wales', NOW(), NOW());
