import { DependencyContainer, inject, injectable, Lifecycle, singleton } from "tsyringe";
import { QuestController } from "@spt/controllers/QuestController";
import { ILogger } from "@spt/models/spt/utils/ILogger";
import { ICancelableEventArgs } from "./ICancelableEventArgs";
import { IPreSptLoadMod } from "@spt/models/external/IPreSptLoadMod";
import { IOnEmitterPreMethodCallback } from "./QuestListenerRegistry";

@injectable()
export class QuestEventEmitter {
    private static container: DependencyContainer

    // notify the registry when the QuestController is about to call one of its methods
    private preEmitListeners: IOnEmitterPreMethodCallback[] = []

    constructor(
    ) { }

    static setContainer(container: DependencyContainer): void {
        QuestEventEmitter.container = container
    }

    public registerPreEmitListener(newListener: IOnEmitterPreMethodCallback): void {
        this.preEmitListeners.push(newListener)
    }

    // public registerPostEmitListener(newListener: IOnEmitterPreMethodCallback): void {
    //     this.preEmitListeners.push(newListener)
    // }

    emitBefore(propKey: keyof QuestController, args: any[]): ICancelableEventArgs {
        const shouldCancelOriginalMethod: ICancelableEventArgs = { cancel: false }
        const logger = QuestEventEmitter.container.resolve<ILogger>("WinstonLogger")
        logger.info(`emitBefore called for method ${propKey.toString()}. Attempting to alert the event listeners`);

        // if the Questregistry is hooked up, emit
        if (this.preEmitListeners) {
            // initialize a bool to check if any listener requested we cancel the full method call
            let shouldCancel = false
            const cancelableEventArgs: ICancelableEventArgs = {
                cancel: shouldCancel
            }
            this.preEmitListeners.forEach(listener => {
                const postListenerEmit = listener.triggerPreEvent(propKey, cancelableEventArgs)

                // if listener function returned should_cancel = true or it was 
                // already set to true by a previous function, ensure that 
                // value persists
                shouldCancel = shouldCancel || postListenerEmit.cancel
            });
        }
        // call all interested event listeners
        return shouldCancelOriginalMethod;
    }


    emitAfter(propKey: string, originalMethodResult: any): void {
        const logger = QuestEventEmitter.container.resolve<ILogger>("WinstonLogger")
        logger.info(`emitAfter called for method ${propKey.toString()}`);

        // call all interested event listeners

    }


}