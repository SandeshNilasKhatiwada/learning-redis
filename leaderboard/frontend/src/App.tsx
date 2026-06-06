import { useState, useEffect } from "react";
import "./App.css";

// 1. Define TypeScript Interfaces for our data
interface Player {
  value: string; // Redis returns the member name as 'value'
  score: number;
}

interface UserRankResponse {
  username?: string;
  rank?: number;
  score?: number;
  error?: string;
}

function App() {
  // 2. Apply strict types to our state variables
  const [leaderboard, setLeaderboard] = useState<Player[]>([]);
  const [username, setUsername] = useState<string>("");
  const [points, setPoints] = useState<string>("");
  const [searchUser, setSearchUser] = useState<string>("");
  const [userRank, setUserRank] = useState<UserRankResponse | null>(null);

  // Fetch the top standings
  const fetchLeaderboard = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/leaderboard");
      const data: Player[] = await response.json();
      setLeaderboard(data);
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
    }
  };

  // Submit score update
  const handleSubmitScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !points) return;

    try {
      await fetch("http://localhost:3000/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, points: parseInt(points) }),
      });
      setUsername("");
      setPoints("");
      fetchLeaderboard(); // Refresh scores immediately
    } catch (err) {
      console.error("Error submitting score:", err);
    }
  };

  // Check an individual user's rank
  const handleCheckRank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchUser) return;

    try {
      const response = await fetch(
        `http://localhost:3000/api/rank/${searchUser}`,
      );
      if (response.ok) {
        const data: UserRankResponse = await response.json();
        setUserRank(data);
      } else {
        setUserRank({ error: "User not found" });
      }
    } catch (err) {
      console.error("Error checking rank:", err);
    }
  };

  // Poll the backend every 5 seconds for live updates
  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        padding: "20px",
        fontFamily: "Arial, sans-serif",
        maxWidth: "600px",
        margin: "0 auto",
      }}
    >
      <h1>🏆 Live Redis Leaderboard</h1>

      {/* Submit Score Form */}
      <section
        style={{
          marginBottom: "30px",
          padding: "15px",
          border: "1px solid #ccc",
          borderRadius: "5px",
        }}
      >
        <h3>Submit / Update Score</h3>
        <form onSubmit={handleSubmitScore}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ marginRight: "10px", padding: "5px" }}
          />
          <input
            type="number"
            placeholder="Points to add"
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            style={{ marginRight: "10px", padding: "5px" }}
          />
          <button type="submit" style={{ padding: "5px 10px" }}>
            Add Score
          </button>
        </form>
      </section>

      {/* Check Specific Rank */}
      <section
        style={{
          marginBottom: "30px",
          padding: "15px",
          border: "1px solid #ccc",
          borderRadius: "5px",
        }}
      >
        <h3>Check Your Rank</h3>
        <form onSubmit={handleCheckRank}>
          <input
            type="text"
            placeholder="Enter Username"
            value={searchUser}
            onChange={(e) => setSearchUser(e.target.value)}
            style={{ marginRight: "10px", padding: "5px" }}
          />
          <button type="submit" style={{ padding: "5px 10px" }}>
            Search
          </button>
        </form>
        {userRank && (
          <div style={{ marginTop: "10px", fontWeight: "bold" }}>
            {userRank.error
              ? userRank.error
              : `User: ${userRank.username} | Rank: #${userRank.rank} | Score: ${userRank.score}`}
          </div>
        )}
      </section>

      {/* Leaderboard Table */}
      <section>
        <h3>Top 10 Players</h3>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            textAlign: "left",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#f2f2f2" }}>
              <th style={{ padding: "10px", borderBottom: "2px solid #ddd" }}>
                Rank
              </th>
              <th style={{ padding: "10px", borderBottom: "2px solid #ddd" }}>
                Username
              </th>
              <th style={{ padding: "10px", borderBottom: "2px solid #ddd" }}>
                Score
              </th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((player, index) => (
              <tr key={player.value} style={{ borderBottom: "1px solid #ddd" }}>
                <td style={{ padding: "10px" }}>#{index + 1}</td>
                <td style={{ padding: "10px" }}>{player.value}</td>
                <td style={{ padding: "10px" }}>{player.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export default App;
