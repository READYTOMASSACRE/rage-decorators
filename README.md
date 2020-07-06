# rage-decorators
A useful lightweight library which helps to registry **server-side/client-side** events, commands via [decorators](https://www.typescriptlang.org/docs/handbook/decorators.html) for RageMP API 

* [Installation](#installation)
* [Examples](#examples)
* [API](#api)

# Installation

Via [npm](https://github.com/npm/cli):
`$ npm i --save rage-decorators`

Via [yarn](https://yarnpkg.com/cli/install):
`$ yarn add rage-decorators`

# Examples

**Ninja.ts** *command example*
```typescript
import { command, commandable } from 'rage-decorators'

@commandable()
class Ninja {
  constructor(
    private isHide: boolean = false,
    private readonly ninjaName: string = "Zorro"
    ) {
      this.hide = this.hide.bind(this)
  }

  @command("hide")
  hide(player: PlayerMp, cmdDesc: string, ...args: any[]): void {
      if (args.length) {
          player.outputChatBox(cmdDesc)
      } else {
          this.isHide = !this.isHide
          player.outputChatBox(`Now ninja is ${this.isHide ? "hided" : "not hided"}`)
      }
  }
  
  @command(["ninjaname", "name", "n"])
  // also we can define custom description, for example
  // @command(["ninjaname", "name", "n"], { desc: "Only ninja see it, usage /{{cmdName}}" })
  // also we can provide  group of commands
  // our commands will be /ninja [ninjaname|name|n]
  // @command(["ninjaname", "name", "n"], "ninja")
  // another syntax
  // @command(["ninjaname", "name", "n"], { group: "ninja" })
  name(player: PlayerMp, cmdDesc: string, ...args: any[]: void) {
    if (args.length) {
      player.outputChatBox(cmdDesc)
    } else {
      player.outputChatBox(`Ninja name ${this.ninjaName}`)
    }
  }
}

export { Ninja }
```

**NinjaEvents.ts** *event example*
```typescript
import { event, eventable } from 'rage-decorators'

@eventable()
class NinjaEvents {
  @event("playerJoin")
  ninjaJoin(player: PlayerMp) {
    mp.players.forEach(currentPlayer => currentPlayer.outputChatBox(`Ninja ${player.name} has just joined.`))
  }
}
```

# API
## **commandable()**
Resolve any commands which passed to classes commandable

## **command(commandName, params)**
Decorator for adding commands to RAGE API
**Parameters**
* `commandName` [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)[] - The command(s) name, which will be added to mp.events.addCommand
* `params` *(optional)* [object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)
  * `group` *(optional)* [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) - A command group
  * `desc` *(optional)* [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) -A command description, supports templates: [`{{cmdName}}`, `{{groupName}}`]

## **eventable()**
Resolve any events which passed to classes with decorator eventable

## **event(eventName)**
**Parameters**
* `eventName` [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)[] - event(s) name, which will be added to mp.events.add