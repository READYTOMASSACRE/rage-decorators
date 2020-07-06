import { enviroment, ENVIROMENT } from "."

import { commandable as serverCommandable } from "./server/commandable"
import { commandable as clientCommandable } from "./client/commandable"

export const commandable = enviroment === ENVIROMENT.CLIENTSIDE ? clientCommandable : serverCommandable