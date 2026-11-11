---
type: llm
focus: trace
weight: 1
---

server/routes/orders.js rejects quantities below 1 and above 10 with a 400 and a clear message, and a test covers both bounds.
