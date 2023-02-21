import { useState, useEffect } from "react";
import { redirect, useNavigate } from "react-router-dom";
import { getCrosswordDefinitions, init, startGame } from "./nostr";
import { Game } from "./types";

export default function Home() {
  const [loading, setIsLoading] = useState(false);
  const [mondays, setMondays] = useState<Game[]>();
  const navigate = useNavigate();

  async function handleStartGame(game: Game) {
    const gameId = await startGame(game.id);
    navigate(`/cw?id=${gameId}`);
  }

  useEffect(() => {
    if (loading) return;
    setIsLoading(true);
    init()
      .then(() => getCrosswordDefinitions())
      .then((games) => {
        const sortedGames = games.sort((a, b) => (a.data < b.data ? 1 : -1));
        // set all categories actually
        setMondays(sortedGames);
      });
  });

  function GameLink(game: Game) {
    return (
      <li key={game.id}>
        {game.meta.publicationDate} by {game.meta.author}{" "}
        <button onClick={() => handleStartGame(game)}>Start Game</button>
      </li>
    );
  }

  return (
    <div>
      <h1>Crosswords</h1>
      <h2>Mondays</h2>
      <ul>{mondays?.map(GameLink)}</ul>
    </div>
  );
}
