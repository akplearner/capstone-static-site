# AWS DevOps Engineer Capstone — certification and cost sheet

**AWS DevOps Engineer – Professional (DOP-C02)** · Professional · exam fee $300 (list price, 2026)

Generated from the certification registry and the course document by `npm run content:export`; edit `src/lib/docs/certs.ts`, `src/lib/docs/costs.ts` or the seed, not this file.

## The ladder

Cloud Practitioner (CLF-C02) → Solutions Architect – Associate (SAA-C03) → **DevOps Engineer – Professional (DOP-C02)**

## Exam coverage — 100% of the exam weight is practised

| Domain | Weight | Practised by |
| --- | --- | --- |
| SDLC Automation | 22% | Write the change request and the gates; Protect main, add the environments and require the checks; Build the staged pipeline |
| Configuration Management and IaC | 17% | Map the template and set the environment strategy; Inventory with the CLI and detect drift; Fill the starter and deploy to dev |
| Resilient Cloud Solutions | 15% | Blue/green the fleet with weighted target groups; Canary the counter with alias weights and an alarm; Rebuild from the template and automate the restart |
| Monitoring and Logging | 15% | Review cost by service and set the service levels; Build the dashboard, require the tag with Config and read the audit trail |
| Incident and Event Response | 14% | Assemble the handover package; Fix an app failure through CI; Contain a security incident and write the post-mortem |
| Security and Compliance | 17% | Parameter files, validation and policy as code; Sign in with OIDC, scope the deploy role and test rollback |

## Cost

Exam $300 · one-off $0 · monthly ceiling $20 · tasks $0.12

| Item | Kind | Cost | Note |
| --- | --- | --- | --- |
| AWS account, pay-as-you-go | cloud | $0 / month (approx.) | The inherited environment, deployed from the template for the drills and deleted after. |
| A dev and a prod stack of the environment (weeks 1, 2, 3, 4) | cloud | $0.05 / hour (approx.) | Two copies of the fleet and the database while a pipeline run or a drill is in flight. |
| GitHub Actions | software | $0 / month | Free minutes on a public or small private repository cover the course. |
| Budget guardrail | cloud | $20 / month (approx.) | The cap the course sets; a forgotten prod stack is the way to exceed it. |

| Task | Runs for | Cost | Note |
| --- | --- | --- | --- |
| Fill the starter and deploy to dev | 55 min | $0.02 | The dev stack’s balancer while the stack exists; deleted inside the task. |
| Build the staged pipeline | 55 min | $0.02 | The dev stack’s balancer between the run and the delete. |
| Blue/green the fleet with weighted target groups | 60 min | $0.05 | Up to three billed t3.micro and the balancer while blue and green run together; both parked at the end. |
| Rebuild from the template and automate the restart | 55 min | $0.02 | The recovery stack’s balancer while it exists; deleted inside the task. |

