import { DependencyContainer } from "tsyringe";

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


class Mod implements IPreSptLoadMod, IPostSptLoadMod {
    // Code added here will load BEFORE the server has started loading
    private static modName: string = "ScrimpyDimpy-QuestsDebugging";

    private static container: DependencyContainer;

    public preSptLoad(container: DependencyContainer): void {
        // store the container in case we need it later on
        Mod.container = container;

        // patch QuestController.acceptQuest to print to the console when a user accepts a new quest
        this.patchQuestControllerMethods(container);
    }

    public postSptLoad(container: DependencyContainer): void {
        const databaseServer = container.resolve<DatabaseServer>("DatabaseServer");
        const questHelper = container.resolve<QuestHelper>("QuestHelper");

        const SHOOTING_CANS_ID = "657315df034d76585f032e01"

        // get the shooting can quest
        const shootingCansQuest: IQuest = databaseServer.getTables().templates.quests[SHOOTING_CANS_ID]

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
            const logger = Mod.container.resolve<ILogger>("WinstonLogger");

            logger.info(`[${Mod.modName}] Notice: acceptQuest invoked. This is before calling the original acceptQuest method.`)
            // TODO: add event handler here

            // original acceptQuest logic
            const originalResult = originalAcceptQuest(pmcData, acceptedQuest, sessionID)
            logger.info(originalResult);


            logger.info(`[${Mod.modName}] Notice: acceptQuest exited. This is AFTER calling the original acceptQuest method.`);

            // TODO: add event handler here
            return originalResult;
        }
    }

    private patchQuestControllerCompleteQuest(container: DependencyContainer, questController: QuestController) {
        // monkey patch method `completeQuest` on QuestController with our event handlers on both ends (pre- and post-method call)

        const originalCompleteRequest = questController.completeQuest.bind(questController);

        questController.completeQuest = (pmcData: IPmcData, body: ICompleteQuestRequestData, sessionID: string): IItemEventRouterResponse => {
            const logger = container.resolve<ILogger>("WinstonLogger");

            logger.info(`[${Mod.modName}] completeQuest about to be called.`);

            const result = originalCompleteRequest(pmcData, body, sessionID);
            logger.info(result);

            logger.info(`[${Mod.modName}] completeQuest has been called. Exiting.`);

            return result;
        }

    }

}

export const mod = new Mod();
