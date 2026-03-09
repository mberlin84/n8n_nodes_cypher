import { ICredentialType, ICredentialTestRequest, INodeProperties } from 'n8n-workflow';

export class CypherApi implements ICredentialType {
	name = 'cypherApi';
	displayName = 'Cypher API';
	documentationUrl = 'https://neo4j.com/docs/bolt/current/';
	test: ICredentialTestRequest = {
		request: {
			// try to hit an HTTP endpoint on the same host as the Bolt URL
			// (replace bolt:// or neo4j:// with http:// so the httpRequest helper can run)
			url: '={{$credentials.boltUrl.replace(/^bolt(s)?:/, "http$")}}',
			method: 'GET',
		},
	};

	properties: INodeProperties[] = [
		{
			displayName: 'Bolt URL',
			name: 'boltUrl',
			type: 'string',
			default: 'bolt://localhost:7687',
			placeholder: 'bolt://localhost:7687',
			description: 'The Bolt URL of the graph database instance',
		},
		{
			displayName: 'Username',
			name: 'username',
			type: 'string',
			default: '',
			description:
				'The username for authentication (leave empty if authentication is disabled)',
		},
		{
			displayName: 'Password',
			name: 'password',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description:
				'The password for authentication (leave empty if authentication is disabled)',
		},
	];
}
