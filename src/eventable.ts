import { EventCollection } from "./types"
import { registeredEvents } from "."

/**
 * Resolve any events which passed to classes with decorator eventable
 */
export const eventable = () => {
  return function(target: any): any {
    return class extends target {
      constructor(...args: any[]) {
        // first we must call an inherited constructor
        super(...args)

        // then we start record our events into Rage API
        // check if class events has already registered
        if (!Reflect.getMetadata("design:eventlist:init", target.prototype)) {
          const events: EventCollection = Reflect.getMetadata("design:eventlist", target.prototype) || []

          // register events in Rage API 
          events.forEach((eventObjects, eventName) => {
            eventObjects = eventObjects.map(eventObject => {
              const { event, callable } = eventObject
  
              // record a callable method
              // to manage in future
              const callableMethod = this[callable]
              if (typeof this[callable] !== 'function') throw new Error(`Event[${eventName}] in ${this.constructor.name} is not callable!`)
  
              event.forEach(eventName => mp.events.add(eventName, callableMethod))

              eventObject.func = callableMethod

              return eventObject
            })

            // record new event into global storage
            const registeredEvent = registeredEvents.get(eventName) || []
            registeredEvents.set(eventName, [...registeredEvent, ...eventObjects])
          })
          // set flag to target.prototype that all class events are registered
          Reflect.defineMetadata("design:eventlist:init", true, target.prototype)
        }
      }
    }
  }
}