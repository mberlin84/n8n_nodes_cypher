# n8n-nodes-memgraph

An [n8n](https://n8n.io) community node to interact with [Memgraph](https://memgraph.com) – an in-memory graph database compatible with the Neo4j Bolt protocol.

## Installation

In your n8n instance, go to **Settings → Community Nodes** and install:

```
n8n-nodes-memgraph
```

Or, for local/self-hosted n8n:

```bash
npm install n8n-nodes-memgraph
```

## Prerequisites

A running Memgraph instance accessible via the Bolt protocol (default port `7687`).

Quick start with Docker:

```bash
docker run -p 7687:7687 memgraph/memgraph
```

## Credentials

Configure the **Memgraph API** credential with:

| Field    | Description                                              | Default                    |
|----------|----------------------------------------------------------|----------------------------|
| Bolt URL | Bolt connection URL                                      | `bolt://localhost:7687`    |
| Username | Username (leave empty if auth is disabled)               | _(empty)_                  |
| Password | Password (leave empty if auth is disabled)               | _(empty)_                  |

## Operations

### Run Cypher Query
Execute any custom Cypher query and return all result records.

**Parameters:**
- **Cypher Query** – the query to execute (e.g. `MATCH (n) RETURN n LIMIT 25`)
- **Query Parameters** – JSON object of parameters referenced in the query (e.g. `{"name": "Alice"}`)

### Create Node
Create a new node with a label and a set of properties.

**Parameters:**
- **Label** – node label (e.g. `Person`)
- **Properties** – JSON object of properties (e.g. `{"name": "Alice", "age": 30}`)

Returns the created node with its internal `_id` and `_labels`.

### Get Node
Retrieve nodes by label with an optional property filter.

**Parameters:**
- **Label** – node label to match
- **Filter Property** – property name to filter by (optional)
- **Filter Value** – value to match (optional)
- **Limit** – max number of nodes to return (default `25`)

### Update Node
Update properties on nodes that match a label and a property value.

**Parameters:**
- **Label** – node label to match
- **Match Property** – property used to identify target nodes
- **Match Value** – value to match
- **Update Properties** – JSON object with properties to set/update (uses `SET n += …`)

### Delete Node
Delete nodes matching a label and a property value.

**Parameters:**
- **Label** – node label to match
- **Match Property** – property used to identify target nodes
- **Match Value** – value to match
- **Detach Relationships** – if enabled (default), uses `DETACH DELETE` to remove connected relationships too

Returns `{ success, nodesDeleted, relationshipsDeleted }`.

### Create Relationship
Create a directed relationship between two nodes identified by their internal IDs.

**Parameters:**
- **From Node ID** – internal ID of the source node
- **To Node ID** – internal ID of the target node
- **Relationship Type** – relationship type (e.g. `KNOWS`, `WORKS_AT`)
- **Relationship Properties** – JSON object of properties for the relationship

## Result Format

Node results include:
```json
{
  "_id": 0,
  "_labels": ["Person"],
  "name": "Alice",
  "age": 30
}
```

Relationship results include:
```json
{
  "_id": 0,
  "_type": "KNOWS",
  "_startNodeId": 0,
  "_endNodeId": 1,
  "since": 2020
}
```

## Development

```bash
# Install dependencies
npm install

# Build (TypeScript + copy icons)
npm run build

# Watch mode
npm run dev
```

## License

[MIT](LICENSE)
