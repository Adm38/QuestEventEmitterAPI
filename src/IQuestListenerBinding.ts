import { QuestController } from "@spt/controllers/QuestController";
import { IPostQuestEventListener, IPreQuestEventListener } from "./IQuestEventListener";

export interface IPreQuestListenerBinding {
    questMethod: keyof QuestController;
    eventListenerCallback: IPreQuestEventListener;
}

export interface IPostQuestListenerBinding {
    questMethod: keyof QuestController;
    eventListenerCallback: IPostQuestEventListener;
}
