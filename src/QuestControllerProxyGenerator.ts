/* eslint-disable @typescript-eslint/brace-style */
import { inject, singleton } from "tsyringe";
import { IQuestControllerProxyHandler } from "./IQuestControllerProxyHandlers";
import { IQuestEventEmitter } from "./QuestEventEmitter";
import { QuestEventEmitterAPILogger } from "./QuestEventEmitterAPILogger";
import { LogTextColor } from "@spt/models/spt/logging/LogTextColor";
import { castToEnum } from "./utils";
import { PatchableMethods } from "./PatchableMethodsEnum";
import { Config } from "./config";


export interface IQCProxyHandlerGenerator {
    getEmitterProxyHandler(): IQuestControllerProxyHandler
}

@singleton()
export class QCProxyHandlerGenerator implements IQCProxyHandlerGenerator {
    constructor(
        @inject("QuestEventEmitterAPILogger") private logger: QuestEventEmitterAPILogger,
        @inject("QuestEventEmitter") private questEventEmitter: IQuestEventEmitter,
        @inject("QuestEventEmitterAPIConfig") private modConfig: Config

    ) { }

    public getEmitterProxyHandler(): IQuestControllerProxyHandler {
        // return a method that will wrap around each method on QuestController.
        // This wrapper method will simply call an event before and after the original method call. It may cancel the method call if one of the pre-method listeners requests that we cancel
        return {
            apply: (target: any, thisArg: any, argumentsList: any[]): any => {
                // target is the method that is being invoked
                const debugging = this.modConfig.debug;

                if (debugging) this.logger.info(`Proxy handler for ${target.name} was called.`)


                // convert the target (method)'s name back into the PatchableMethods enum
                const patchableEnumValue = castToEnum(PatchableMethods, target.name)
                if (!patchableEnumValue) {
                    if (debugging) {
                        this.logger.warning(`Appears ${target.name} was unable to be cast to a PatchableMethods enum value. Calling original method and returning.`)
                    }

                    target.call(thisArg, ...argumentsList)
                    return
                }

                const shouldCancel = this.questEventEmitter.emitBefore(patchableEnumValue, ...argumentsList);

                if (shouldCancel.cancel) {
                    if (debugging) {
                        this.logger.log(`Not calling method ${target.name} as a preEmit listener requested we cancel.`, LogTextColor.WHITE)
                    }
                    return
                }

                // if we did not need to cancel, we should call the original method with the provided arguments 
                // need to change my naming here
                const result = target.call(thisArg, ...argumentsList)

                this.questEventEmitter.emitAfter(patchableEnumValue, result);
            }
        }
    }

}

