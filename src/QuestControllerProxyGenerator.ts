import { inject, singleton } from "tsyringe";
import { depr_IQuestControllerProxyHandler, IQuestControllerProxyHandler } from "./IQuestControllerProxyHandlers";
import { QuestController } from "@spt/controllers/QuestController";
import { IQuestEventEmitter } from "./QuestEventEmitter";
import { ICancelableEventArgs } from "./ICancelableEventArgs";
import { ILogger } from "@spt/models/spt/utils/ILogger";
import { QuestEventEmitterAPILogger } from "./QuestEventEmitterAPILogger";
import { LogTextColor } from "@spt/models/spt/logging/LogTextColor";


export interface IQCProxyHandlerGenerator {
    getEmitterProxyHandler(): IQuestControllerProxyHandler
}

@singleton()
export class QCProxyHandlerGenerator implements IQCProxyHandlerGenerator {
    constructor(
        @inject("QuestEventEmitterAPILogger") private logger: QuestEventEmitterAPILogger,
        @inject("QuestEventEmitter") private questEventEmitter: IQuestEventEmitter

    ) { }

    public getEmitterProxyHandler(): IQuestControllerProxyHandler {
        // return a method that will wrap around each method on QuestController.
        // This wrapper method will simply call an event before and after the original method call. It may cancel the method call if one of the pre-method listeners requests that we cancel
        return {
            apply: (target: any, thisArg: any, argumentsList: any[]): any => {
                // target is the method that is being invoked

                // notify event emitter that we are calling the originalMethod soon
                // allow them to cancel the originalMethod if they want to
                this.logger.info(`Proxy handler for ${target.name} was called.`)

                const shouldCancel = this.questEventEmitter.emitBefore(target.name, ...argumentsList);

                if (shouldCancel.cancel) {
                    this.logger.log(`Not calling method ${target.name} as a preEmit listener requested we cancel.`, LogTextColor.WHITE)
                }

                // if we did not need to cancel, we should call the original method with the provided arguments 
                // need to change my naming here
                const result = target.call(thisArg, ...argumentsList)

                this.questEventEmitter.emitAfter(target.name, result);
            }
        }
    }

    /*
    public depr_getEmitterProxyHandler(): depr_IQuestControllerProxyHandler {

        //TODO: Genius Plan
        /* for property in QuestController
         1. get original method through Reflection.get 
         2. we should build a new `apply` trap to each method that emits and calls the **original** method
         3. emit again
         4. once done building trap, we should figure out how to modify a proxy object or something. This part I don't know entirely but the idea is to overwrite each function on preferably a proxy
        

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
        */
}

