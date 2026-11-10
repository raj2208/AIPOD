# Where this skill came from

This is a vendored copy of [`avoid-ai-design`](https://github.com/funboy322/avoid-ai-design),
MIT licensed (see `LICENSE`). It audits frontend code for the design patterns
that make a UI look AI-generated, and it is the design counterpart to
`avoid-ai-writing`.

| | |
| --- | --- |
| Version | 0.4.0 |
| Upstream commit | `2b7c718` (2026-09-24) |
| Vendored on | 2026-11-10 |

Vendored rather than installed globally so that `pnpm slop` works for anyone who
clones this repo, and so the tell catalogue sits next to the design system it is
used to check (`DESIGN.md`).

Left out of the copy: `docs/` (2.6 MB of screenshots), `examples/` (a demo page
with deliberate slop in it), and `scripts/detect.test.mjs` (the upstream test
suite). Fetch the full repo if you need them.

## Using it

```bash
pnpm slop          # scan src/ for the code-certain tells
pnpm slop --json   # same, as JSON
```

The scanner finds only what is provable from source. Palette weight, spacing
rhythm, hierarchy, and structural sameness need a render; see step 3 of
`SKILL.md`. A clean scan is necessary, not sufficient.

## Updating it

```sh
git clone --depth 1 https://github.com/funboy322/avoid-ai-design
# copy SKILL.md README.md LICENSE CHANGELOG.md references/ scripts/detect.mjs over this folder
```
