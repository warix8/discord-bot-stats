/* eslint-disable no-unused-vars */
import { schedule } from "node-cron";
import { StatsModule } from "./StatsModule";
import {
	GraphType,
	EnabledStats,
	StatsManagerOptions,
	PossibleStats,
	StatsAcquisition,
	SavedStatsFormat
} from "./types/types";

const defaultStatsModule: StatsModule[] = [
	new StatsModule("cpu", { graphType: GraphType.LINE, dataType: "number" }),
	new StatsModule("ram", { graphType: GraphType.LINE, dataType: "number" }),
	new StatsModule("servers", { graphType: GraphType.LINE, dataType: "number" }),
	new StatsModule("users", { graphType: GraphType.LINE, dataType: "number" }),
	new StatsModule("shards", { graphType: GraphType.LINE, dataType: "number" }),
	new StatsModule("commands", { graphType: GraphType.BAR, dataType: "map" }),
	new StatsModule("errors", { graphType: GraphType.LINE, dataType: "number" })
];

/**
 * Creates a new StatsManager instance
 */
abstract class StatsManager {
	scheduleCron: string;
	enabledStats: EnabledStats;
	debuggingMode: boolean;
	private _statsModules: StatsModule[];
	/**
	 * Manages the stats of your discord bot.
	 * @param {StatsManagerOptions} options - The options for the stats manager.
	 * @param {string} [options.scheduleCron = "0 0 * * * *"] - The interval in milliseconds default 1 hour. See https://crontab.guru/#0_*_*_*_* and https://www.npmjs.com/package/node-cron for more info .
	 * @param {EnabledStats} [options.enabledStats = {}] - The enabled stats.
	 */
	constructor(options: StatsManagerOptions) {
		this.scheduleCron = options.scheduleCron || "0 0 * * * *";
		this.enabledStats = options.enabledStats || {};
		this._statsModules = [];
		this.debuggingMode = options.debuggingMode || false;
		this._init();
	}

	/**
	 * Initializes the stats manager.
	 * @private
	 * @returns {void}
	 */
	_init(): void {
		for (const module of defaultStatsModule) {
			const status = this.enabledStats[module.name as PossibleStats];
			if (status) this._statsModules.push(module);
		}
		if (this.debuggingMode)
			console.debug(`[StatsManager] Enabled stats: ${this._statsModules.map(m => m.name).join(", ")}`);
	}

	/**
	 * Returns the enabled stats modules.
	 * @type {StatsModule[]}
	 */
	get statsModules(): StatsModule[] {
		return this._statsModules;
	}

	/**
	 * Returns the targetted stats module.
	 * @param {string} name - The name of the stats module.
	 * @returns {StatsModule|undefined}
	 */
	findModule(name: string): StatsModule {
		return this._statsModules.find(m => m.name === name);
	}

	/**
	 * Add custom module to your stats manager.
	 * @param {StatsModule[]} modules - The stats module to add.
	 * @returns {void}
	 * @example
	 * const customModule = new StatsModule("custom", { graphType: GraphType.LINE, dataType: "number" });
	 * statsManager.addModule([customModule]);
	 * statsManager.findModule("custom"); // => customModule
	 * @throws {Error} If the module is already added.
	 * @throws {Error} If the module has not a valid graph type.
	 * @throws {Error} If the module has not a valid data type.
	 */
	addModules(modules: StatsModule[]): void {
		if (modules?.length === 0) throw new Error("You must provid a non-empty array of modules.");
		for (const module of modules) {
			if (this.findModule(module.name)) throw new Error(`The module ${module.name} is already added.`);
			if (!Object.values(GraphType).includes(module.graphType))
				throw new Error(`The module ${module.name} has not a valid graph type.`);
			if (["number", "map"].includes(module.dataType))
				throw new Error(`The module ${module.name} has not a valid data type.`);
			this._statsModules.push(module);
		}
	}

