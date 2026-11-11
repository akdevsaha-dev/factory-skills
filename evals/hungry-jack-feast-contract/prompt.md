---
tags: [hungry-jack, feast, cross-system]
max_turns: 120
timeout_seconds: 1500
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash, Task, Agent]
---

/hungry-jack --effort feast Change GET /api/products to return the price as an integer priceCents field instead of the decimal price string, and update every consumer. Do not wait for plan approval.
