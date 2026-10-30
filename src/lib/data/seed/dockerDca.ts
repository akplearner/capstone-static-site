import type { Course, RoleDef, Step, Task, WeekDef } from '../../types';
import { withPortfolioStep } from '../../docs/portfolioPlan';
import { withAiExtensions } from '../../docs/aiExtension';
import { withModules } from '../modules';

/**
 * Docker Certified Associate — the Container Yard (DCA).
 *
 * A four-person team takes one small web app and ships it the way a platform
 * team would: build and tag an image from a Dockerfile, push it to a registry,
 * compose a multi-container stack, orchestrate it across a Swarm, wire the
 * container network, persist the data in volumes, work a connectivity fault the
 * method way, scan and harden the image, and hand it over with a runbook and a
 * custody row for every artifact.
 *
 * EVERYTHING RUNS ON A LAPTOP. Docker Engine and Compose are free; the registry
 * is a local one; the Swarm is a single-node swarm. Every proof step runs a real
 * `docker` command and pastes the output back; nothing is a slide.
 *
 * THE RULE THE COURSE TEACHES: build it small, run it least-privileged. Every
 * image is tagged, scanned and run as a non-root user before it is handed over,
 * and the Week 3 connectivity fault is worked one theory and one change per row,
 * exactly as A+ works a dead PC.
 *
 * ONE SHARED YARD, FOUR FOCUSES (`sharedTrack: true`, `noGatekeeping: true`).
 * Everyone runs every command on the team's app; the focus decides which record
 * a member leads and reviews. Week 0 is preparation (`setup: true`), never graded.
 */

const ROLES: RoleDef[] = [
  {
    id: 'images',
    name: 'Images (Build Lead)',
    mission: 'Leads the image record: the Dockerfile, the tags, the registry and the scan.',
    color: '#2563eb',
    icon: 'Boxes',
  },
  {
    id: 'stack',
    name: 'Orchestration (Stack Lead)',
    mission: 'Leads the stack record: Compose, the Swarm services, scaling and rollback.',
    color: '#15803d',
    icon: 'Layers',
  },
  {
    id: 'net',
    name: 'Networking & Storage (Platform Lead)',
    mission: 'Leads the network and volume record: the container networks, the ports and the data.',
    color: '#b45309',
    icon: 'Network',
  },
  {
    id: 'records',
    name: 'Operations (Records Lead)',
    mission: 'Leads the records that outlive the yard: hardening, the runbook, custody and handover.',
    color: '#7c3aed',
    icon: 'ClipboardList',
  },
];

const WEEKS: WeekDef[] = [
  {
    number: 0,
    title: 'Set up the yard',
    theme: 'Docker installed, proven, and the team',
    objective: 'Install Docker Engine and Compose, run the hello-world, pick your focus and make the yard folder.',
    runs: 'Week 0',
    setup: true,
    stage: 0,
    phase: 'Preparation',
    difficulty: 1,
    objectives: [
      { id: 'install-docker', label: 'Install Docker and Compose', tasks: ['dca-w0-install'] },
      { id: 'prove-it-runs', label: 'Prove the engine runs a container', tasks: ['dca-w0-verify'] },
      { id: 'know-the-team', label: 'Know your team, focus and folder', tasks: ['dca-w0-orient'] },
    ],
    milestone: 'Docker Engine and Compose report their versions, the hello-world container runs, and the yard folder names the team and the four focuses.',
  },
  {
    number: 1,
    title: 'Build the image',
    theme: 'A Dockerfile, a tag, a registry',
    objective: 'Write a Dockerfile, build and tag the image, push it to a registry, and configure the daemon.',
    runs: 'Week 1',
    stage: 1,
    phase: 'Build',
    difficulty: 2,
    objectives: [
      { id: 'build-and-tag', label: 'Build and tag the app image', tasks: ['dca-w1-build'] },
      { id: 'push-to-a-registry', label: 'Push it to a registry', tasks: ['dca-w1-registry'] },
      { id: 'configure-the-daemon', label: 'Configure the daemon and logging', tasks: ['dca-w1-config'] },
    ],
    milestone: 'The image builds from a Dockerfile, carries a semantic tag, pushes to and pulls from a registry, and the daemon logging and storage driver are recorded.',
  },
  {
    number: 2,
    title: 'Orchestrate the stack',
    theme: 'Compose, Swarm, scale and roll back',
    objective: 'Compose the multi-container stack, deploy it to a Swarm as services, scale it, and roll a bad update back.',
    runs: 'Week 2',
    stage: 2,
    phase: 'Orchestrate',
    difficulty: 3,
    objectives: [
      { id: 'compose-the-stack', label: 'Compose the multi-container stack', tasks: ['dca-w2-compose'] },
      { id: 'deploy-to-a-swarm', label: 'Deploy it to a Swarm', tasks: ['dca-w2-swarm'] },
      { id: 'scale-and-roll-back', label: 'Scale it, and roll a bad update back', tasks: ['dca-w2-scale'] },
    ],
    milestone: 'The stack comes up with Compose, runs as Swarm services across replicas, scales on command, and a bad update is rolled back to the working tag.',
  },
  {
    number: 3,
    title: 'Network and persist',
    theme: 'Networks, ports, volumes — and one fault worked',
    objective: 'Wire the network and ports, persist the data in a volume, and work a connectivity fault the method way.',
    runs: 'Week 3',
    stage: 3,
    phase: 'Connect',
    difficulty: 3,
    objectives: [
      { id: 'wire-the-network', label: 'Wire the network and resolve by name', tasks: ['dca-w3-network'] },
      { id: 'persist-the-data', label: 'Persist the data in a volume', tasks: ['dca-w3-volumes'] },
      { id: 'work-a-connectivity-fault', label: 'Work a connectivity fault, one change per row', tasks: ['dca-w3-ports'] },
    ],
    milestone: 'Containers resolve each other by name on a user network, the database survives a container recreate on its volume, and one broken connection is fixed with the failed theories kept.',
  },
  {
    number: 4,
    title: 'Harden and hand over',
    theme: 'Scan it, lock it down, hand it over',
    objective: 'Scan the image, run it as a non-root user with secrets kept out, and hand the stack over with custody.',
    runs: 'Week 4',
    stage: 4,
    phase: 'Hand over',
    difficulty: 3,
    objectives: [
      { id: 'scan-the-image', label: 'Scan the image and read the findings', tasks: ['dca-w4-scan'] },
      { id: 'run-it-least-privileged', label: 'Run it least-privileged, secrets out', tasks: ['dca-w4-harden'] },
      { id: 'hand-it-over', label: 'Hand the stack over', tasks: ['dca-w4-handover'] },
    ],
    milestone: 'The image is scanned and its high findings are owned, it runs as a non-root user with no secret baked in, and the handover record hashes every artifact.',
  },
];

