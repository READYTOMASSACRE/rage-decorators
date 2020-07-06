import { registeredCommands, CommandCollection, ICommand } from "."

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