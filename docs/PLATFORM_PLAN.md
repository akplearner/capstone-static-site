# Capstone Quarry Platform Plan

As of 2026-09-18.

The platform becomes three products on one content model: a certification capstone, a business training environment, and an MSP build kit. Every one of them renders the same documents. The work is to finish the document model, then add the capabilities each product needs on top of it.

## Where the platform stands

Four courses, 634 guards, and one content export that now covers the whole model. The Server+ course is the most complete: 219 base-build commands written once, each with the machine it runs on, a sample of what it prints and a backup marker, rendered into the course, the guide, the topology diagrams and the host's firewall file from one topology model.

What the last three rounds proved is that the pattern works. Every address, port and rule lives in one module; every surface derives from it; a guard fails when anything is restated by hand. That is the discipline the whole platform needs, and it exists today in one course.

The one structural gap is that commands are still literal text. `ping -c 4 172.16.0.1` is a string, not a reference to the DMZ gateway. A business on a different subnet cannot reuse a single procedure until that changes. Everything in this plan that says "instantiate" or "generate" depends on fixing it first.

| Surface | State | In the export |
| --- | --- | --- |
| Courses, weeks, tasks, steps | Present, 4 courses | Yes |
| Deliverable forms | Present, 8 to 14 per course | Yes |
| Guide procedures and command registry | Present, Server+ only | Yes |
| Topology model | Present, Server+ and SOC lab | Yes, computed |
| Glossary, lab fields, tool choice, marking | Present | Yes, since R73 |
| Diagrams | 6 hold their data inside the component | No |
| Troubleshooting manual, tool manuals, lab specs | Prose inside components, about 3,000 words | No |
| Cert objectives, controls | Absent as entities | No |
| Environment as code | Absent; the firewall file is the one generated artifact | No |

## Pillar 1: a high-quality capstone

The jump from a good course to a credible credential is proof that the student built the thing, not that they ticked the box. Five additions deliver that.

**Validators that read real state.** Today a step is verified by pasting terminal output and matching tokens. The next level is a small collector script the student runs on each machine. It gathers addresses, routes, the firewall file, service states and file hashes into one JSON, which the student uploads. Validators then assert against that JSON: three DNAT rules exist, port 22 is not published into the private zone, NGINX is active on websrv. Pass or fail with the evidence attached, mapped to the control it satisfies. The existing DoD check is the right shape; it needs to read state instead of form text.

**Commands proven in CI.** Students reported commands that did not work, and two were found this week by writing their sample output. A nightly job that runs every bash command from the registry against a Debian container, and every PowerShell line against a Windows runner, turns that from a review into a test. Commands that need the real topology are tagged and run against a small Proxmox test host when one exists.

**Cert-objective coverage.** Every task and procedure tagged with the exam objectives it exercises, from the published objective lists. A student sees which objectives they have proven, an instructor sees the cohort's gaps, and the platform recommends the task that closes one. This is the entity the roadmap calls Competency and CertObjective, and it is what makes a business instance still count toward a certification.

**Instructor marking with evidence.** The cohort dashboard exists. Add rubric-assisted marking where each rubric line links to the validator result or the evidence hash that proves it, a generated grade sheet, and duplicate-evidence detection: two teams submitting the same file hash is already detectable because hashes are stored.

**A remediation path.** A failed validator names the procedure that fixes it and opens the guide there. A student who cannot get past a check is never stuck without a next step.

| Addition | Builds on | New entity |
| --- | --- | --- |
| State-reading validators | DoD checks, the evidence ledger | Validator, Collector |
| Commands in CI | The command registry | none |
| Objective coverage | Task frameworks tags | CertObjective, Competency |
| Marking with evidence | Cohort dashboard, rubric | none |
| Remediation | guideRef, fixes rows | none |

## Pillar 2: business training

A company uses the platform to train its own staff on its own environment. That is the same content model with a different topology, a different framing and a different audience. Six additions make it a product.

**Template plus overlay.** A course is a template. A business instance is an overlay document that changes the addressing, adds or renames machines, chooses which procedures are in scope and adds its own. A pure function resolves the two into the document the UI already renders. Nothing in the UI knows the difference. This is the prerequisite for everything below.

**Runbook mode.** A business does not want weeks and gates. It wants the same procedures as a searchable SOP library with the topology diagram beside each one, the machine chip on each command, and the sample output. The guide page is already most of this; runbook mode is the guide without the curriculum chrome, plus a change record on each run.

