# n8n-nodes-agent-output-guard

An n8n community node that checks text from an AI agent before the next step runs. It checks the length, whether the text is JSON, and whether it contains phrases you list.

The built-in guardrail runner lives inside n8n Agents. This node is for a normal workflow, including a LangChain agent node, where you want the same kind of check on the text you already have.

## Install

In n8n, go to Settings, then Community nodes, and install:

```
n8n-nodes-agent-output-guard
```

For a local checkout:

```bash
npm install
npm run build
npm run dev
```

`npm run dev` starts n8n with this node loaded.

## Use

1. Add **Agent Output Guard** after the node that produces the agent text.
2. Set **Text** to an expression, for example `{{ $json.output }}`.
3. Set **Max Characters** to the longest reply you accept. `0` means no limit.
4. Turn on **Require JSON** when the next node needs a JSON object.
5. Put phrases you will not accept in **Blocked Phrases**, separated by commas. Matching ignores case.
6. **On Failure** is **Stop** by default. Choose **Continue** to output the item with `ok: false` and a `reasons` array instead of failing the run.

A passing item looks like this:

```json
{
	"ok": true,
	"text": "The order id is 1842.",
	"characterCount": 22,
	"reasons": []
}
```

A stopped item fails the node with one message that lists every reason. Empty text, a bad limit, invalid JSON, and a blocked phrase are all reported together.

## Example workflow

Import [workflows/example.json](workflows/example.json). It runs the node on a short sentence with a 200 character limit and the phrases `password` and `api key`. Execute it. The output item has `ok: true`.

Change the text to `The API Key is in the note.` and execute again. The node stops, and the message names the phrase.

## Develop

```bash
npm install
npm test
npm run lint
npm run build
```

The tests cover the check function. They do not need a running n8n.

## License

[MIT](LICENSE.md)
