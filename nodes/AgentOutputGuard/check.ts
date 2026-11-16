export type AgentOutputCheckInput = {
	text: string;
	maxCharacters: number;
	requireJson: boolean;
	blockedPhrases: string;
};

export type AgentOutputCheckResult = {
	ok: boolean;
	text: string;
	characterCount: number;
	reasons: string[];
};

export function checkAgentOutput(input: AgentOutputCheckInput): AgentOutputCheckResult {
	const reasons: string[] = [];
	const text = input.text;
	const characterCount = text.length;

	if (text.trim() === '') {
		reasons.push('Text is empty. Pass the agent output in the Text field.');
	}

	if (!Number.isInteger(input.maxCharacters) || input.maxCharacters < 0) {
		reasons.push('Max characters must be a whole number, 0 or greater. 0 means no limit.');
	} else if (input.maxCharacters > 0 && characterCount > input.maxCharacters) {
		reasons.push(`Text is ${characterCount} characters. The limit is ${input.maxCharacters}.`);
	}

	if (input.requireJson && text.trim() !== '') {
		try {
			JSON.parse(text);
		} catch {
			reasons.push('Text is not valid JSON.');
		}
	}

	const folded = text.toLowerCase();
	for (const phrase of blockedPhraseList(input.blockedPhrases)) {
		if (folded.includes(phrase.toLowerCase())) {
			reasons.push(`Text contains the blocked phrase "${phrase}".`);
		}
	}

	return {
		ok: reasons.length === 0,
		text,
		characterCount,
		reasons,
	};
}

function blockedPhraseList(raw: string): string[] {
	return raw
		.split(',')
		.map((phrase) => phrase.trim())
		.filter((phrase) => phrase.length > 0);
}
