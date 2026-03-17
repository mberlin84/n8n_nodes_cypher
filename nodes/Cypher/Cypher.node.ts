import neo4j, { Node, Relationship } from 'neo4j-driver';
import {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

function serializeValue(value: unknown): IDataObject | IDataObject[] | string | number | boolean | null {
	if (value instanceof Node) {
		return {
			_id: value.identity as unknown as number,
			_labels: value.labels as unknown as string,
			...(value.properties as IDataObject),
		} as IDataObject;
	}
	if (value instanceof Relationship) {
		return {
			_id: value.identity as unknown as number,
			_type: value.type,
			_startNodeId: value.start as unknown as number,
			_endNodeId: value.end as unknown as number,
			...(value.properties as IDataObject),
		} as IDataObject;
	}
	if (Array.isArray(value)) {
		return value.map((v) => serializeValue(v)) as IDataObject[];
	}
	if (value !== null && typeof value === 'object') {
		const result: IDataObject = {};
		for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
			result[k] = serializeValue(v);
		}
		return result;
	}
	return value as string | number | boolean | null;
}

function parseJson(
	raw: string | IDataObject,
	fieldName: string,
	node: ReturnType<IExecuteFunctions['getNode']>,
	itemIndex: number,
): IDataObject {
	try {
		return typeof raw === 'string'
			? (JSON.parse(raw) as IDataObject)
			: raw;
	} catch {
		throw new NodeOperationError(node, `${fieldName} must be valid JSON`, { itemIndex });
	}
}

