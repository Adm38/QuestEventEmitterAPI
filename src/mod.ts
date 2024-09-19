import { DependencyContainer, Lifecycle } from "tsyringe";

import { IPreSptLoadMod } from "@spt/models/external/IPreSptLoadMod";
import { ILogger } from "@spt/models/spt/utils/ILogger";
import { DatabaseServer } from "@spt/servers/DatabaseServer";
import { QuestCallbacks } from "@spt/callbacks/QuestCallbacks";
import { QuestHelper } from "@spt/helpers/QuestHelper";
import { IPostSptLoadMod } from "@spt/models/external/IPostSptLoadMod";
import { IQuest } from "@spt/models/eft/common/tables/IQuest";
import { QuestController } from "@spt/controllers/QuestController";
import { IItemEventRouterResponse } from "@spt/models/eft/itemEvent/IItemEventRouterResponse";
import { IAcceptQuestRequestData } from "@spt/models/eft/quests/IAcceptQuestRequestData";
import { IPmcData } from "@spt/models/eft/common/IPmcData";
import { ICompleteQuestRequestData } from "@spt/models/eft/quests/ICompleteQuestRequestData";
import { PackageJson, Config, PACKAGE_JSON_PATH, CONFIG_PATH } from "./config"
import { readJsonFile } from "./utils";


export class QuestNotifierMod implements IPreSptLoadMod, IPostSptLoadMod {
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

        // Register our mod as a singleton in the container. When other classes retrieve this from the container, they will retrieve *this* instance.
        container.register<QuestNotifierMod>(QuestNotifierMod._modName, QuestNotifierMod, { lifecycle: Lifecycle.Singleton })

        // store the container in case we need it later on
        QuestNotifierMod.container = container;

        // do our patching on all of the QuestHelper methods
        this.patchQuestControllerMethods(container);
    }

    public postSptLoad(container: DependencyContainer): void {
        // if the mod is not enabled, exit without doing anything
        if (!this._modConfig.enabled) return;

        const databaseServer = container.resolve<DatabaseServer>("DatabaseServer");
        const questHelper = container.resolve<QuestHelper>("QuestHelper");
    }

    private patchQuestControllerMethods(container: DependencyContainer) {
        // wait until QuestController has been resolved by the server and monkey patch our code onto it
        container.afterResolution("QuestController", (_t, result: QuestController) => {
            this.patchQuestControllerAcceptQuest(container, result);
            this.patchQuestControllerCompleteQuest(container, result);
        });
    }

    private patchQuestControllerAcceptQuest(container: DependencyContainer, questController: QuestController) {
        // monkey patch method `acceptQuest` on QuestController with our event handlers on both ends (pre- and post-method call)

        const originalAcceptQuest = questController.acceptQuest.bind(questController);

        // wrapping this originalAcceptQuest method with our own code to log to console when this method is called
        questController.acceptQuest = (pmcData: IPmcData, acceptedQuest: IAcceptQuestRequestData, sessionID: string): IItemEventRouterResponse => {
            const logger = QuestNotifierMod.container.resolve<ILogger>("WinstonLogger");

            logger.info(`[${QuestNotifierMod._modName}] Notice: acceptQuest invoked. This is before calling the original acceptQuest method.`)
            // TODO: add event handler here

            // original acceptQuest logic
            const originalResult = originalAcceptQuest(pmcData, acceptedQuest, sessionID)
            logger.info(originalResult);


            logger.info(`[${QuestNotifierMod._modName}] Notice: acceptQuest exited. This is AFTER calling the original acceptQuest method.`);

            // TODO: add event handler here
            return originalResult;
        }
    }

    private patchQuestControllerCompleteQuest(container: DependencyContainer, questController: QuestController) {
        // monkey patch method `completeQuest` on QuestController with our event handlers on both ends (pre- and post-method call)

        const originalCompleteRequest = questController.completeQuest.bind(questController);

        questController.completeQuest = (pmcData: IPmcData, body: ICompleteQuestRequestData, sessionID: string): IItemEventRouterResponse => {
            const logger = container.resolve<ILogger>("WinstonLogger");

            logger.info(`[${QuestNotifierMod._modName}] completeQuest about to be called.`);

            const result = originalCompleteRequest(pmcData, body, sessionID);
            logger.info(result);

            logger.info(`[${QuestNotifierMod._modName}] completeQuest has been called. Exiting.`);

            return result;
        }

    }

}

export const mod = new QuestNotifierMod();
