import { CluesInputOriginal } from "@jaredreisinger/react-crossword/dist/types";
import {
    relayInit,
    generatePrivateKey,
    getPublicKey,
    getEventHash,
    signEvent,
} from "nostr-tools";

import { type Relay } from "nostr-tools";
import { Game, NostrEvent } from "./types";

const RELAY_URL = "wss://knostr.neutrine.com";
const CROSSWORD_STATE_KIND = 19879
const CROSSWORD_DEFINITION_KIND = 8981
const CROSSWORD_START_KIND = 2470
export let cwGameEventId = "mymadeupgameeventid"

let relay: Relay
let privateKey: string

export type CwState = {
    [index: string]: string
}

let cwState: CwState = {}


export function init() {
    if (relay?.status === 1 || relay?.status === 0) return Promise.resolve()
    if (!privateKey) privateKey = generatePrivateKey()
    return new Promise<void>((resolve, reject) => {
        relay = relayInit(RELAY_URL)
        relay!.on("connect", resolve);
        relay!.on("error", reject);
        relay!.connect()
    });
}

export async function publishCellChange(row: number, col: number, char: string) {
    const key = `${row}_${col}`
    if (cwState[key] === char) {
        console.log('not publishing already known cell change')
        return
    }
    cwState[key] = char
    const content = {
        type: "rcw0",
        data: cwState
    }

    console.log('publishing cell change', row, col, char)


    let event: any = {
        kind: CROSSWORD_STATE_KIND,
        created_at: Math.floor(Date.now() / 1000),
        tags: [
            ['e', cwGameEventId, 'somerelay', 'root'],
            ['d', cwGameEventId],
            ['expiration', `${Math.floor(Date.now() / 1000) + 24 * 60 * 60}`]
        ],
        content: JSON.stringify(content),
        pubkey: getPublicKey(privateKey)
    }

    event.id = getEventHash(event)
    event.sig = signEvent(event, privateKey)

    relay!.publish(event)
}

export async function publishCrosswordDefinition(cluesInput: CluesInputOriginal, meta: any) {
    await init()

    const type = 'rcw0'

    const content = {
        type,
        data: cluesInput,
        meta
    }
    let event: any = {
        kind: CROSSWORD_DEFINITION_KIND,
        created_at: Math.floor(Date.now() / 1000),
        tags: [
            ['expiration', `${Math.floor(Date.now() / 1000) + 24 * 60 * 60}`],
            ['t', type]
        ],
        content: JSON.stringify(content),
        pubkey: getPublicKey(privateKey)
    }

    event.id = getEventHash(event)
    event.sig = signEvent(event, privateKey)
    relay!.publish(event)
}


export function getCrosswordDefinitions() {
    return new Promise<Game[]>((resolve, reject) => {
        init().then(() => {
            const games: Game[] = []
            const sub = relay!.sub([
                {
                    kinds: [CROSSWORD_DEFINITION_KIND],
                }
            ])

            sub.on('event', (event: NostrEvent) => {
                try {
                    JSON.parse(event.content)
                } catch (e: any) {
                    return console.error(e)
                }
                const content = JSON.parse(event.content) as { data: CluesInputOriginal, meta: any, type: string }
                games.push({ id: event.id, ...content })
            })

            sub.on('eose', () => {
                sub.unsub()
                resolve(games)
            })
        })

    })
}

export async function registerStateListener(cwGameEventId: string, listener: (state: CwState) => any) {
    let lastEvent: NostrEvent
    let sawEose = false
    const sub = relay!.sub([
        {
            kinds: [CROSSWORD_STATE_KIND],
            "#e": [cwGameEventId]
        }
    ])
    sub.on('event', (event: NostrEvent) => {
        try {
            JSON.parse(event.content)
        } catch (e: any) {
            return console.error(e)
        }

        if (sawEose) {
            console.log('got new event after eose was seen')
            if (event.pubkey === getPublicKey(privateKey)) {
                console.log('discarding own state change')
                return
            }
            const content = JSON.parse(event.content)
            return listener(content.data)
        }
        else if (!lastEvent || event.created_at > lastEvent.created_at)
            lastEvent = event
        else
            console.log('discarding old event', event)
    })

    sub.on('eose', (event: NostrEvent) => {
        console.log('got eose')
        sawEose = true
        const content = JSON.parse(lastEvent.content)
        return listener(content.data)
    })

}

export async function loadCwData(id: string): Promise<Game> {
    return new Promise<Game>((resolve, reject) => {
        init().then(() => {
            const startSub = relay!.sub([
                {
                    kinds: [CROSSWORD_START_KIND],
                    ids: [id]
                }
            ])
            relay.on('error', reject)

            startSub.on('event', (event: NostrEvent) => {
                const rootTag = event.tags.find(tag => tag[0] === 'e' && tag[3] === 'root')
                if (!rootTag) return reject()
                const rootId = rootTag[1]
                const defSub = relay!.sub([
                    {
                        kinds: [CROSSWORD_DEFINITION_KIND],
                        ids: [rootId]
                    }
                ])
                defSub.on('event', (event: NostrEvent) => {
                    try {
                        JSON.parse(event.content)
                    } catch (e: any) {
                        reject(e)
                    }
                    const content = JSON.parse(event.content) as { data: CluesInputOriginal, meta: any, type: string }
                    resolve({ id: event.id, ...content })
                })

                defSub.on('eose', () => reject('could not find game definition'))
            })

            startSub.on('eose', () => {
                startSub.unsub()
            })
        })
    })
}

export async function startGame(id: string) {
    return new Promise<string>((resolve, reject) => {
        init().then(() => {
            const content = ''

            const tags = [
                ["e", id, RELAY_URL, "root"],
                ['expiration', `${Math.floor(Date.now() / 1000) + 24 * 60 * 60}`]
            ]

            let event: any = {
                kind: CROSSWORD_START_KIND,
                created_at: Math.floor(Date.now() / 1000),
                tags,
                content,
                pubkey: getPublicKey(privateKey)
            }
            event.id = getEventHash(event)
            event.sig = signEvent(event, privateKey)
            const pub = relay.publish(event)
            pub.on('ok', () => resolve(event.id))
            pub.on('failed', reject)
        })
    })

}
