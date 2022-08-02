import { GraphType, StatsModuleOptions } from "./types/types";

/**
 * Creates a StatsModule
 * @class StatsModule
 * @description Manages a single stats.
 */
class StatsModule {
	private _name: string;
	private _graphType: GraphType;
	private _dataType: "number" | "map";
	/**
	 * @param {string} name - The name of the module.
	 * @param {StatsModuleOptions} options - The options for the module.
	 * @param {GraphType} options.graphType - The graph type.
	 * @param {"number" | "map"} options.dataType - The data type.
	 */
	constructor(name: string, options: StatsModuleOptions) {
		this._name = name;
		this._graphType = options.graphType;
		this._dataType = options.dataType;
	}

	/**
	 * Gets the name of the module.
	 * @returns {string}
	 * @readonly
	 */
	get name(): string {
		return this._name;
	}

	/**
	 * Gets the graph type of the module.
	 * @returns {GraphType}
	 * @readonly
	 */
	get graphType(): GraphType {
		return this._graphType;
	}

	/**
	 * Gets the data type of the module.
	 * @returns {"number" | "map"}
	 * @readonly
	 */
	get dataType(): "number" | "map" {
		return this._dataType;
	}

	/**
	 * Validates the data provide to the module.
	 * @param {any} data - The data to validate.
	 * @returns {boolean}
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	validInputData(data: any): boolean {
		console.log(data, data instanceof Map);
		if (this._dataType === "number" && isNaN(data)) {
			return false;
		} else if (this._dataType === "map" && !(data instanceof Map)) {
			return false;
		} else return true;
	}
}

export { StatsModule };
