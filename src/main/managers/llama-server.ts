import { execFile } from 'child_process'

import llamaServer from '../../../resources/llamacpp/server?asset&asarUnpack'

export class ElectronLlamaServerManager {
  launchServer() {
    execFile(llamaServer, (err, stdout, _stderr) => {
      if (err) {
        console.error(err)
        return
      }
      console.log(stdout)
    })
  }
}
