import type { Component } from 'solid-js';

import styles from './App.module.css';
import {createSignal} from "solid-js";
import {Song} from "./types/Song";
import { SongBrowser } from "./components/SongBrowser";
import { info } from "./songinfo"
import { SongPage } from './components/SongPage';
import { AudioState } from './types/AudioState';

const App: Component = () => {
  let input!: HTMLInputElement
  const [currentSong, setCurrentSong] = createSignal<Song | null>(null)
  const [audioState, setAudioState] = createSignal<AudioState>('pause')
  // separate because fetching from here is much easier
  const [currentLyrics, setCurrentLyrics] = createSignal<string | null>(null)

  function unloadSong() {
    setAudioState('pause')
    setCurrentSong(null)
    setCurrentLyrics(null)
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

  return (
    <div class={styles.App}>
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
        <footer>
          Source: <a href="https://github.com/barbeque-squared/lyricsprompter">https://github.com/barbeque-squared/lyricsprompter</a>
        </footer>
      </div>

      <div class={styles.Content}>
        {(currentSong() === null || currentLyrics() === null) && (
          <SongBrowser songs={info.songs} loadSong={loadSong} />
        )}
        {currentSong() !== null && currentLyrics() !== null && (
          <SongPage song={currentSong()!} lyrics={currentLyrics()!} state={audioState()} setAudioState={setAudioState} />
        )}
      </div>
    </div>
  )
}

export default App
