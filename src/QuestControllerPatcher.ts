import { DependencyContainer, Dictionary, Lifecycle } from "tsyringe/dist/typings/types";
import { IBaseQuestEventCallback, IQuestAcceptCallback, IQuestCompleteCallback } from "./IQuestEventListener";
import { ListenerType } from "./ListenerTypeEnum"
import { ICancelableEventArgs } from "./QuestEventArgs";
import { ILogger } from "@spt/models/spt/utils/ILogger";
import { QuestNotifierMod } from "./mod";
import { QuestController } from "@spt/controllers/QuestController";
import { QuestListenerRegistry } from "./QuestListenerRegistry";

/* I almost wonder if it would be better to have a dict with the enum as keys. Something like:
{
  listenerType: [] // list of listeners. These should all be listening on the same event considering OnQuestAccept is an enum value and that's one single function we want to hook into
}

Also - I think I could probably set this up to be more flexible if I set up the implementation in a smart way. I think I could create a generic `patchMethod` method that takes the following args:
  - ListenerType enum. This will be matched to a dict or something (maybe in the config files?) that points to the correct name of the method on QuestController (or QuestHelper I don't remember where the method lives)
  - A IBaseQuestEventCallback (or a class inheriting from). [Do I even need this? I feel like no...]
  - A ICancelableEventArgs (more likely a class extending that). This would let me set up the patcher to know what type of args to emit
The problem with this approach is I'm not yet sure how to pass all the original method parameters (IPmcData and sessionID for example) to the eventListener without needing bespoke code for each one. I think I saw something about ...args[] ?
  --> https://stackoverflow.com/questions/50726326/how-to-go-about-understanding-the-type-new-args-any-any
*/


export class QuestControllerPatcher {
    constructor(
        private container: DependencyContainer,
    ) {

        // Register this class as a singleton in the DI container
        container.register<QuestControllerPatcher>("QuestControllerPatcher", QuestControllerPatcher, { lifecycle: Lifecycle.Singleton });
    }

    public patchQuestMethod(listenerType: ListenerType): void {

        // get a reference to QuestController class
        const questController = this.container.resolve<QuestController>("QuestController");

        // store a reference to the method before patching
        const originalMethod = questController[listenerType].bind(questController);

        // create an event listener both pre- and post-method invoke
        questController[listenerType] = (...args: any[]) => {
            // Dynamically handle arguments, assuming they match original method signature
            //TODO I'm stuck here. I think I need to look into factories / generators because this is too generic for me to wrap my head around
            // 1. Pre-method event emit (before calling the original method)
            const preEventArgs: ICancelableEventArgs = { cancel: false };
            // (Emit pre-event logic here using your event listener manager, e.g.):
            this.container.resolve<QuestListenerRegistry>("QuestListenerRegistry").triggerPreEvent(listenerType, preEventArgs, ...args);

            // Check if the event canceled the method call
            if (preEventArgs.cancel) {
                // Early return if the event was canceled
                return;
            }

            // 2. Call the original method with the same arguments
            const result = originalMethod(...args);

            // 3. Post-method event emit (after calling the original method)
            this.container.resolve<QuestListenerRegistry>("QuestListenerRegistry").triggerPostEvent(listenerType, result, ...args);

            // Return the original result
            return result;
        };
    }

    //TODO: write method to unpatch a function
}
