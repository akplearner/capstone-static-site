# AWS Cloud Practitioner Capstone — skills sheet

16 graded tasks · 18 skills · 12 tools · 6 procedures · 4 standards (2 controls cited) · 0 tactics · 18 practices

Generated from the registries and the course document by `npm run content:export`; edit `src/lib/docs/skills.ts`, `tools.ts`, `standards.ts`, `sops.ts`, `tactics.ts` or the seed, not this file.

## Skills

| Skill | Area | Anchored to | Practised by |
| --- | --- | --- | --- |
| Write an incident report `comp.respond.incident-report` | Incident response | CS0-003.d3, AZ-900.d3, CLF-C02.d2, NIST.800-61 | Find who changed it in CloudTrail and write the incident record |
| Set a budget alert and a tag standard `comp.cloud.budget-and-tags` | Cloud services | AZ-900.d1, CLF-C02.d1, WAF.cost | Set the standard, the budget and the service model |
| State the shared-responsibility split `comp.cloud.shared-responsibility` | Cloud services | AZ-900.d1, CLF-C02.d1 | Set the standard, the budget and the service model |
| Create the network foundation: VNet or VPC `comp.cloud.network-foundation` | Cloud services | AZ-900.d2, CLF-C02.d3 | Create the VPC and public subnet |
| Open a team repository and board `comp.cloud.team-repo-and-board` | Cloud services | AZ-900.d3, CLF-C02.d3 | Open the team repository and board |
| Grant team access through groups and roles `comp.cloud.identity-and-groups` | Cloud services | AZ-900.d2, CLF-C02.d2, NIST.800-53.AC-2 | Add the team to the account and give them access |
| Estimate monthly cost and choose storage classes `comp.cloud.cost-estimate` | Cloud services | AZ-900.d3, CLF-C02.d4, WAF.cost | Estimate the cost and choose storage classes |
| Launch a free-tier VM and stop it `comp.cloud.launch-vm` | Cloud services | AZ-900.d2, CLF-C02.d3, WAF.cost | Launch the tools instance |
| Publish a static site over HTTPS `comp.cloud.static-site-https` | Cloud services | AZ-900.d2, CLF-C02.d3 | Publish the website with CloudFront |
| Allow SSH from one address only `comp.cloud.ssh-from-one-ip` | Cloud services | AZ-900.d2, CLF-C02.d2, NIST.800-53.SC-7 | Allow SSH from your IP only |
| Draw a request flow and who manages hops `comp.cloud.request-flow` | Cloud services | AZ-900.d1, CLF-C02.d1 | Draw the request flow and say who manages each hop |
| Create a managed NoSQL table and seed it `comp.cloud.managed-database` | Cloud services | AZ-900.d2, CLF-C02.d3 | Create the DynamoDB table |
| Build a serverless function and API `comp.cloud.serverless-api` | Cloud services | AZ-900.d2, CLF-C02.d3 | Build the counter Lambda and API |
| Grant read-only access to a group with MFA `comp.cloud.read-only-access` | Cloud services | AZ-900.d2, CLF-C02.d2, NIST.800-53.AC-6 | Give the team the right access |
| Report spend and read the advisor `comp.cloud.cost-report` | Cloud services | AZ-900.d3, CLF-C02.d4, WAF.cost | Report the cost, and read Trusted Advisor and the support plans |
| Alert on function errors to the team `comp.cloud.error-alert` | Cloud services | AZ-900.d3, CLF-C02.d3, NIST.CSF.DE.CM | Alarm on Lambda errors |
| Find a failure in logs and fix it `comp.cloud.read-logs` | Cloud services | AZ-900.d3, CLF-C02.d3 | Find a failure in CloudWatch Logs |
| Trace a change in the audit trail `comp.cloud.audit-trail` | Cloud services | AZ-900.d3, CLF-C02.d2, NIST.800-61.DETECT | Find who changed it in CloudTrail and write the incident record |

## Tools

| Tool | Kind | Used by |
| --- | --- | --- |
| Linux shell | cli | Set the standard, the budget and the service model; Create the VPC and public subnet; Add the team to the account and give them access; Launch the tools instance; Publish the website with CloudFront; Allow SSH from your IP only; Create the DynamoDB table; Build the counter Lambda and API; Give the team the right access; Find a failure in CloudWatch Logs |
| PowerShell | cli | Allow SSH from your IP only |
| curl | cli | Allow SSH from your IP only; Build the counter Lambda and API; Find a failure in CloudWatch Logs |
| Capstone forms | document | Set the standard, the budget and the service model; Create the VPC and public subnet; Open the team repository and board; Add the team to the account and give them access; Estimate the cost and choose storage classes; Launch the tools instance; Publish the website with CloudFront; Allow SSH from your IP only; Draw the request flow and say who manages each hop; Create the DynamoDB table; Build the counter Lambda and API; Give the team the right access; Report the cost, and read Trusted Advisor and the support plans; Alarm on Lambda errors; Find a failure in CloudWatch Logs; Find who changed it in CloudTrail and write the incident record |
| Capstone guide | document | Draw the request flow and say who manages each hop |
| Browser DevTools | app | Build the counter Lambda and API; Find a failure in CloudWatch Logs |
| Authenticator app | app | Add the team to the account and give them access |
| GitHub | service | Open the team repository and board |
| AWS console | portal | Set the standard, the budget and the service model; Create the VPC and public subnet; Add the team to the account and give them access; Launch the tools instance; Publish the website with CloudFront; Allow SSH from your IP only; Create the DynamoDB table; Build the counter Lambda and API; Give the team the right access; Report the cost, and read Trusted Advisor and the support plans; Alarm on Lambda errors; Find a failure in CloudWatch Logs; Find who changed it in CloudTrail and write the incident record |
| AWS CloudShell | portal | Set the standard, the budget and the service model; Create the VPC and public subnet; Add the team to the account and give them access; Launch the tools instance; Publish the website with CloudFront; Allow SSH from your IP only; Create the DynamoDB table; Build the counter Lambda and API; Give the team the right access; Report the cost, and read Trusted Advisor and the support plans; Alarm on Lambda errors; Find a failure in CloudWatch Logs; Find who changed it in CloudTrail and write the incident record |
| AWS CLI | cli | Set the standard, the budget and the service model; Create the VPC and public subnet; Add the team to the account and give them access; Launch the tools instance; Publish the website with CloudFront; Allow SSH from your IP only; Create the DynamoDB table; Build the counter Lambda and API; Give the team the right access; Report the cost, and read Trusted Advisor and the support plans; Alarm on Lambda errors; Find a failure in CloudWatch Logs; Find who changed it in CloudTrail and write the incident record |
| AWS Pricing Calculator | portal | Estimate the cost and choose storage classes |

