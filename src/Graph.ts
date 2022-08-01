import { Chart, ChartConfiguration, ChartTypeRegistry } from "chart.js";
import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import "chartjs-adapter-luxon";
import StatsManager from "../src/StatsManager";
import StatsModule, { GraphType } from "./StatsModule";

interface GraphOptions {
	height?: number;
	width?: number;
	time?: number;
	color?: string;
	backgroundColor?: string;
	fontSize?: number;
	lineColor?: string;
	fillColor?: string;
	labels?: string[];
	displayOthers?: boolean;
}

// type GraphType = "line" | "bar" | "doughnut";

interface LineStats {
	timestamp: number;
	value: number;
}

interface BarStats {
	timestamp: number;
	value: Map<string, number>;
}

interface DoughnutStats {
	timestamp: number;
	value: Map<string, number>;
}

export default class {
	height: number;
	width: number;
	time: number;
	color: string;
	lineColor: string;
	backgroundColor: string;
	statsmanager: StatsManager;
	labels: string[];
	displayOthers: boolean;
	constructor(statsmanager: StatsManager, options: GraphOptions = {}) {
		this.statsmanager = statsmanager;
		this.height = options.height || 400;
		this.width = options.width || 800;
		this.color = options.color || "rgba(227, 227, 227, 0.9)";
		this.time = options.time || 7 * 24 * 60 * 60 * 1000;
		this.lineColor = options.lineColor || "rgba(255, 152, 56, 0.9)";
		this.backgroundColor = options.backgroundColor || "rgba(40, 40, 40, 0.9)";
		this.labels = options.labels || ["Test"];
		this.displayOthers = options.displayOthers || true;

		Chart.defaults.color = options.color || "rgba(227, 227, 227, 0.9)";
		Chart.defaults.backgroundColor = options.fillColor || "rgba(255, 152, 56, 0.4)";
		Chart.defaults.font.size = options.fontSize || 14;
	}

	async generate(targetStats: string): Promise<Buffer> {
		const data = await this.statsmanager.getStats();

		const module: StatsModule = this.statsmanager.findModule(targetStats);

		if (!module) throw new Error(`Module ${targetStats} not found or not enabled`);

		if (module.graphType === GraphType.LINE && module.dataType === "number") {
			return this.generateLine(
				data.map(d => {
					if (!module.validInputData(d.stats[module.name]))
						throw new Error(`Invalid data type for module ${targetStats}`);
					return { timestamp: d.timestamp, value: d.stats[module.name] as number };
				})
			);
		} else if (module.graphType === GraphType.BAR && module.dataType === "map") {
			return this.generateBar(
				data.map(d => {
					const mapData: Map<string, number> = new Map(Object.entries(d.stats[module.name]));
					if (!module.validInputData(mapData)) throw new Error(`Invalid data type for module ${targetStats}`);
					return { timestamp: d.timestamp, value: mapData };
				})
			);
		} else if (module.graphType === GraphType.DOUGHNUT && module.dataType === "map") {
			return this.generateDoughnut(
				data.map(d => {
					const mapData: Map<string, number> = new Map(Object.entries(d.stats[module.name]));
					if (!module.validInputData(mapData)) throw new Error(`Invalid data type for module ${targetStats}`);
					return { timestamp: d.timestamp, value: mapData };
				})
			);
		}
		throw new Error(`Invalid graph type for module ${targetStats}`);

		/*switch (targetStats) {
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
		}*/
	}

	async generateLine(data: LineStats[]): Promise<Buffer> {
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
				/*labels: preparedData.map(d =>
					new Date(d.timestamp).toLocaleString("FR-fr", { timeZone: "Europe/Paris" })
				),*/
				labels: preparedData.map(d => d.timestamp),
				datasets: [
					{
						borderColor: this.lineColor,
						borderWidth: 4,
						/*data: data.map(d => {
							return { x: new Date(d.timestamp), y: d.value };
						}),*/
						data: preparedData.map(d => d.value),
						label: "HeapUsed",
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
						display: true,
						labels: {
							color: "rgb(202, 202, 202)"
						}
					}
				},
				scales: {
					x: {
						offsetAfterAutoskip: true,
						offset: true,
						type: "time",
						time: {
							tooltipFormat: "DD/MM/YYYY HH:mm:ss"
						}
						/*ticks: {
							maxTicksLimit: 16,
							maxRotation: 30
						}*/
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
	generateDoughnut(data: DoughnutStats[]) {
		const width = 600;
		const height = 600;
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
						backgroundColor: ["#ED4245", "#57F287", "#FEE75C", "#EB459E", "#FFFFFF"]
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
	generateBar(data: BarStats[]): Promise<Buffer> {
		const width = 1000;
		const height = 600;
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
			type: "bar",
			data: {
				labels: topFive.map(d => `${d.name} - ${Math.round((d.value / total) * 100)}%`),
				datasets: [
					{
						label: "Distribution",
						borderColor: this.color,
						borderWidth: 4,
						data: topFive.map(d => d.value),
						fill: "start",
						tension: 0.4,
						backgroundColor: ["#ED4245", "#57F287", "#FEE75C", "#EB459E", "#FFFFFF", "#7289DA"]
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
}
