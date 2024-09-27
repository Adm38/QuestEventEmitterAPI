import { DependencyContainer, Lifecycle } from "tsyringe";

import { IPreSptLoadMod } from "@spt/models/external/IPreSptLoadMod";
import { IPostSptLoadMod } from "@spt/models/external/IPostSptLoadMod";
import { PackageJson, Config, PACKAGE_JSON_PATH, CONFIG_PATH } from "./config"
import { readJsonFile } from "./utils";
import { QuestControllerPatcher } from "./QuestControllerPatcher";
import { IQuestEventEmitter, QuestEventEmitter } from "./QuestEventEmitter";
import { IPostQuestEventListener, IPreQuestEventListener } from "./IQuestEventListener";
import { ICancelableEventArgs } from "./ICancelableEventArgs";
import { ILogger } from "@spt/models/spt/utils/ILogger";
import { IPostQuestListenerRegistry, IPreQuestListenerRegistry, QuestListenerRegistry } from "./QuestListenerRegistry";
import { IPostQuestListenerBinding, IPreQuestListenerBinding } from "./IQuestListenerBinding";
import { IQCProxyHandlerGenerator, QCProxyHandlerGenerator } from "./QuestControllerProxyGenerator";
import { QuestEventEmitterAPILogger } from "./QuestEventEmitterAPILogger";
import { QuestController } from "@spt/controllers/QuestController";
import { PatchableMethods } from "./PatchableMethodsEnum";


export class QuestNotifierMod implements IPreSptLoadMod, IPostSptLoadMod {
    // Set out mod name so only this class can modify
    private static _modName: string = "ScrimpyDimpy-QuestNotifierMod";
    private static packageJSON: PackageJson;
    private static container: DependencyContainer;

    public static get modName(): string {
        return QuestNotifierMod._modName;
    }

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
        container.register<QuestNotifierMod>(QuestNotifierMod._modName, QuestNotifierMod, { lifecycle: Lifecycle.Singleton })

        // run our patching
        const questControllerPatcher = container.resolve(QuestControllerPatcher)
        const patchedController = questControllerPatcher.patchQuestController()

        const wasSuccess = questControllerPatcher.rerouteQuestController(container, patchedController)

        const logger = container.resolve<ILogger>("QuestEventEmitterAPILogger")
        logger.info(`ran successfully? ${wasSuccess}`)
    }

    postSptLoad(container: DependencyContainer): void {
        // if the mod is not enabled, exit without doing anything
        if (!this.modConfig.enabled) return;

        const logger = container.resolve<ILogger>("QuestEventEmitterAPILogger")

        // Create some test callbacks

        const preEventRegistry = container.resolve<IPreQuestListenerRegistry>("PreQuestListenerRegistry")
        const postEventRegistry = container.resolve<IPostQuestListenerRegistry>("PostQuestListenerRegistry")

        // Accept Quests Callback
        this.createTestAcceptQuestCallback(preEventRegistry, postEventRegistry, logger)

        // Complete Quests Callbacks
        this.createTestPreCompleteQuestCallback(preEventRegistry, logger)
        this.createTestPostCompleteQuestCallback(postEventRegistry, logger)

        // Fail Quest Callback
        this.createTestFailCallbacks(preEventRegistry, postEventRegistry, logger)

        // Fails Quest Callback (notice the 's')
        this.createTestFailsCallbacks(preEventRegistry, postEventRegistry, logger)
    }

    // REGION: TEST CALLBACKS
    private createTestPreCallback(preEventRegistry: IPreQuestListenerRegistry, methodName: PatchableMethods, successMsg: string, logger?: ILogger): void {
        // Create a test event that gets called before I accept a task
        const preEventCallback: IPreQuestEventListener = {
            // define the callback function
            on(eventArgs, ...args): ICancelableEventArgs {
                if (logger) {
                    logger.info(successMsg);
                    //logger.info(`I received the following args: ${JSON.stringify(args, null, 4)}`)
                }

                // return eventArgs without setting cancel to True
                return eventArgs
            }
        }
        const binding: IPreQuestListenerBinding = {
            questMethod: methodName,
            eventListenerCallback: preEventCallback
        }
        preEventRegistry.registerPreListener(binding)
    }
    private createTestPostCallback(postEventRegistry: IPostQuestListenerRegistry, methodName: PatchableMethods, successMsg: string, logger?: ILogger): void {
        // create a test event that gets called after I finish accepting a task
        const postEventCallback: IPostQuestEventListener = {
            on: function (originalMethodResult: any): void {
                if (logger) {
                    //logger.success(`${successMsg} ${JSON.stringify(originalMethodResult, null, 4)}`)
                    logger.success(`${successMsg}`)
                }
            }
        }

        const binding: IPostQuestListenerBinding = {
            questMethod: methodName,
            eventListenerCallback: postEventCallback
        }

        postEventRegistry.registerPostListener(binding)
    }

    // REGION: acceptQuest Callbacks
    private createTestAcceptQuestCallback(preEventRegistry: IPreQuestListenerRegistry, postEventRegistry: IPostQuestListenerRegistry, logger?: ILogger): void {
        // Create a test event that gets called before I accept a task
        this.createTestPreCallback(preEventRegistry, PatchableMethods.ACCEPT_QUEST, "Nice job accepting that task, champ!", logger)
        this.createTestPostCallback(postEventRegistry, PatchableMethods.ACCEPT_QUEST, "mod.js received post-accept quest callback", logger)
    }

    // REGION: TEST CALLBACKS (completeQuest)
    private createTestPreCompleteQuestCallback(preEventRegistry: IPreQuestListenerRegistry, logger?: ILogger): void {
        // Create a test event that gets called before I accept a task
        this.createTestPreCallback(preEventRegistry, PatchableMethods.COMPLETE_QUEST, "Wow! I think you just completed a task. Keep it up champ.", logger)
    }

    private createTestPostCompleteQuestCallback(postEventRegistry: IPostQuestListenerRegistry, logger?: ILogger): void {
        // create a test event that gets called after I finish accepting a task
        this.createTestPostCallback(postEventRegistry, PatchableMethods.COMPLETE_QUEST, "mod.js received post-method callback", logger)
    }

    // REGION: failQuest callbacks
    private createTestFailCallbacks(preEventRegistry: IPreQuestListenerRegistry, postEventRegistry: IPostQuestListenerRegistry, logger?: ILogger) {
        this.createTestPreCallback(preEventRegistry, PatchableMethods.FAIL_QUEST, "Pre-event: Failed a quest successfully", logger)
        this.createTestPostCallback(postEventRegistry, PatchableMethods.FAIL_QUEST, "Post-event: Failed a quest successfully.", logger)
    }

    private createTestFailsCallbacks(preEventRegistry: IPreQuestListenerRegistry, postEventRegistry: IPostQuestListenerRegistry, logger?: ILogger) {
        this.createTestPreCallback(preEventRegistry, PatchableMethods.FAIL_QUESTS, "Pre-event: Failed multiple quests successfully", logger)
        this.createTestPostCallback(postEventRegistry, PatchableMethods.FAIL_QUESTS, "Post-event: Failed multiple quests successfully.", logger)
    }


}

export const mod = new QuestNotifierMod();
