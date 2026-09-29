import { describe, it, expect } from 'vitest';
import yaml from 'js-yaml';
import { AZURE_IAC } from './azureIac';
import { AWS_IAC } from './awsIac';
import { AZURE_TOPOLOGY } from './azureTopology';
import { AWS_TOPOLOGY } from './awsTopology';
import { armDependencies, cfnDependencies } from './deps';
import type { CloudTopology, IacBundle } from './model';
import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { CONTAINER_STROKE } from './brand';
import { DARK_CONTAINER_VARIANTS, DARK_VARIANTS, OFFICIAL_CONTAINER_ICONS, OFFICIAL_ICONS } from './officialIcons';

/**
 * R87 — the diagram IS the template, and the template is sound.
 *
 * Every assertion here re-reads the templates with real parsers (JSON.parse,
 * js-yaml with CloudFormation's short-form tags) so the light text scanners
 * the app uses at runtime are checked against the truth, not against
 * themselves.
 */

// CloudFormation short-form tags, kept as {tag: value} so references survive.
const CFN_TAGS = ['!Ref', '!GetAtt', '!Sub', '!Select', '!GetAZs', '!Base64', '!Join', '!If', '!Equals'].flatMap((t) =>
  (['scalar', 'sequence', 'mapping'] as const).map(
    (kind) => new yaml.Type(t, { kind, construct: (d: unknown) => ({ [t]: d }) })
  )
);
const CFN_SCHEMA = yaml.DEFAULT_SCHEMA.extend(CFN_TAGS);
type CfnDoc = {
  Parameters: Record<string, { Default?: unknown }>;
  Resources: Record<string, { Type: string; DependsOn?: string | string[]; Metadata?: { Capstone?: { Week?: number } }; Properties?: Record<string, unknown> }>;
  Outputs: Record<string, unknown>;
};
const loadCfn = (text: string) => yaml.load(text, { schema: CFN_SCHEMA }) as CfnDoc;

type ArmDoc = {
  parameters: Record<string, { defaultValue?: unknown }>;
  resources: { comments: string; type: string; name: string; properties?: Record<string, unknown> }[];
  outputs: Record<string, unknown>;
};

const TEMPLATE_CONTAINERS: Record<string, string[]> = { azure: ['vnet'], aws: ['Vpc', 'PublicSubnet', 'PrivateSubnet'] };

