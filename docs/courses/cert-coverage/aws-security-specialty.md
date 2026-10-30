# AWS Security Specialty — the Secure Workload — certification and cost sheet

**AWS Security – Specialty (SCS-C03)** · Specialty · exam fee $300 (list price, 2026)

Generated from the certification registry and the course document by `npm run content:export`; edit `src/lib/docs/certs.ts`, `src/lib/docs/costs.ts` or the seed, not this file.

## The ladder

**Security – Specialty (SCS-C03)**

## Exam coverage — 100% of the exam weight is practised

| Domain | Weight | Practised by |
| --- | --- | --- |
| Identity and Access Management | 20% | Users, roles and MFA; Least privilege, proved on a denial |
| Infrastructure Security | 18% | The segmented network; Least-exposure security groups; Reach the host without opening SSH |
| Data Protection | 18% | A customer-managed key; The locked, encrypted bucket |
| Threat Detection | 16% | Read what detection found; Wire the detection alarm |
| Incident Response | 14% | Work the incident with the runbook |
| Security Foundations and Governance | 14% | The account governance baseline; Hand the baseline over |

## Cost

Exam $300 · one-off $0 · monthly ceiling $0 · tasks $0

| Item | Kind | Cost | Note |
| --- | --- | --- | --- |
| AWS free tier (IAM, VPC, KMS, S3, CloudTrail, CloudWatch) | cloud | $0 / month | Every proof runs on the free tier, with --dry-run where a change would cost, and resources are removed at the end. |
| The sample GuardDuty/CloudTrail findings shipped with the course | software | $0 | Detection is read from a provided JSON file with jq; no paid detection service is stood up. |

