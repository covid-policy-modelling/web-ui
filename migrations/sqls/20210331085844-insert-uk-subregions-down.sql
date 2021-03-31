UPDATE regions SET name = 'Great Britain' where id = 'GB';
DELETE FROM regions WHERE parent_id = 'GB';
