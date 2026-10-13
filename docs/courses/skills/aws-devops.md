# AWS DevOps Engineer Capstone — skills sheet

16 graded tasks · 16 skills · 12 tools · 10 procedures · 3 standards (5 controls cited) · 0 tactics · 26 practices

Generated from the registries and the course document by `npm run content:export`; edit `src/lib/docs/skills.ts`, `tools.ts`, `standards.ts`, `sops.ts`, `tactics.ts` or the seed, not this file.

## Skills

| Skill | Area | Anchored to | Practised by |
| --- | --- | --- | --- |
| Map a template and write an ADR `comp.cloud.template-map` | Cloud services | AZ-400.d1, DOP-C02.d2, ISO42010 | Map the template and set the environment strategy |
| Inventory with the CLI and detect drift `comp.cloud.inventory-and-drift` | Cloud services | AZ-400.d3, DOP-C02.d2, WAF.operational-excellence | Inventory with the CLI and detect drift |
| Preview and deploy from a template `comp.cloud.deploy-from-template` | Cloud services | AZ-400.d3, DOP-C02.d2 | Fill the starter and deploy to dev |
| Validate templates and enforce policy as code `comp.cloud.policy-as-code` | Cloud services | AZ-400.d4, DOP-C02.d6, WAF.security | Parameter files, validation and policy as code |
| Write a change request with gates `comp.cloud.change-request-and-gates` | Cloud services | AZ-400.d1, DOP-C02.d1, ITIL.change | Write the change request and the gates |
| Protect main and require checks `comp.cloud.branch-protection` | Cloud services | AZ-400.d2, DOP-C02.d1, NIST_800_218 | Protect main, add the environments and require the checks |
| Build a staged pipeline with approval `comp.cloud.staged-pipeline` | Cloud services | AZ-400.d3, DOP-C02.d1, NIST_800_218 | Build the staged pipeline |
| Deploy with a federated identity, no secret `comp.cloud.oidc-deploy-identity` | Cloud services | AZ-400.d4, DOP-C02.d6, NIST_800_63 | Sign in with OIDC, scope the deploy role and test rollback |
| Review cost by service and set SLOs `comp.cloud.cost-by-service-and-slos` | Cloud services | AZ-400.d5, DOP-C02.d4, WAF.cost | Review cost by service and set the service levels |
| Cut over blue-green with no failed request `comp.cloud.blue-green` | Cloud services | AZ-400.d3, DOP-C02.d3, WAF.operational-excellence | Blue/green the fleet with weighted target groups |
| Canary a release behind a metric `comp.cloud.canary` | Cloud services | AZ-400.d3, DOP-C02.d3, WAF.operational-excellence | Canary the counter with alias weights and an alarm |
| Dashboard the SLIs and enforce a tag `comp.cloud.dashboard-and-compliance` | Cloud services | AZ-400.d5, DOP-C02.d4, WAF.security | Build the dashboard, require the tag with Config and read the audit trail |
| Assemble a handover package with risks `comp.cloud.handover-package` | Cloud services | AZ-400.d1, DOP-C02.d5, ITIL.transition | Assemble the handover package |
| Rebuild from the template and automate a restart `comp.cloud.rebuild-and-automate` | Cloud services | AZ-400.d3, DOP-C02.d3, NIST.800-53.CP-4 | Rebuild from the template and automate the restart |
| Recover an app failure through CI `comp.cloud.fix-through-ci` | Cloud services | AZ-400.d3, DOP-C02.d5 | Fix an app failure through CI |
| Contain a cloud incident and write a post-mortem `comp.cloud.contain-and-post-mortem` | Cloud services | AZ-400.d4, DOP-C02.d5, NIST.800-61.POST | Contain a security incident and write the post-mortem |

## Tools

