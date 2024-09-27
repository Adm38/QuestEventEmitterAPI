import { QuestController } from "@spt/controllers/QuestController";
import { IPostQuestEventListener, IPreQuestEventListener } from "./IQuestEventListener";
import { PatchableMethods } from "./PatchableMethodsEnum";

export interface IPreQuestListenerBinding {
    questMethod: PatchableMethods;
    eventListenerCallback: IPreQuestEventListener;
}

export interface IPostQuestListenerBinding {
    questMethod: PatchableMethods;
    eventListenerCallback: IPostQuestEventListener;
}
