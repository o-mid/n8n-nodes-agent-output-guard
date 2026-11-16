import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import { checkAgentOutput } from './check';

function parameterString(value: unknown, fallback: string): string {
	return typeof value === 'string' ? value : fallback;
}

function parameterNumber(value: unknown, fallback: number): number {
	return typeof value === 'number' ? value : fallback;
}

function parameterBoolean(value: unknown, fallback: boolean): boolean {
	return typeof value === 'boolean' ? value : fallback;
}

export class AgentOutputGuard implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Agent Output Guard',
		name: 'agentOutputGuard',
		icon: { light: 'file:guard.svg', dark: 'file:guard.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: 'Check agent text',
		description: 'Check agent text for length, JSON, and blocked phrases',
		defaults: {
			name: 'Agent Output Guard',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		properties: [
			{
				displayName: 'Text',
				name: 'text',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				required: true,
				description:
					'The agent output to check. Use an expression to read it from the previous node.',
			},
			{
				displayName: 'Max Characters',
				name: 'maxCharacters',
				type: 'number',
				typeOptions: {
					minValue: 0,
				},
				default: 0,
				description: 'Longest text to accept. 0 means no limit.',
			},
			{
				displayName: 'Require JSON',
				name: 'requireJson',
				type: 'boolean',
				default: false,
				description: 'Whether the text must be valid JSON',
			},
			{
				displayName: 'Blocked Phrases',
				name: 'blockedPhrases',
				type: 'string',
				default: '',
				placeholder: 'password, api key',
				description: 'Phrases to reject, separated by commas. Matching ignores case.',
			},
			{
				displayName: 'On Failure',
				name: 'onFailure',
				type: 'options',
				default: 'error',
				options: [
					{
						name: 'Stop',
						value: 'error',
						description: 'Fail the item and show the reasons',
					},
					{
						name: 'Continue',
						value: 'item',
						description: 'Output the item with ok set to false',
					},
				],
				description: 'What to do when a check fails',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const output: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			let text = '';
			let maxCharacters = 0;
			let requireJson = false;
			let blockedPhrases = '';
			let onFailure = 'error';
			try {
				text = parameterString(this.getNodeParameter('text', itemIndex, ''), '');
				maxCharacters = parameterNumber(this.getNodeParameter('maxCharacters', itemIndex, 0), 0);
				requireJson = parameterBoolean(
					this.getNodeParameter('requireJson', itemIndex, false),
					false,
				);
				blockedPhrases = parameterString(
					this.getNodeParameter('blockedPhrases', itemIndex, ''),
					'',
				);
				onFailure = parameterString(
					this.getNodeParameter('onFailure', itemIndex, 'error'),
					'error',
				);
			} catch (error) {
				if (this.continueOnFail()) {
					const message = error instanceof Error ? error.message : 'Agent output check failed.';
					output.push({
						json: { ok: false, text: '', characterCount: 0, reasons: [message] },
						pairedItem: { item: itemIndex },
					});
					continue;
				}
				const cause = error instanceof Error ? error : new Error('Agent output check failed.');
				throw new NodeOperationError(this.getNode(), cause, { itemIndex });
			}

			const result = checkAgentOutput({ text, maxCharacters, requireJson, blockedPhrases });
			if (!result.ok && onFailure === 'error') {
				throw new NodeOperationError(
					this.getNode(),
					`Agent output was rejected. ${result.reasons.join(' ')}`,
					{ itemIndex },
				);
			}

			output.push({
				json: { ...result },
				pairedItem: { item: itemIndex },
			});
		}

		return [output];
	}
}