| Tool | Kind | Used by |
| --- | --- | --- |
| Linux shell | cli | Inventory with the CLI and detect drift; Fill the starter and deploy to dev; Parameter files, validation and policy as code; Build the staged pipeline; Blue/green the fleet with weighted target groups; Canary the counter with alias weights and an alarm; Build the dashboard, require the tag with Config and read the audit trail; Rebuild from the template and automate the restart; Fix an app failure through CI; Contain a security incident and write the post-mortem |
| curl | cli | Parameter files, validation and policy as code; Fix an app failure through CI |
| Capstone forms | document | Map the template and set the environment strategy; Inventory with the CLI and detect drift; Fill the starter and deploy to dev; Parameter files, validation and policy as code; Write the change request and the gates; Protect main, add the environments and require the checks; Build the staged pipeline; Sign in with OIDC, scope the deploy role and test rollback; Review cost by service and set the service levels; Blue/green the fleet with weighted target groups; Canary the counter with alias weights and an alarm; Build the dashboard, require the tag with Config and read the audit trail; Assemble the handover package; Rebuild from the template and automate the restart; Fix an app failure through CI; Contain a security incident and write the post-mortem |
| Capstone guide | document | Map the template and set the environment strategy; Fill the starter and deploy to dev |
| Git | cli | Parameter files, validation and policy as code |
| GitHub | service | Write the change request and the gates; Protect main, add the environments and require the checks; Build the staged pipeline; Sign in with OIDC, scope the deploy role and test rollback; Fix an app failure through CI |
| GitHub Actions | service | Build the staged pipeline |
| Python | language | Parameter files, validation and policy as code |
| CloudFormation | language | Parameter files, validation and policy as code |
| AWS console | portal | Inventory with the CLI and detect drift; Fill the starter and deploy to dev; Parameter files, validation and policy as code; Build the staged pipeline; Sign in with OIDC, scope the deploy role and test rollback; Review cost by service and set the service levels; Blue/green the fleet with weighted target groups; Canary the counter with alias weights and an alarm; Build the dashboard, require the tag with Config and read the audit trail; Rebuild from the template and automate the restart; Fix an app failure through CI; Contain a security incident and write the post-mortem |
| AWS CloudShell | portal | Inventory with the CLI and detect drift; Fill the starter and deploy to dev; Parameter files, validation and policy as code; Build the staged pipeline; Sign in with OIDC, scope the deploy role and test rollback; Review cost by service and set the service levels; Blue/green the fleet with weighted target groups; Canary the counter with alias weights and an alarm; Build the dashboard, require the tag with Config and read the audit trail; Rebuild from the template and automate the restart; Fix an app failure through CI; Contain a security incident and write the post-mortem |
| AWS CLI | cli | Inventory with the CLI and detect drift; Fill the starter and deploy to dev; Parameter files, validation and policy as code; Build the staged pipeline; Sign in with OIDC, scope the deploy role and test rollback; Review cost by service and set the service levels; Blue/green the fleet with weighted target groups; Canary the counter with alias weights and an alarm; Build the dashboard, require the tag with Config and read the audit trail; Rebuild from the template and automate the restart; Fix an app failure through CI; Contain a security incident and write the post-mortem |

## Procedures

Runbooks and standard operating procedures the forms are instances of, and the tasks that execute them.

| Procedure | Kind | Standards | Forms | Executed by |
| --- | --- | --- | --- | --- |
| Incident record | incident | NIST.800-61.DETECT, ISO27001.A.5.26, NIST.CSF.RS.AN | — | Contain a security incident and write the post-mortem |
| Change record | change | ITIL.change, ISO27001.A.8.32, NIST.800-53.CM-3, SOC2.CC8.1 | Change Request & Release Record | Write the change request and the gates |
| Release record | release | ITIL.release, NIST.800-218, SOC2.CC8.1 | Change Request & Release Record | Blue/green the fleet with weighted target groups; Canary the counter with alias weights and an alarm |
| Recovery drill | recovery | NIST.800-34, NIST.CSF.RC.RP, ISO27001.A.5.30, NIST.800-53.CP-4 | — | Rebuild from the template and automate the restart |
| Operational handover | handover | ITIL.transition, ISO27001.A.5.37, ITIL.knowledge | Operational Handover Package | Assemble the handover package |
| Risk register | risk | NIST.800-30, ISO27005, ISO27001.6.1.2, NIST.CSF.GV.RM | Operational Handover Package | — |
| Cost review | governance | WAF.cost | Governance, Security & Cost Report | — |
| Governance report | governance | NIST.CSF.GV, ISO27001.9.3 | Governance, Security & Cost Report | — |
| Build record | build | ITIL.configuration, NIST.800-53.CM-2, ISO27001.A.8.9 | IaC Design & Deployment Record | — |
| Pipeline record | build | NIST.800-218, WAF.operational-excellence, ITIL.deployment | IaC Design & Deployment Record | Fill the starter and deploy to dev; Build the staged pipeline |

## Standards

