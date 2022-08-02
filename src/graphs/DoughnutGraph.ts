import { ChartConfiguration, ChartTypeRegistry } from "chart.js";
import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import { GraphBase } from "./BaseGraph";
import { StatsManager } from "../StatsManager";
import { DoughnutStats, GraphType, DoughnutGraphOptions } from "../types/types";

/** Class that generate Douhnout graph
 * @extends GraphBase
 */
class DoughnutGraph extends GraphBase {
	fillColors: string[];
	displayOthers: boolean;
	/**
	 * @param {StatsManager} statsmanager - Your StatsManager instance
	 * @param {DoughnutGraphOptions} options - options for the graph
	 * @param {string[]} [options.fillColors = ["#ED4245", "#57F287", "#FEE75C", "#EB459E", "#FFFFFF", "#7289DA"]] - Colors of the doughnut
	 * @param {boolean} [options.displayOthers = true] - Display the category others in doughnut
	 * @param {number} [options.height = 400] - The height of the graph
	 * @param {number} [options.width = 800] - The width of the graph
	 * @param {number} [options.time = 604800000] - The time in miliseconds that the graph will display default is 1 week
	 * @param {string} [options.color = "rgba(227, 227, 227, 0.9)"] - The color of the text and borders
	 * @param {string} [options.backgroundColor = "rgba(40, 40, 40, 0.9)"] - The color of the background
	 * @param {number} [options.fontSize = 14] - The font size of the text
	 */
	constructor(statsmanager: StatsManager, options: DoughnutGraphOptions = {}) {
		super(statsmanager, GraphType.DOUGHNUT, options);
		this.fillColors = options.fillColors || ["#ED4245", "#57F287", "#FEE75C", "#EB459E", "#FFFFFF", "#7289DA"];
		this.displayOthers = options.displayOthers || true;
	}

	/**
	 * @param {DoughnutStats[]} data - Data to generate the graph
	 * @returns {Promise<Buffer>} - Promise that resolve to the generated graph
	 */
	async generateCanvas(data: DoughnutStats[]): Promise<Buffer> {
		const width = this.width;
		const height = this.height;
		const chartJsNodeCanvas = new ChartJSNodeCanvas({ width, height });

		const preparedData = data
			.sort((a, b) => a.timestamp - b.timestamp)
			.filter(d => d.timestamp > Date.now() - this.time);

		let radius = 35;

		const reducedData = preparedData.reduce(
			(acc, prev) => {
				for (const someObj of acc.value.keys()) {
					if (prev.value.has(someObj))
						prev.value.set(someObj, prev.value.get(someObj) + acc.value.get(someObj));
					else prev.value.set(someObj, acc.value.get(someObj));
				}
				return prev;
			},
			{
				timestamp: 0,
				value: new Map<string, number>()
			}
		);

		const dataArray = [...reducedData.value.entries()].map(d => {
			return { name: d[0], value: d[1] };
		});

		const total = dataArray.reduce((acc, prev) => acc + prev.value, 0);

		let topFive = dataArray.sort((a, b) => b.value - a.value).slice(0, 5);
		if (this.displayOthers)
			topFive = topFive.concat({
				name: "Others",
				value: total - topFive.reduce((acc, prev) => acc + prev.value, 0)
			});

		const configuration: ChartConfiguration<keyof ChartTypeRegistry> = {
			type: "doughnut",
			data: {
				labels: topFive.map(d => `${d.name} - ${Math.round((d.value / total) * 100)}%`),
				datasets: [
					{
						borderColor: this.color,
						borderWidth: 4,
						data: topFive.map(d => d.value),
						fill: "start",
						tension: 0.4,
						backgroundColor: this.fillColors
					}
				]
			},
			plugins: [
				{
					id: "custom_canvas_background_color",
					beforeDraw: chart => {
						const { ctx } = chart;
						ctx.save();
						ctx.globalCompositeOperation = "destination-over";
						ctx.fillStyle = this.backgroundColor;
						if (width < 2 * radius) radius = width / 2;
						if (height < 2 * radius) radius = height / 2;
						ctx.beginPath();
						ctx.moveTo(0 + radius, 0);
						ctx.arcTo(0 + width, 0, 0 + width, 0 + height, radius);
						ctx.arcTo(0 + width, 0 + height, 0, 0 + height, radius);
						ctx.arcTo(0, 0 + height, 0, 0, radius);
						ctx.arcTo(0, 0, 0 + width, 0, radius);
						ctx.closePath();
						ctx.fill();
						ctx.restore();
					}
				}
			]
		};

		const image = chartJsNodeCanvas.renderToBuffer(configuration);

		return image;
	}
}

export { DoughnutGraph };
