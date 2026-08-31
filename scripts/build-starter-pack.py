#!/usr/bin/env python3
"""Build public/downloads/ServerPlus_Starter_Pack.zip from the strings below.

Why this file exists
--------------------
The starter pack was a checked-in binary with no generator anywhere in the repo,
so nothing in the codebase could reach the words inside it. It drifted, exactly
as an unreachable artifact does: its README kept telling students that "the
Configuration Guide is handed out by your instructor" long after that guide was
moved INTO the platform, and its addressing block still described a topology the
course had already replaced. A student unzips this onto their own disk on day
one and reads it there — it is the one course artifact nobody can correct after
the fact, which is precisely why it must be generated and not hand-packed.

So: the pack's entire contents live here as source. Change the words here, run

    python3 scripts/build-starter-pack.py

and commit the regenerated ZIP. Standard library only — no new dependency.

The topology below is the same one `src/lib/serverTopology.ts` serves to the app.
This script cannot import a TypeScript module, so when the addressing moves,
this file is the fifth place to update; ADDRESSING_BLOCK is deliberately one
string so it is a single edit rather than a scavenger hunt.

The build is reproducible: every entry gets a fixed timestamp and mode, so
re-running with unchanged content produces a byte-identical ZIP and an unchanged
git diff.
"""

from __future__ import annotations

import sys
import zipfile
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
OUT = REPO / "public" / "downloads" / "ServerPlus_Starter_Pack.zip"
PXE_PDF = REPO / "public" / "downloads" / "PXE_Imaging_Student_Guide.pdf"

ROOT = "ServerPlus_Capstone"

# Fixed so an unchanged rebuild is byte-identical. 1980-01-01 is the earliest
# timestamp the ZIP format can store.
TIMESTAMP = (1980, 1, 1, 0, 0, 0)
FILE_MODE = 0o644

# Every folder README repeats this, because a student who opens 08_Evidence
# first should not have to go back up a level to learn how to name a photo.
NAMING = """FILE NAMING CONVENTION
======================
Name every exported form and evidence file like this:

    <Client>_Wk<N>_<what-it-is>.<ext>

Examples:
    GranitePeak_Wk1_Hardware_and_HCL.pdf
    GranitePeak_Wk2_rack-front.jpg
    GranitePeak_Wk3_topology.png

Keep the client name and week number consistent -- your Week-4 handover
package is assembled from these files.
"""

# folder -> the one line saying what lands in it.
#
# These EIGHT folders are the eight deliverables in
# src/lib/docs/serverPlusDeliverables.ts, one folder per form, in `num` order --
# folder prefix is always `num - 1`. 08_Evidence is the ninth folder and is not
# a form. src/lib/starterPack.test.ts asserts this list still matches the
# deliverables and the in-platform folder tree, because this pack is unzipped
# onto a student's own disk on day one and cannot be corrected afterwards.
FOLDERS: dict[str, str] = {
    "00_Planning": "The Architecture Brief -- what the business needs and the design that delivers it -- lives here.",
    "01_Hardware": "The Hardware Discovery, HCL & Upgrade Plan lives here.",
    "02_BringUp": "The Server Bring-Up Log -- POST fault to RAID to hypervisor -- lives here.",
    "03_Rack": "The Rack, Power & Asset Register lives here.",
    "04_Network": "The IP Plan & Connectivity Proof lives here.",
    "05_Standards": "Baselines, Policies & Standards lives here.",
    "06_Operations": "The Operations Log & SOPs lives here.",
    "07_Handover": "The DR Plan & As-Built Handover -- the capstone -- lives here.",
    "08_Evidence": (
        "Every photo and screenshot you attach or hand over lives here, named per "
        "the convention and logged in the As-Built evidence appendix."
    ),
}

