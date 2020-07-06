import 'reflect-metadata'

import { ENVIROMENT, CommandCollection, ICommand, EventCollection, IEvent } from './types'

export * from './types'

/**
 * The current enviroment
 */
export const enviroment = typeof mp.game !== 'undefined' ? ENVIROMENT.CLIENTSIDE : ENVIROMENT.SERVERSIDE

/**
 * A storage of commands which is called by decorator command
 */
export const registeredCommands: CommandCollection = new Map<string, ICommand | ICommand[]>()

/**
 * A storage of events which is called by decorator event
 */
export const registeredEvents: EventCollection = new Map<string, IEvent[]>()

export * from './command'
export * from './commandable'
export * from './event'
export * from './eventable'