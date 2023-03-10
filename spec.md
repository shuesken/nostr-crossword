# Nostr Spec for Crossword Events
(might become a NIP sometime)

## Flow
Clients join a game by choosing the ID of a **Crossword Game** Event, and polling for the last **Crossword Move** Event by `created_at`. They make a move by submitting their own **Crossword Move** event.

Clients should consider the **Crossword Move** event with the latest `created_at` timestamp the authoritative one. There is no support for offline play or intelligent merging. Issues of spam should be resolved by limiting what pubkeys are considered trusted.

## Events
There are three types of crossword events:
- **Crossword Defintions**: These events contain the layout and clues for a crossword.
- **Crossword Games**: These events mark a particular instance of a crossword game; they reply to a **Crossword Definition** and are used as a root event for all the moves in a game.
- **Crossword Move**: These events mark a move in a crossword game. (Open question: Should they be a move or a state? Should we replace old events?)

### Crossword Definition
```js
content = {
        "type": "rcw0", // what data format we're using for the crossword; could be "puz", I choose to name "rcw0" the type of react-crossword
        "data": "...", // the content, in the "rcw0" case, just a string
        "meta": { // any optional, additional metadata a client might choose to display
            "author": "some author",
            "publishedAt": "2023-01-10",
            "canonicalSource": "https://nytimes.com/whatever/the/link/is",
            "publisher": "New York Times",
            "category": "Tuesday"
            ...restOfMeta,
        }
    }

tags = ["t", "rcw0"] // data format we're using for the crossword
```

### Crossword Game
```js
content = ''

tags = [
        ["e", idOfCrosswordDefEvent, preferredRelayForCrosswordDefEvent, "root"]
    ],
```

### Crossword Move
```js
content = { // encoding the state of the crossword
        type: "simple0", // leaving this to be possibly updated in the future
        data: {
            // crossword state encoding
        }
    }

tags = [
        ["e", idOfCrosswordGameEvent, "root"],
        ["d", idOfCrosswordGameEvent], // used for parametrized replacing
    ]
```

The Crossword Move event should be replacable; it contains the entire state for one pubkey participating in the game.




