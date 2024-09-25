import { container, DependencyContainer, inject, injectable, Lifecycle, singleton } from "tsyringe";
import { ICancelableEventArgs } from "./ICancelableEventArgs";
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

    /**
     * Sets the global dependency container to be used for dependency injection.
     * 
     * @param container - The DependencyContainer instance that will be used to resolve dependencies, 
     *                    such as the QuestController and other services.
     */
    static setContainer(container: DependencyContainer): void {
        QuestControllerPatcher.container = container
    }

    /**
     * Patches the QuestController by creating a proxy and rerouting the original QuestController calls to it.
     * Logs the success of the operation.
     * 
     * This method creates a proxy of the QuestController and overrides the default QuestController 
     * in the dependency container with the proxy version. If successful, it logs a message indicating 
     * that the QuestController has been patched.
     */
    public patchQuestController(): void {
        // Create proxy
        const questControllerProxy = this.createQuestControllerProxy()

        // Redirect calls to container.resolve("QuestController") to our new proxy
        const wasSuccess = this.rerouteQuestController(questControllerProxy)

        if (wasSuccess) {
            container.resolve<ILogger>("WinstonLogger").logWithColor("Patched QuestController", LogTextColor.YELLOW)
        }
    }

    /**
     * Reroutes the QuestController in the container to a provided proxy instance.
     * 
     * This method replaces the original QuestController in the dependency container with the proxy version, 
     * ensuring that any subsequent requests for the QuestController use the proxy instead. It verifies 
     * the success of the patch by checking that the `acceptQuest` method of the resolved controller 
     * has been modified.
     * 
     * @param proxyQuestController - The proxy instance of QuestController that should replace the original one.
     * @returns {boolean} - Returns `true` if the rerouting was successful (i.e., the proxy successfully replaced 
     *                      the original QuestController), otherwise `false`.
     */
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

    /**
     * Creates a proxy for the QuestController class that wraps all method calls with event emissions.
     * 
     * This method resolves the original QuestController from the container, and returns a proxy object 
     * which uses a provided or default handler to intercept and wrap method calls. The handler is responsible 
     * for emitting events before and after the method execution.
     * 
     * @param _handler - An optional custom handler implementing the IQuestControllerProxyHandler interface. 
     *                   If not provided, a default handler will be used.
     * @returns {QuestController} - A proxy object that wraps the QuestController instance, enabling interception 
     *                              of method calls.
     */
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

    /**
     * Provides a default proxy handler for the QuestController that intercepts method calls to emit events.
     * 
     * This handler overrides the `get` method on the proxy object, allowing it to wrap any method calls 
     * on the QuestController. The handler emits an event before the method is called, checks if the call 
     * should be canceled, and then emits an event after the method is executed.
     * 
     * @returns {IQuestControllerProxyHandler} - A handler object implementing traps for intercepting method calls 
     *                                           on the QuestController proxy.
     */
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
                        questEventEmitter.emitAfter(propKey, result)

                        return result
                    }
                }

                // If propKey is not a function, return the original property
                return originalMethod
            }
        }

    }

}
