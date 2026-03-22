import { describe, test } from "vitest";
import { tokens, tokenize } from "src/tokenize";
import { AssertionError } from "assert";
import { inspect } from "util";

function tokenizationOf(input: string) {
	return {
		shouldEqual(expected: any, ...additional: any[]) {
			const err = new AssertionError({
				stackStartFn: this.shouldEqual,
				message: "did not match expected tokens",
			});
			err.expected = [expected, ...additional];
			test(input, (t) => {
				const debug = console.debug;
				const logs: any[][] = [];
				console.debug = (...args: any[]) => {
					logs.push(args);
				};
				const actual = tokenize(input);
				console.debug = debug;
				try {
					t.expect(actual).toEqual(err.expected);
				} catch (cause) {
					err.actual = actual;
					err.cause = new Error(
						"Logs: \n" +
							logs.map((line) => line.map((it) => inspect(it)).join(" ")).join("\n"),
					);
					throw err;
				}
			});
		},
	};
}

describe("tokenization", () => {
	const { Negate, word, phrase, keywords, symbols, operators } = tokens;

	tokenizationOf(`-`).shouldEqual(Negate);
	tokenizationOf(`hello`).shouldEqual(word("hello"));
	tokenizationOf(`hello world`).shouldEqual(word("hello"), word("world"));
	tokenizationOf(`"hello world"`).shouldEqual(phrase("hello world"));
	tokenizationOf(`"they said \\"hello\\" to each other"`).shouldEqual(
		phrase('they said "hello" to each other'),
	);
	tokenizationOf(`-"hello world"`).shouldEqual(Negate, phrase("hello world"));
	tokenizationOf(`meeting OR work`).shouldEqual(word("meeting"), keywords.OR, word("work"));
	tokenizationOf(`meeting (work OR meetup) personal`).shouldEqual(
		word("meeting"),
		symbols.GroupStart,
		word("work"),
		keywords.OR,
		word("meetup"),
		symbols.GroupEnd,
		word("personal"),
	);

	tokenizationOf(`file:.jpg`).shouldEqual(operators.File, symbols.Colon, word(".jpg"));
	tokenizationOf(`file:202209`).shouldEqual(operators.File, symbols.Colon, word("202209"));
	tokenizationOf(`file 202209`).shouldEqual(word("file"), word("202209"));
	tokenizationOf(`path:"Daily notes/2022-07"`).shouldEqual(
		operators.Path,
		symbols.Colon,
		phrase("Daily notes/2022-07"),
	);
	tokenizationOf(`content:"happy cat"`).shouldEqual(
		operators.Content,
		symbols.Colon,
		phrase("happy cat"),
	);
	tokenizationOf(`match-case:HappyCat`).shouldEqual(
		operators.MatchCase,
		symbols.Colon,
		word("HappyCat"),
	);
	tokenizationOf(`ignore-case:ikea`).shouldEqual(
		operators.IgnoreCase,
		symbols.Colon,
		word("ikea"),
	);
	tokenizationOf(`tag:#work`).shouldEqual(operators.Tag, symbols.Colon, word("#work"));
	tokenizationOf(`line:(mix flour)`).shouldEqual(
		operators.Line,
		symbols.Colon,
		symbols.GroupStart,
		word("mix"),
		word("flour"),
		symbols.GroupEnd,
	);
	tokenizationOf(`block:(dog cat)`).shouldEqual(
		operators.Block,
		symbols.Colon,
		symbols.GroupStart,
		word("dog"),
		word("cat"),
		symbols.GroupEnd,
	);
	tokenizationOf(`section:(dog cat)`).shouldEqual(
		operators.Section,
		symbols.Colon,
		symbols.GroupStart,
		word("dog"),
		word("cat"),
		symbols.GroupEnd,
	);
	tokenizationOf(`task:call`).shouldEqual(operators.Task, symbols.Colon, word("call"));
	tokenizationOf(`task-todo:call`).shouldEqual(operators.TaskToDo, symbols.Colon, word("call"));
	tokenizationOf(`task-done:call`).shouldEqual(operators.TaskDone, symbols.Colon, word("call"));

	tokenizationOf(`[aliases]`).shouldEqual(
		symbols.BracketOpen,
		word("aliases"),
		symbols.BracketClose,
	);
	tokenizationOf(`[aliases:Name]`).shouldEqual(
		symbols.BracketOpen,
		word("aliases"),
		symbols.Colon,
		word("Name"),
		symbols.BracketClose,
	);
	tokenizationOf(`[aliases:Name OR Published]`).shouldEqual(
		symbols.BracketOpen,
		word("aliases"),
		symbols.Colon,
		word("Name"),
		keywords.OR,
		word("Published"),
		symbols.BracketClose,
	);
});
