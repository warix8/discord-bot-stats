interface StatsModuleOptions {
	graphType: GraphType;
	dataType: "number" | "map";
}

export enum GraphType {
	LINE = "line",
	BAR = "bar",
	DOUGHNUT = "doughnut"
}

export default class {
	private _name: string;
	private _graphType: GraphType;
	private _dataType: "number" | "map";
	constructor(name: string, options: StatsModuleOptions) {
		this._name = name;
		this._graphType = options.graphType;
		this._dataType = options.dataType;
	}

	get name(): string {
		return this._name;
	}

	get graphType(): GraphType {
		return this._graphType;
	}

	get dataType(): "number" | "map" {
		return this._dataType;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	validInputData(data: any): boolean {
		console.log(data, (data instanceof Map));
		if (this._dataType === "number" && isNaN(data)) {
			return false;
		} else if (this._dataType === "map" && !(data instanceof Map)) {
			return false;
		} else return true;
	}
}