export class Cypher implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Cypher',
		name: 'cypher',
		icon: 'file:matterandes.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Interact with a graph database via the Bolt protocol using Cypher queries',
		defaults: {
			name: 'Cypher',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'cypherApi',
				required: true,
			},
		],
		properties: [
			// ── Operation selector ─────────────────────────────────────────────────
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Run Cypher Query',
						value: 'runQuery',
						description: 'Execute a custom Cypher query',
						action: 'Run a Cypher query',
					},
					{
						name: 'Create Node',
						value: 'createNode',
						description: 'Create a new node with a label and properties',
						action: 'Create a node',
					},
					{
						name: 'Get Node',
						value: 'getNode',
						description: 'Retrieve nodes matching a label and an optional filter',
						action: 'Get nodes',
					},
					{
						name: 'Update Node',
						value: 'updateNode',
						description: 'Update properties on matching nodes',
						action: 'Update a node',
					},
					{
						name: 'Delete Node',
						value: 'deleteNode',
						description: 'Delete nodes matching a label and property filter',
						action: 'Delete a node',
					},
					{
						name: 'Create Relationship',
						value: 'createRelationship',
						description: 'Create a relationship between two nodes by their internal ID',
						action: 'Create a relationship',
					},
				],
				default: 'runQuery',
			},

			// ── Run Cypher Query ───────────────────────────────────────────────────
			{
				displayName: 'Cypher Query',
				name: 'query',
				type: 'string',
				typeOptions: { rows: 5 },
				displayOptions: { show: { operation: ['runQuery'] } },
				default: '',
				placeholder: 'MATCH (n) RETURN n LIMIT 25',
				description: 'The Cypher query to execute',
				required: true,
			},
			{
				displayName: 'Query Parameters',
				name: 'queryParameters',
				type: 'json',
				displayOptions: { show: { operation: ['runQuery'] } },
				default: '{}',
				description:
					'Parameters to pass to the query as a JSON object, e.g. {"name":"Alice"}',
			},

			// ── Create Node ────────────────────────────────────────────────────────
			{
				displayName: 'Label',
				name: 'label',
				type: 'string',
				displayOptions: {
					show: { operation: ['createNode', 'getNode', 'updateNode', 'deleteNode'] },
				},
				default: '',
				placeholder: 'Person',
				description: 'The node label',
				required: true,
			},
			{
				displayName: 'Properties',
				name: 'properties',
				type: 'json',
				displayOptions: { show: { operation: ['createNode'] } },
				default: '{}',
				description:
					'Properties for the new node as a JSON object, e.g. {"name":"Alice","age":30}',
			},

			// ── Get Node ───────────────────────────────────────────────────────────
			{
				displayName: 'Filter Property',
				name: 'filterProperty',
				type: 'string',
				displayOptions: { show: { operation: ['getNode'] } },
				default: '',
				placeholder: 'name',
				description:
					'Property name to filter by (leave empty to return all nodes with this label)',
			},
			{
				displayName: 'Filter Value',
				name: 'filterValue',
				type: 'string',
				displayOptions: { show: { operation: ['getNode'] } },
				default: '',
				placeholder: 'Alice',
				description: 'Value to match against the filter property',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				typeOptions: { minValue: 1 },
				displayOptions: { show: { operation: ['getNode'] } },
				default: 25,
				description: 'Maximum number of nodes to return',
			},

			// ── Update / Delete Node ───────────────────────────────────────────────
			{
				displayName: 'Match Property',
				name: 'matchProperty',
				type: 'string',
				displayOptions: { show: { operation: ['updateNode', 'deleteNode'] } },
				default: '',
				placeholder: 'name',
				description: 'Property name used to identify the node(s)',
				required: true,
			},
			{
				displayName: 'Match Value',
				name: 'matchValue',
				type: 'string',
				displayOptions: { show: { operation: ['updateNode', 'deleteNode'] } },
				default: '',
				placeholder: 'Alice',
				description: 'Value to match for the match property',
				required: true,
			},
			{
				displayName: 'Update Properties',
				name: 'updateProperties',
				type: 'json',
				displayOptions: { show: { operation: ['updateNode'] } },
				default: '{}',
				description:
					'Properties to set/update on the matched node(s) as a JSON object',
			},

			// ── Delete Node ────────────────────────────────────────────────────────
			{
				displayName: 'Detach Relationships',
				name: 'detach',
				type: 'boolean',
				displayOptions: { show: { operation: ['deleteNode'] } },
				default: true,
				description:
					'Whether to also delete all relationships connected to the node (DETACH DELETE). Disable to fail if the node has relationships.',
			},

			// ── Create Relationship ────────────────────────────────────────────────
			{
				displayName: 'From Node ID',
				name: 'fromNodeId',
				type: 'number',
				displayOptions: { show: { operation: ['createRelationship'] } },
				default: 0,
				description: 'Internal ID of the source node',
				required: true,
			},
			{
				displayName: 'To Node ID',
				name: 'toNodeId',
				type: 'number',
				displayOptions: { show: { operation: ['createRelationship'] } },
				default: 0,
				description: 'Internal ID of the target node',
				required: true,
			},
			{
				displayName: 'Relationship Type',
				name: 'relationshipType',
				type: 'string',
				displayOptions: { show: { operation: ['createRelationship'] } },
				default: '',
				placeholder: 'KNOWS',
				description: 'The relationship type (e.g. KNOWS, WORKS_AT)',
				required: true,
			},
			{
				displayName: 'Relationship Properties',
				name: 'relationshipProperties',
				type: 'json',
				displayOptions: { show: { operation: ['createRelationship'] } },
				default: '{}',
				description: 'Properties for the relationship as a JSON object',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const credentials = await this.getCredentials('cypherApi');

		const driver = neo4j.driver(
			credentials.boltUrl as string,
			neo4j.auth.basic(
				credentials.username as string,
				credentials.password as string,
			),
			{ disableLosslessIntegers: true },
		);

		const returnData: INodeExecutionData[] = [];
		const items = this.getInputData();

		try {
			for (let i = 0; i < items.length; i++) {
				const operation = this.getNodeParameter('operation', i) as string;
				const session = driver.session();

				try {
					if (operation === 'runQuery') {
						const query = this.getNodeParameter('query', i) as string;
						const paramsRaw = this.getNodeParameter('queryParameters', i) as
							| string
						| IDataObject;
						const params = parseJson(paramsRaw, 'Query Parameters', this.getNode(), i);

						const result = await session.run(query, params);
						for (const record of result.records) {
						const obj: IDataObject = {};
							for (const key of record.keys) {
								obj[key as string] = serializeValue(record.get(key as string));
							}
							returnData.push({ json: obj, pairedItem: { item: i } });
						}
					} else if (operation === 'createNode') {
						const label = this.getNodeParameter('label', i) as string;
						const propsRaw = this.getNodeParameter('properties', i) as
							| string
						| IDataObject;
						const props = parseJson(propsRaw, 'Properties', this.getNode(), i);

						const result = await session.run(`CREATE (n:\`${label}\` $props) RETURN n`, {
							props,
						});
						for (const record of result.records) {
							returnData.push({
								json: serializeValue(record.get('n')) as IDataObject,
								pairedItem: { item: i },
							});
						}
					} else if (operation === 'getNode') {
						const label = this.getNodeParameter('label', i) as string;
						const filterProperty = (
							this.getNodeParameter('filterProperty', i) as string
						).trim();
						const filterValue = this.getNodeParameter('filterValue', i) as string;
						const limit = this.getNodeParameter('limit', i) as number;

						let query: string;
						const params: Record<string, unknown> = {};
						const limitInt = Math.floor(limit);

						if (filterProperty) {
							query = `MATCH (n:\`${label}\`) WHERE n.\`${filterProperty}\` = $filterValue RETURN n LIMIT ${limitInt}`;
							params.filterValue = filterValue;
						} else {
							query = `MATCH (n:\`${label}\`) RETURN n LIMIT ${limitInt}`;
						}

						const result = await session.run(query, params);
						for (const record of result.records) {
							returnData.push({
							json: serializeValue(record.get('n')) as IDataObject,
								pairedItem: { item: i },
							});
						}
					} else if (operation === 'updateNode') {
						const label = this.getNodeParameter('label', i) as string;
						const matchProperty = this.getNodeParameter('matchProperty', i) as string;
						const matchValue = this.getNodeParameter('matchValue', i) as string;
						const updateRaw = this.getNodeParameter('updateProperties', i) as
							| string
						| IDataObject;
						const updateProps = parseJson(updateRaw, 'Update Properties', this.getNode(), i);

						const result = await session.run(
							`MATCH (n:\`${label}\`) WHERE n.\`${matchProperty}\` = $matchValue SET n += $updateProps RETURN n`,
							{ matchValue, updateProps },
						);
						for (const record of result.records) {
							returnData.push({
								json: serializeValue(record.get('n')) as IDataObject,
								pairedItem: { item: i },
							});
						}
					} else if (operation === 'deleteNode') {
						const label = this.getNodeParameter('label', i) as string;
						const matchProperty = this.getNodeParameter('matchProperty', i) as string;
						const matchValue = this.getNodeParameter('matchValue', i) as string;
						const detach = this.getNodeParameter('detach', i) as boolean;

						const deleteClause = detach ? 'DETACH DELETE n' : 'DELETE n';
						const result = await session.run(
							`MATCH (n:\`${label}\`) WHERE n.\`${matchProperty}\` = $matchValue ${deleteClause}`,
							{ matchValue },
						);

						const counters = result.summary.counters.updates();
						returnData.push({
							json: {
								success: true,
								nodesDeleted: counters.nodesDeleted,
								relationshipsDeleted: counters.relationshipsDeleted,
							},
							pairedItem: { item: i },
						});
					} else if (operation === 'createRelationship') {
						const fromNodeId = this.getNodeParameter('fromNodeId', i) as number;
						const toNodeId = this.getNodeParameter('toNodeId', i) as number;
						const relationshipType = this.getNodeParameter(
							'relationshipType',
							i,
						) as string;
						const relRaw = this.getNodeParameter('relationshipProperties', i) as
							| string
						| IDataObject;
						const relProps = parseJson(
							relRaw,
							'Relationship Properties',
							this.getNode(),
							i,
						);

						const result = await session.run(
							`MATCH (a), (b) WHERE id(a) = $fromId AND id(b) = $toId CREATE (a)-[r:\`${relationshipType}\` $relProps]->(b) RETURN r`,
							{ fromId: fromNodeId, toId: toNodeId, relProps },
						);
						for (const record of result.records) {
							returnData.push({
								json: serializeValue(record.get('r')) as IDataObject,
								pairedItem: { item: i },
							});
						}
					} else {
						throw new NodeOperationError(
							this.getNode(),
							`Unknown operation: ${operation}`,
							{ itemIndex: i },
						);
					}
				} finally {
					await session.close();
				}
			}
		} finally {
			await driver.close();
		}

		return [returnData];
	}
}