| Standard | Tagged on tasks | Cited by forms |
| --- | --- | --- |
| ITIL 4 | — | Change Request & Release Record; Operational Handover Package |
| AWS DOP-C02 | Map the template and set the environment strategy; Inventory with the CLI and detect drift; Fill the starter and deploy to dev; Parameter files, validation and policy as code; Write the change request and the gates; Protect main, add the environments and require the checks; Build the staged pipeline; Sign in with OIDC, scope the deploy role and test rollback; Review cost by service and set the service levels; Blue/green the fleet with weighted target groups; Canary the counter with alias weights and an alarm; Build the dashboard, require the tag with Config and read the audit trail; Assemble the handover package; Rebuild from the template and automate the restart; Fix an app failure through CI; Contain a security incident and write the post-mortem | — |
| Well-Architected | Map the template and set the environment strategy; Inventory with the CLI and detect drift; Fill the starter and deploy to dev; Parameter files, validation and policy as code; Write the change request and the gates; Protect main, add the environments and require the checks; Build the staged pipeline; Sign in with OIDC, scope the deploy role and test rollback; Review cost by service and set the service levels; Blue/green the fleet with weighted target groups; Canary the counter with alias weights and an alarm; Build the dashboard, require the tag with Config and read the audit trail; Assemble the handover package; Rebuild from the template and automate the restart; Fix an app failure through CI; Contain a security incident and write the post-mortem | IaC Design & Deployment Record; Governance, Security & Cost Report |

| Control cited | Standard | By |
| --- | --- | --- |
| ITIL.change Change enablement | ITIL | Change Request & Release Record |
| ITIL.transition Service transition | ITIL | Operational Handover Package |
| WAF.security Security pillar | WAF | Governance, Security & Cost Report |
| WAF.cost Cost optimisation pillar | WAF | Governance, Security & Cost Report |
| WAF.operational-excellence Operational excellence pillar | WAF | IaC Design & Deployment Record |

## Tactics and practices

Adversary tactics are not part of this course.

| Practice | Anchor | Asked for by |
| --- | --- | --- |
| Least privilege | NIST.800-53.AC-6 | Sign in with OIDC, scope the deploy role and test rollback |
| Federated identity | NIST_800_63 | Sign in with OIDC, scope the deploy role and test rollback |
| Secrets in a store | NIST.800-53.IA-5 | Parameter files, validation and policy as code |
| Separation of duties | NIST.800-53.AC-5 | Protect main, add the environments and require the checks |
| Likelihood-times-impact scoring | NIST_800_30 | Assemble the handover package |
| Change control | ITIL.change | Fill the starter and deploy to dev; Write the change request and the gates |
| Rollback plan | ITIL.change | Write the change request and the gates; Sign in with OIDC, scope the deploy role and test rollback |
| Infrastructure as code | WAF.operational-excellence | Map the template and set the environment strategy; Fill the starter and deploy to dev; Build the staged pipeline |
| Drift detection | WAF.operational-excellence | Inventory with the CLI and detect drift; Fix an app failure through CI |
| Rebuild, do not repair | WAF.reliability | Rebuild from the template and automate the restart |
| Reproducible builds | NIST_800_218 | Rebuild from the template and automate the restart |
| Blue-green deployment | WAF.operational-excellence | Blue/green the fleet with weighted target groups |
| Canary release | WAF.operational-excellence | Canary the counter with alias weights and an alarm |
| Automated rollback | WAF.reliability | Fix an app failure through CI |
| Pipeline gates | NIST_800_218 | Protect main, add the environments and require the checks; Build the staged pipeline |
| Policy as code | WAF.security | Parameter files, validation and policy as code; Build the dashboard, require the tag with Config and read the audit trail |
| Naming and tagging | WAF.cost | Inventory with the CLI and detect drift |
| Right-sizing | WAF.cost | Review cost by service and set the service levels |
| Health checks | WAF.reliability | Blue/green the fleet with weighted target groups; Canary the counter with alias weights and an alarm |
| Contain before analysing | NIST.800-61.CONTAIN | Contain a security incident and write the post-mortem |
| Evidence-backed timeline | NIST.800-61.DETECT | Contain a security incident and write the post-mortem |
| Lessons learned | NIST.800-61.POST | Contain a security incident and write the post-mortem |
| Written runbooks | ISO27001.A.5.37 | Rebuild from the template and automate the restart |
| As-built documentation | ITIL.transition | Assemble the handover package |
| Architecture decision records | ISO_42010 | Map the template and set the environment strategy |
| Metrics with targets | ISO27001.9.1 | Review cost by service and set the service levels; Build the dashboard, require the tag with Config and read the audit trail |

