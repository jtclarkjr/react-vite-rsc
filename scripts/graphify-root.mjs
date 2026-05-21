import { mkdir, readFile, lstat, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

const root = resolve(process.env.GRAPHIFY_ROOT ?? process.cwd())
const outDir = join(root, 'graphify-out')
const rootFile = join(outDir, '.graphify_root')
const force = process.argv.includes('--force') || process.env.GRAPHIFY_ROOT_FORCE === '1'

async function pathState(path) {
  try {
    return await lstat(path)
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return null
    }

    throw error
  }
}

const outDirStat = await pathState(outDir)

if (outDirStat?.isSymbolicLink()) {
  console.error('Refusing to write graphify root: graphify-out is a symlink')
  process.exit(1)
}

if (outDirStat && !outDirStat.isDirectory()) {
  console.error('Refusing to write graphify root: graphify-out exists and is not a directory')
  process.exit(1)
}

await mkdir(outDir, { recursive: true })

const rootFileStat = await pathState(rootFile)

if (rootFileStat?.isSymbolicLink()) {
  console.error('Refusing to write graphify root: graphify-out/.graphify_root is a symlink')
  process.exit(1)
}

if (rootFileStat && !rootFileStat.isFile()) {
  console.error(
    'Refusing to write graphify root: graphify-out/.graphify_root exists and is not a file'
  )
  process.exit(1)
}

if (rootFileStat) {
  const existingRoot = (await readFile(rootFile, 'utf8')).trim()

  if (existingRoot === root) {
    console.log('graphify root already points to current directory')
    process.exit(0)
  }

  if (!force) {
    console.error(
      'Refusing to overwrite graphify-out/.graphify_root because it points to a different directory'
    )
    console.error('Run `node scripts/graphify-root.mjs --force` to replace it.')
    process.exit(1)
  }
}

await writeFile(rootFile, `${root}\n`, 'utf8')

console.log('graphify root written to graphify-out/.graphify_root')
