# Azure DevOps Capstone — certification and cost sheet

**Microsoft DevOps Engineer (AZ-400)** · Expert · exam fee $165 (list price, 2026)

Generated from the certification registry and the course document by `npm run content:export`; edit `src/lib/docs/certs.ts`, `src/lib/docs/costs.ts` or the seed, not this file.

## The ladder

Azure Fundamentals (AZ-900) → Azure Administrator (AZ-104) → **DevOps Engineer (AZ-400)**

## Exam coverage — 0% of the exam weight is practised

| Domain | Weight | Practised by |
| --- | --- | --- |
| Design and implement processes and communications | 11–15% | — not practised in this course |
| Design and implement a source control strategy | 10–15% | — not practised in this course |
| Design and implement build and release pipelines | 50–55% | — not practised in this course |
| Develop a security and compliance plan | 10–15% | — not practised in this course |
| Implement an instrumentation strategy | 5–10% | — not practised in this course |

Graded tasks that name no domain: az-w9-arch, az-w9-infra, az-w9-dev, az-w9-secops, az-w10-arch, az-w10-infra, az-w10-dev, az-w10-secops, az-w11-arch, az-w11-infra, az-w11-dev, az-w11-secops, az-w12-arch, az-w12-infra, az-w12-dev, az-w12-secops.

## Cost

Exam $165 · one-off $0 · monthly ceiling $20 · tasks $0

| Item | Kind | Cost | Note |
| --- | --- | --- | --- |
| Azure account, pay-as-you-go | cloud | $0 / month (approx.) | The inherited environment, deployed from the template for the drills and deleted after. |
| A dev and a prod stack of the environment (weeks 1, 2, 3, 4) | cloud | $0.05 / hour (approx.) | Two copies of the fleet and the database while a pipeline run or a drill is in flight. |
| GitHub Actions | software | $0 / month | Free minutes on a public or small private repository cover the course. |
| Budget guardrail | cloud | $20 / month (approx.) | The cap the course sets; a forgotten prod stack is the way to exceed it. |

