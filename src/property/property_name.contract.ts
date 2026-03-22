import { SearchContract, exampleQuery, matches } from "../contract";

export const propertyNameContractTest: SearchContract = async (search, file) => {
	await exampleQuery(search, `[property]`, [
		matches("Files with the property", [
			await file({ properties: { property: false } }),
			await file({ properties: { property: 0 } }),
			await file({ properties: { property: "" } }),
			await file({ properties: { property: [] } }),
			await file({ properties: { property: {} } }),
		]),
	]);
};
