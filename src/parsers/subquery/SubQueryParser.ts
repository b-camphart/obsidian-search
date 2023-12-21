import { StringChecker } from "src/checkers/StringChecker";

export interface SubQueryParser {
    parse(char: string): SubQueryParser | null;
    end(): StringChecker | void;
}