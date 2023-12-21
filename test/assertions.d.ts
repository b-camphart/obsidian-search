import type { AsymmetricMatchersContaining , Assertion } from 'vitest'

interface PossibleMatcher<T = unknown> {
    toEqualOneOf(possibilities: T[]): void;
}

declare module 'vitest' {
    interface Assertion<T = any> extends PossibleMatcher<T> {}
    interface AsymmetricMatchersContaining extends PossibleMatcher {}
}