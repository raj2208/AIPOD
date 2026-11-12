---
id: postgres-indexes
title: Indexes
topic: Postgres
source: notes/postgres/indexes.md
source_hash: 7f2152f31307f421fe379c6e3cfe036a4e728c18
model: claude-opus-5
skill_version: 2
status: draft
---
Let's revise indexes.

By the end of this session, you should be able to explain why an index helps, what a B-tree is good for, how a composite index behaves, how to read a query plan, and how to tell whether an index is earning its place.

Start with why you'd want an index at all.

Without one, Postgres reads every row of the table, which is called a sequential scan.

An index is a separate structure that points at rows, so a lookup touches a handful of pages instead of all of them.

But indexes are not free.

Every insert, update and delete has to maintain them, and they take disk space.

Next, the B-tree, which is the default.

If you write CREATE INDEX ON orders, customer_id, what you get is a B-tree.

A B-tree is good for equality and for ranges: equals, less than, greater than, BETWEEN, and ORDER BY on the same column.

It's no help for a LIKE pattern with a leading wildcard, because the start of the value is unknown.

Now composite indexes, meaning an index over more than one column.

An index on a, b can serve a query on a, or on a and b together, but not on b alone.

That's the leftmost prefix rule.

So put the column you always filter on first.

Let's look at reading a plan.

EXPLAIN ANALYZE runs the query and shows what actually happened.

The thing to look for is a sequential scan on a large table in a hot query.

But a sequential scan is not always wrong.

For a small table, or when the query returns most of the rows, a sequential scan is faster than an index.

Last, keeping your indexes useful.

An unused index still costs you on every write.

The view pg_stat_user_indexes shows how often each one was scanned.

And when you add an index in production, use CREATE INDEX CONCURRENTLY, which builds it without locking writes.

CREATE INDEX CONCURRENTLY is slower, and it can fail, leaving behind an invalid index that you then have to drop.

To recap.

An index saves Postgres from reading every row, at the cost of slower writes and more disk.

B-trees are the default and handle equality, ranges and ordering, but not leading wildcards.

A composite index works left to right, so order the columns by what you always filter on.

EXPLAIN ANALYZE tells you what really ran, and a sequential scan is only a problem on a large table in a hot query.

And check pg_stat_user_indexes for indexes nobody uses, and build new ones CONCURRENTLY.

That's your revision on indexes.
