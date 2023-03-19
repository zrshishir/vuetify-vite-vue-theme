'use strict'

const archiver = require('archiver')
const fs = require('fs')
const path = require('path')
const shell = require('shelljs')

const resolve = file => path.resolve(__dirname, file)
const pkgPath = resolve('../package.json')
const packages = require(pkgPath)
const THEME_NAME = packages.name
// const THEME_PRODUCTS = ['78271730']

// Remove hooks from package.json
delete packages.scripts.postversion
delete packages.devDependencies.archiver
delete packages.devDependencies.shelljs
fs.writeFileSync(pkgPath, JSON.stringify(packages, null, 2), 'utf8')

shell.exec('rimraf dist staging')
shell.mkdir('-p', 'dist')
shell.mkdir('-p', 'staging')

const { stdout } = shell.exec('git stash create')
shell.exec(`git archive -o staging/theme.zip HEAD $(git diff --name-only ${stdout})`)

const archive = archiver('zip', { zlib: { level: 9 } })
const dist = resolve(`../dist/${THEME_NAME}-v${packages.version}.zip`)
const output = fs.createWriteStream(dist)

shell.exec('conventional-changelog -o staging/CHANGELOG.md -p angular -r 0')
archive.append(fs.createReadStream(resolve('../README.md')), { name: 'README.md' })

archive.pipe(output)
archive.directory(resolve('../staging'), false)

archive.finalize().then(() => {
  shell.exec('git reset --hard && git clean -fd')
})
