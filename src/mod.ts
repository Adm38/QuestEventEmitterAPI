/* eslint-disable @typescript-eslint/brace-style */
import { DependencyContainer, Lifecycle } from "tsyringe";

import { IPreSptLoadMod } from "@spt/models/external/IPreSptLoadMod";
import { PackageJson, Config, PACKAGE_JSON_PATH, CONFIG_PATH } from "./config"
import { readJsonFile } from "./utils";
import { QuestControllerPatcher } from "./QuestControllerPatcher";
import { IQuestEventEmitter, QuestEventEmitter } from "./QuestEventEmitter";
import { ILogger } from "@spt/models/spt/utils/ILogger";
import { IPostQuestListenerRegistry, IPreQuestListenerRegistry, QuestListenerRegistry } from "./QuestListenerRegistry";
import { IQCProxyHandlerGenerator, QCProxyHandlerGenerator } from "./QuestControllerProxyGenerator";
import { QuestEventEmitterAPILogger } from "./QuestEventEmitterAPILogger";


export class QuestNotifierMod implements IPreSptLoadMod {
    // Set out mod name so only this class can modify
    private static packageJSON: PackageJson;
    private static container: DependencyContainer;

    private modConfig: Config;

    public preSptLoad(container: DependencyContainer): void {
        QuestNotifierMod.packageJSON = readJsonFile<PackageJson>(PACKAGE_JSON_PATH);

        // assign our config so we can retrieve it later
        this.modConfig = readJsonFile<Config>(CONFIG_PATH);

        // make sure this mod is enabled before we make any other changes
        if (!this.modConfig.enabled) return;

        container.register<Config>("QuestEventEmitterAPIConfig", { useValue: this.modConfig })


        container.register<ILogger>("QuestEventEmitterAPILogger", QuestEventEmitterAPILogger, { lifecycle: Lifecycle.Singleton })
        container.register<IQCProxyHandlerGenerator>("QCProxyHandlerGenerator", QCProxyHandlerGenerator);

        container.register<QuestControllerPatcher>("QuestControllerPatcher", QuestControllerPatcher, { lifecycle: Lifecycle.Singleton })
        container.register<IQuestEventEmitter>("QuestEventEmitter", QuestEventEmitter, { lifecycle: Lifecycle.Singleton })
        container.register<IPreQuestListenerRegistry>("PreQuestListenerRegistry", QuestListenerRegistry, { lifecycle: Lifecycle.Singleton })
        container.register<IPostQuestListenerRegistry>("PostQuestListenerRegistry", QuestListenerRegistry, { lifecycle: Lifecycle.Singleton })
        container.register<QuestNotifierMod>(QuestNotifierMod.packageJSON.name, QuestNotifierMod, { lifecycle: Lifecycle.Singleton })

        const logger = container.resolve<ILogger>("QuestEventEmitterAPILogger")

        // run our patching
        const questControllerPatcher = container.resolve(QuestControllerPatcher)
        const patchedController = questControllerPatcher.patchQuestController()
        const successfulPatch = questControllerPatcher.verifyPatch()

        if (!successfulPatch.success) {
            logger.error(`QuestController Patcher did not successfully patch the following functions: ${JSON.stringify(successfulPatch.unpatchedMethods, null, 4)}`)
            logger.error(" exiting without rerouting container calls.")
            return
        }

        logger.success("Successfully patched QuestController.")

        questControllerPatcher.rerouteQuestController(container, patchedController)

        logger.info(`${QuestNotifierMod.packageJSON.name} loaded.`)
    }
}

export const mod = new QuestNotifierMod();
