import { IEvent, EventCollection } from "./types"

/**
 * Decorator for adding events into RAGE API
 * 
 * @param {string | string[]} eventName - event(s) name, which will be added to mp.events.add
 * 
 * @example
 * decorator usage:
 * event("playerJoin")
 * event(["playerDeath", "playerQuit"])
 */
export const event = (eventName: string | string[]): MethodDecorator => {
  // make sure we have an array in the event
  // and clean any duplicate cmds which passed into the params
  eventName = Array.isArray(eventName) ? eventName : [eventName]
  const events = eventName.filter((item, index) => eventName.indexOf(item) === index)

  const newEvent: IEvent = {
    event: events,
    callable: ''
  }

  // get a main event name
  const mainEvent = events[0]

  // return methodDecorator in which we define our IEvent into metadata
  return function(target: Object, callableMethod: string | symbol, descriptor: TypedPropertyDescriptor<any>) {
    // method must be callable
    if (!(descriptor.value instanceof Function)) throw new Error(`Event[${mainEvent}] must be callable`)

    // get the target metadata to merge new IEvent
    const targetEvents: EventCollection = Reflect.getMetadata("design:eventlist", target) || new Map<string, IEvent>()

    // set the callable event
    newEvent.callable = callableMethod.toString()

    // merge with existing events
    const eventObjects = targetEvents.get(mainEvent)
    targetEvents.set(mainEvent, eventObjects && [...eventObjects, newEvent] || [newEvent])

    // store them into metadata
    Reflect.defineMetadata("design:eventlist", targetEvents, target)

    return descriptor
  }
}