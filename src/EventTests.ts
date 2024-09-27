import { singleton, inject } from "tsyringe";
import { IPostQuestListenerRegistry, IPreQuestListenerRegistry } from "./QuestListenerRegistry";
import { IPreQuestEventListener } from "./IQuestEventListener";
import { ICancelableEventArgs } from "./ICancelableEventArgs";
import { ILogger } from "@spt/models/spt/utils/ILogger";
import { IPreQuestListenerBinding } from "./IQuestListenerBinding";
import { QuestController } from "@spt/controllers/QuestController";
import { IPmcData } from "@spt/models/eft/common/IPmcData";
import { IAcceptQuestRequestData } from "@spt/models/eft/quests/IAcceptQuestRequestData";


@singleton()
export class QuestEventTests {
    constructor(
        @inject("QuestEventEmitterAPILogger") private logger: ILogger,
        @inject("PreQuestListenerRegistry") private preEmitRegistry: IPreQuestListenerRegistry,
        @inject("PostQuestListenerRegistry") private postEmitRegistry: IPostQuestListenerRegistry,
        @inject("QuestController") private questController: QuestController

    ) { }

    public runTests(): void {
        // first we just want to see if we can trigger an event through QuestHelper

        // Define constants


        // creates a listener for "acceptQuest"
        this.logger.info("Quest Event Testing: Now testing preEvent")
        const preEventSuccess = this.testPreEvent()

        // try to manually accept a quest
        //this.questController.acceptQuest()

    }

    testPreEvent(): void {
        // just creates one event, checks if that resolves successfully
        // Create a test event that gets called before I accept a task
        const logger = this.logger
        const acceptTaskCallback: IPreQuestEventListener = {
            // define the callback function
            on(eventArgs, pmcData: IPmcData, acceptedQuest: IAcceptQuestRequestData, sessionID: string, ...args): ICancelableEventArgs {
                if (logger) {
                    logger.success("Pre-accept event called successfully")
                    logger.success("acceptQuest called by " + pmcData._id)
                }

                // return eventArgs without setting cancel to True
                return eventArgs
            },
        }
        const binding: IPreQuestListenerBinding = {
            questMethod: "acceptQuest",
            eventListenerCallback: acceptTaskCallback
        }
        this.preEmitRegistry.registerPreListener(binding);
    }

    testPostEvent(): void {
        // creates on post-event listener, checks if that resolves successfully
        throw new Error("Not Yet Implemented")

    }

    testPreEventWithCancel(): void {
        // creates two events. The first event will attempt to cancel the QuestController method call.
        // If the postEvent is called, we failed
        throw new Error("Not Yet Implemented")

    }

    testPreEventWithWrongTypes(): void {
        // attempts to bind a function referencing an invalid parameter
        throw new Error("Not Yet Implemented")

    }

    testPostEventWithWrongTypes(): void {
        // attempts to bind a function referencing an invalid parameter
        throw new Error("Not Yet Implemented")

    }

}