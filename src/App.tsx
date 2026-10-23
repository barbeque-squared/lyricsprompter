import type { Component } from 'solid-js';

import styles from './App.module.css';
import {createSignal} from "solid-js";
import {Song} from "./types/Song";
import { SongBrowser } from "./components/SongBrowser";
import { info } from "./songinfo"
import { SongPage } from './components/SongPage';
import { AudioState } from './types/AudioState';

const App: Component = () => {
  const bc = new BroadcastChannel('lyricsprompter')
  let input!: HTMLInputElement
  const [currentSong, setCurrentSong] = createSignal<Song | null>(null)
  const [audioState, setAudioState] = createSignal<AudioState>('pause')
  const [isMonitor, setIsMonitor] = createSignal<boolean>(false)
  // separate because fetching from here is much easier
  const [currentLyrics, setCurrentLyrics] = createSignal<string | null>(null)
  const [nextPlaylistId, setNextPlaylistId] = createSignal<string | null>(info.playlist.length > 0 ? info.playlist[0] : null)

  function unloadSong() {
    setAudioState('pause')
    setCurrentSong(null)
    setCurrentLyrics(null)
    if (!isMonitor()) {
      bc.postMessage({ type: 'unloadsong' })
    }
    input.focus()
  }

  async function loadSong(song: Song) {
    setAudioState('pause')
    const lyricsXhr = await fetch(song.lyrics)
    // replace CRLF with LF since that's what the rest assumes
    const lyrics = (await lyricsXhr.text()).replaceAll('\r\n', '\n')
    setCurrentLyrics(null)
    setCurrentLyrics(lyrics)
    setCurrentSong(song)
    const playlistIndex = info.playlist.indexOf(song.id.toString())
    if (playlistIndex > -1) {
      if (info.playlist.length > playlistIndex + 1) {
        setNextPlaylistId(info.playlist[playlistIndex + 1])
      } else {
        setNextPlaylistId(null)
      }
    }
    if (!isMonitor()) {
      bc.postMessage({ type: 'loadsong', id: song.id })
    }
    input.focus()
  }

  async function onSubmit(event: Event) {
    event.preventDefault()
    switch(input.value) {
      case '':
        // stop playing
        setAudioState('pause')
        break
      case '+':
      case ' ':
        // start playing
        setAudioState('play')
        break
      default:
        // load new song if it exists
        const value = Number.parseInt(input.value)
        if (value === 0) {
          unloadSong()
        } else {
          const newSong = info.songs.find((song) => song.id === value)
          if (newSong !== undefined) {
            await loadSong(newSong)
          }
        }
    }
    input.value = ''
  }

  function enableMonitor() {
    setIsMonitor(true)
    bc.onmessage = (event) => {
      if (event.data.type === 'unloadsong') {
        unloadSong()
      } else if (event.data.type === 'loadsong') {
        const newSong = info.songs.find((song) => song.id === event.data.id)
        if (newSong !== undefined) {
          void loadSong(newSong)
        }
      }
    }
  }

  return (
    <div class={styles.App}>
      {!isMonitor() && (
        <div class={styles.GlobalNavigation}>
          <p onclick={unloadSong}><b>Lyricsprompter</b></p>
          Mouse navigation:
          <ul>
            <li>click Lyricsprompter: home</li>
            <li>click table header: sort</li>
            <li>click song row: select song</li>
            <li>click time: play/pause</li>
          </ul>
          Input:
          <ul>
            <li>0: home</li>
            <li>song number: select song</li>
            <li>+ or space: play</li>
            <li>(empty): pause</li>
          </ul>

          <form onSubmit={onSubmit}>
            <input type='text' size={4} pattern='\d+| |\+' ref={input} autofocus />
          </form>

          Current song:<br/>
          {(currentSong() === null || currentLyrics() === null) && (
            '-'
          )}
          {currentSong() !== null && currentLyrics() !== null && (
            <>
              <h1>{currentSong()!.id}</h1>
              <b>{currentSong()!.title}</b>
            </>
          )}
          {nextPlaylistId() !== null && (
            <h1 class={styles.next}>next: {nextPlaylistId()}</h1>
          )}
          <footer>
            <p><a onclick={() => enableMonitor()}>Enter monitor mode</a></p>
            Source: <a href="https://github.com/barbeque-squared/lyricsprompter">https://github.com/barbeque-squared/lyricsprompter</a>
          </footer>
        </div>
      )}

      <div class={styles.Content}>
        {!isMonitor() && (currentSong() === null || currentLyrics() === null) && (
          <SongBrowser songs={info.songs} loadSong={loadSong} />
        )}
        {currentSong() !== null && currentLyrics() !== null && (
          <SongPage
            song={currentSong()!}
            lyrics={currentLyrics()!}
            state={audioState()}
            setAudioState={setAudioState}
            isMonitor={isMonitor()}
            audienceBanner={info.audienceBanner}
          />
        )}
      </div>
    </div>
  )
}

export default App
