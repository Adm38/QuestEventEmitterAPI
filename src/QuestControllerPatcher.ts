/* eslint-disable @typescript-eslint/brace-style */
import { DependencyContainer, inject, injectable } from "tsyringe";
import { ILogger } from "@spt/models/spt/utils/ILogger";
import { QuestController } from "@spt/controllers/QuestController";
import { IQuestControllerProxyHandler } from "./IQuestControllerProxyHandlers";
import { IQCProxyHandlerGenerator } from "./QuestControllerProxyGenerator";
import { Config } from "./config";

export interface IQuestControllerPatcher {
    patchQuestController(): QuestController
    rerouteQuestController(container: DependencyContainer, proxyQuestController: QuestController): boolean
}

@injectable()
export class QuestControllerPatcher {
    constructor(
        @inject("QuestEventEmitterAPILogger") private logger: ILogger,
        @inject("QuestController") private questController: QuestController,
        @inject("QCProxyHandlerGenerator") private proxyHandlerGenerator: IQCProxyHandlerGenerator,
        @inject("QuestEventEmitterAPIConfig") private modConfig: Config
    ) { }

    /**
     * Returns a QuestController so another class can reroute the DI container
     */
    public patchQuestController(): QuestController {
        // patch each individual method on the Quest Controller
        this.patchEachQCMethod()
        return this.questController
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
    public rerouteQuestController(container: DependencyContainer, proxyQuestController: QuestController): void {
        // override following logic described here:
        // https://dev.sp-tarkov.com/chomp/ModExamples/src/branch/master/TypeScript/12ClassExtensionOverride/src/mod.ts
        container.register<QuestController>("QuestController", { useValue: proxyQuestController });

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
        const qcProperties = Object.getOwnPropertyNames(Object.getPrototypeOf(this.questController))
        const qcMethods = qcProperties.filter((prop) => {
            return !(prop in methodNameBlacklist)
        });

        // apply our handler wrapper to each method on QuestController
        const methodWhitelist = this.modConfig.methodsToPatch;
        qcMethods.forEach((qcMethod) => {
            if (!(methodWhitelist.includes(qcMethod))) {
                if (this.modConfig.debug) this.logger.warning(`Patcher: Skipped patching ${qcMethod}`);
                return;
            }

            const originalMethod = Reflect.get(this.questController, qcMethod)
            const patchedMethod = new Proxy(originalMethod, handler)

            // set a property `wasPatched` on our wrapped method to check for in verifyPatch
            Reflect.set(patchedMethod, "wasPatched", true)

            // overwrite original method on the quest controller
            Reflect.set(this.questController, qcMethod, patchedMethod)
            this.logger.success(`Patcher: patched ${qcMethod}`)
        });

        return;
    }

    public verifyPatch(): { success: boolean, unpatchedMethods: string[] } {
        // for each method we were supposed to patch (defined in config), 
        // ensure that the "wasPatched" property exists on that method

        const unpatchedMethods = []
        let wasSuccess = true

        const methodList = this.modConfig.methodsToPatch

        methodList.forEach((methodName) => {
            const actualMethod = Reflect.get(this.questController, methodName)
            if (!actualMethod) {
                wasSuccess = false
                unpatchedMethods.push(methodName)
                return
            }

            const wasPatched = Reflect.get(actualMethod, "wasPatched");
            if (!wasPatched) {
                wasSuccess = false
                unpatchedMethods.push(methodName)
            }
        });

        return {
            success: wasSuccess,
            unpatchedMethods: unpatchedMethods
        }
    }

}
