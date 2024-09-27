import { DependencyContainer, inject, injectable } from "tsyringe";
import { ILogger } from "@spt/models/spt/utils/ILogger";
import { QuestController } from "@spt/controllers/QuestController";
import { depr_IQuestControllerProxyHandler, IQuestControllerProxyHandler } from "./IQuestControllerProxyHandlers";
import { LogTextColor } from "@spt/models/spt/logging/LogTextColor";
import { IQCProxyHandlerGenerator } from "./QuestControllerProxyGenerator";
import { json } from "stream/consumers";

export interface IQuestControllerPatcher {
    patchQuestController(): QuestController
    rerouteQuestController(container: DependencyContainer, proxyQuestController: QuestController): boolean
}

@injectable()
export class QuestControllerPatcher {
    constructor(
        @inject("QuestEventEmitterAPILogger") private logger: ILogger,
        @inject("QuestController") private originalQuestController: QuestController,
        @inject("QCProxyHandlerGenerator") private proxyHandlerGenerator: IQCProxyHandlerGenerator

    ) { }

    /**
     * Returns a QuestController so another class can reroute the DI container
     */
    public patchQuestController(): QuestController {
        // patch each individual method on the Quest Controller
        this.patchEachQCMethod()
        return this.originalQuestController
    }

    /**
     * Reroutes the QuestController in the container to a provided proxy instance.
     * 
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
    public rerouteQuestController(container: DependencyContainer, proxyQuestController: QuestController): boolean {
        // override following logic described here:
        // https://dev.sp-tarkov.com/chomp/ModExamples/src/branch/master/TypeScript/12ClassExtensionOverride/src/mod.ts
        container.register<QuestController>("QuestController", { useValue: proxyQuestController });

        // Check if the service locator is routing to our patched 
        // QuestController Proxy object
        const newlyRoutedQuestController = container.resolve<QuestController>("QuestController")
        const wasSuccess = newlyRoutedQuestController.acceptQuest != this.originalQuestController.acceptQuest

        if (wasSuccess) {
            this.logger.logWithColor("Successfully patched QuestController", LogTextColor.YELLOW)
            return wasSuccess
        }
        this.logger.error("Did not successfully patch QuestController");
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
    public createQuestControllerProxy(): QuestController {
        // returns a proxy object for the QuestController class.
        // start with an empty handler because we want to apply proxies at the function level. 
        // However, we don't want to modify the original QuestController when we start overwriting functions

        this.logger.warning("createQuestControllerProxy is being depreciated. This should not be called.")

        return new Proxy(this.originalQuestController, {})
    }

    patchEachQCMethod(_handler?: IQuestControllerProxyHandler): void {
        // which functions do we not want to patch?
        const methodNameBlacklist = ["constructor"]

        // initialize handler with a default proxy handler function
        // this handler will be applied to each function on the proxy QuestController
        let handler: IQuestControllerProxyHandler = this.proxyHandlerGenerator.getEmitterProxyHandler();

        // use provided handler instead if we received one
        if (typeof _handler !== "undefined") handler = this.proxyHandlerGenerator.getEmitterProxyHandler();

        // get each property on QuestController, then narrow to just methods
        const qcProperties = Object.getOwnPropertyNames(Object.getPrototypeOf(this.originalQuestController))
        const qcMethods = qcProperties.filter((prop) => {
            return !(prop in methodNameBlacklist)
        });

        // apply our handler wrapper to each method on QuestController
        const methodWhitelist = ["acceptQuest", "completeQuest", "failQuest", "failQuests"]
        qcMethods.forEach((qcMethod) => {
            if (!(methodWhitelist.includes(qcMethod))) {
                //TODO: Remove this - only for debugging purposes

                this.logger.warning(`Patcher: Skipped patching ${qcMethod}`);
                return
            }

            const originalMethod = Reflect.get(this.originalQuestController, qcMethod)
            const patchedMethod = new Proxy(originalMethod, handler)
            Reflect.set(this.originalQuestController, qcMethod, patchedMethod)

            this.logger.info(`Patcher: patched ${qcMethod}`)
        });

        return
    }

}
