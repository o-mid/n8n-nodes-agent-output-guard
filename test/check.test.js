const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const { checkAgentOutput } = require('../dist/nodes/AgentOutputGuard/check.js');

const base = {
	text: 'The order id is 1842.',
	maxCharacters: 0,
	requireJson: false,
	blockedPhrases: '',
};

describe('checkAgentOutput', () => {
	it('accepts text when no limit is set', () => {
		const result = checkAgentOutput(base);
		assert.equal(result.ok, true);
		assert.deepEqual(result.reasons, []);
		assert.equal(result.characterCount, base.text.length);
	});

	it('rejects empty text', () => {
		const result = checkAgentOutput({ ...base, text: '   ' });
		assert.equal(result.ok, false);
		assert.equal(result.reasons[0], 'Text is empty. Pass the agent output in the Text field.');
	});

	it('rejects text over the character limit', () => {
		const result = checkAgentOutput({ ...base, maxCharacters: 5 });
		assert.equal(result.ok, false);
		assert.match(result.reasons[0], /limit is 5/);
	});

	it('accepts text that is exactly the limit', () => {
		const text = 'abcde';
		const result = checkAgentOutput({ ...base, text, maxCharacters: text.length });
		assert.equal(result.ok, true);
	});

	it('rejects a negative or fractional limit', () => {
		assert.equal(checkAgentOutput({ ...base, maxCharacters: -1 }).ok, false);
		assert.equal(checkAgentOutput({ ...base, maxCharacters: 1.5 }).ok, false);
	});

	it('requires valid JSON when that check is on', () => {
		const good = checkAgentOutput({
			...base,
			text: '{"orderId":1842}',
			requireJson: true,
		});
		const bad = checkAgentOutput({ ...base, requireJson: true });
		assert.equal(good.ok, true);
		assert.equal(bad.ok, false);
		assert.equal(bad.reasons[0], 'Text is not valid JSON.');
	});

	it('matches blocked phrases without case, and ignores blanks', () => {
		const result = checkAgentOutput({
			...base,
			text: 'The API Key is in the note.',
			blockedPhrases: ' , api key, password ',
		});
		assert.equal(result.ok, false);
		assert.deepEqual(result.reasons, ['Text contains the blocked phrase "api key".']);
	});

	it('reports every failed check', () => {
		const result = checkAgentOutput({
			text: 'not json and it has a secret',
			maxCharacters: 4,
			requireJson: true,
			blockedPhrases: 'secret',
		});
		assert.equal(result.ok, false);
		assert.equal(result.reasons.length, 3);
	});
});
