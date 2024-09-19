import { IItemEventRouterResponse } from "@spt/models/eft/itemEvent/IItemEventRouterResponse";
import { ICancelableEventArgs, IQuestCompleteEventArgs, IQuestAcceptEventArgs } from "./QuestEventArgs";
import { IAcceptQuestRequestData } from "@spt/models/eft/quests/IAcceptQuestRequestData";
import { IPmcData } from "@spt/models/eft/common/IPmcData";
import { Item } from "@spt/models/eft/common/tables/IItem";

/**
 * Base interface for all quest event callbacks.
 * Provides a generic type for onPreEvent and onPostEvent to support flexibility.
 */
export interface IBaseQuestEventCallback<TEventArgs, TResult = any> {
    onPreEvent?(eventArgs: TEventArgs, ...args: any[]): void;
    onPostEvent?(result: TResult, ...args: any[]): void;
}


/**
 * Event listener interface for quest acceptance events.
 * Extends the base quest event callback interface with specific quest acceptance parameters.
 */
export interface IQuestAcceptCallback extends IBaseQuestEventCallback<IQuestAcceptEventArgs> {
    // onPreEvent and onPostEvent are inherited with specific types from IBaseQuestEventCallback
}

/**
 * Event listener interface for quest completion events.
 * Extends the base quest event callback interface with specific quest completion parameters.
 */
export interface IQuestCompleteCallback extends IBaseQuestEventCallback<IQuestCompleteEventArgs> {
    // onPreEvent and onPostEvent are inherited with specific types from IBaseQuestEventCallback
}