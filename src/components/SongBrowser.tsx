import { createSignal } from "solid-js";
import { Song } from "../types/Song";
import styles from './SongBrowser.module.css';

export const SongBrowser = (props: { songs: Song[], loadSong: (song: Song) => Promise<void> }) => {
    function sortSongs(key: keyof Song) {
        return props.songs.toSorted((a, b) => a[key].toString().localeCompare(b[key].toString()))
    }
    function sortSongsByID() {
        return props.songs.toSorted((a, b) => a.id - b.id)
    }
    const [sortedSongs, setSortedSongs] = createSignal<Song[]>(sortSongsByID())

    return (
        <div class={styles.SongBrowser}>
            <table>
                <thead>
                    <tr>
                        <th onclick={() => setSortedSongs(sortSongsByID())}>ID</th>
                        <th onclick={() => setSortedSongs(sortSongs('artist'))}>Artist</th>
                        <th onclick={() => setSortedSongs(sortSongs('title'))}>Title</th>
                        <th onclick={() => setSortedSongs(sortSongs('year'))}>Year</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedSongs().map((song) => (
                        <tr onclick={() => props.loadSong(song)}>
                            <td>{song.id}</td>
                            <td>{song.artist}</td>
                            <td>{song.title}</td>
                            <td>{song.year}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
