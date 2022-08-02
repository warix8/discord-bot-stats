import { ChartConfiguration, ChartTypeRegistry } from "chart.js";
import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import { GraphBase } from "./BaseGraph";
import { StatsManager } from "../StatsManager";
import { LineGraphOptions, GraphType, LineStats } from "../types/types";

/** The LineGraph class to generate linear graphics
 * @extends GraphBase
 */
class LineGraph extends GraphBase {
	lineColor: string;
	fillColor: string;
	dataSetName: string;
	/**
	 * @param {StatsManager} statsmanager - Your StatsManager instance
	 * @param {LineGraphOptions} options - The graph options
	 * @param {string} [options.dataSetName = "Unamed"] - The name of the data set
	 * @param {string} [options.lineColor = "rgba(255, 152, 56, 0.9)"] - The color of the line
	 * @param {string} [options.fillColor = "rgba(255, 152, 56, 0.4)"] - The color that will fill the graph under the line
	 * @param {number} [options.height = 400] - The height of the graph
	 * @param {number} [options.width = 800] - The width of the graph
	 * @param {number} [options.time = 604800000] - The time in miliseconds that the graph will display default is 1 week
	 * @param {string} [options.color = "rgba(227, 227, 227, 0.9)"] - The color of the text and borders
	 * @param {string} [options.backgroundColor = "rgba(40, 40, 40, 0.9)"] - The color of the background
	 * @param {number} [options.fontSize = 14] - The font size of the text
	 */
	constructor(statsmanager: StatsManager, options: LineGraphOptions = { dataSetName: "Unamed" }) {
		super(statsmanager, GraphType.LINE, options);
		this.lineColor = options.lineColor || "rgba(255, 152, 56, 0.9)";
		this.fillColor = options.fillColor || "rgba(255, 152, 56, 0.4)";
		this.dataSetName = options.dataSetName;
	}

	/**
	 * @param {LineStats[]} data - The data to generate the graph
	 * @returns {Promise<Buffer>} - Promise that resolve to the generated graph
	 */
	async generateCanvas(data: LineStats[]): Promise<Buffer> {
		const width = 1080;
		const height = 520;
		const chartJsNodeCanvas = new ChartJSNodeCanvas({ width, height });

		const preparedData = data
			.sort((a, b) => a.timestamp - b.timestamp)
			.filter(d => d.timestamp > Date.now() - this.time);

		let radius = 35;

		const configuration: ChartConfiguration<keyof ChartTypeRegistry> = {
			type: "line",
			data: {
				labels: preparedData.map(d =>
					new Date(d.timestamp).toLocaleString("FR-fr", { timeZone: "Europe/Paris" })
				),
				datasets: [
					{
						borderColor: this.lineColor,
						backgroundColor: this.fillColor,
						borderWidth: 4,
						data: preparedData.map(d => d.value),
						label: this.dataSetName,
						fill: "start",
						tension: 0.2
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
			],
			options: {
				plugins: {
					legend: {
						display: true
					}
				},
				scales: {
					x: {
						ticks: {
							maxTicksLimit: 16,
							maxRotation: 30
						}
					}
				},
				elements: {
					point: {
						radius: 0
					}
				}
			}
		};

		const image = chartJsNodeCanvas.renderToBuffer(configuration);

		return image;
	}
}

export { LineGraph };
