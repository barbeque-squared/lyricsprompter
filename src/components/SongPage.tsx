import {createEffect, createSignal, Setter} from "solid-js";
import { Song } from "../types/Song";
import styles from './SongPage.module.css';
import { LyricsInfo } from "../types/LyricsInfo";
import { TimeBar } from "./TimeBar";
import { AudioState } from "../types/AudioState";

export const SongPage = (props: { song: Song, lyrics: string, state: AudioState, setAudioState: Setter<AudioState> }) => {
    const [duration, setDuration] = createSignal(0)
    const [currentTime, setCurrentTime] = createSignal(0)
    const [currentLyricsInfoIndex, setCurrentLyricsInfoIndex] = createSignal(0)
    // we need the audiodiv for seeking
    let audiodiv!: HTMLDivElement
    let audioelem!: HTMLAudioElement

    createEffect(() => {
        if (props.state === 'play') {
            audioelem.play()
        } else {
            audioelem.pause()
        }
    })

    // always have an empty element at the beginning
    let lyricsInfo: LyricsInfo[] = []
    let lines: string[] = []
    let firstTimestampFound = false
    let timestamp = 0
    for (const line of props.lyrics.split('\n')) {
        if (line.match(/^\d+:\d+(\.\d+)?$/)) {
            if (firstTimestampFound) {
                // everything before the first timestamp is ignored
                lyricsInfo.push({
                    timestamp,
                    text: lines.join('\n').trim(),
                })
            }
            lines = []
            const [minutes, seconds] = line.split(':')
            timestamp = Number.parseInt(minutes)*60 + Number.parseFloat(seconds)
            if (!firstTimestampFound && timestamp !== 0) {
                // add an empty one at the beginning if the song doesn't start at 0:00
                lyricsInfo.push({ timestamp: 0, text: '' })
            }
            firstTimestampFound = true
        } else {
            lines.push(line)
        }
    }
    // add the last element
    lyricsInfo.push({
        timestamp,
        text: lines.join('\n').trim(),
    })

    function onDurationChange(event: Event) {
        const elem = event.target as HTMLAudioElement
        setDuration(elem.duration)
    }

    function onTimeUpdate(event: Event) {
        const elem = event.target as HTMLAudioElement
        const newTime = elem.currentTime
        setCurrentTime(newTime)
        const newIndex = lyricsInfo.findLastIndex((info) => info.timestamp <= newTime)
        if (newIndex > -1 && newIndex !== currentLyricsInfoIndex()) {
            setCurrentLyricsInfoIndex(newIndex)
        }
    }

    function relevantLyrics(): string {
        const startIndex = currentLyricsInfoIndex()
        let res = lyricsInfo.at(startIndex)?.text ?? ''
        if (res === '') {
            // return immediately if this is an empty one
            return res
        }
        for (let i = startIndex + 1; i < lyricsInfo.length; i++) {
            const text = lyricsInfo[i].text
            if (text === '') {
                break
            }
            res += `\n\n${text}`
        }
        return res
    }

    // if the current text is empty, find the first non-empty text and return that
    // it will be displayed in grey
    function nextLyrics(): string {
        const startIndex = currentLyricsInfoIndex()
        let currentText = lyricsInfo.at(startIndex)?.text ?? 'nonempty'
        if (currentText !== '') {
            // return empty text because there are already relevantLyrics
            return ''
        }
        const res = []
        for (let i = startIndex + 1; i < lyricsInfo.length; i++) {
            const nextText = lyricsInfo[i].text
            if (nextText === '') {
                break
            }
            res.push(nextText)
        }
        return res.join('\n\n')
    }

    function seek(event: MouseEvent) {
        const width = audiodiv.clientWidth
        if (width < 1) {
            // ignore
            return
        }
        const fraction = event.offsetX/width
        const actualDuration = duration()
        if (actualDuration < 1) {
            // ignore
            return
        }
        audioelem.currentTime = fraction*actualDuration
    }

    function togglePlayPause() {
        // use the setter, otherwise it's impossible to pause from the input box if it was started from a click
        // by using the setter, it remains synced
        if (audioelem.paused) {
            props.setAudioState('play')
        } else {
            props.setAudioState('pause')
        }
    }

    function formatTime(time: number): string {
        const rounded = Math.round(time)
        const minutes = Math.floor(rounded / 60);
        const seconds = rounded - minutes * 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }

    function lineStartsAndEndsWithNUnderscoresOrAsterisks(line: string, n: number) {
        return line.length > 2*n && (
            (line.startsWith('_'.repeat(n)) && line.endsWith('_'.repeat(n)))
            || (line.startsWith('*'.repeat(n)) && line.endsWith('*'.repeat(n)))
        )
    }

    function formatLine(line: string) {
        if (lineStartsAndEndsWithNUnderscoresOrAsterisks(line, 3)) {
            return <b><i>{line.slice(3, -3)}</i></b>
        } else if (lineStartsAndEndsWithNUnderscoresOrAsterisks(line, 2)) {
            return <b>{line.slice(2, -2)}</b>
        } else if (lineStartsAndEndsWithNUnderscoresOrAsterisks(line, 1)) {
            return <i>{line.slice(1, -1)}</i>
        }
        return line
    }

    return (
        <div class={styles.SongPage}>
            <div class={styles.Lyrics}>
                {relevantLyrics() !== '' && relevantLyrics().split('\n').map((line) => (
                    <p>{formatLine(line)}</p>
                ))}
                {nextLyrics() !== '' && nextLyrics().split('\n').map((line) => (
                    <p class={styles.nextLyrics}>{formatLine(line)}</p>
                ))}
            </div>
            <div class={styles.Audio} on:click={seek} ref={audiodiv}>
                <audio src={props.song.audio} onTimeUpdate={onTimeUpdate} onDurationChange={onDurationChange} ref={audioelem} />
                <TimeBar lyricsInfo={lyricsInfo} duration={duration()} currentTime={currentTime()} />
            </div>
            <div class={styles.Time} onclick={togglePlayPause} >{formatTime(currentTime())} / {formatTime(duration())}</div>
        </div>
    )
}
