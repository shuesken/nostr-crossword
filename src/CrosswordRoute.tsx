import { useSearchParams } from "react-router-dom";
import {
  Crossword,
  CrosswordContext,
  CrosswordProviderImperative,
} from "@jaredreisinger/react-crossword";
import { useState, useRef, useContext, useEffect } from "react";
import {
  cwGameEventId,
  loadCwData,
  publishCellChange,
  registerStateListener,
  init,
  CwState,
} from "./nostr";
import { type CluesInputOriginal } from "@jaredreisinger/react-crossword/dist/types";

export default function CrosswordRoute() {
  let [searchParams] = useSearchParams();

  const ref = useRef<CrosswordProviderImperative>(null);

  let cwId = searchParams.get("id") ?? "";

  let [loading, setLoading] = useState<boolean>(false);

  const [cwData, setCwData] = useState<CluesInputOriginal>({
    across: {},
    down: {},
  });

  useEffect(() => {
    if (loading) return;
    setLoading(true);
    init()
      .then(() => loadCwData(cwId))
      .then(setCwData)
      .then(() => registerStateListener(cwGameEventId, handleNewState));
  });

  function handleOnCellChange(row: number, col: number, char: string) {
    publishCellChange(row, col, char);
  }

  function handleNewState(state: CwState) {
    for (const [key, value] of Object.entries(state)) {
      const [row, col] = key.split("_");
      ref.current?.setGuess(parseInt(row), parseInt(col), value);
    }
  }

  return (
    <div>
      <p>Id! {cwId}</p>
      <Crossword data={cwData} onCellChange={handleOnCellChange} ref={ref} />
    </div>
  );
}