	/**
	 * Acquires the stats.
	 * @param {StatsAcquisition} returnedStatsFunction - The function that returns the stats.
	 * @returns {Promise<void>}
	 * @example
	 * statsManager.acquireStats(async () => {
	 * 	return {
	 * 		ram: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
	 * 		servers: client.guilds.size,
	 * 		users: client.users.size,
	 * }
	 * });
	 * @throws {Error} If the stats are not acquired.
	 * @throws {Error} If the stats are not acquired in the correct format.
	 */
	async start(returnedStatsFunction: StatsAcquisition): Promise<void> {
		schedule(this.scheduleCron, async () => {
			if (this.debuggingMode) console.debug("[StatsManager] Acquiring stats...");

			const returnedStats = await returnedStatsFunction();

			if (this.debuggingMode) console.debug("[StatsManager] Acquired stats!", returnedStats);

			if (!returnedStats.stats)
				throw new Error(
					"No stats found! Be sure that you provide a object with a stats property. Example: { stats: { ... } }"
				);

			if (isNaN(returnedStats?.timestamp)) returnedStats.timestamp = Date.now();

			// Saving new Data
			/*for (const [stat, status] of Object.entries(this.enabledStats) as [PossibleStats, boolean][]) {
				if (status && !returnedStats[stat])
					throw new Error(`The stat ${stat} is enabled but not returned by the stats acquisition function.`);
			}*/
			for (const module of this._statsModules) {
				const moduleStats = returnedStats.stats[module.name];
				if (!moduleStats) {
					throw new Error(
						`The stats ${module.name} is enabled but not returned by the stats acquisition function.`
					);
				}
				if (!module.validInputData(moduleStats)) {
					throw new Error(
						`The stats ${module.name} is provided but don't but not match the type ${module.dataType}.`
					);
				}
				if (isNaN(returnedStats.timestamp)) {
					throw new Error(`The timestamp ${returnedStats.timestamp} is not a valid timestamp.`);
				}
			}

			if (this.debuggingMode) console.debug("[StatsManager] Saving stats...");
			await this.saveStats(returnedStats);
			if (this.debuggingMode) console.debug("[StatsManager] Saved stats!");

			// Supress useless data
			/*let count = -1;
			let cumStat: Stats = {};
			const data = await this.getStats();

			const last7Days = data.filter(
				d =>
					d.timestamp > Date.now() - 7 * 24 * 60 * 60 * 1000 && d.timestamp < Date.now() - 24 * 60 * 60 * 1000
			);
			const remainingData = sliceIntoChunks(last7Days, 4).every(d => {
				d.reduce((acc, prev) => AverageOfTwoStats(acc, prev), d[0]);
			});

			const dataToKeep = data.every(d => {
				if (d.timestamp > Date.now() - 24 * 60 * 60 * 1000) {
					return false;
				} else if (d.timestamp > Date.now() - 7 * 24 * 60 * 60 * 1000) {
					count++;
					if (count === 0) cumStat = d;
					if (count % 4 === 0) {
						cumStat = d;
					} else if (count % 4) {
						cumStat = AverageOfTwoStats(cumStat, d);
					} else {
						count;
					}
				}
			});*/
			const oldData = (await this.getStats())
				.filter(d => d.timestamp < Date.now() - 28 * 24 * 60 * 60 * 1000)
				.map(d => d.timestamp);

			if (this.debuggingMode) console.debug("[StatsManager] Deleting old stats...", oldData);
			await this.deleteStats(oldData);
			if (this.debuggingMode) console.debug("[StatsManager] Deleted old stats!");
		});
	}

	/**
	 * Saves the stats.
	 * @abstract
	 * @param {SavedStatsFormat} stats - The stats to save.
	 */
	abstract saveStats(stats: SavedStatsFormat): Promise<void>;

	/**
	 * Gets the stats.
	 * @abstract
	 * @returns {Promise<SavedStatsFormat[]>}
	 */
	abstract getStats(): Promise<SavedStatsFormat[]>;

	/**
	 * Deletes the stats.
	 * @abstract
	 * @param {number[]} timestamps - The timestamps of the stats to delete.
	 */
	abstract deleteStats(timestamps: number[]): Promise<void>;
}

export { StatsManager };

/*function AverageOfTwoStats(stats1: Stats, stats2: Stats) {
	return {
		timestamp: stats1?.timestamp || stats2?.timestamp,
		cpu: (stats1.cpu + stats2.cpu) / 2,
		ram: (stats1.ram + stats2.ram) / 2,
		servers: (stats1?.servers + stats2.servers) / 2,
		users: (stats1?.users + stats2.users) / 2,
		commands: new Map(
			[...stats1.commands, ...stats2.commands].map(([key, value]) => [
				key,
				{
					execution: value.execution + stats2.commands.get(key)?.execution,
					errors: value.errors + stats2.commands.get(key)?.errors
				}
			])
		),
		errors: stats1.errors + stats2.errors
	};
}

function sliceIntoChunks(arr: Array<Stats>, chunkSize: number) {
	const res = [];
	for (let i = 0; i < arr.length; i += chunkSize) {
		const chunk = arr.slice(i, i + chunkSize);
		res.push(chunk);
	}
	return res;
}*/
