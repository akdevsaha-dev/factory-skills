---
tags: [hungry-jack, snack, backend]
max_turns: 60
timeout_seconds: 1500
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash, Task, Agent]
---

/hungry-jack --effort snack Reject order quantities that are not between 1 and 10 in POST /api/orders with a 400 and a clear error message.
