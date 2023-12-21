import { StringChecker } from "src/checkers/StringChecker";
import { FileFilter } from "src/filters/FileFilter";

export interface Parser {
    parse(char: string): Parser | null;
    end(): FileFilter | StringChecker | void;
}