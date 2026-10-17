import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { join, resolve } from 'node:path'

// duplicated from src/types/Song because node doesn't like the import
interface Song {
  id: number
  artist: string
  title: string
  year: number
  lyrics: string
  audio: string
}

function recursivelyFindSongsByExtension(base: string, extension: string): Song[] {
  let res: Song[] = []
  readdirSync(resolve(base)).forEach((file) => {
    const path = join(base, file)
    const stat = statSync(path)
    if (stat.isDirectory()) {
      res = res.concat(recursivelyFindSongsByExtension(path, extension))
    } else if (stat.isFile() && path.endsWith(`.${extension}`)) {
      let id: number | null = null
      let artist: string | null = null
      let title: string | null = null
      let year: number | null = null
      let audio: string | null = null
      const lyrics = path.replace('public', '')

      // replace CRLF with LF
      const lines = readFileSync(path, 'utf-8').replaceAll('\r\n', '\n')
      for (const line of lines.split('\n')) {
        if (line.startsWith('ID: ')) {
          id = Number.parseInt(line.substring('ID: '.length))
        } else if (line.startsWith('Artist: ')) {
          artist = line.substring('Artist: '.length)
        } else if (line.startsWith('Title: ')) {
          title = line.substring('Title: '.length)
        } else if (line.startsWith('Year: ')) {
          year = Number.parseInt(line.substring('Year: '.length))
        } else if (line.startsWith('Audio: ')) {
          audio = join(base, line.substring('Audio: '.length)).replace('public', '')
        } else if (line === '' || line.match(/^\d+:\d+$/)) {
          break
        }
      }

      // make sure everything is set now
      if (id === null) {
        console.warn(`Cannot find ID in ${path}`)
        return
      } else if (id < 0) {
        throw new Error(`ID must be positive in ${path}, found ${id}`)
      } else if (id === 0) {
        throw new Error(`ID is not allowed to be 0 in ${path}`)
      } else if (artist === null) {
        console.warn(`Cannot find artist in ${path}`)
        return
      } else if (title === null) {
        console.warn(`Cannot find title in ${path}`)
        return
      } else if (year === null) {
        console.warn(`Cannot find year in ${path}`)
        return
      } else if (audio === null) {
        console.warn(`Cannot find audio in ${path}`)
        return
      } else if (!existsSync(`public${audio}`)) {
        console.warn(`Cannot find audio file 'public${audio}' referenced in ${path}`)
        return
      }
      // check that the path is actually file and not a directory
      const audioinfo = statSync(`public${audio}`)
      if (!audioinfo.isFile()) {
        console.warn(`Audio file 'public${audio}' referenced in ${path} does not look like a file`)
      }
      res.push({ id, artist, title, year, lyrics, audio})
    }
  })
  return res
}

function assertThatAllIdsAreUnique(songs: Song[]) {
  var ids = songs.map((song) => song.id)
  const uniqueIds = new Set(ids)
  if (uniqueIds.size === songs.length) {
    return
  }
  // find the ids that exist multiple times
  var o = ids.reduce((o, n) => {
    n in o ? o[n] += 1 : o[n] = 1
    return o
  }, {} as Record<number, number>)
  var duplicateIds = Object.keys(o)
    .map((k) => Number.parseInt(k))
    .filter(k => o[k] > 1)
    .toSorted()

  // construct the error message
  let res = ''
  duplicateIds.forEach((id) => {
    res += `Multiple songs with ID=${id} were found:\n`
    songs.filter((song) => song.id === id).forEach((song) => {
      res += `  - ${song.lyrics}\n`
    })
  })
  // trim off the stray newline
  throw new Error(res.trim())
}

const songs = recursivelyFindSongsByExtension('public/songs', 'txt')
assertThatAllIdsAreUnique(songs)
writeFileSync('src/songinfo.ts', `export const info = ${JSON.stringify({ songs }, null, 4)}`)
