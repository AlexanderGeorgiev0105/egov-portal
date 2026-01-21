ALTER TABLE users
  ALTER COLUMN doc_number TYPE varchar(9)
  USING trim(doc_number);
ALTER TABLE users
  ALTER COLUMN egn TYPE varchar(10)
  USING trim(egn);