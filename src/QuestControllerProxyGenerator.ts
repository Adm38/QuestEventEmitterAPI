import { inject, singleton } from "tsyringe";
import { IQuestControllerProxyHandler } from "./IQuestControllerProxyHandlers";
import { QuestController } from "@spt/controllers/QuestController";
import { IQuestEventEmitter } from "./QuestEventEmitter";
import { ICancelableEventArgs } from "./ICancelableEventArgs";
import { ILogger } from "@spt/models/spt/utils/ILogger";


export interface IQCProxyHandlerGenerator {
    getEmitterProxyHandler(): IQuestControllerProxyHandler
}

@singleton()
export class QCProxyHandlerGenerator implements IQCProxyHandlerGenerator {
    constructor(
        @inject("QuestEventEmitterAPILogger") private logger: ILogger,
        @inject("QuestEventEmitter") private questEventEmitter: IQuestEventEmitter

    ) { }

    public getEmitterProxyHandler(): IQuestControllerProxyHandler {
        return {
            // override the `get` method. This is called when accessing any properties or functions on the proxy obj
            get: (target: QuestController, propKey: keyof QuestController, receiver: any): any => {
                const originalMethod = target[propKey];

                // Only wrap if it's a method
                if (typeof originalMethod === "function") {
                    return (...args: any[]) => {
                        // Notify the emitter that we're calling the original method soon
                        const eventArgsBefore: ICancelableEventArgs = this.questEventEmitter.emitBefore(propKey, args)

                        // Check if any of the listeners requested we cancel the original method call
                        if (eventArgsBefore.cancel) {
                            this.logger.info(`Cancelling original method call for ${propKey}. An event listener indicated we should cancel`);
                            return
                        }

                        // Invoke the original QuestController method
                        const result = originalMethod.apply(target, args)

                        // Emit event after the method call
                        this.questEventEmitter.emitAfter(propKey, result)
                        return result
                    }
                }

                // If propKey is not a function, return the original property
                return originalMethod
            }
        }

    }
}