describe.each([
  ['azure', AZURE_IAC, AZURE_TOPOLOGY],
  ['aws', AWS_IAC, AWS_TOPOLOGY],
] as [string, IacBundle, CloudTopology][])('R87 cloud parity — %s', (platform, iac, topo) => {
  const templateIds = iac.resources.map((r) => r.id);
  const drawn = new Set([
    ...topo.nodes.filter((n) => !n.external).map((n) => n.id),
    ...topo.containers.filter((c) => TEMPLATE_CONTAINERS[platform].includes(c.id)).map((c) => c.id),
  ]);

  it('both templates and the starter parse', () => {
    if (iac.full.lang === 'json') {
      expect(() => JSON.parse(iac.full.text)).not.toThrow();
      expect(() => JSON.parse(iac.starter.text)).not.toThrow();
    } else {
      expect(() => loadCfn(iac.full.text)).not.toThrow();
      expect(() => loadCfn(iac.starter.text)).not.toThrow();
    }
    for (const p of iac.parameters) expect(() => JSON.parse(p.text), p.name).not.toThrow();
  });

  it('the scanner found every resource, with a week, exactly once', () => {
    const real =
      iac.full.lang === 'json'
        ? (JSON.parse(iac.full.text) as ArmDoc).resources.length
        : Object.keys(loadCfn(iac.full.text).Resources).length;
    expect(iac.resources.length).toBe(real);
    expect(new Set(templateIds).size).toBe(templateIds.length);
    for (const r of iac.resources) {
      expect(r.week, r.id).toBeGreaterThanOrEqual(1);
      expect(r.week, r.id).toBeLessThanOrEqual(12);
      expect(r.end, r.id).toBeGreaterThan(r.start);
      expect(r.type.length, r.id).toBeGreaterThan(3);
    }
  });

  it('every template resource is drawn, and everything drawn is in the template', () => {
    for (const id of templateIds) expect(drawn.has(id), `${id} is in the template but not the diagram`).toBe(true);
    for (const id of drawn) expect(templateIds, `${id} is drawn but not in the template`).toContain(id);
  });

  it('the diagram shows each resource in the week the template says it arrives', () => {
    for (const n of topo.nodes.filter((x) => !x.external)) {
      expect(n.week, `${n.id}`).toBe(iac.resources.find((r) => r.id === n.id)!.week);
    }
  });

  it('the dependency view is the template’s real reference graph', () => {
    const scanned =
      iac.full.lang === 'json' ? armDependencies(iac.full.text) : cfnDependencies(iac.full.text, iac.resources);
    const key = (d: { from: string; to: string }) => `${d.from}->${d.to}`;
    if (iac.full.lang === 'yaml') {
      // Re-derive from the parsed document: Ref / GetAtt / Sub / DependsOn.
      const doc = loadCfn(iac.full.text);
      const ids = new Set(Object.keys(doc.Resources));
      const real = new Set<string>();
      const walk = (from: string, v: unknown) => {
        if (Array.isArray(v)) return v.forEach((x) => walk(from, x));
        if (v && typeof v === 'object') {
          for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
            if (k === '!Ref' && typeof val === 'string' && ids.has(val)) real.add(`${from}->${val}`);
            if (k === '!GetAtt') {
              const target = String(Array.isArray(val) ? val[0] : val).split('.')[0];
              if (ids.has(target)) real.add(`${from}->${target}`);
            }
            if (k === '!Sub') {
              const s = Array.isArray(val) ? String(val[0]) : String(val);
              for (const m of s.matchAll(/\$\{([A-Za-z0-9]+)/g)) if (ids.has(m[1])) real.add(`${from}->${m[1]}`);
            }
            walk(from, val);
          }
        }
      };
      for (const [id, r] of Object.entries(doc.Resources)) {
        walk(id, r.Properties);
        for (const d of [r.DependsOn ?? []].flat()) real.add(`${id}->${d}`);
      }
      real.forEach((k) => {
        const [a, b] = k.split('->');
        if (a === b) real.delete(k);
      });
      expect(new Set(scanned.map(key))).toEqual(real);
    } else {
      expect(scanned.length, 'ARM dependsOn edges found').toBeGreaterThan(10);
    }
    const drawnDeps = new Set(topo.edges.filter((e) => e.kind === 'depends').map(key));
    expect(drawnDeps).toEqual(new Set(scanned.map(key)));
  });

  it('every edge starts and ends on something drawn', () => {
    const anchors = new Set([...topo.nodes.map((n) => n.id), ...topo.containers.map((c) => c.id)]);
    for (const e of topo.edges) {
      expect(anchors.has(e.from), `edge from ${e.from}`).toBe(true);
      expect(anchors.has(e.to), `edge to ${e.to}`).toBe(true);
    }
    for (const n of topo.nodes) {
      expect(n.x > 0 && n.x < topo.width && n.y > 0 && n.y < topo.height, `${n.id} inside the canvas`).toBe(true);
    }
  });

  it('the starter differs from the reference only at its blanks', () => {
    expect(iac.fillCount).toBeGreaterThanOrEqual(6);
    expect((iac.starter.text.match(/FILL-ME:/g) ?? []).length).toBe(iac.fillCount);
    expect(iac.full.text).not.toContain('FILL-ME');
    expect(iac.full.text).not.toContain('⟦');
    const a = iac.full.text.split('\n');
    const b = iac.starter.text.split('\n');
    expect(b.length).toBe(a.length);
    const differing = a.filter((line, i) => line !== b[i]).length;
    expect(differing).toBe(iac.fillCount);
  });

  it('parameter files set only real parameters, and every required one', () => {
    const params =
      iac.full.lang === 'json'
        ? (JSON.parse(iac.full.text) as ArmDoc).parameters
        : (loadCfn(iac.full.text).Parameters as Record<string, { defaultValue?: unknown; Default?: unknown }>);
    const required = Object.entries(params)
      .filter(([, p]) => (p as { defaultValue?: unknown }).defaultValue === undefined && (p as { Default?: unknown }).Default === undefined)
      .map(([k]) => k);
    for (const f of iac.parameters) {
      const parsed = JSON.parse(f.text);
      const keys: string[] = Array.isArray(parsed)
        ? parsed.map((p: { ParameterKey: string }) => p.ParameterKey)
        : Object.keys(parsed.parameters);
      for (const k of keys) expect(Object.keys(params), `${f.name}: ${k}`).toContain(k);
      for (const k of required) expect(keys, `${f.name} must set ${k}`).toContain(k);
    }
  });

  it('the documented outputs are exactly the template’s outputs', () => {
    const outs =
      iac.full.lang === 'json'
        ? Object.keys((JSON.parse(iac.full.text) as ArmDoc).outputs)
        : Object.keys(loadCfn(iac.full.text).Outputs);
    expect(iac.outputs.map((o) => o.name).sort()).toEqual([...outs].sort());
  });
});

