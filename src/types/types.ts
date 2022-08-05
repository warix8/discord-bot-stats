/* eslint-disable no-unused-vars */
export interface StatsModuleOptions {
	graphType: GraphType;
	dataType: "number" | "map";
}

export enum GraphType {
	LINE = "line",
	BAR = "bar",
	DOUGHNUT = "doughnut"
}

export type PossibleStats = "cpu" | "ram" | "servers" | "users" | "shards" | "commands" | "errors";

export type EnabledStats = {
	[key in PossibleStats]?: boolean;
};

export type Stats = {
	[key: string]: number | Map<string, unknown>;
};

export interface SavedStatsFormat {
	timestamp: number;
	stats: Stats;
}

export interface StatsManagerOptions {
	scheduleCron?: string;
	debuggingMode?: boolean;
	enabledStats?: EnabledStats;
}

export interface StatsAcquisition {
	(): Promise<SavedStatsFormat>;
}

export interface GraphOptions {
	height?: number;
	width?: number;
	time?: number;
	color?: string;
	backgroundColor?: string;
	fontSize?: number;
	labels?: string[];
	displayOthers?: boolean;
}

export interface LineGraphOptions extends GraphOptions {
	lineColor?: string;
	fillColor?: string;
	dataSetName: string;
}

export interface LineStats {
	timestamp: number;
	value: number;
}

export interface BarGraphOptions extends GraphOptions {
	fillColors?: string[];
	displayOthers?: boolean;
}

export interface BarStats {
	timestamp: number;
	value: Map<string, number>;
}

export interface DoughnutGraphOptions extends GraphOptions {
	fillColors?: string[];
	displayOthers?: boolean;
}

export interface DoughnutStats {
	timestamp: number;
	value: Map<string, number>;
}