**Compliance evidence packs.** The deliverables, the evidence ledger with its hashes and the chain-of-custody log already form an audit trail. Tag each procedure with the controls it satisfies, from NIST CSF, CIS and ISO 27001, and the platform can export an audit pack: control, the procedure that implements it, the validator result, the evidence hash and who ran it. OSCAL is the format auditors' tools read, and the roadmap already names it.

**Change management as data.** Week 4 has students write change rows in a form. Make the change record an entity: what changed, on which machine, the backup taken, who approved, the rollback. The backup guard added in R72 is the first half of this.

**Tenancy, SSO and LMS.** A tenant column on every row with row-level security, OIDC sign-in for the company directory, LTI launch so the platform sits inside their LMS, and xAPI events so completions land in their records. All four are roadmap items 6 and 9 and all are additive to the Supabase layer.

**Role tracks.** The role model exists. A business assigns a track per job: the network technician sees the network procedures and their validators, the help desk sees the account and access procedures. Same documents, filtered by role.

| Addition | Builds on | New entity |
| --- | --- | --- |
| Template plus overlay | The DTO, the topology model, the lab-access fill | Business, Instance |
| Runbook mode | The guide page | none |
| Evidence packs | Deliverables, ledger, custody log | Control |
| Change records | Week 4 change rows, backup markers | ChangeRecord |
| Tenancy, SSO, LMS | Supabase RLS, OIDC | tenant_id, Event |
| Role tracks | Roles, role deliverables | none |

## Pillar 3: MSP building

Week 6 already teaches the MSP shape: sixteen client environments run from one Core node with Git, Terraform, Ansible, monitoring and a SIEM. The platform becomes the console that story describes. The topology document is the client's inventory, the procedures are the client's runbooks, and the same document renders to code.

**The document renders to Terraform and Ansible.** The host's firewall file is already generated from the topology model. Extend that to the whole environment: the resolved topology document renders a Terraform module for the Proxmox VMs and bridges, an Ansible inventory keyed by machine role, and playbooks assembled from the procedures' command steps. The student, or the technician, reads the guide and applies the code, and both came from one source. This is roadmap item 5, environments as code, and it is the feature that makes a business instance deployable rather than only describable.

**Client instances.** Each client is a Business overlay on a template. The onboarding wizard is the overlay editor: name, addressing, machines, which service lines they bought, which procedures apply. Save it and the client has a guide, a diagram, an inventory and a code module.

**Fleet dashboard.** The instructor cohort view already shows many teams from one screen. Generalise it: many clients, each with their validators' last results, open change records and evidence coverage. That is the MSP's morning screen.

**Monitoring as evidence.** Weeks 5 and 6 stand up Prometheus, Loki and Wazuh. Ingest their alerts and check results as validator inputs: a service that Prometheus reports up is a validator that passes without anyone pasting anything. The collector script from pillar 1 is the manual version; this is the continuous one.

**Service catalogue and tickets.** GLPI and NetBox are taught in Week 5. Read from and write to them: the topology document exports as NetBox inventory, a failed validator opens a GLPI ticket that links to the remediation procedure. Service lines and their SLAs become attributes of the Business overlay.

**Agents as actors.** The roadmap already reserves an actor type for agents. A scheduled agent that runs the collector, evaluates validators and files the change record is the first one. Its actions land in the same event log as a human's, attributed as an agent.

| Addition | Builds on | New entity |
| --- | --- | --- |
| Render to Terraform and Ansible | hostRulesFile, Week 5 and 6 IaC content | Environment |
| Client instances | Template plus overlay | Client, ServiceLine |
| Fleet dashboard | Instructor cohort view | none |
| Monitoring as evidence | Validators, Week 5 monitoring stack | Signal |
| Catalogue and tickets | NetBox and GLPI procedures | Integration |
| Agent actors | actor.type in the roadmap | Agent |

## Foundations every pillar rests on

Six pieces of plumbing are shared by all three products. None is visible to a student, and every pillar stalls without them.

**Templated commands.** Commands reference topology symbols and render at load. The registry is keyed by the template, not the rendered text, and the address guard inverts: a literal address inside any procedure fails the build. Without this there is no overlay, no instance and no generated code.

**Loadable documents.** The export is a snapshot today. A loader with a round-trip test, where rendering from the JSON equals rendering from the TypeScript, is what proves the UI is separate from the content. After that the content can live in a database and the UI does not know.

**No functions in the documents.** Definition-of-Done checks export as function markers. A small declarative predicate vocabulary replaces them, so a document is only data and an editor can hold all of it.

