/* eslint-disable no-unused-vars */
import { schedule } from "node-cron";

export type PossibleStats = "cpu" | "ram" | "servers" | "users" | "commands" | "errors";

interface EnabledStats {
	cpu?: boolean;
	ram?: boolean;
	servers?: boolean;
	users?: boolean;
	commands?: boolean;
	errors?: boolean;
}

interface CommandInformation {
	execution: number;
	errors: number;
}

export interface Stats {
	timestamp?: number;
	cpu?: number;
	ram?: number;
	servers?: number;
	users?: number;
	commands?: Map<string, CommandInformation>;
	errors?: number;
}

export interface StatsManagerOptions {
	saveInterval?: number;
	enabledStats?: EnabledStats;
}

interface StatsAcquisition {
	(): Stats;
}

/**
 * Manages the stats of your discord bot.
 * @param {options} StatsManagerOptions The client to manage the stats of.
 * @returns {StatsManager} The stats manager.
 */

export default abstract class {
	saveInterval: number;
	enabledStats: EnabledStats;
	constructor(options: StatsManagerOptions) {
		this.saveInterval = options.saveInterval || 3_600_000;
		this.enabledStats = options.enabledStats || {};
	}

	async start(returnedStatsFunction: StatsAcquisition): Promise<void> {
		schedule("0 * * * * *", async () => {
			const returnedStats = returnedStatsFunction();

			if (isNaN(returnedStats?.timestamp)) returnedStats.timestamp = Date.now();

			// Saving new Data
			for (const [stat, status] of Object.entries(this.enabledStats) as [PossibleStats, boolean][]) {
				if (status && !returnedStats[stat])
					throw new Error(`The stat ${stat} is enabled but not returned by the stats acquisition function.`);
			}

			await this.saveStats(returnedStats);

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

			await this.deleteStats(oldData);
		});
	}

	abstract saveStats(stats: Stats): Promise<void>;

	abstract getStats(): Promise<Stats[]>;

	abstract deleteStats(timestamps: number[]): Promise<void>;
}

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
