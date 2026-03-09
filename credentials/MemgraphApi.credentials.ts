import { ICredentialType, INodeProperties } from 'n8n-workflow';

export class MemgraphApi implements ICredentialType {
	name = 'memgraphApi';
	displayName = 'Memgraph API';
	documentationUrl = 'https://memgraph.com/docs/client-libraries/nodejs';
	properties: INodeProperties[] = [
		{
			displayName: 'Bolt URL',
			name: 'boltUrl',
			type: 'string',
			default: 'bolt://localhost:7687',
			placeholder: 'bolt://localhost:7687',
			description: 'The Bolt URL of the Memgraph instance',
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
