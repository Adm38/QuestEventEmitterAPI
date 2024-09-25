import { Daum } from "@spt/models/eft/itemEvent/IItemEventRouterRequest";
import { LogBackgroundColor } from "@spt/models/spt/logging/LogBackgroundColor";
import { LogTextColor } from "@spt/models/spt/logging/LogTextColor";
import { ILogger } from "@spt/models/spt/utils/ILogger";
import { inject, singleton } from "tsyringe";
import { Config } from "./config";

@singleton()
export class QuestEventEmitterAPILogger implements ILogger {
    constructor(
        @inject("WinstonLogger") private winstonLogger: ILogger,
        @inject("QuestEventEmitterAPIConfig") private modConfig: Config
    ) { }

    public writeToLogFile(data: string | Daum): void {
        data = this.modConfig.loggerPrefix + data
        this.winstonLogger.writeToLogFile(data)
    }
    public log(data: string | Record<string, unknown> | Error, color: string, backgroundColor?: string): void {
        data = this.modConfig.loggerPrefix + data
        this.winstonLogger.log(data, color, backgroundColor)
    }
    public logWithColor(data: string | Record<string, unknown>, textColor: LogTextColor, backgroundColor?: LogBackgroundColor): void {
        data = this.modConfig.loggerPrefix + data
        this.winstonLogger.logWithColor(data, textColor, backgroundColor)
    }
    public error(data: string): void {
        data = this.modConfig.loggerPrefix + data
        this.winstonLogger.error(data)
    }
    public warning(data: string): void {
        data = this.modConfig.loggerPrefix + data
        this.winstonLogger.warning(data)

    }
    public success(data: string): void {
        data = this.modConfig.loggerPrefix + data
        this.winstonLogger.success(data)

    }
    public info(data: string): void {
        data = this.modConfig.loggerPrefix + data
        this.winstonLogger.info(data)

    }
    public debug(data: string | Record<string, unknown>, onlyShowInConsole?: boolean): void {
        data = this.modConfig.loggerPrefix + data
        this.winstonLogger.debug(data, onlyShowInConsole)

    }

} 