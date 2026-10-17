# Lyricsprompter
Because on stage you just need a quick reminder of what the lyrics were.
Videos work but are so much effort, and printing out doesn't really scale.

So I created this to show me the next few lines of text,
with some extra's like a progress bar and a rough indication of where the text blocks are.

## Getting started
1. One-time `pnpm i`
2. Put songs + text files in `public/songs`
3. `pnpm run start`

If songs are missing: `pnpm run prestart`

## Controls
The input box controls everything.
Type any of the below and press Enter:
* `0`: return to home screen
* `<ID number>`: load song
* `+` (or `<Space>`): play
* `<nothing at all>`: pause

You can also click on the progress/text info bar to seek.

## Song format
A song consists of two parts:
* Any file that an `<audio>` element understands
* A textfile with some metadata, timestamps, and the lyrics

You can use any directory structure you want within `public/songs`,
though it's recommended to keep the audio and textfile next to each other.

A textfile looks like this:
```
ID: 4
Artist: YourStageName
Title: My Awesome Cover
Year: 2026
Audio: FileForTheAudioElement.mp3
The above fields are required, but you can add whatever else you like

0:05
This is the first block of text
It will become visible at 5 seconds
0:10
This is the second block of text
It will already be visible at 5 seconds
But at 10 seconds, the first block disappears
The third block is not shown yet

This is still part of the second "block"
Timestamps can also have decimals, eg 0:15.5 or 0:15.563
0:15

0:30
This is the third block
Between 15 and 30 seconds, it will be shown in grey.
At 30 seconds, it will become white
and directly following blocks also shown.
Because there is no final timestamp,
this will be shown until the end of the song
```

Everything else is up to you!
Some people want to have it scroll by sentence by sentence, others prefer blocks.

A very limited amount of markup is supported:
* a line surrounded by `***` or `___` will be bold+italics
* a line surrounded by `**` or `__` will be bold
* a line surrounded by `*` or `_` will be italics

## Playlists
You can create a textfile `public/playlist.txt`.
The format is simply one song ID per line.
No error checking is done on this.
