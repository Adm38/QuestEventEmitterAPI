These server methods/routers are called when a user accepts a task

[Client Request] /client/game/profile/items/moving
[Client Request] /client/mail/dialog/info
[Client Request] /player/health/sync

[Client Request] /client/game/profile/items/moving
[Client Request] /client/mail/dialog/info


# Other interesting routers
/client/quest/list

callbacks -> QuestCallbacks.d.ts


helpers -> ProfileHelper.d.ts -> removeQuestConditionFromProfile
    /**
     * Remove/reset a completed quest condtion from players profile quest data
     * @param sessionID Session id
     * @param questConditionId Quest with condition to remove
     */

QuestConditionHelper.d.ts
QuestHelper.d.ts
    /**
     * Fail a quest in a player profile
     * @param pmcData Player profile
     * @param failRequest Fail quest request data
     * @param sessionID Session id
     * @param output Client output
     */
    failQuest(pmcData: IPmcData, failRequest: IFailQuestRequestData, sessionID: string, output?: IItemEventRouterResponse): void;


        /**
     * Alter a quests state + Add a record to its status timers object
     * @param pmcData Profile to update
     * @param newQuestState New state the quest should be in
     * @param questId Id of the quest to alter the status of
     */
    updateQuestState(pmcData: IPmcData, newQuestState: QuestStatus, questId: string): void;


        /**
     * Resets a quests values back to its chosen state
     * @param pmcData Profile to update
     * @param newQuestState New state the quest should be in
     * @param questId Id of the quest to alter the status of
     */
    resetQuestState(pmcData: IPmcData, newQuestState: QuestStatus, questId: string): void;


        /**
     * Get quest by id from database (repeatables are stored in profile, check there if questId not found)
     * @param questId Id of quest to find
     * @param pmcData Player profile
     * @returns IQuest object
     */
    getQuestFromDb(questId: string, pmcData: IPmcData): IQuest;