---
name: vision
description: "Refine the AIPOD product vision and keep the docs in sync with it. Use when the user says 'use skill vision', 'vision', or invokes /vision, usually after discussing the product idea."
---

Keep the product docs in `docs/` up to date with what the user and agent have decided about the AIPOD vision.

Follow these steps:

1. **Read first.** Read every file in `docs/` so you know the current state:
   - `docs/vision.md` has the problem, the product, and the core principles.
   - `docs/pipeline.md` explains how notes become audio.
   - `docs/open-questions.md` lists what is not decided yet.

2. **Collect what changed.** From the conversation, list only what the user has actually said or agreed to: new decisions, corrections, and new questions. Do not invent decisions the user has not made.

3. **Update the docs.**
   - A decision goes into the doc where it belongs (`vision.md` or `pipeline.md`).
   - If a decision answers a question in `open-questions.md`, remove that question.
   - If something is raised but not decided, add it to `open-questions.md`.
   - If the user contradicts an earlier statement, change the doc to match the latest decision.
   - Create a new file in `docs/` only if the topic clearly does not fit the existing ones.

4. **Keep the docs simple.** Short sentences, plain words, no duplicated content between files.

5. **Report back.** Tell the user in a few lines what you changed, and list any open questions still left.

Do not commit unless the user asks. When they do, use the `commit` skill.
