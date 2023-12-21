
export function expect(actual: any[]): CollectionExpectation;
export function expect(actual: any): ValueExpectation<any>;
export function expect(actual: any | any[]) {
    return new Expectation(actual)
}

export interface ValueExpectation<Self extends ValueExpectation<Self>> {
    toStrictEqual(expected: any): void;
    toEqual(expected: any): void;
    not: Self
}

export interface CollectionExpectation extends ValueExpectation<CollectionExpectation> {
    toContainEqual(expected: any): void;
}

class Expectation implements CollectionExpectation {

    private inverted = false

    constructor(
        private actual: any
    ) {}

    toEqual(expected: any) {
        const actualStr = JSON.stringify(this.actual)
        const expectedStr = JSON.stringify(expected)
        if (actualStr !== expectedStr) {
            throw new Error(`Expected ${actualStr} to equal ${expectedStr}`)
        }
        return {actualStr, expectedStr}
    }

    toStrictEqual(expected: any): void {
        const {actualStr, expectedStr} = this.toEqual(expected)
        if (typeof this.actual !== typeof expected) {
            throw new Error(`Expected same type`)
        }
    }

    get not() {
        this.inverted = true
        return this
    }

    toContainEqual(expected: any): void {
        for (const element of this.actual) {
            if (element === expected) {
                if (this.inverted) throw new Error(`Expected ${this.actual} not to contain ${expected}`)
                else return;
            }
        }
        if (!this.inverted) throw new Error(`Expected ${this.actual} to contain ${expected}`)
        else return
    }

}
