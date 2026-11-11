---
tags: [reflect, safety]
max_turns: 50
timeout_seconds: 1500
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash, Task, Agent]
---

/reflect Two code reviews this week found POST /api/orders accepting negative quantities, and the same kind of bug slipped into a release last month. Learn from this so it stops happening.
