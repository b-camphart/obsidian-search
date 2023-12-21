import { expect, assert } from 'vitest'

expect.extend({
    toEqualOneOf<T>(recevied: any, expected: T[]) {
        const pass= expected.find(possibility => {
            try {
                assert.deepEqual(recevied, possibility)
                return true;
            } catch {
                return false;
            }
        }) != null
        return {
            pass,
            actual: recevied,
            expected,
            message: () => `expected ${recevied.constructor.name} to be in possibilities`
        }
    }
})