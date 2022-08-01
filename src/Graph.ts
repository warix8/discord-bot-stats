import { Chart, ChartConfiguration, ChartTypeRegistry } from "chart.js";
import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import StatsManager, { PossibleStats } from "../src/StatsManager";

interface GraphOptions {
	height?: number;
	width?: number;
	time?: number;
	color?: string;
	backgroundColor?: string;
	fontSize?: number;
	lineColor?: string;
	fillColor?: string;
}

type GraphType = "line" | "bar" | "doughnut";

interface LineStats {
	timestamp: number;
	value: number;
}

export default class {
	height: number;
	width: number;
	time: number;
	color: string;
	lineColor: string;
	backgroundColor: string;
	statsmanager: StatsManager;
	constructor(statsmanager: StatsManager, options: GraphOptions = {}) {
		this.statsmanager = statsmanager;
		this.height = options.height || 400;
		this.width = options.width || 800;
		this.color = options.color || "rgba(255, 152, 56, 0.9)";
		this.time = options.time || 7 * 24 * 60 * 60 * 1000;
		this.lineColor = options.lineColor || "rgba(255, 152, 56, 0.9)";
		this.backgroundColor = options.backgroundColor || "rgba(40, 40, 40, 0.9)";

		Chart.defaults.color = options.color || "rgba(227, 227, 227, 0.9)";
		Chart.defaults.backgroundColor = options.fillColor || "rgba(255, 152, 56, 0.4)";
		Chart.defaults.font.size = options.fontSize || 14;
	}

	async generate(targetStats: PossibleStats): Promise<Buffer> {
		const data = await this.statsmanager.getStats();
		switch (targetStats) {
			case "cpu":
				return this.generateLine(
					data.map(d => {
						return { timestamp: d.timestamp, value: d.cpu };
					})
				);
			case "servers":
				return this.generateLine(
					data.map(d => {
						return { timestamp: d.timestamp, value: d.servers };
					})
				);
			case "ram":
				return this.generateLine(
					data.map(d => {
						return { timestamp: d.timestamp, value: d.ram };
					})
				);
			default:
				throw new Error(`Unknown graph type ${targetStats}`);
		}
	}

	async generateLine(data: LineStats[]): Promise<Buffer> {
		const width = 1080;
		const height = 520;
		const chartJsNodeCanvas = new ChartJSNodeCanvas({ width, height });

		const preparedData = data
			.sort((a, b) => b.timestamp - a.timestamp)
			.filter(d => d.timestamp > Date.now() - this.time);
		preparedData.reverse();

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
						borderWidth: 4,
						data: data.map(d => Math.round(d.value)),
						label: "HeapUsed",
						fill: true,
						tension: 0.4
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
						display: true,
						labels: {
							color: "rgb(202, 202, 202)"
						}
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
						radius: 2
					}
				}
			}
		};

		const image = chartJsNodeCanvas.renderToBuffer(configuration);

		return image;
	}
	generateDoughnut() {
		throw new Error("Method not implemented.");
	}
	generateBar() {
		throw new Error("Method not implemented.");
	}
}