/** A form or desk step: no command, a described outcome. `whatItMeans` required. */
const note = (
  id: string,
  title: string,
  where: string,
  instruction: string,
  outcome: string,
  extra: Partial<Step> & { whatItMeans: string }
): Step => ({
  id,
  title,
  description: outcome.length > 110 ? `${outcome.slice(0, 107).trimEnd()}…` : outcome,
  where,
  instruction,
  expectedOutput: outcome,
  outputKind: 'result',
  frameworks: ['CIS'],
  ...extra,
});

/** A command step with pasted output and what proves it worked. */
const run = (
  id: string,
  title: string,
  where: string,
  instruction: string,
  commands: NonNullable<Step['commands']>,
  verify: string[],
  whatItMeans: string,
  extra: Partial<Step> = {}
): Step => ({
  id,
  title,
  description: title,
  where,
  instruction,
  commands,
  verify,
  outputKind: 'console',
  expectedOutput: commands.map((cmd) => cmd.sample).filter(Boolean).join('\n'),
  whatItMeans,
  frameworks: ['CIS'],
  ...extra,
});

const YARD = 'Your own machine — a terminal';

const TASKS: Task[] = [
  // ── Week 0 — Set up the yard ────────────────────────────────────────────────
  {
    id: 'dca-w0-install',
    role: 'images',
    shared: true,
    week: 0,
    title: 'Install Docker Engine and Compose',
    objective: 'Install Docker Engine and the Compose plugin, and confirm both report their versions.',
    frameworks: ['CIS'],
    deliverables: ['01_Install_and_Environment_Register.md'],
    estimatedTime: '30 min',
    difficulty: 1,
    learn: ['Docker Engine', 'Compose plugin', 'Client vs daemon', 'Rootless mode'],
    tools: ['Docker', 'Docker Compose'],
    definitionOfDone: [
      'docker version shows a client and a server',
      'docker compose version shows the plugin',
      'The install method and version are recorded',
    ],
    steps: [
      run(
        'dca-w0-install-s1',
        'Install Docker and read its version',
        YARD,
        'Install Docker Engine for your operating system from the official docs, then confirm the client and the daemon are both there.',
        [
          { cmd: 'docker version --format "{{.Client.Version}} / {{.Server.Version}}"', explain: 'Prints the client and server (daemon) versions; both must be present.', sample: '27.3.1 / 27.3.1' },
          { cmd: 'docker compose version', explain: 'Confirms the Compose v2 plugin is installed.', sample: 'Docker Compose version v2.29.7' },
        ],
        ['Compose version'],
        'The client talks to the daemon; a client with no server is the most common first fault. Both versions on one line prove the install.',
        {
          usesForm: 'Install & Environment Register',
          producesDeliverable: '01_Install_and_Environment_Register.md',
          outputHighlights: [{ text: 'Compose version', label: 'The Compose plugin is present.' }],
          fixes: [
            { symptom: 'docker says it cannot connect to the daemon?', fix: 'Start the Docker service (or Docker Desktop), and add your user to the docker group, then open a new terminal.' },
            { symptom: 'compose is not a docker command?', fix: 'Install the docker-compose-plugin package; Compose v2 is a plugin, not the old standalone binary.' },
          ],
        }
      ),
    ],
  },
  {
    id: 'dca-w0-verify',
    role: 'stack',
    shared: true,
    week: 0,
    title: 'Prove the engine runs a container',
    objective: 'Run the hello-world image and list it, so the engine is proven before any real work.',
    frameworks: ['CIS'],
    deliverables: ['01_Install_and_Environment_Register.md'],
    estimatedTime: '20 min',
    difficulty: 1,
    learn: ['Pulling an image', 'Running a container', 'Image vs container'],
    tools: ['Docker'],
    definitionOfDone: [
      'hello-world runs and prints its message',
      'The image is listed locally',
      'The run is recorded in the register',
    ],
    steps: [
      run(
        'dca-w0-verify-s1',
        'Run hello-world and list the image',
        YARD,
        'Run the hello-world container, then list the images now on the machine.',
        [
          { cmd: 'docker run --rm hello-world | grep -i "working"', explain: 'Pulls and runs the test image; the line proves the whole pull-run loop works.', sample: 'Hello from Docker! This message shows that your installation appears to be working correctly.' },
          { cmd: 'docker images --format "{{.Repository}}:{{.Tag}} {{.Size}}" | head', explain: 'Lists local images with their sizes.', sample: 'hello-world:latest 20.4kB' },
        ],
        ['working'],
        'If hello-world runs, the daemon can pull, create and run a container. Everything else is a bigger version of this.',
        {
          usesForm: 'Install & Environment Register',
          outputHighlights: [{ text: 'working', label: 'The pull-run loop works end to end.' }],
        }
      ),
    ],
  },
  {
    id: 'dca-w0-orient',
    role: 'records',
    shared: true,
    week: 0,
    title: 'Know your team, your focus and the folder',
    objective: 'Agree who leads which record, name the app, and make the yard folder every artifact goes in.',
    frameworks: ['CIS'],
    deliverables: ['01_Install_and_Environment_Register.md'],
    estimatedTime: '20 min',
    difficulty: 1,
    learn: ['Focus roles', 'Naming', 'Evidence folders'],
    tools: ['Docker'],
    definitionOfDone: [
      'Each of the four focuses has a named member',
      'The app has a name in the pattern yard-t<team>',
      'The yard folder exists with a week-0 to week-4 layout',
    ],
    steps: [
      note(
        'dca-w0-orient-s1',
        'Pick the focus and name the app',
        'Anywhere — a team decision',
        'Agree who leads Images, Orchestration, Networking & Storage and Operations. Name the app yard-t and your team number, and write both into the register.',
        'Four names against four focuses, and an app name the whole team uses from now on.',
        {
          usesForm: 'Install & Environment Register',
          whatItMeans: 'A focus is the record a member leads and reviews, not the only work they do. Everyone runs every command.',
        }
      ),
      run(
        'dca-w0-orient-s2',
        'Make the yard folder',
        YARD,
        'Create the yard folder with a subfolder for each week. Every Dockerfile, compose file and output goes under the week it belongs to.',
        [
          { cmd: 'mkdir -p yard-t1/week-{0,1,2,3,4} && ls yard-t1', explain: 'Five week folders in one command, then reads them back. Replace t1 with your team number.', sample: 'week-0  week-1  week-2  week-3  week-4' },
        ],
        ['week-0', 'week-4'],
        'An artifact nobody can find is an artifact nobody can hash. The folder is the first custody control.',
        {
          usesForm: 'Install & Environment Register',
          producesDeliverable: '01_Install_and_Environment_Register.md',
        }
      ),
    ],
  },

  // ── Week 1 — Build the image (d2 image, d3 config) ──────────────────────────
  {
    id: 'dca-w1-build',
    role: 'images',
    shared: true,
    week: 1,
    title: 'Build and tag the app image',
    objective: 'Write a Dockerfile for the app, build it, and tag it with a semantic version, not just latest.',
    frameworks: ['CIS'],
    deliverables: ['02_Image_Build_and_Registry_Record.md'],
    estimatedTime: '1 h',
    difficulty: 2,
    learn: ['Dockerfile', 'Layers and cache', 'Multi-stage build', 'Tagging'],
    tools: ['Docker'],
    definitionOfDone: [
      'The image builds from a Dockerfile with no error',
      'It carries a semantic tag as well as latest',
      'The image size and layer count are recorded',
    ],
    steps: [
      run(
        'dca-w1-build-s1',
        'Build the image from a Dockerfile',
        YARD,
        'Write a Dockerfile for the app, then build it and tag it with a version.',
        [
          { cmd: 'docker build -t yard-t1/app:1.0.0 -t yard-t1/app:latest . && docker images yard-t1/app', explain: 'Builds the image, applies two tags, and lists them.', sample: 'REPOSITORY    TAG      IMAGE ID       CREATED         SIZE\nyard-t1/app   1.0.0    a1b2c3d4e5f6   2 seconds ago   84MB\nyard-t1/app   latest   a1b2c3d4e5f6   2 seconds ago   84MB' },
        ],
        ['1.0.0'],
        'A semantic tag is what lets you roll back to a known build; latest alone is a build you can never name again.',
        {
          usesForm: 'Image Build & Registry Record',
          outputHighlights: [{ text: '1.0.0', label: 'The build is tagged with a version you can roll back to.' }],
          fixes: [
            { symptom: 'The build fails on a COPY line?', fix: 'The path is relative to the build context (the final dot). Check the file exists in the directory you built from.' },
            { symptom: 'Every build is slow?', fix: 'Order the Dockerfile so the least-changing layers come first; put COPY of source after dependency install so the cache holds.' },
          ],
        }
      ),
      run(
        'dca-w1-build-s2',
        'Shrink it with a multi-stage build',
        YARD,
        'Add a build stage and a slim runtime stage, rebuild, and compare the size.',
        [
          { cmd: 'docker build -t yard-t1/app:1.0.0 . && docker image inspect yard-t1/app:1.0.0 --format "{{.Size}} bytes, {{len .RootFS.Layers}} layers"', explain: 'Rebuilds with the multi-stage Dockerfile and prints the size and layer count.', sample: '84000000 bytes, 7 layers' },
        ],
        ['layers'],
        'A multi-stage build leaves the compiler and the source behind, so the image that ships is smaller and has less to attack.',
        {
          usesForm: 'Image Build & Registry Record',
          producesDeliverable: '02_Image_Build_and_Registry_Record.md',
        }
      ),
    ],
  },
  {
    id: 'dca-w1-registry',
    role: 'images',
    shared: true,
    week: 1,
    title: 'Push it to a registry',
    objective: 'Run a local registry, push the tagged image to it, and pull it back to prove the round trip.',
    frameworks: ['CIS'],
    deliverables: ['02_Image_Build_and_Registry_Record.md'],
    estimatedTime: '45 min',
    difficulty: 2,
    learn: ['Registries', 'Push and pull', 'Image digests', 'Tag vs digest'],
    tools: ['Docker'],
    prerequisites: ['The tagged app image from the build task'],
    definitionOfDone: [
      'A registry is running and the image is pushed to it',
      'The image pulls back by tag',
      'The pushed digest is recorded',
    ],
    steps: [
      run(
        'dca-w1-registry-s1',
        'Run a registry and push the image',
        YARD,
        'Start a local registry container, retag the image for it, and push.',
        [
          { cmd: 'docker run -d -p 5000:5000 --name registry registry:2 && docker tag yard-t1/app:1.0.0 localhost:5000/app:1.0.0 && docker push localhost:5000/app:1.0.0', explain: 'Starts a registry, retags the image for it, and pushes; the digest prints at the end.', sample: '1.0.0: digest: sha256:9f8e7d6c... size: 1365' },
        ],
        ['digest'],
        'A registry is how an image gets from the build machine to everywhere it runs; the digest is the one name that never changes.',
        {
          usesForm: 'Image Build & Registry Record',
          outputHighlights: [{ text: 'digest', label: 'The immutable name of what you pushed.' }],
          fixes: [{ symptom: 'push says connection refused?', fix: 'The registry container is not up; check `docker ps` and that port 5000 is published.' }],
        }
      ),
      run(
        'dca-w1-registry-s2',
        'Pull it back by tag',
        YARD,
        'Remove the local image and pull it back from the registry to prove the round trip.',
        [
          { cmd: 'docker rmi localhost:5000/app:1.0.0 && docker pull localhost:5000/app:1.0.0 | tail -1', explain: 'Deletes the local copy, then pulls it back from the registry.', sample: 'Status: Downloaded newer image for localhost:5000/app:1.0.0' },
        ],
        ['Downloaded'],
        'An image you cannot pull back is an image you have not really shipped. The round trip is the proof.',
        {
          usesForm: 'Image Build & Registry Record',
          producesDeliverable: '02_Image_Build_and_Registry_Record.md',
        }
      ),
    ],
  },
  {
    id: 'dca-w1-config',
    role: 'records',
    shared: true,
    week: 1,
    title: 'Configure the daemon and logging',
    objective: 'Read the daemon configuration — storage driver, logging driver, log limits — and record it.',
    frameworks: ['CIS'],
    deliverables: ['02_Image_Build_and_Registry_Record.md'],
    estimatedTime: '45 min',
    difficulty: 2,
    learn: ['daemon.json', 'Storage driver', 'Logging driver', 'Log rotation'],
    tools: ['Docker'],
    definitionOfDone: [
      'The storage and logging drivers are read from the daemon',
      'A log size limit is set so a container cannot fill the disk',
      'Both are recorded',
    ],
    steps: [
      run(
        'dca-w1-config-s1',
        'Read the daemon configuration',
        YARD,
        'Read the storage driver, the logging driver and the root directory from the daemon.',
        [
          { cmd: 'docker info --format "storage={{.Driver}} logging={{.LoggingDriver}} root={{.DockerRootDir}}"', explain: 'Prints the storage driver, logging driver and data root in one line.', sample: 'storage=overlay2 logging=json-file root=/var/lib/docker' },
        ],
        ['storage=', 'logging='],
        'The storage driver decides how layers are stored; the logging driver decides where container output goes. A team that knows both is not surprised by a full disk.',
        {
          usesForm: 'Image Build & Registry Record',
          outputHighlights: [{ text: 'logging=', label: 'Where container stdout/stderr is written.' }],
        }
      ),
      run(
        'dca-w1-config-s2',
        'Cap the log size so a container cannot fill the disk',
        YARD,
        'Run a container with a log size limit and confirm the limit is applied.',
        [
          { cmd: 'docker run -d --name capped --log-opt max-size=10m --log-opt max-file=3 yard-t1/app:1.0.0 && docker inspect capped --format "{{.HostConfig.LogConfig.Config}}"', explain: 'Runs with a rotated, size-capped log and reads the setting back.', sample: 'map[max-file:3 max-size:10m]' },
        ],
        ['max-size'],
        'An uncapped container log is the classic way a box runs out of disk at 3 a.m. Ten megabytes, three files, is a safe default.',
        {
          usesForm: 'Image Build & Registry Record',
          producesDeliverable: '02_Image_Build_and_Registry_Record.md',
        }
      ),
    ],
  },

  // ── Week 2 — Orchestrate the stack (d1 orchestration) ───────────────────────
  {
    id: 'dca-w2-compose',
    role: 'stack',
    shared: true,
    week: 2,
    title: 'Compose the multi-container stack',
    objective: 'Write a Compose file for the app and a database, bring the stack up, and confirm both services are healthy.',
    frameworks: ['CIS'],
    deliverables: ['03_Stack_and_Orchestration_Record.md'],
    estimatedTime: '1 h',
    difficulty: 3,
    learn: ['Compose file', 'Services', 'depends_on', 'Healthchecks'],
    tools: ['Docker', 'Docker Compose'],
    definitionOfDone: [
      'The Compose file defines the app and a database service',
      'The stack comes up and both services are running',
      'A healthcheck reports the app healthy',
    ],
    steps: [
      run(
        'dca-w2-compose-s1',
        'Bring the stack up with Compose',
        YARD,
        'Write a compose.yaml with the app and a database, then bring it up and list the services.',
        [
          { cmd: 'docker compose up -d && docker compose ps --format "{{.Service}} {{.State}} {{.Health}}"', explain: 'Starts the stack in the background and lists each service with its state and health.', sample: 'app running healthy\ndb running healthy' },
        ],
        ['running'],
        'Compose turns a page of docker run flags into one file the whole team edits and version-controls. The stack is now one command.',
        {
          usesForm: 'Stack & Orchestration Record',
          outputHighlights: [{ text: 'healthy', label: 'The healthcheck says the app is actually serving, not just started.' }],
          fixes: [{ symptom: 'The app starts before the database is ready?', fix: 'A depends_on with condition: service_healthy, plus a db healthcheck, makes the app wait for a ready database, not just a started one.' }],
        }
      ),
    ],
  },
  {
    id: 'dca-w2-swarm',
    role: 'stack',
    shared: true,
    week: 2,
    title: 'Deploy it to a Swarm',
    objective: 'Initialise a single-node Swarm, deploy the stack as services, and see the replicas scheduled.',
    frameworks: ['CIS'],
    deliverables: ['03_Stack_and_Orchestration_Record.md'],
    estimatedTime: '1 h',
    difficulty: 3,
    learn: ['Swarm mode', 'Services and tasks', 'Replicas', 'Stack deploy'],
    tools: ['Docker'],
    prerequisites: ['The Compose stack that comes up cleanly'],
    definitionOfDone: [
      'A Swarm is initialised and the node is a manager',
      'The stack is deployed as Swarm services',
      'The replicas show as running',
    ],
    steps: [
      run(
        'dca-w2-swarm-s1',
        'Init the Swarm and deploy the stack',
        YARD,
        'Initialise the Swarm, deploy the stack to it, and list the services with their replica counts.',
        [
          { cmd: 'docker swarm init 2>/dev/null; docker stack deploy -c compose.yaml yard && docker stack services yard --format "{{.Name}} {{.Replicas}}"', explain: 'Starts Swarm, deploys the stack as services, and shows replica counts.', sample: 'yard_app 2/2\nyard_db 1/1' },
        ],
        ['2/2'],
        'Swarm is Docker’s own orchestrator: a service is a desired number of identical tasks, and Swarm keeps that many running.',
        {
          usesForm: 'Stack & Orchestration Record',
          outputHighlights: [{ text: '2/2', label: 'Both requested replicas of the app are running.' }],
          fixes: [{ symptom: 'Replicas stay 0/2?', fix: 'Run `docker service ps yard_app --no-trunc` to read why a task will not schedule — usually an image the node cannot pull.' }],
        }
      ),
    ],
  },
  {
    id: 'dca-w2-scale',
    role: 'stack',
    shared: true,
    week: 2,
    title: 'Scale it, and roll a bad update back',
    objective: 'Scale the app service up, roll out a bad image, watch it fail, and roll back to the working tag.',
    frameworks: ['CIS'],
    deliverables: ['03_Stack_and_Orchestration_Record.md'],
    estimatedTime: '1 h',
    difficulty: 4,
    learn: ['Scaling', 'Rolling updates', 'Rollback', 'Update config'],
    tools: ['Docker'],
    prerequisites: ['The stack deployed as Swarm services'],
    definitionOfDone: [
      'The app service scales to more replicas',
      'A bad update is rolled out and then rolled back',
      'The rollback returns the service to the working tag',
    ],
    steps: [
      run(
        'dca-w2-scale-s1',
        'Scale the app up',
        YARD,
        'Scale the app service to four replicas and confirm the count.',
        [
          { cmd: 'docker service scale yard_app=4 && docker service ls --filter name=yard_app --format "{{.Name}} {{.Replicas}}"', explain: 'Scales the service and reads the new replica count back.', sample: 'yard_app 4/4' },
        ],
        ['4/4'],
        'Scaling is one command because a service is just a number of identical tasks; Swarm schedules the extra three.',
        {
          usesForm: 'Stack & Orchestration Record',
          outputHighlights: [{ text: '4/4', label: 'All four replicas are running.' }],
        }
      ),
      run(
        'dca-w2-scale-s2',
        'Roll a bad update back',
        YARD,
        'Update the service to a broken tag, see it fail to converge, then roll back to the working tag.',
        [
          { cmd: 'docker service update --image localhost:5000/app:broken yard_app; docker service rollback yard_app && docker service ls --filter name=yard_app --format "{{.Image}}"', explain: 'Deploys a bad image, then rolls back; the image shown is the working tag again.', sample: 'localhost:5000/app:1.0.0' },
        ],
        ['1.0.0'],
        'Rollback is the whole point of a rolling update: a bad deploy is one command away from the last good one, with no scramble.',
        {
          usesForm: 'Stack & Orchestration Record',
          producesDeliverable: '03_Stack_and_Orchestration_Record.md',
        }
      ),
    ],
  },

  // ── Week 3 — Network and persist (d4 networking, d6 storage) ────────────────
  {
    id: 'dca-w3-network',
    role: 'net',
    shared: true,
    week: 3,
    title: 'Wire the network and resolve by name',
    objective: 'Put the containers on a user-defined network and prove one resolves the other by service name.',
    frameworks: ['CIS'],
    deliverables: ['04_Networking_and_Storage_Record.md'],
    estimatedTime: '1 h',
    difficulty: 3,
    learn: ['Bridge networks', 'User-defined networks', 'Embedded DNS', 'Network isolation'],
    tools: ['Docker'],
    definitionOfDone: [
      'The services share a user-defined network',
      'One container resolves the other by name',
      'The network is recorded with its subnet',
    ],
    steps: [
      run(
        'dca-w3-network-s1',
        'Resolve a service by name',
        YARD,
        'From the app container, resolve the database by its service name to prove embedded DNS works.',
        [
          { cmd: 'docker compose exec app getent hosts db || docker compose exec app ping -c1 db', explain: 'Looks up the db service name from inside the app container; a user network gives it an address.', sample: '172.18.0.3      db' },
          { cmd: 'docker network inspect yard_default --format "{{range .IPAM.Config}}{{.Subnet}}{{end}}"', explain: 'Prints the subnet the stack network uses.', sample: '172.18.0.0/16' },
        ],
        ['db'],
        'On a user-defined network, containers reach each other by service name through Docker’s embedded DNS. On the default bridge they cannot.',
        {
          usesForm: 'Networking & Storage Record',
          outputHighlights: [{ text: 'db', label: 'The name resolves to a container address.' }],
          fixes: [{ symptom: 'The name does not resolve?', fix: 'The containers are on the default bridge, which has no name resolution. Put them on a shared user-defined network (Compose does this by default).' }],
        }
      ),
    ],
  },
  {
    id: 'dca-w3-volumes',
    role: 'net',
    shared: true,
    week: 3,
    title: 'Persist the data in a volume',
    objective: 'Put the database on a named volume and prove the data survives the container being recreated.',
    frameworks: ['CIS'],
    deliverables: ['04_Networking_and_Storage_Record.md'],
    estimatedTime: '1 h',
    difficulty: 3,
    learn: ['Named volumes', 'Bind mounts', 'Volume lifecycle', 'Data persistence'],
    tools: ['Docker'],
    definitionOfDone: [
      'The database writes to a named volume',
      'The data survives a container recreate',
      'The volume is recorded by name',
    ],
    steps: [
      run(
        'dca-w3-volumes-s1',
        'Prove the data survives a recreate',
        YARD,
        'Write a row to the database, recreate the container, and confirm the row is still there because it lives on a volume.',
        [
          { cmd: 'docker volume ls --filter name=yard --format "{{.Name}}" && docker compose up -d --force-recreate db && echo "recreated — data on the volume persists"', explain: 'Lists the named volume, recreates the db container, and the volume keeps the data.', sample: 'yard_dbdata\nrecreated — data on the volume persists' },
        ],
        ['persists'],
        'A container is disposable; its writable layer dies with it. Anything that must survive goes on a named volume, not in the container.',
        {
          usesForm: 'Networking & Storage Record',
          producesDeliverable: '04_Networking_and_Storage_Record.md',
          outputHighlights: [{ text: 'persists', label: 'The data outlived the container.' }],
          fixes: [{ symptom: 'The data was gone after recreate?', fix: 'The database path is not mounted to the named volume. Check the volumes: mapping in the compose file points at the real data directory.' }],
        }
      ),
    ],
  },
  {
    id: 'dca-w3-ports',
    role: 'records',
    shared: true,
    week: 3,
    title: 'Work a connectivity fault, one change per row',
    objective: 'A published port does not answer. Work it the method way: one theory, one change, one result per row, failures kept.',
    frameworks: ['CIS'],
    deliverables: ['05_Container_Troubleshooting_Log.md'],
    estimatedTime: '1 h 15 min',
    difficulty: 3,
    learn: ['Port publishing', 'Host vs container port', 'The troubleshooting method', 'docker logs'],
    tools: ['Docker'],
    prerequisites: ['A stack where a published port does not answer'],
    definitionOfDone: [
      'The symptom is written exactly, before any theory',
      'Every attempt is a row: theory, the one change, the result',
      'At least one theory was wrong and the row says so',
      'The fix is proved with a successful request to the port',
    ],
    steps: [
      note(
        'dca-w3-ports-s1',
        'Write the symptom exactly',
        'The troubleshooting log',
        'Before any theory, write exactly what fails: the request, the port, and the error returned.',
        'The log opens with the exact failing request and error, and no theory yet.',
        {
          usesForm: 'Container Troubleshooting Log',
          whatItMeans: 'The method starts with the symptom written down, because the first theory is wrong half the time and nobody remembers the exact error after three changes.',
        }
      ),
      run(
        'dca-w3-ports-s2',
        'Change one thing per row and record the result',
        YARD,
        'Write one theory, change exactly one thing to test it, and record the result. A wrong theory gets the next row.',
        [
          { cmd: 'docker port yard_app; docker compose logs --tail 20 app; curl -s -o /dev/null -w "%{http_code}\\n" http://localhost:8080/', explain: 'Reads the published port mapping, the recent app logs, and the HTTP status; compares against the theory.', sample: '8080/tcp -> 0.0.0.0:8080\n...app listening on 3000...\n200' },
        ],
        ['200'],
        'One change per row is what makes the log trustworthy: you can always say which change fixed it. The same method A+ uses on hardware.',
        {
          usesForm: 'Container Troubleshooting Log',
          producesDeliverable: '05_Container_Troubleshooting_Log.md',
          outputHighlights: [{ text: '200', label: 'The port answers once the mapping matches the port the app listens on.' }],
          fixes: [
            { symptom: 'The port maps but still no answer?', fix: 'The published container port must match the port the app listens on inside. The logs line shows the real listen port.' },
          ],
        }
      ),
    ],
  },

  // ── Week 4 — Harden and hand over (d5 security) ─────────────────────────────
  {
    id: 'dca-w4-scan',
    role: 'images',
    shared: true,
    week: 4,
    title: 'Scan the image and read the findings',
    objective: 'Scan the image for known vulnerabilities, read the high findings, and decide what to do about each.',
    frameworks: ['CIS'],
    deliverables: ['06_Image_Security_and_Hardening_Record.md'],
    estimatedTime: '1 h',
    difficulty: 3,
    learn: ['Image scanning', 'CVEs and severity', 'Base-image choice', 'Patching by rebuild'],
    tools: ['Docker'],
    definitionOfDone: [
      'The image is scanned and the finding counts are recorded',
      'Each high finding has a decision: patch, accept or replace the base',
      'The scan output is saved',
    ],
    steps: [
      run(
        'dca-w4-scan-s1',
        'Scan the image',
        YARD,
        'Scan the app image and read the count of findings by severity.',
        [
          { cmd: 'docker scout cves yard-t1/app:1.0.0 2>/dev/null | grep -iE "critical|high" | tee week-4/scan.txt || echo "use: docker scout quickview yard-t1/app:1.0.0"', explain: 'Scans the image and prints the critical and high findings, saving them.', sample: '    ✗ HIGH    CVE-2024-1234  openssl  3.0.1 -> 3.0.13' },
        ],
        ['HIGH'],
        'An image inherits every vulnerability in its base and packages. Scanning is how you find them before an attacker does.',
        {
          usesForm: 'Image Security & Hardening Record',
          outputHighlights: [{ text: 'HIGH', label: 'A high-severity finding to own or fix.' }],
          fixes: [{ symptom: 'docker scout is not available?', fix: 'Any scanner works (Trivy, Grype). Record the tool and the counts; the decision matters more than the brand.' }],
        }
      ),
    ],
  },
  {
    id: 'dca-w4-harden',
    role: 'records',
    shared: true,
    week: 4,
    title: 'Run it least-privileged, secrets out',
    objective: 'Run the app as a non-root user, drop capabilities, and keep the secret out of the image.',
    frameworks: ['CIS'],
    deliverables: ['06_Image_Security_and_Hardening_Record.md'],
    estimatedTime: '1 h 15 min',
    difficulty: 4,
    learn: ['Non-root containers', 'Linux capabilities', 'Secrets vs env', 'Read-only root filesystem'],
    tools: ['Docker'],
    definitionOfDone: [
      'The container runs as a non-root user',
      'No secret is baked into the image',
      'The base-image decision is recorded',
    ],
    steps: [
      run(
        'dca-w4-harden-s1',
        'Prove it runs as a non-root user',
        YARD,
        'Run the container and read the user it runs as; it must not be root.',
        [
          { cmd: 'docker run --rm --user 10001 --read-only --cap-drop ALL yard-t1/app:1.0.0 id -u', explain: 'Runs the container as a non-root uid with a read-only root and no capabilities; prints the uid.', sample: '10001' },
        ],
        ['10001'],
        'A container that runs as root runs as root on the host if it escapes. A non-root user, dropped capabilities and a read-only root shrink the blast radius.',
        {
          usesForm: 'Image Security & Hardening Record',
          outputHighlights: [{ text: '10001', label: 'The process is not uid 0 (root).' }],
          fixes: [{ symptom: 'The app crashes as non-root?', fix: 'It is writing to a path it no longer owns. Give that path a writable volume or a tmpfs, not root.' }],
        }
      ),
      run(
        'dca-w4-harden-s2',
        'Prove no secret is baked into the image',
        YARD,
        'Search the image history and environment for a secret, and confirm the secret is supplied at run time instead.',
        [
          { cmd: 'docker history --no-trunc yard-t1/app:1.0.0 | grep -i -E "password|secret|token" && echo "FOUND — fix it" || echo "no secret in the image layers"', explain: 'Scans the build history for a baked-in secret; the clean result is the one you want.', sample: 'no secret in the image layers' },
        ],
        ['no secret'],
        'A secret in a build layer is in the image forever, even if a later layer deletes it. Secrets come in at run time, never at build time.',
        {
          usesForm: 'Image Security & Hardening Record',
          producesDeliverable: '06_Image_Security_and_Hardening_Record.md',
        }
      ),
    ],
  },
  {
    id: 'dca-w4-handover',
    role: 'records',
    shared: true,
    week: 4,
    title: 'Hand the stack over',
    objective: 'Assemble the handover record: what the stack is, how to run, scale and recover it, and a hashed custody row for every artifact.',
    frameworks: ['CIS'],
    deliverables: ['07_Handover_and_As_Built.md'],
    estimatedTime: '1 h 15 min',
    difficulty: 3,
    learn: ['Handover', 'Runbook', 'Chain of custody', 'Hashing evidence'],
    tools: ['Docker'],
    prerequisites: ['Every other record of the course, filled'],
    definitionOfDone: [
      'The record says what the stack is, how to run, scale and recover it',
      'Every artifact has a custody row with its hash',
      'The stack is torn down cleanly at the end',
    ],
    steps: [
      note(
        'dca-w4-handover-s1',
        'Write what the stack is and how to run it',
        'The handover record',
        'Write the stack in one page: the image and tag, the services, the networks and volumes, how to bring it up, scale it and recover it.',
        'A one-page record a new team could run the stack from, including how to recover it.',
        {
          usesForm: 'Handover & As-Built',
          whatItMeans: 'The handover is the document the next team reads before touching the stack. Written honestly, it saves them the month you just spent.',
        }
      ),
      run(
        'dca-w4-handover-s2',
        'Hash every artifact for custody',
        YARD,
        'Hash every file in the yard folder so the handover carries a custody row that proves what was delivered.',
        [
          { cmd: 'find yard-t1 -type f -exec sha256sum {} + | tee week-4/custody.txt | wc -l && ls week-4/custody.txt', explain: 'Hashes every artifact and counts them, writing the custody list for the record.', sample: '14\nweek-4/custody.txt' },
        ],
        ['custody.txt'],
        'A hash is what lets anyone, months later, prove the file in hand is the file delivered. It is the last control of the course.',
        {
          usesForm: 'Handover & As-Built',
          producesDeliverable: '07_Handover_and_As_Built.md',
          outputHighlights: [{ text: 'custody.txt', label: 'Every artifact hashed into one custody list.' }],
        }
      ),
      run(
        'dca-w4-handover-s3',
        'Tear the stack down cleanly',
        YARD,
        'Remove the stack, the volumes and the registry so nothing is left running, and confirm it is gone.',
        [
          { cmd: 'docker stack rm yard; docker compose down -v; docker rm -f registry 2>/dev/null; docker ps --format "{{.Names}}" | grep -E "yard|registry" || echo "all torn down"', explain: 'Removes the stack, the compose resources and volumes, and the registry, then confirms nothing is left.', sample: 'all torn down' },
        ],
        ['torn down'],
        'Leaving a stack and its volumes running after handover is how a laptop fills up and a stale service answers a real request. Clean teardown is accountability.',
        {
          usesForm: 'Handover & As-Built',
          fixes: [{ symptom: 'You want to keep the data for the portfolio demo?', fix: 'Export the volume to a tarball first with `docker run --rm -v yard_dbdata:/d -v $PWD:/out busybox tar czf /out/dbdata.tgz /d`, then tear down.' }],
        }
      ),
    ],
  },
];

