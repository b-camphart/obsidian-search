import * as obsidian from "obsidian";
import { AsyncFilter, Filter } from "./Filter";

export type FileFilter = Filter<obsidian.TFile>;
export type AsyncFileFilter = AsyncFilter<obsidian.TFile>;