describe('R87 — the templates are sound', () => {
  const arm = JSON.parse(AZURE_IAC.full.text) as ArmDoc;
  const byType = (t: string) => arm.resources.filter((r) => r.type === t);

  it('Azure: no inbound rule admits SSH/RDP (or anything) from the internet', () => {
    const OPEN = ['*', 'Internet', '0.0.0.0/0', 'Any'];
    for (const nsg of byType('Microsoft.Network/networkSecurityGroups')) {
      const rules = (nsg.properties!.securityRules as { name: string; properties: Record<string, string | number> }[]);
      for (const r of rules) {
        const p = r.properties;
        if (p.direction === 'Inbound' && p.access === 'Allow') {
          expect(OPEN, `${nsg.comments}: ${r.name} allows from ${p.sourceAddressPrefix}`).not.toContain(p.sourceAddressPrefix);
        }
      }
    }
  });

  it('Azure: storage is HTTPS-only with TLS 1.2 and no anonymous blobs; the Function is HTTPS-only', () => {
    for (const s of byType('Microsoft.Storage/storageAccounts')) {
      expect(s.properties!.supportsHttpsTrafficOnly, s.comments).toBe(true);
      expect(s.properties!.minimumTlsVersion, s.comments).toBe('TLS1_2');
      expect(s.properties!.allowBlobPublicAccess, s.comments).toBe(false);
    }
    const func = byType('Microsoft.Web/sites')[0];
    expect(func.properties!.httpsOnly).toBe(true);
    expect((func.properties!.siteConfig as { ftpsState: string }).ftpsState).toBe('Disabled');
  });

  it('Azure: the VM logs in with a key only, and the Function reaches data with its identity', () => {
    const vm = byType('Microsoft.Compute/virtualMachines')[0];
    const linux = (vm.properties!.osProfile as { linuxConfiguration: { disablePasswordAuthentication: boolean } }).linuxConfiguration;
    expect(linux.disablePasswordAuthentication).toBe(true);
    const settings = ((byType('Microsoft.Web/sites')[0].properties!.siteConfig as { appSettings: { name: string }[] }).appSettings).map((s) => s.name);
    expect(settings).toContain('CosmosConnection__accountEndpoint');
    // The runtime's own storage connection (AzureWebJobsStorage and the
    // content share) is required on a Consumption plan; the DATA path must
    // carry no key.
    expect(settings.some((n) => /cosmos.*(key|connectionstring)/i.test(n))).toBe(false);
  });

  const cfn = loadCfn(AWS_IAC.full.text);

  it('AWS: the instance has no inbound rule, requires IMDSv2, and every disk is encrypted', () => {
    const sg = cfn.Resources.ToolsSecurityGroup.Properties!;
    expect(sg.SecurityGroupIngress, 'no inbound rules at all').toBeUndefined();
    const inst = cfn.Resources.ToolsInstance.Properties! as { MetadataOptions: { HttpTokens: string }; BlockDeviceMappings: { Ebs: { Encrypted: boolean } }[] };
    expect(inst.MetadataOptions.HttpTokens).toBe('required');
    expect(inst.BlockDeviceMappings.every((b) => b.Ebs.Encrypted)).toBe(true);
    expect((cfn.Resources.DataVolume.Properties as { Encrypted: boolean }).Encrypted).toBe(true);
  });

  it('AWS: the site bucket blocks all public access and only this distribution can read it', () => {
    const pab = (cfn.Resources.SiteBucket.Properties as { PublicAccessBlockConfiguration: Record<string, boolean> }).PublicAccessBlockConfiguration;
    expect(Object.values(pab).every(Boolean)).toBe(true);
    expect(Object.keys(pab).length).toBe(4);
    expect(JSON.stringify(cfn.Resources.SiteBucketPolicy.Properties)).toContain('AWS:SourceArn');
  });

  it('AWS: the Lambda role can touch one table, named by its ARN — never "*"', () => {
    const role = cfn.Resources.CounterFunctionRole.Properties as { Policies: { PolicyDocument: { Statement: { Resource: unknown }[] } }[] };
    for (const p of role.Policies) {
      for (const s of p.PolicyDocument.Statement) {
        expect(s.Resource).not.toBe('*');
        expect(JSON.stringify(s.Resource)).toContain('VisitorTable');
      }
    }
  });
});

/**
 * R88 — the official icons, and a picture with nothing floating.
 */
