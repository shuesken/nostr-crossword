import { GridData } from "@jaredreisinger/react-crossword/dist/types";
import {
    relayInit,
    generatePrivateKey,
    getPublicKey,
    getEventHash,
    signEvent,
} from "nostr-tools";

import { type Relay } from "nostr-tools";
import { useState } from "react";
import { NostrEvent } from "./types";

const RELAY_URL = "wss://knostr.neutrine.com";
const CROSSWORD_STATE_KIND = 19879
export let cwGameEventId = "mymadeupgameeventid"

let relay: Relay
let privateKey: string

export type CwState = {
    [index: string]: string
}

let cwState: CwState = {}


export function init() {
    if (relay?.status == 1 || relay?.status == 0) return Promise.resolve()
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
    cwState[key] = char
    const content = {
        type: "rcw0",
        data: cwState
    }


    let event: any = {
        kind: CROSSWORD_STATE_KIND,
        created_at: Math.floor(Date.now() / 1000),
        tags: [
            ['e', cwGameEventId, 'root'],
            ['d', cwGameEventId]
        ],
        content: JSON.stringify(content),
        pubkey: getPublicKey(privateKey)
    }

    event.id = getEventHash(event)
    event.sig = signEvent(event, privateKey)

    relay!.publish(event)
}

export async function registerStateListener(cwGameEventId: string, listener: (state: CwState) => any) {
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
        const content = JSON.parse(event.content)
        listener(content.data)
    })

}

export async function loadCwData(id: string) {
    // load the data for a crossword
    const data = {
        across: {
            1: {
                clue: "one plus one",
                answer: "TWO",
                row: 0,
                col: 0,
            },
        },
        down: {
            2: {
                clue: "three minus two",
                answer: "ONE",
                row: 0,
                col: 2,
            },
        },
    };
    return data
}
