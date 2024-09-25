import { ICancelableEventArgs } from "./ICancelableEventArgs";

/**
 * Interface for a generic pre-event listener that can be bound to methods of the QuestController.
 * 
 * Classes implementing this interface will intercept method calls on the QuestController before 
 * the actual method execution. The `on` method will be triggered with the method name (propKey) 
 * and its arguments, and it should return an object of type `ICancelableEventArgs`. 
 * This allows listeners to modify the behavior of the original method, potentially canceling the call.
 * 
 * @interface IPreQuestEventListener
 */
export interface IPreQuestEventListener {
    /**
     * Handles an event before the execution of a QuestController method.
     * 
     * @param propKey - The name of the method on QuestController that is being intercepted.
     * @param args - The arguments that were passed to the QuestController method.
     * @returns {ICancelableEventArgs} - An event arguments object that can signal whether the method call should be canceled or proceed as normal.
     */
    on(eventArgs: ICancelableEventArgs, ...args: any[]): ICancelableEventArgs
}

/**
 * Interface for a generic post-event listener that can be bound to methods of the QuestController.
 * Classes implementing this interface will be notified after a method on the QuestController has been executed. 
 * The `on` method will be triggered with the method name (propKey) and the result of the method execution. 
 * Post-event listeners can use this information for logging, modifying the result, or triggering additional actions.
 * @interface IPostQuestEventListener
 */
export interface IPostQuestEventListener {
    /**
     * Handles an event after the execution of a QuestController method.
     * @param propKey - The name of the method on QuestController that was called.
     * @param originalMethodResult - The result of the method call, which can be used or modified by the listener.
     */
    on(originalMethodResult: any): void
}


