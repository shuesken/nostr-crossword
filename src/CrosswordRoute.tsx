import { useSearchParams } from "react-router-dom";
import {
  Crossword,
  CrosswordProviderImperative,
} from "@jaredreisinger/react-crossword";
import { useState, useRef, useEffect } from "react";
import {
  cwGameEventId,
  loadCwData,
  publishCellChange,
  registerStateListener,
  init,
  CwState,
} from "./nostr";
import { type CluesInputOriginal } from "@jaredreisinger/react-crossword/dist/types";
import MyCrossword from "./MyCrossword";

export default function CrosswordRoute() {
  let [searchParams] = useSearchParams();

  const ref = useRef<CrosswordProviderImperative>(null);

  let cwId = searchParams.get("id") ?? "";

  const [cwData, setCwData] = useState<CluesInputOriginal>({
    across: {},
    down: {},
  });

  useEffect(() => {
    init()
      .then(() => loadCwData(cwId))
      .then((game) => {
        setCwData(game.data);
      })
      .then(() => registerStateListener(cwGameEventId, handleNewState))
      .catch(console.error);
  }, [cwId]);

  function handleOnCellChange(row: number, col: number, char: string) {
    console.log("cell changed", row, col, char);
    publishCellChange(row, col, char);
  }

  function handleNewState(state: CwState) {
    for (const [key, value] of Object.entries(state)) {
      const [row, col] = key.split("_");
      ref.current?.setGuess(parseInt(row), parseInt(col), value);
    }
  }

  return (
    <MyCrossword data={cwData} onCellChange={handleOnCellChange} ref={ref} />
  );
}