# The authoritative topology, as a student reads it. One block, one edit.
ADDRESSING_BLOCK = """THE ADDRESSING RULE
===================
Campus LAN:          10.10.0.0/16, gateway 10.10.0.1
Your Proxmox host:   10.10.30.T   (T = your team number; Team 1 = 10.10.30.1)
Its web console:     https://10.10.30.T:8006

vmbr0 -- management: the campus LAN above. The host lives here.

vmbr1 -- DMZ:        172.16.0.0/24, gateway 172.16.0.1
    websrv    172.16.0.10   Ubuntu + NGINX -- the public website

vmbr2 -- private:    192.168.0.0/24, gateway 192.168.0.1
    winserver 192.168.0.2    Windows Server -- AD DS, DNS, DHCP
    linuxsrv  192.168.0.3    Ubuntu -- MariaDB, database "capstone_db"
    secmon    192.168.0.4    OPTIONAL monitoring -- Prometheus / Grafana / Loki

Your team's OWN business VMs start at 192.168.0.5 in the private zone and
172.16.0.11 in the DMZ. Never at 192.168.0.4: that address belongs to the
monitoring host whether or not your team builds it, and a duplicate address
surfaces days later as an outage nobody can explain.

Later phase: vmbr2 is assigned to a physical NIC and attached to a Cisco router
+ switch -- that becomes the ONLY path for the servers to reach the internet.

The rack is 24U. There is no jump box in this build, and the website is NGINX
on websrv -- never IIS.
"""

# The line this whole pack got wrong. The configuration guide is in the platform.
CONFIG_GUIDE_BLOCK = """WHERE THE CONFIGURATION GUIDE LIVES
===================================
In the platform -- not in this pack, and not on paper. Open your course and go
to the Reference page, section "Configuration guide":

    /courses/server-plus/guide/reference#config-guide

That is the exact CLI, click-path and BIOS keystroke for every install step,
written against the addressing above. Nothing about configuration is handed out
by anyone: when the topology changes, that page changes with it, which is the
whole reason it no longer lives in a document you keep a stale copy of.
"""

TOP_README = f"""SERVER+ CAPSTONE -- STARTER PACK
================================
Unzip this on your freshly imaged workstation. It is the folder structure
your whole engagement files into: every form you export as PDF, and every
photo or screenshot you take, has a home below.

Each numbered folder holds one part of the record set (a README inside
each says which forms land there). Keep the documents current as you work
-- Week 4's handover package is assembled from these folders, not written
from memory.

{NAMING}
{ADDRESSING_BLOCK}
{CONFIG_GUIDE_BLOCK}
ALSO IN THIS PACK
=================
    PXE_Imaging_Student_Guide.pdf -- the Week 0 workstation imaging guide.
"""


def folder_readme(folder: str, blurb: str) -> str:
    """A folder README: heading, underline, what lands here, then the naming rule."""
    return f"{folder}\n{'=' * len(folder)}\n{blurb}\n\n{NAMING}"


def add(zf: zipfile.ZipFile, name: str, data: bytes) -> None:
    info = zipfile.ZipInfo(name, date_time=TIMESTAMP)
    info.compress_type = zipfile.ZIP_DEFLATED
    info.external_attr = FILE_MODE << 16
    zf.writestr(info, data)


def build() -> None:
    if not PXE_PDF.is_file():
        sys.exit(f"missing {PXE_PDF} -- the imaging guide ships inside the pack")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as zf:
        add(zf, f"{ROOT}/README.txt", TOP_README.encode("utf-8"))
        for folder, blurb in FOLDERS.items():
            add(zf, f"{ROOT}/{folder}/README.txt", folder_readme(folder, blurb).encode("utf-8"))
        add(zf, f"{ROOT}/{PXE_PDF.name}", PXE_PDF.read_bytes())

    verify()


def verify() -> None:
    """Reopen what we just wrote. A pack that does not open is worse than none."""
    with zipfile.ZipFile(OUT) as zf:
        bad = zf.testzip()
        if bad is not None:
            sys.exit(f"corrupt entry in {OUT}: {bad}")
        names = zf.namelist()
        expected = (
            [f"{ROOT}/README.txt"]
            + [f"{ROOT}/{f}/README.txt" for f in FOLDERS]
            + [f"{ROOT}/{PXE_PDF.name}"]
        )
        missing = [n for n in expected if n not in names]
        if missing:
            sys.exit(f"missing entries: {missing}")
        readme = zf.read(f"{ROOT}/README.txt").decode("utf-8")
        # The two mistakes this generator exists to make unrepeatable.
        if "handed out by your instructor" in readme:
            sys.exit("README still sends students to an instructor handout")
        if "/courses/server-plus/guide/reference#config-guide" not in readme:
            sys.exit("README does not point at the in-platform configuration guide")

        print(f"wrote {OUT.relative_to(REPO)} ({OUT.stat().st_size:,} bytes)")
        for info in zf.infolist():
            print(f"  {info.file_size:>9,}  {info.filename}")


if __name__ == "__main__":
    build()
