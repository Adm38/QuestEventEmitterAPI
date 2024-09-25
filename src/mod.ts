import { DependencyContainer, Lifecycle } from "tsyringe";

import { IPreSptLoadMod } from "@spt/models/external/IPreSptLoadMod";
import { DatabaseServer } from "@spt/servers/DatabaseServer";
import { QuestHelper } from "@spt/helpers/QuestHelper";
import { IPostSptLoadMod } from "@spt/models/external/IPostSptLoadMod";
import { PackageJson, Config, PACKAGE_JSON_PATH, CONFIG_PATH } from "./config"
import { readJsonFile } from "./utils";
import { QuestControllerPatcher } from "./QuestControllerPatcher";
import { QuestEventEmitter } from "./QuestEventEmitter";
import { IPostDBLoadMod } from "@spt/models/external/IPostDBLoadMod";
import { IPreQuestEventListener } from "./IQuestEventListener";
import { ICancelableEventArgs } from "./ICancelableEventArgs";
import { ILogger } from "@spt/models/spt/utils/ILogger";
import { QuestListenerRegistry } from "./QuestListenerRegistry";
import { IPreQuestListenerBinding } from "./IQuestListenerBinding";


export class QuestNotifierMod implements IPreSptLoadMod, IPostDBLoadMod, IPostSptLoadMod {
    // Set out mod name so only this class can modify
    private static _modName: string = "ScrimpyDimpy-QuestNotifierMod";
    public static get modName(): string {
        return QuestNotifierMod._modName;
    }

    // set our config so only this class can modify it
    private _modConfig: Config;
    public get modConfig(): Config {
        return this._modConfig;
    }

    private static packageJSON: PackageJson;
    private static container: DependencyContainer;

    public preSptLoad(container: DependencyContainer): void {
        QuestNotifierMod.packageJSON = readJsonFile<PackageJson>(PACKAGE_JSON_PATH);

        // assign our config so classes can retrieve it later
        this._modConfig = readJsonFile<Config>(CONFIG_PATH);

        // make sure this mod is enabled before we make any other changes
        if (!this._modConfig.enabled) return;

        // Register classes we'll be accessing via container
        QuestControllerPatcher.setContainer(container)
        QuestEventEmitter.setContainer(container)
        QuestListenerRegistry.setContainer(container)


        container.register<QuestControllerPatcher>("QuestControllerPatcher", QuestControllerPatcher, { lifecycle: Lifecycle.Singleton })
        container.register<QuestEventEmitter>("QuestEventEmitter", QuestEventEmitter, { lifecycle: Lifecycle.Singleton })
        container.register<QuestListenerRegistry>("QuestListenerRegistry", QuestListenerRegistry, { lifecycle: Lifecycle.Singleton })
        // Register our mod as a singleton in the container. When other classes retrieve this from the container, they will retrieve *this* instance.

        container.register<QuestNotifierMod>(QuestNotifierMod._modName, QuestNotifierMod, { lifecycle: Lifecycle.Singleton })

        // run our patching
        const questControllerPatcher = container.resolve(QuestControllerPatcher)
        questControllerPatcher.patchQuestController()

        // TODO: this feels like bad practice
        const questListenerRegistry = container.resolve<QuestListenerRegistry>("QuestListenerRegistry")
        questListenerRegistry.postSptLoad(container)
    }

    postDBLoad(container: DependencyContainer): void {


    }



    postSptLoad(container: DependencyContainer): void {
        // if the mod is not enabled, exit without doing anything
        if (!this._modConfig.enabled) return;

        const databaseServer = container.resolve<DatabaseServer>("DatabaseServer");
        const questHelper = container.resolve<QuestHelper>("QuestHelper");
        const questEventRegistry = container.resolve<QuestListenerRegistry>("QuestListenerRegistry")

        // Create a test event that gets called whenever I accept a task
        const acceptTaskCallback: IPreQuestEventListener = {
            // define the callback function
            on(eventArgs, ...args): ICancelableEventArgs {
                const logger = container.resolve<ILogger>("WinstonLogger")
                logger.info("Wow! I think you just accepted a task. Keep it up champ.")

                // return eventArgs without setting cancel to True
                return eventArgs
            },
        }
        const binding: IPreQuestListenerBinding = {
            questMethod: "acceptQuest",
            eventListenerCallback: acceptTaskCallback
        }
        questEventRegistry.registerPreListener(binding)
    }

}

export const mod = new QuestNotifierMod();
