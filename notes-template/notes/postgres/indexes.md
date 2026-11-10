# Indexes

Sample note. Replace it with your own.

## Why an index
- Without one, Postgres reads every row of the table: a sequential scan.
- An index is a separate structure that points at rows, so a lookup touches a handful of pages instead of all of them.
- Indexes are not free: every insert, update and delete has to maintain them, and they take disk space.

## B-tree, the default
- `CREATE INDEX ON orders (customer_id);` builds a B-tree.
- Good for equality and ranges: `=`, `<`, `>`, `BETWEEN`, and `ORDER BY` on the same column.
- No help for a `LIKE` pattern with a leading wildcard, because the start of the value is unknown.

## Composite indexes
- An index on `(a, b)` can serve a query on `a`, or on `a` and `b`, but not on `b` alone.
- Leftmost prefix rule. Put the column you always filter on first.

## Reading a plan
- `EXPLAIN ANALYZE` runs the query and shows what actually happened.
- Seq Scan on a large table in a hot query is the thing to look for.
- A sequential scan is not always wrong: for a small table, or when the query returns most of the rows, it is faster than an index.

## Keeping them useful
- Unused indexes still cost writes. `pg_stat_user_indexes` shows how often each one was scanned.
- `CREATE INDEX CONCURRENTLY` builds without locking writes, which is what you want in production. It is slower and can fail, leaving an invalid index to drop.
