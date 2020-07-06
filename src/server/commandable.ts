import { CommandCollection } from ".."

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
              mp.events.addCommand(mainCmd, (player: any, _: string, ...args: string[]) => {
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
                (player: any, _: string, ...args: any[]) => this[callable](player, desc[cmdIndex], ...args)
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