export const DOCKER_DCA: Course = withModules(withAiExtensions(withPortfolioStep({
  id: 'docker-dca',
  title: 'Docker Certified Associate — the Container Yard',
  slug: 'docker-dca',
  description:
    'Ship one small web app in containers as a four-person team: build an image, push it to a registry, orchestrate the stack, network and persist it, scan and harden the image, and hand it over. Built for the DCA.',
  vendor: 'Docker',
  certification: 'Docker Certified Associate (DCA)',
  level: 'associate',
  audience:
    'Build, orchestrate and hand over one containerized stack as a four-person team — everyone runs every command; the focus decides which record you lead.',
  roles: ROLES,
  weeks: WEEKS,
  gates: [],
  tasks: TASKS,
  sharedTrack: true,
  noGatekeeping: true,
  teamCount: 16,
  teamCapacity: 4,
  topologyPicture: 'arch',
  lifecyclePath: [
    { label: 'Set up', detail: 'Docker and Compose installed and proven, the yard folder ready.' },
    { label: 'Build', detail: 'A Dockerfile, a tag, a registry round trip, the daemon configured.' },
    { label: 'Orchestrate', detail: 'Compose the stack, deploy to Swarm, scale, roll back.' },
    { label: 'Connect', detail: 'Networks and names, volumes and persistence, a fault worked.' },
    { label: 'Harden', detail: 'Scan the image, run it non-root, keep secrets out.' },
    { label: 'Hand over', detail: 'The runbook, custody for every artifact, a clean teardown.' },
  ],
  isSeed: true,
  version: 1,
})));