describe('R88 — official icons', () => {
  const file = (p: string) => existsSync(resolve(process.cwd(), 'public/cloud-icons', p));

  it.each(['azure', 'aws'] as const)('%s: every listed key has its file, and dark twins exist where declared', (platform) => {
    for (const key of OFFICIAL_ICONS[platform]) {
      expect(file(`${platform}/${key}.svg`), `${platform}/${key}.svg`).toBe(true);
    }
    for (const key of DARK_VARIANTS[platform]) {
      expect(OFFICIAL_ICONS[platform], `${key} has a dark twin but is not listed`).toContain(key);
      expect(file(`${platform}/${key}.dark.svg`), `${platform}/${key}.dark.svg`).toBe(true);
    }
    for (const kind of OFFICIAL_CONTAINER_ICONS[platform]) {
      expect(file(`${platform}/group-${kind}.svg`), `${platform}/group-${kind}.svg`).toBe(true);
    }
    for (const kind of DARK_CONTAINER_VARIANTS[platform]) {
      expect(file(`${platform}/group-${kind}.dark.svg`), `${platform}/group-${kind}.dark.svg`).toBe(true);
    }
  });

  it.each([
    ['azure', AZURE_TOPOLOGY],
    ['aws', AWS_TOPOLOGY],
  ] as const)('%s: every drawn resource has an official icon, except the two Azure has none for', (platform, topo) => {
    const missing = [...new Set(topo.nodes.map((n) => n.icon))].filter((k) => !OFFICIAL_ICONS[platform].includes(k));
    expect(missing).toEqual(platform === 'azure' ? ['github', 'notify'] : []);
  });

  it('no file was added without being listed (a stray file is a key nobody renders)', () => {
    for (const platform of ['azure', 'aws'] as const) {
      const listed = new Set([
        ...OFFICIAL_ICONS[platform].flatMap((k) => [`${k}.svg`, ...(DARK_VARIANTS[platform].includes(k) ? [`${k}.dark.svg`] : [])]),
        ...OFFICIAL_CONTAINER_ICONS[platform].flatMap((k) => [`group-${k}.svg`, ...(DARK_CONTAINER_VARIANTS[platform].includes(k) ? [`group-${k}.dark.svg`] : [])]),
      ]);
      const onDisk = readdirSync(resolve(process.cwd(), 'public/cloud-icons', platform)).filter((f) => f.endsWith('.svg'));
      expect(onDisk.sort()).toEqual([...listed].sort());
    }
  });
});

describe.each([
  ['azure', AZURE_TOPOLOGY, AZURE_IAC],
  ['aws', AWS_TOPOLOGY, AWS_IAC],
] as const)('R88 — nothing floats — %s', (platform, topo, iac) => {
  const deps = platform === 'azure' ? armDependencies(iac.full.text) : cfnDependencies(iac.full.text, iac.resources);
  const boxes = new Set(topo.containers.map((c) => c.id));
  const inBox = (n: { x: number; y: number }) =>
    topo.containers.some((c) => c.id !== topo.containers[0].id && c.kind === 'group' && n.x > c.x && n.x < c.x + c.w && n.y > c.y && n.y < c.y + c.h);

  it('every supporting resource is tied to something: a template reference, a traffic line, or a scope box', () => {
    const loose: string[] = [];
    for (const n of topo.nodes.filter((x) => x.small)) {
      const tied =
        deps.some((d) => d.from === n.id || d.to === n.id) ||
        topo.edges.some((e) => e.kind === 'traffic' && (e.from === n.id || e.to === n.id)) ||
        inBox(n);
      if (!tied) loose.push(n.id);
    }
    expect(loose).toEqual([]);
  });

  it('the alert watches something: an incoming traffic edge from what it measures', () => {
    const alert = topo.nodes.find((n) => n.icon === 'alert')!;
    expect(topo.edges.some((e) => e.kind === 'traffic' && e.to === alert.id), alert.id).toBe(true);
  });

  it('every container kind drawn has a stroke colour', () => {
    for (const c of topo.containers) expect(CONTAINER_STROKE[platform][c.kind], `${c.id} (${c.kind})`).toBeTruthy();
    expect(boxes.size).toBe(topo.containers.length);
  });

  it('no traffic edge outlives the template: a line drawn "until" a week ends before the final state', () => {
    for (const e of topo.edges.filter((x) => x.until != null)) expect(e.until!, `${e.from}→${e.to}`).toBeLessThan(12);
  });
});

describe('R88 — Azure: the Key Vault line ends when the secret does', () => {
  it('the Function → Key Vault edge stops at Week 4; from Week 5 the identity carries the data path', () => {
    const kv = AZURE_TOPOLOGY.edges.find((e) => e.kind === 'traffic' && e.from === 'func' && e.to === 'kv')!;
    expect(kv.until).toBe(4);
    // And the template agrees: no Function setting references the vault.
    const func = AZURE_IAC.full.text.slice(AZURE_IAC.resources.find((r) => r.id === 'func')!.start);
    expect(func.slice(0, 4000)).not.toMatch(/@Microsoft\.KeyVault/);
  });
});
