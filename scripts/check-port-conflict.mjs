import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { createServer } from 'node:net'
import { resolve } from 'node:path'
import { loadConfigFromFile } from 'vite'

const configFile = resolve(process.cwd(), 'vite.config.ts')
const loaded = await loadConfigFromFile({ command: 'serve', mode: 'test' }, configFile)

if (!loaded) {
  throw new Error('Viten projektiasetusta ei löytynyt.')
}

const viteBin = resolve(process.cwd(), 'node_modules/vite/bin/vite.js')

function getAddress(config) {
  const host = typeof config.host === 'string' ? config.host : '127.0.0.1'
  if (typeof config.port !== 'number' || !config.strictPort) {
    throw new Error(
      'Porttikonfliktitesti edellyttää Vite-asetuksesta kiinteää porttia ja strictPort=true.',
    )
  }
  return { host, port: config.port }
}

async function assertPortConflict(command, address) {
  const holder = createServer()
  holder.listen(address.port, address.host)
  await once(holder, 'listening')

  const child = spawn(process.execPath, [viteBin, command], {
    cwd: process.cwd(),
    shell: false,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  })
  let output = ''
  child.stdout.on('data', (data) => {
    output += data.toString()
  })
  child.stderr.on('data', (data) => {
    output += data.toString()
  })

  try {
    const exitCode = await new Promise((resolveExit, reject) => {
      const timeout = setTimeout(() => {
        child.kill()
        reject(new Error(`${command} ei palauttanut porttikonfliktivirhettä viidessä sekunnissa.`))
      }, 5_000)
      child.once('error', (error) => {
        clearTimeout(timeout)
        reject(error)
      })
      child.once('close', (code) => {
        clearTimeout(timeout)
        resolveExit(code)
      })
    })

    if (
      exitCode === 0 ||
      !output.includes(String(address.port)) ||
      !/already in use|EADDRINUSE/i.test(output)
    ) {
      throw new Error(`Odotettu ${command}-porttikonfliktivirhe puuttui. Tuloste:\n${output}`)
    }
    console.log(
      `${command}: porttikonflikti varmennettu osoitteessa ${address.host}:${address.port}.`,
    )
  } finally {
    if (child.exitCode === null) child.kill()
    holder.close()
    await once(holder, 'close')
  }
}

await assertPortConflict('dev', getAddress(loaded.config.server))
await assertPortConflict('preview', getAddress(loaded.config.preview))