**Content out of components.** Roughly 3,000 words of instructional prose and 110 structured rows live inside React components: six diagrams' data tables, the troubleshooting manual, the tool manuals, the lab specs, the manual's section blurbs. Each moves to a data module and into the export. The list is in the R73 audit.

**Content pipeline.** Documents in a `content_documents` table keyed by kind, tenant, parent and version. A form-based editor over the document schema for instructors. Review and publish states. Schema versions with migrations, because a document written for schema 1 must still load under schema 3.

**Event log, evidence storage, consent.** Roadmap items 2, 7 and 8. An append-only event table that every completion, validator result and change record writes to, shaped so xAPI export is a projection. Object storage for evidence files keyed by their hash, since the hashes are already recorded. Consent and provenance fields on every row that holds a person's work, built now because they are brutal to retrofit.

| Foundation | Unblocks | Roadmap item |
| --- | --- | --- |
| Templated commands | Overlay, instance, generated code | 5 |
| Loadable documents | Database-backed content, editor | new |
| Declarative predicates | Complete documents, editor | 4 |
| Content out of components | Complete export, diagrams per instance | new |
| Content pipeline | Authoring by instructors, versioning | new |
| Event log, storage, consent | xAPI, audit packs, LMS, agents | 2, 7, 8 |

## Phased roadmap

**Phase 1 is done (R74–R75).** Commands are authored against topology symbols and the address guard is
inverted; `content/courses/*.json` loads back through `content/load.ts` and is what the app renders from,
with the compiled modules as a loud fallback; the 128 function markers are zero, because Definition-of-Done
checks and computed columns are a declarative predicate vocabulary (`docs/predicate.ts`) proven equivalent
to the functions they replaced over a generated corpus; and the reference content is out of the components
in five data modules, carried in the document's `content` section. Phase 2 — splitting Topology, Procedures
and Curriculum into separate documents with a business overlay — is where to start next.

Five phases, each shippable on its own and each unlocking the next. Phases 1 and 2 are foundations and change nothing a student sees. Phase 3 is where the capstone visibly improves. Phases 4 and 5 are the business and MSP products.

| Phase | Ships | Unlocks | Depends on |
| --- | --- | --- | --- |
| 1. Complete the documents | Templated commands with the inverted address guard; loadable DTO with a round-trip test; declarative predicates replacing function markers; diagram data and component prose moved to data modules | A document that is only data and holds everything the UI renders | Nothing; this is where to start |
| 2. Split and store | Topology, Procedures and Curriculum as separate documents; the Business overlay and the resolve function with tests; the content_documents table; courseRepo reading from it; tenant column and RLS | Instances; database-backed content; more than one tenant | Phase 1 |
| 3. Prove the build | The collector script and state-reading validators; commands run in CI against containers; cert objectives and controls as entities, procedures tagged; rubric marking with evidence; remediation links | A credential backed by proof; coverage reporting; instructor time back | Phase 1 for predicates, phase 2 for tagging |
| 4. Business training | Overlay editor; runbook mode; change records; evidence pack export in OSCAL; OIDC, LTI and xAPI; role tracks | Selling training on a company's own environment | Phases 2 and 3 |
| 5. MSP console | Render to Terraform and Ansible; client onboarding; fleet dashboard; monitoring as validator input; NetBox and GLPI integration; the first scheduled agent | Deploying and running client environments from the same documents that teach them | Phases 2, 3 and 4 |

The order inside phase 1 matters. Templated commands come first because every later phase reads through them, and the cost of leaving commands as literal text grows with every command added.

## Decisions to make first

Four choices shape phases 1 and 2, and each is yours rather than a technical default.

- [ ] **Authoring format.** Keep TypeScript as the authoring form until an editor exists, with JSON as the stored form. Or move to YAML now for hand-editing by instructors, at the cost of the compile-time checks the seeds get today. Recommendation: TypeScript until the editor, because 634 guards run against it.
- [ ] **Where instances live.** Supabase with a tenant column, which the roadmap already assumes. Or a separate content service, if the business and MSP products will be sold to companies that cannot use your Supabase project.
- [ ] **How far the code generation goes.** Terraform and Ansible only, matching what Weeks 5 and 6 teach. Or also the Proxmox API directly, so a client environment can be created from the platform without a student running anything.
- [ ] **The first business pilot.** One real business overlay built by hand, before the editor, proves the template model and finds what the overlay schema is missing. Pick the business now.
