import { QuestController } from "@spt/controllers/QuestController";
import { PatchableMethods } from "./PatchableMethodsEnum";

export interface depr_IQuestControllerProxyHandler {
    get(target: QuestController, propKey: PatchableMethods, receiver: any): any
}

export interface IQuestControllerProxyHandler {
    apply(target: any, thisArg: any, argumentsList: any[]): any
}