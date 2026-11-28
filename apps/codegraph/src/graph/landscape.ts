/** The layered map (CODEGRAPH_LLD.md section 4.10). `source` is a URL from the section 2 table. */

export type LayerId = 'format' | 'indexer' | 'storage' | 'serving' | 'org';
/** spec = published openly; project = open-source project; pattern = each organization assembles it itself. */
export type PieceStatus = 'spec' | 'project' | 'pattern';
export interface Piece {
  id: string;
  layer: LayerId;
  name: string;
  status: PieceStatus;
  source: string | null;
}

export const LAYERS: LayerId[] = ['format', 'indexer', 'storage', 'serving', 'org'];

const LSP_OVERVIEW = 'https://raw.githubusercontent.com/microsoft/language-server-protocol/gh-pages/_overviews/lsif/overview.md';
const SCIP = 'https://github.com/sourcegraph/scip';
const KYTHE = 'https://raw.githubusercontent.com/kythe/kythe/master/kythe/docs/kythe-overview.txt';
const MCP = 'https://raw.githubusercontent.com/modelcontextprotocol/modelcontextprotocol/main/docs/specification/2025-06-18/architecture/index.mdx';
const BACKSTAGE = 'https://raw.githubusercontent.com/backstage/backstage/master/docs/features/software-catalog/system-model.md';

export const PIECES: Piece[] = [
  { id: 'lsif', layer: 'format', name: 'LSIF', status: 'spec', source: LSP_OVERVIEW },
  { id: 'scip', layer: 'format', name: 'SCIP', status: 'spec', source: SCIP },
  { id: 'kythe-schema', layer: 'format', name: 'Kythe graph schema', status: 'spec', source: KYTHE },
  { id: 'tree-sitter', layer: 'indexer', name: 'tree-sitter', status: 'project', source: 'https://github.com/tree-sitter/tree-sitter' },
  { id: 'scip-indexers', layer: 'indexer', name: 'SCIP indexers (one per language)', status: 'project', source: SCIP },
  { id: 'kythe-indexers', layer: 'indexer', name: 'Kythe indexers', status: 'project', source: KYTHE },
  { id: 'codeql', layer: 'indexer', name: 'CodeQL extractors and databases', status: 'project', source: 'https://raw.githubusercontent.com/github/codeql/main/docs/codeql/codeql-overview/about-codeql.rst' },
  { id: 'glean', layer: 'storage', name: 'Glean', status: 'project', source: 'https://raw.githubusercontent.com/facebookincubator/Glean/main/README.md' },
  { id: 'central-index', layer: 'storage', name: 'One central index', status: 'pattern', source: 'https://abseil.io/resources/swe-book/html/ch17.html' },
  { id: 'registry', layer: 'storage', name: 'Registry of snapshots, by repo and commit', status: 'pattern', source: null },
  { id: 'mcp', layer: 'serving', name: 'Model Context Protocol (MCP)', status: 'spec', source: MCP },
  { id: 'lsp', layer: 'serving', name: 'Language Server Protocol (LSP)', status: 'spec', source: LSP_OVERVIEW },
  { id: 'graph-tools', layer: 'serving', name: 'Which tools a graph server offers', status: 'pattern', source: null },
  { id: 'backstage', layer: 'org', name: 'Backstage software catalog', status: 'project', source: BACKSTAGE },
  { id: 'openapi', layer: 'org', name: 'OpenAPI', status: 'spec', source: 'https://raw.githubusercontent.com/OAI/OpenAPI-Specification/main/versions/3.1.0.md' },
  { id: 'asyncapi', layer: 'org', name: 'AsyncAPI', status: 'spec', source: 'https://raw.githubusercontent.com/asyncapi/spec/master/spec/asyncapi.md' },
  { id: 'protobuf', layer: 'org', name: 'Protocol Buffers', status: 'spec', source: 'https://raw.githubusercontent.com/protocolbuffers/protobuf/main/README.md' },
  { id: 'graphql', layer: 'org', name: 'GraphQL', status: 'spec', source: 'https://raw.githubusercontent.com/graphql/graphql-spec/main/README.md' },
  { id: 'spdx', layer: 'org', name: 'SPDX', status: 'spec', source: 'https://raw.githubusercontent.com/spdx/spdx-spec/develop/README.md' },
  { id: 'cyclonedx', layer: 'org', name: 'CycloneDX', status: 'spec', source: 'https://raw.githubusercontent.com/CycloneDX/specification/master/README.md' },
  { id: 'joining', layer: 'org', name: 'Joining code, contracts and ownership into one graph', status: 'pattern', source: null },
];

export function piecesIn(layer: LayerId): Piece[] {
  return PIECES.filter((p) => p.layer === layer);
}

export function countByStatus(layer: LayerId): Record<PieceStatus, number> {
  const r: Record<PieceStatus, number> = { spec: 0, project: 0, pattern: 0 };
  for (const p of piecesIn(layer)) r[p.status] += 1;
  return r;
}
