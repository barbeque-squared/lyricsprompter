import { LyricsInfo } from "../types/LyricsInfo";

const HEIGHT = 1

interface TimeBarSentence {
    start: number
    duration: number
}

export const TimeBar = (props: { lyricsInfo: LyricsInfo[], duration: number, currentTime: number }) => {
    const sentences: TimeBarSentence[] = []
    for (let i = 0; i < props.lyricsInfo.length - 1; i++) {
        if (props.lyricsInfo[i].text === '') {
            // don't draw empties
            continue
        }
        const start = props.lyricsInfo[i].timestamp
        const end = props.lyricsInfo[i+1].timestamp
        const duration = end - start
        if (duration < 0.1) {
            // skip if multiple boxes at same timestamp, this happens when:
            // - default box at 0 but the song also has something on 0
            // - double timestamp to clear screen
            continue
        }
        sentences.push({ start, duration })
    }
    // the last one is done at rendering time
    const lastInfo = props.lyricsInfo[props.lyricsInfo.length-1]

    return (
        <svg viewBox={`0,0,${props.duration},${HEIGHT*2}`} width='100%' height='100%' preserveAspectRatio="none">
            <rect x={0} y={0} width={props.currentTime} height={HEIGHT} fill='white' />
            {sentences.map((sentence) => (
                <rect
                    x={sentence.start}
                    y={HEIGHT}
                    width={sentence.duration}
                    height={HEIGHT}
                    fill='white'
                />
            ))}
            {lastInfo.text !== '' && (
                <rect
                    x={lastInfo.timestamp}
                    y={HEIGHT}
                    width={props.duration - lastInfo.timestamp}
                    height={HEIGHT}
                    fill='white'
                />
            )}
        </svg>
    )
}
