import { Chart } from "chart.js";
import { StatsManager } from "../StatsManager";
import { StatsModule } from "../StatsModule";
import { GraphType, GraphOptions } from "../types/types";

// type GraphType = "line" | "bar" | "doughnut";

/** An abstract that should be extends to generate Graph  */
abstract class GraphBase {
	height: number;
	width: number;
	time: number;
	color: string;
	backgroundColor: string;
	statsmanager: StatsManager;
	graphType: GraphType;
	/**
	 * @param {StatsManager} statsmanager
	 * @param {GraphType} graphType - The GraphType
	 * @param {GraphOptions} options - The options for the graph
	 * @param {number} [options.height = 400] - The height of the graph
	 * @param {number} [options.width = 800] - The width of the graph
	 * @param {number} [options.time = 604800000] - The time in miliseconds that the graph will display default is 1 week
	 * @param {string} [options.color = "rgba(227, 227, 227, 0.9)"] - The color of the text and borders
	 * @param {string} [options.backgroundColor = "rgba(40, 40, 40, 0.9)"] - The color of the background
	 * @param {number} [options.fontSize = 14] - The font size of the text
	 */
	constructor(statsmanager: StatsManager, graphType: GraphType, options: GraphOptions = {}) {
		this.statsmanager = statsmanager;
		this.graphType = graphType;
		this.height = options.height || 400;
		this.width = options.width || 800;
		this.color = options.color || "rgba(227, 227, 227, 0.9)";
		this.time = options.time || 604800000;
		this.backgroundColor = options.backgroundColor || "rgba(40, 40, 40, 0.9)";

		Chart.defaults.color = options.color || "rgba(227, 227, 227, 0.9)";
		Chart.defaults.font.size = options.fontSize || 14;
	}

	/**
	 * @param {string} targetStats - The name of the stats to display
	 * @returns {Promise<Buffer>} - The graph buffer
	 * @example
	 * const graph = new LineGraph(statsmanager, "cpu", {
	 * 	height: 400,
	 * 	width: 800,
	 * 	time: 604800000,
	 * 	color: "rgba(227, 227, 227, 0.9)",
	 * 	backgroundColor: "rgba(40, 40, 40, 0.9)",
	 * 	fontSize: 14
	 * });
	 * const buffer = graph.generate("ram");
	 * fs.writeFileSync("ram.png", buffer);
	 * @throws {Error} - If there is no data found
	 * @throws {Error} - If the graph type is not supported
	 */
	async generate(targetStats: string): Promise<Buffer> {
		const data = await this.statsmanager.getStats();
		if (this.statsmanager.debuggingMode) console.debug(`[GraphBase] Acquired ${data.length} stats`);
		if (data.length === 0) throw new Error("No data was found");

		const module: StatsModule = this.statsmanager.findModule(targetStats);

		if (!module) throw new Error(`Module ${targetStats} not found or not enabled`);

		if (this.graphType === GraphType.LINE && module.dataType === "number") {
			return this.generateCanvas(
				data.map(d => {
					if (!module.validInputData(d.stats[module.name]))
						throw new Error(`Invalid data type for module ${targetStats}`);
					return { timestamp: d.timestamp, value: d.stats[module.name] as number };
				})
			);
		} else if (this.graphType === GraphType.BAR && module.dataType === "map") {
			return this.generateCanvas(
				data.map(d => {
					const mapData: Map<string, number> = new Map(Object.entries(d.stats[module.name]));
					if (!module.validInputData(mapData)) throw new Error(`Invalid data type for module ${targetStats}`);
					return { timestamp: d.timestamp, value: mapData };
				})
			);
		} else if (this.graphType === GraphType.DOUGHNUT && module.dataType === "map") {
			return this.generateCanvas(
				data.map(d => {
					const mapData: Map<string, number> = new Map(Object.entries(d.stats[module.name]));
					if (!module.validInputData(mapData)) throw new Error(`Invalid data type for module ${targetStats}`);
					return { timestamp: d.timestamp, value: mapData };
				})
			);
		}
		throw new Error(`Invalid graph type for module ${targetStats}`);
	}

	/**
	 * @abstract
	 * @param {Array} data - GraphDatas
	 * @returns {Promise<Buffer>} - The graph buffer
	 */
	// eslint-disable-next-line no-unused-vars
	abstract generateCanvas(data: unknown[]): Promise<Buffer>;
}

export { GraphBase };
