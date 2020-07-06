import { ICommand, CommandCollection } from ".."

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
            mp.events.add(
              "playerCommand",
              onPlayerCommand(this, command, Array.isArray(command) && mainCmd || undefined),
            )
          })
          // set flag to target.prototype that all their commands are registered
          Reflect.defineMetadata("design:cmdlist:init", true, target.prototype)
        }
      }
    }
  }
}

/**
 * Returns a function which invokes by event playerCommand
 * 
 * @param context - context of current command 
 * @param commands - list of group commands or command
 * @param group (optional) - command name of group
 */
const onPlayerCommand = (context: any, commands: ICommand | ICommand[], group?: string) => (input: string): void => {
  // register commands in Rage API 
  const commandArgs = input.split(/[ ]+/)
  const commandName = commandArgs.shift()

  if (!commandName) return
  if (group && group !== commandName) return

  if (!Array.isArray(commands)) {
    const { cmd, callable, desc } = commands

    if (cmd.indexOf(commandName) === -1) return
    const descIndex = cmd.findIndex(cmdname => cmdname === commandName)

    return context[callable](desc[descIndex], ...commandArgs)
  } else {
    const subCommand = commandArgs.shift()
    // flat array of commands
    const cmdList = commands.reduce((carry, { cmd }) => carry.concat(cmd), [] as string[])
    // flat array of descriptions
    const descList = commands.reduce((carry, { desc }) => carry.concat(desc), [] as string[])

    if (!subCommand || cmdList.indexOf(subCommand) === -1) {
      descList.forEach(text => mp.gui.chat.push(text))
    } else {
      for ( let { cmd, callable } of commands) {
        if (cmd.indexOf(subCommand) === -1) return

        // call registered command with [this] context of current class
        const descIndex = cmdList.findIndex(cmdname => cmdname === commandName)
        context[callable](descList[descIndex], ...commandArgs)
        break
      }
    }
  }
}