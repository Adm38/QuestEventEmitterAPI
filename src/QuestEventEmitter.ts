import { DependencyContainer, inject, injectable, Lifecycle, singleton } from "tsyringe";
import { QuestController } from "@spt/controllers/QuestController";
import { ILogger } from "@spt/models/spt/utils/ILogger";
import { ICancelableEventArgs } from "./ICancelableEventArgs";
import { IPreSptLoadMod } from "@spt/models/external/IPreSptLoadMod";
import { IPostQuestListenerRegistry, IPreQuestListenerRegistry } from "./QuestListenerRegistry";


export interface IQuestEventEmitter {
    emitBefore(propKey: keyof QuestController, args: any[]): ICancelableEventArgs
    emitAfter(propKey: string, originalMethodResult: any): void
}

@injectable()
export class QuestEventEmitter {
    constructor(
        @inject("PreQuestListenerRegistry") private preEmitRegistry: IPreQuestListenerRegistry,
        @inject("PostQuestListenerRegistry") private postEmitRegistry: IPostQuestListenerRegistry,
        @inject("WinstonLogger") private logger: ILogger

    ) { }

    emitBefore(propKey: keyof QuestController, args: any[]): ICancelableEventArgs {
        this.logger.info(`emitBefore called for method ${propKey.toString()}. Attempting to alert the event listeners`);

        const cancelableEventArgs: ICancelableEventArgs = {
            cancel: false
        }
        const shouldCancelResult = this.preEmitRegistry.notifyPreEventListeners(propKey, cancelableEventArgs, args)

        return shouldCancelResult;
    }


    emitAfter(propKey: string, originalMethodResult: any): void {
        this.logger.info(`emitAfter called for method ${propKey.toString()}. Note: Not yet implemented`);

        // call all interested event listeners
        return
    }


}