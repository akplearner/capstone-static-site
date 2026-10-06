# Azure DevOps Capstone — certification and cost sheet

**Microsoft DevOps Engineer (AZ-400)** · Expert · exam fee $165 (list price, 2026)

Generated from the certification registry and the course document by `npm run content:export`; edit `src/lib/docs/certs.ts`, `src/lib/docs/costs.ts` or the seed, not this file.

## The ladder

Azure Fundamentals (AZ-900) → Azure Administrator (AZ-104) → **DevOps Engineer (AZ-400)**

## Exam coverage — 96% of the exam weight is practised

| Domain | Weight | Practised by |
| --- | --- | --- |
| Design and implement processes and communications | 11–15% | Map the template and set the environment strategy; Write the change request and the gates; Assemble the handover package |
| Design and implement a source control strategy | 10–15% | Protect main, add the environments and require the checks |
| Design and implement build and release pipelines | 50–55% | Inventory with the CLI and detect drift; Fill the starter and deploy to dev; Build the staged pipeline; Blue/green the fleet with a second pool and a cut-over; Canary the counter with a deployment slot and a metric; Rebuild from the template and automate the restart; Fix an app failure through CI |
| Develop a security and compliance plan | 10–15% | Parameter files, validation and policy as code; Sign in with OIDC, scope the deploy identity and test rollback; Contain a security incident and write the post-mortem |
| Implement an instrumentation strategy | 5–10% | Review cost by service and set the service levels; Build the dashboard, require the tag with Policy and read the audit trail |

## Cost

Exam $165 · one-off $0 · monthly ceiling $20 · tasks $0.18

| Item | Kind | Cost | Note |
| --- | --- | --- | --- |
| Azure account, pay-as-you-go | cloud | $0 / month (approx.) | The inherited environment, deployed from the template for the drills and deleted after. |
| A dev and a prod stack of the environment (weeks 1, 2, 3, 4) | cloud | $0.05 / hour (approx.) | Two copies of the fleet and the database while a pipeline run or a drill is in flight. |
| GitHub Actions | software | $0 / month | Free minutes on a public or small private repository cover the course. |
| Budget guardrail | cloud | $20 / month (approx.) | The cap the course sets; a forgotten prod stack is the way to exceed it. |

| Task | Runs for | Cost | Note |
| --- | --- | --- | --- |
| Fill the starter and deploy to dev | 55 min | $0.04 | The dev copy’s VM and balancer while the group exists; deleted inside the task. |
| Build the staged pipeline | 55 min | $0.04 | The dev copy’s VM and balancer between the run and the delete. |
| Blue/green the fleet with a second pool and a cut-over | 60 min | $0.06 | Up to three billed B1s and the balancer while blue and green run together; both parked at the end. |
| Rebuild from the template and automate the restart | 55 min | $0.04 | The recovery copy’s VM and balancer while the group exists; deleted inside the task. |

