import StatsManager, { Stats, StatsManagerOptions } from "../src/StatsManager";
import mongoose from "mongoose";

const StatsSchema = new mongoose.Schema({
	timestamp: Number,
	cpu: Number,
	ram: Number,
	servers: Number,
	users: Number,
	commands: Map,
	errors: Number
});

const StatsModel = mongoose.model("BotStats", StatsSchema);

export default class extends StatsManager {
	constructor(options: StatsManagerOptions) {
		super(options);
		this._init();
	}

	async _init() {
		await mongoose.connect("mongodb://localhost:27017/botstatsmodule");
	}

	async deleteStats(timestamps: number[]): Promise<void> {
		StatsModel.deleteMany({ timestamp: { $in: timestamps } }).exec();
		return;
	}

	async getStats(): Promise<Stats[]> {
		return StatsModel.find().lean().exec() as unknown as Promise<Stats[]>;
	}

	async saveStats(stats: Stats): Promise<void> {
		StatsModel.create(stats);
		return;
	}
}
