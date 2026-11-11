---
tags: [hungry-jack, snack, high-risk]
max_turns: 60
timeout_seconds: 1500
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash, Task, Agent]
---

/hungry-jack --effort snack Add refunds: POST /api/orders/:id/refund lets the order owner refund up to the captured amount through the payment provider, idempotent by the Idempotency-Key header.
