import { container, DependencyContainer, inject, injectable, Lifecycle, singleton } from "tsyringe";
import { ICancelableEventArgs } from "./QuestEventArgs";
import { ILogger } from "@spt/models/spt/utils/ILogger";
import { QuestController } from "@spt/controllers/QuestController";
import { QuestEventEmitter } from "./QuestEventEmitter";
import { IQuestControllerProxyHandler } from "./IQuestControllerProxyHandlers";
import { IPreSptLoadMod } from "@spt/models/external/IPreSptLoadMod";
import { LogTextColor } from "@spt/models/spt/logging/LogTextColor";
import { assert } from "console";

@injectable()
export class QuestControllerPatcher {
    private static container: DependencyContainer

    constructor(
    ) { }

    static setContainer(container: DependencyContainer) {
        QuestControllerPatcher.container = container
    }

    public patchQuestController(): void {
        // Create proxy
        const questControllerProxy = this.createQuestControllerProxy()

        // Redirect calls to container.resolve("QuestController") to our new proxy
        const wasSuccess = this.rerouteQuestController(questControllerProxy)

        if (wasSuccess) {
            container.resolve<ILogger>("WinstonLogger").logWithColor("Patched QuestController", LogTextColor.YELLOW)
        }
    }

    protected rerouteQuestController(proxyQuestController: QuestController): boolean {
        const originalQC = QuestControllerPatcher.container.resolve<QuestController>("QuestController")

        // override following logic described here:
        // https://dev.sp-tarkov.com/chomp/ModExamples/src/branch/master/TypeScript/12ClassExtensionOverride/src/mod.ts
        QuestControllerPatcher.container.register<QuestController>("QuestController", { useValue: proxyQuestController });
        //QuestControllerPatcher.container.register("QuestController", { useToken: "EmitterPatchedQuestController" })

        const wasSuccess = QuestControllerPatcher.container.resolve<QuestController>("QuestController").acceptQuest != originalQC.acceptQuest
        if (!wasSuccess) {
            container.resolve<ILogger>("WinstonLogger").error("Did not successfully patch QuestController")
        }
        return wasSuccess
    }

    public createQuestControllerProxy(_handler?: IQuestControllerProxyHandler): QuestController {
        // returns a proxy object for the QuestController class.
        const questController = QuestControllerPatcher.container.resolve<QuestController>("QuestController");

        // initialize handler with a default proxy handler function
        let handler: IQuestControllerProxyHandler = this.getEmitterProxyHandler();

        // use provided handler instead if we received one
        if (typeof _handler !== "undefined") handler = this.getEmitterProxyHandler();

        // Return the proxy object that wraps QuestController
        return new Proxy(questController, handler)
    }

    protected getEmitterProxyHandler(): IQuestControllerProxyHandler {
        return {
            // override the `get` method. This is called when accessing any properties or functions on the proxy obj
            get: (target: QuestController, propKey: keyof QuestController, receiver: any): any => {
                const originalMethod = target[propKey];

                // Only wrap if it's a method
                if (typeof originalMethod === "function") {
                    return (...args: any[]) => {
                        // resolve dependencies
                        const questEventEmitter = QuestControllerPatcher.container.resolve<QuestEventEmitter>("QuestEventEmitter")
                        const logger = QuestControllerPatcher.container.resolve<ILogger>("WinstonLogger")

                        // Notify the emitter that we're calling the original method soon
                        const eventArgsBefore: ICancelableEventArgs = questEventEmitter.emitBefore(propKey, args)

                        // Check if any of the listeners requested we cancel the original method call
                        if (eventArgsBefore.cancel) {
                            logger.info(`Cancelling original method call for ${propKey}. An event listener indicated we should cancel`);
                            return
                        }

                        // Invoke the original QuestController method
                        const result = originalMethod.apply(target, args)

                        // Emit event after the method call
                        questEventEmitter.emitAfter(propKey, args)

                        return result
                    }
                }

                // If propKey is not a function, return the original property
                return originalMethod
            }
        }

    }

}
