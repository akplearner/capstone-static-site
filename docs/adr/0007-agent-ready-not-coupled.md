# ADR 0007 — Agent-ready, not agent-coupled (no MCP gateway yet)

- **Status:** Proposed
- **Phase:** 1 (design) · Phase 4 (the adapter, deferred)

## Context
The platform should thrive in an MCP/A2A/agentic world, but building an agent gateway now would couple the
core to a fast-moving surface and risk a rewrite. The value (ontology + xAPI events + validators) is what
agents will consume.

## Decision
Keep the API **capability-scoped and resource-clean** (REST/GraphQL), model `actor.type: human|agent` in
identity and events, and emit standard xAPI. **Do not build the MCP server or A2A federation now.** When
needed, an MCP server is a *thin adapter* over the existing API; A2A rides the ontology + xAPI.

## Consequences
- (+) Agent-readiness with zero agent-coupling; the adapter stays a small addition, not a rewrite.
- (+) Forces clean API boundaries that benefit human clients too.
- (−) No agent execution until Phase 4 by design (acceptable; keep-possible-don't-build).
