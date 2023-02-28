import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CATEGORIES } from "./Admin";
import { getCrosswordDefinitions, init, startGame } from "./nostr";
import { Game } from "./types";

export default function Home() {
  const [categories, setCategories] = useState<
    {
      category: string;
      games: Game[];
    }[]
  >(
    CATEGORIES.map((c) => {
      return { category: c, games: [] };
    })
  );

  const navigate = useNavigate();

  async function handleStartGame(game: Game) {
    const gameId = await startGame(game.id);
    navigate(`/cw?id=${gameId}`);
  }

  useEffect(() => {
    init()
      .then(() => getCrosswordDefinitions())
      .then((games) => {
        const sortedGames = games.sort((a, b) =>
          a.meta?.publicationDate < b.meta?.publicationDate ? 1 : -1
        );

        setCategories((categories) =>
          categories.map((c) => {
            return {
              category: c.category,
              games: sortedGames.filter(
                (game) => game.meta.category === c.category
              ),
            };
          })
        );
      });
  }, []);

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
      {categories.map((c) => {
        return (
          <div>
            <h2>{c.category}</h2>
            <ul>{c.games.map(GameLink)}</ul>
          </div>
        );
      })}
    </div>
  );
}
