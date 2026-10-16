import { connect, createServer } from 'node:net'

// Docker does not publish ports on internal-only networks; relay browser traffic to dev.
createServer((browser) => {
  const dev = connect(3000, 'dev')
  browser.pipe(dev).pipe(browser)
  browser.on('error', () => dev.destroy())
  dev.on('error', () => browser.destroy())
  browser.on('close', () => dev.destroy())
  dev.on('close', () => browser.destroy())
}).listen(3000, '0.0.0.0')