## Procedures

Runbooks and standard operating procedures the forms are instances of, and the tasks that execute them.

| Procedure | Kind | Standards | Forms | Executed by |
| --- | --- | --- | --- | --- |
| Incident record | incident | NIST.800-61.DETECT, ISO27001.A.5.26, NIST.CSF.RS.AN | Monitoring & Incident Report | Find who changed it in CloudTrail and write the incident record |
| Security policy | policy | ISO27001.5.2, ISO27001.A.5.1, NIST.CSF.GV.PO, NIST.800-53.PM-1 | Cloud Foundation & Naming Standard | — |
| Monitoring plan | monitoring | NIST.CSF.DE.CM, ISO27001.A.8.16, SOC2.CC7.2, ITIL.monitoring | Monitoring & Incident Report | — |
| Cost review | governance | WAF.cost | Cloud Foundation & Naming Standard | Launch the tools instance |
| Architecture record | design | ISO42010, WAF, NIST.800-53.PL-8 | Solution Architecture Document | — |
| Requirements record | design | ISO42010, WAF | Application & API Design Specification | — |

## Standards

| Standard | Tagged on tasks | Cited by forms |
| --- | --- | --- |
| ITIL 4 | — | Monitoring & Incident Report |
| AWS CLF-C02 | Set the standard, the budget and the service model; Create the VPC and public subnet; Open the team repository and board; Add the team to the account and give them access; Estimate the cost and choose storage classes; Launch the tools instance; Publish the website with CloudFront; Allow SSH from your IP only; Draw the request flow and say who manages each hop; Create the DynamoDB table; Build the counter Lambda and API; Give the team the right access; Report the cost, and read Trusted Advisor and the support plans; Alarm on Lambda errors; Find a failure in CloudWatch Logs; Find who changed it in CloudTrail and write the incident record | — |
| Well-Architected | Set the standard, the budget and the service model; Create the VPC and public subnet; Open the team repository and board; Add the team to the account and give them access; Estimate the cost and choose storage classes; Launch the tools instance; Publish the website with CloudFront; Allow SSH from your IP only; Draw the request flow and say who manages each hop; Create the DynamoDB table; Build the counter Lambda and API; Give the team the right access; Report the cost, and read Trusted Advisor and the support plans; Alarm on Lambda errors; Find a failure in CloudWatch Logs; Find who changed it in CloudTrail and write the incident record | — |
| ISO/IEC/IEEE 42010 | — | Solution Architecture Document |

| Control cited | Standard | By |
| --- | --- | --- |
| ITIL.incident Incident management | ITIL | Monitoring & Incident Report |
| ISO42010 Architecture description | ISO_42010 | Solution Architecture Document |

Forms whose standard names a practice rather than a control:

- Cloud Foundation & Naming Standard: practice.naming-and-tagging
- Application & API Design Specification: practice.api-contract

## Tactics and practices

Adversary tactics are not part of this course.

| Practice | Anchor | Asked for by |
| --- | --- | --- |
| Least privilege | NIST.800-53.AC-6 | Add the team to the account and give them access; Allow SSH from your IP only; Give the team the right access |
| Default deny | NIST.800-53.SC-7 | Allow SSH from your IP only |
| Multi-factor authentication | NIST_800_63 | Add the team to the account and give them access; Give the team the right access |
| Secrets in a store | NIST.800-53.IA-5 | Build the counter Lambda and API |
| Encryption in transit | NIST.800-53.SC-8 | Publish the website with CloudFront |
| Interface contract | WAF.operational-excellence | Build the counter Lambda and API |
| Naming and tagging | WAF.cost | Set the standard, the budget and the service model |
| Budget guardrails | WAF.cost | Set the standard, the budget and the service model; Report the cost, and read Trusted Advisor and the support plans |
| Tear down after use | WAF.cost | Launch the tools instance |
| Right-sizing | WAF.cost | Estimate the cost and choose storage classes; Create the DynamoDB table; Report the cost, and read Trusted Advisor and the support plans |
| Centralised logging | NIST.CSF.DE.CM | Alarm on Lambda errors; Find a failure in CloudWatch Logs |
| Alert to ticket | ITIL.incident | Alarm on Lambda errors |
| Evidence-backed timeline | NIST.800-61.DETECT | Find who changed it in CloudTrail and write the incident record |
| Lessons learned | NIST.800-61.POST | Find who changed it in CloudTrail and write the incident record |
| Architecture decision records | ISO_42010 | Draw the request flow and say who manages each hop |
| Addressing plan | NIST.CSF.ID.AM | Create the VPC and public subnet |
| Structured troubleshooting | ITIL.problem | Find a failure in CloudWatch Logs |
| Work tracked on a board | ITIL.knowledge | Open the team repository and board |

