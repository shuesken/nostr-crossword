import Crossword from "@jaredreisinger/react-crossword";
import {
  CluesData,
  CluesInputOriginal,
} from "@jaredreisinger/react-crossword/dist/types";
import { url } from "inspector";
import { useState } from "react";
import { publishCrosswordDefinition } from "./nostr";

export const CATEGORIES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function Admin() {
  const [date, setDate] = useState("2023-02-08");
  const [meta, setMeta] = useState({});

  function parseCrossword(text: string) {
    const sections = text.replace("\r", "").split("\n\n");
    const solutionsText = sections[8].replaceAll("%", ""); // in the original format, these mark circled letters; we're ignoring them
    const acrossText = sections[9].trim();
    const downText = sections[10].trim();

    let acrossClues = acrossText.split("\n");
    let downClues = downText.split("\n");

    const solutions = solutionsText.split("\n").map((row) => row.split(""));

    if (sections[0] !== "ARCHIVE")
      throw new Error("doesn't start with 'ARCHIVE");

    if (sections[1].length !== 6)
      throw new Error("date is not specified: " + sections[1]);

    if (parseInt(sections[4]) !== parseInt(sections[5]))
      throw new Error("indicated size is not square");

    if (parseInt(sections[4]) !== solutions.length)
      throw new Error("parsed solutions are bigger than indicated size");

    solutions.forEach((r) => {
      if (parseInt(sections[4]) !== r.length) {
        throw new Error("parsed solutions are bigger than indicated size");
      }
    });

    if (parseInt(sections[6]) !== acrossClues.length)
      throw new Error("different number of across clues than indicated");

    console.log(sections[7], downClues.length, downClues);
    if (parseInt(sections[7]) !== downClues.length)
      throw new Error("different number of down clues than indicated");

    let cluesInput: CluesInputOriginal = {
      across: {},
      down: {},
    };

    let clueNumber = 1;
    for (let row = 0; row < solutions.length; row++) {
      for (let col = 0; col < solutions.length; col++) {
        const skip = solutions[row][col] === "#";
        const addDown = row === 0 || solutions[row - 1][col] === "#";
        const addAcross = col === 0 || solutions[row][col - 1] === "#";
        if (!skip) {
          if (addDown) {
            // we should build a down clue
            let answer = "";
            for (
              let i = row;
              i < solutions.length && solutions[i][col] !== "#";
              i++
            ) {
              answer += solutions[i][col];
            }
            cluesInput.down[clueNumber] = {
              row,
              col,
              answer,
              clue: downClues.shift() as string,
            };
          }
          if (addAcross) {
            // we should build an across clue
            let answer = "";
            for (
              let i = col;
              i < solutions.length && solutions[row][i] !== "#";
              i++
            ) {
              answer += solutions[row][i];
            }
            cluesInput.across[clueNumber] = {
              row,
              col,
              answer,
              clue: acrossClues.shift() as string,
            };
          }

          if (addDown || addAcross) clueNumber++;
        }
      }
    }

    // set category and publication date
    let dateString = sections[1];
    let d = new Date();

    d.setUTCFullYear(
      (parseInt(`20${dateString.slice(0, 2)}`),
      parseInt(dateString.slice(2, 4)),
      parseInt(dateString.slice(4, 6)))
    );

    let dayIndex = d.getDay();

    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    const meta: any = {
      author: sections[3],
      category: days[dayIndex],
      publicationDate: d.toISOString().slice(0, 10),
    };
    return {
      cluesInput,
      meta,
    };
  }

  async function handlePullClick(e: any) {
    e.preventDefault();
    const url = `https://nytsyn.pzzl.com/nytsyn-crossword/nytsyncrossword?date=${date
      .replaceAll("-", "")
      .slice(2)}`;

    const res = await window.fetch(url);
    // need to use our own text decoder because the server doesn't declare encoding correctly -.-
    const decoder = new TextDecoder("iso-8859-1");
    const text = decoder.decode(await res.arrayBuffer());
    const parsed = parseCrossword(text);
    parsed.meta.publisher = "New York Times";
    parsed.meta.category = CATEGORIES[new Date(date).getDay()];
    parsed.meta.publicationDate = date;
    setCluesInput(parsed.cluesInput);
    setMeta(parsed.meta);
  }

  async function handlePublishClick(e: any) {
    e.preventDefault();
    await publishCrosswordDefinition(cluesInput, meta);
  }

  const [cluesInput, setCluesInput] = useState<CluesInputOriginal>({
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
  });

  return (
    <div>
      <input
        value={date}
        onChange={(e) => setDate(e.target.value)}
        type="date"
      ></input>
      <button onClick={handlePullClick}>Pull data</button>
      <output>
        <pre>{JSON.stringify(cluesInput, null, 2)}</pre>
      </output>
      <Crossword data={cluesInput} />
      <button onClick={handlePublishClick}>Publish Crossword Definition</button>
    </div>
  );
}
