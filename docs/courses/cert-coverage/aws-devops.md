# AWS DevOps Engineer Capstone — certification and cost sheet

**AWS DevOps Engineer – Professional (DOP-C02)** · Professional · exam fee $300 (list price, 2026)

Generated from the certification registry and the course document by `npm run content:export`; edit `src/lib/docs/certs.ts`, `src/lib/docs/costs.ts` or the seed, not this file.

## The ladder

Cloud Practitioner (CLF-C02) → Solutions Architect – Associate (SAA-C03) → **DevOps Engineer – Professional (DOP-C02)**

## Exam coverage — 0% of the exam weight is practised

| Domain | Weight | Practised by |
| --- | --- | --- |
| SDLC Automation | 22% | — not practised in this course |
| Configuration Management and IaC | 17% | — not practised in this course |
| Resilient Cloud Solutions | 15% | — not practised in this course |
| Monitoring and Logging | 15% | — not practised in this course |
| Incident and Event Response | 14% | — not practised in this course |
| Security and Compliance | 17% | — not practised in this course |

Graded tasks that name no domain: aws-w9-arch, aws-w9-infra, aws-w9-dev, aws-w9-secops, aws-w10-arch, aws-w10-infra, aws-w10-dev, aws-w10-secops, aws-w11-arch, aws-w11-infra, aws-w11-dev, aws-w11-secops, aws-w12-arch, aws-w12-infra, aws-w12-dev, aws-w12-secops.

## Cost

Exam $300 · one-off $0 · monthly ceiling $20 · tasks $0

| Item | Kind | Cost | Note |
| --- | --- | --- | --- |
| AWS account, pay-as-you-go | cloud | $0 / month (approx.) | The inherited environment, deployed from the template for the drills and deleted after. |
| A dev and a prod stack of the environment (weeks 1, 2, 3, 4) | cloud | $0.05 / hour (approx.) | Two copies of the fleet and the database while a pipeline run or a drill is in flight. |
| GitHub Actions | software | $0 / month | Free minutes on a public or small private repository cover the course. |
| Budget guardrail | cloud | $20 / month (approx.) | The cap the course sets; a forgotten prod stack is the way to exceed it. |

