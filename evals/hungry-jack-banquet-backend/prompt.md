---
tags: [hungry-jack, banquet, backend]
max_turns: 150
timeout_seconds: 1500
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash, Task, Agent]
---

/hungry-jack --effort banquet Add limit and offset pagination to GET /api/products, defaulting to a limit of 20 and rejecting invalid values (and limits above 100) with a 400. Keep the response a plain array. Do not wait for plan approval.
