import StatsManager, { SavedStatsFormat, StatsManagerOptions } from "../src/StatsManager";
import mongoose from "mongoose";

const StatsSchema = new mongoose.Schema({
	timestamp: Number,
	stats: {
		cpu: Number,
		ram: Number,
		servers: Number,
		users: Number,
		commands: Map,
		errors: Number
	}
});

const StatsModel = mongoose.model("BotStats", StatsSchema);

export default class extends StatsManager {
	constructor(options: StatsManagerOptions) {
		super(options);
		this._connect();
	}

	async _connect() {
		await mongoose.connect("mongodb://localhost:27017/botstatsmodule");
	}

	async deleteStats(timestamps: number[]): Promise<void> {
		StatsModel.deleteMany({ timestamp: { $in: timestamps } }).exec();
		return;
	}

	async getStats(): Promise<SavedStatsFormat[]> {
		return StatsModel.find().lean().exec() as unknown as Promise<SavedStatsFormat[]>;
	}

	async saveStats(stats: SavedStatsFormat): Promise<void> {
		StatsModel.create(stats);
		return;
	}
}
