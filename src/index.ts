import 'reflect-metadata'

/**
 * An interface of command entity
 */
export interface ICommand {
  cmd: string[],
  desc: string[]
  callable: string,
  group?: string
}

export interface IEvent {
  event: string[]
  callable: string
  func?: Function
}

/**
 * A collection of commands
 */
export type CommandCollection = Map<string, ICommand | ICommand[]>

/**
 * A collection of events
 */
export type EventCollection = Map<string, IEvent[]>

/**
 * A storage of commands which is called by decorator command
 */
export const registeredCommands: CommandCollection = new Map<string, ICommand | ICommand[]>()

/**
 * Resolve any commands which passed to classes commandable
 */
export const commandable = (): any => {
  return function (target: any): any {
    return class extends target {
      constructor(...args: any[]) {
        // first we must call an inherited constructor
        super(...args)

        // then we start record our commands to Rage API
        // check if commands has already registered
        if (!Reflect.getMetadata("design:cmdlist:init", target.prototype)) {
          const commands: CommandCollection = Reflect.getMetadata("design:cmdlist", target.prototype) || []

          // register commands in Rage API 
          commands.forEach((command, mainCmd) => {
            // check if the command is a group command
            if (Array.isArray(command)) {
              // flat array of commands
              const cmdList = command.reduce((carry, { cmd }) => carry.concat(cmd), [] as string[])
              // flat array of descriptions
              const descList = command.reduce((carry, { desc }) => carry.concat(desc), [] as string[])
  
              // make a group command
              mp.events.addCommand(mainCmd, (player: PlayerMp, fullText: string, ...args: string[]) => {
                const cmdName = args.shift()
          
                // check if current subcommand in command group
                // otherwise send a message to a player
                if (!cmdName || cmdList.indexOf(cmdName) === -1) {
                  descList.forEach(text => player.outputChatBox(text))
                } else {
                  for (let { cmd, callable } of command) {
                    // check if command exists
                    if (cmd.indexOf(cmdName) !== -1) {
                      // call registered command with [this] context of current class
                      const descIndex = cmdList.findIndex(cmdname => cmdname === cmdName)
                      this[callable](player, descList[descIndex], ...args)
                      break
                    }
                  }
                }
              })
            } else {
              // make a common command
              // and then call the registered command with [this] context of current class
              const { cmd, callable, desc } = command
              cmd.forEach((cmdName, cmdIndex) => mp.events.addCommand(
                cmdName,
                (player: PlayerMp, fullText: string, ...args: any[]) => this[callable](player, desc[cmdIndex], ...args)
              ))
            }
          })
          // set flag to target.prototype that all their commands are registered
          Reflect.defineMetadata("design:cmdlist:init", true, target.prototype)
        }
      }
    }
  }
}

/**
 * Decorator for adding commands to RAGE API
 *
 * @param {string | string[]} cmd - command(s) name, which will be added to mp.events.addCommand
 * @param {string | { group?: string, desc?: string }} params - additional params, add to group or add to description
 * 
 * Supports templates in the desc param:
 *  @template cmdName - name of command
 *  @template groupName - name of group (if added in the additional params)
 *
 * @example desc parameter template:
 * `Usage: /{{cmdName}} id`
 * `Usage: /{{groupName}} {{cmdName}} id`
 * 
 * decorator usage:
 * command("foo")
 * command(["bar", "baz"])
 * command("foo", "foogroup")
 * command("bar", { group: "foogroup", desc: "Custom description"})
 * 
 */
export const command = (
  cmd: string | string[],
  params?: string | { group?: string, desc?: string }
): MethodDecorator => {
  let group: string | undefined = undefined
  let desc: string | undefined = undefined

  // detect which params are passed to function
  if (typeof params === 'string') {
    group = params
  } else if (params) {
    group = params.group
    desc  = params.desc
  }

  // make sure we have an array in the cmd
  // and clean any duplicate cmds which passed into the params
  cmd = (Array.isArray(cmd) ? cmd : [cmd])
  const cmds = cmd.filter((item, index) => cmd.indexOf(item) === index)

  // get a main cmd
  const mainCmd = group || cmds[0]

  /** @todo seterror, setlocale */
  // throw erros if something has gone wrong
  if (!mainCmd) throw new Error("Wrong registry command")
  if (!group && registeredCommands.get(mainCmd)) throw new Error(`Duplicate command "${mainCmd}"`)

  if (group) {
    const command = registeredCommands.get(mainCmd)

    if (command) {
      if (Array.isArray(command)) {
        const flatCmds = command.reduce((carry, { cmd }) => carry.concat(cmd), [] as string[])
        const intersect = cmds.filter(value => flatCmds.includes(value))
  
        // make sure we won't add duplicate commands into group
        if (intersect.length) throw new Error(`Duplicate commands "${intersect.join(',')}" by group "${mainCmd}"`)
      } else {
        const { cmd } = command
        // make sure we won't add duplicate commands which intersect with group
        if (cmd.includes(mainCmd)) throw new Error(`Duplicate commands "${mainCmd}", trying to make a command group when a command has already existed`)
      }
    }
  } else {
    registeredCommands.forEach(value => {
      if (!Array.isArray(value)) {
        const { cmd } = value

        const intersect = cmds.filter(value => cmd.includes(value))
        // make sure we won't add duplicate commands
        if (intersect.length) throw new Error(`Duplicate commands "${intersect.join(',')}"`)
      }
    })
  }

  let description: string[] = []

  // make the description of commands
  if (desc) {
    description = cmds.map(cmdname => {
      let newDescription = desc!.replace(/{{cmdName}}/, cmdname)
      if (group) newDescription = newDescription.replace(/{{groupName}}/, mainCmd)

      return newDescription
    })
  } else {
    description = cmds.map(cmdname => `Usage /${group && (group + ' ' + cmdname) || cmdname}`)
  }

  // make a new object of command
  const newCommand: ICommand = {
    cmd: cmds,
    callable: "",
    desc: description,
  }

  // store in global storage our commands
  if (group) {
    const command = registeredCommands.get(mainCmd)
    registeredCommands.set(mainCmd, Array.isArray(command) ? [...command, newCommand] : [newCommand])
  } else {
    registeredCommands.set(mainCmd, newCommand)
  }

  return function(target: Object, callableMethod: string | symbol, descriptor: TypedPropertyDescriptor<any>) {
    const targetCommands: CommandCollection = Reflect.getMetadata("design:cmdlist", target) || new Map<string, ICommand>()

    // throw error if we're trying add command to not callable value
    if (!(descriptor.value instanceof Function)) throw new Error(`Command "${mainCmd}" should be callable`)

    newCommand.callable = callableMethod.toString()

    // store in target context storage our commands to pass them into constructor
    // where we will can register them in Rage API
    if (group) {
      const command = targetCommands.get(mainCmd)
      targetCommands.set(mainCmd, Array.isArray(command) ? [...command, newCommand] : [newCommand])
    } else {
      targetCommands.set(mainCmd, newCommand)
    }

    Reflect.defineMetadata("design:cmdlist", targetCommands, target)

    return descriptor
  }
}

/**
 * A storage of events which is called by decorator event
 */
export const registeredEvents: EventCollection = new Map<string, IEvent[]>()

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