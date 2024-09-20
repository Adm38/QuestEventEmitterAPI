import { DependencyContainer, inject, injectable, Lifecycle, singleton } from "tsyringe";
import { QuestController } from "@spt/controllers/QuestController";
import { ILogger } from "@spt/models/spt/utils/ILogger";
import { ICancelableEventArgs } from "./QuestEventArgs";
import { IPreSptLoadMod } from "@spt/models/external/IPreSptLoadMod";

@injectable()
export class QuestEventEmitter {
    private static container: DependencyContainer

    constructor(
    ) { }

    static setContainer(container: DependencyContainer) {
        QuestEventEmitter.container = container
    }

    emitBefore(propKey: keyof QuestController, args: any[]): ICancelableEventArgs {
        const shouldCancelOriginalMethod: ICancelableEventArgs = { cancel: false }
        const logger = QuestEventEmitter.container.resolve<ILogger>("WinstonLogger")
        logger.info(`emitBefore called for method ${propKey.toString()}`);

        // call all interested event listeners
        return shouldCancelOriginalMethod;
    }


    emitAfter(propKey: string, args: any[]): void {
        const logger = QuestEventEmitter.container.resolve<ILogger>("WinstonLogger")
        logger.info(`emitAfter called for method ${propKey.toString()}`);

        // call all interested event listeners

    }


}