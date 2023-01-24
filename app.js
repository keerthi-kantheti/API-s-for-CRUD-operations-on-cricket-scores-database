const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");
const app = express();
app.use(express.json());
let db = null;
const dbPath = path.join(__dirname, "cricketMatchDetails.db");

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Database and server connected successfully");
    });
  } catch (e) {
    console.log(`db error:${e.message}`);
  }
};
initializeDbAndServer();

//API 1 get all players details from player_details table
app.get("/players/", async (request, response) => {
  const allStatesQuery = `SELECT player_id AS playerId,player_name AS playerName FROM player_details;`;
  const allStateArray = await db.all(allStatesQuery);

  response.send(allStateArray);
});

//API 2 get a player with specific iD from player_details table
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const allStatesQuery = `SELECT 
  player_id AS playerId,
  player_name AS playerName 
  FROM 
  player_details
  WHERE 
  player_id=${playerId};`;
  const allStateArray = await db.all(allStatesQuery);

  response.send(allStateArray[0]);
});

//API 3  put player details based on id in player_details table
app.put("/players/:playerId", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const putPlayerDetailsQuery = `UPDATE player_details
    SET 
    player_name='${playerName}'
    WHERE 
    player_id=${playerId};`;
  const resultArray = await db.run(putPlayerDetailsQuery);
  response.send("Player Details Updated");
});

//API 4 get details of match with match_id from match_details table
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const matchDetailsWithIdQuery = `SELECT 
    match_id AS matchId,
    match,year
    FROM 
    match_details
    WHERE 
    match_id=${matchId};
    `;
  const matchArray = await db.get(matchDetailsWithIdQuery);
  response.send(matchArray);
});

//API 5 get match details of players
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchDetailsOfPlayerWithIdQuery = `SELECT 
    player_match_score.match_id AS matchId,
    match_details.match,
    match_details.year
    FROM player_match_score INNER JOIN match_details 
    ON 
    player_match_score.match_id=match_details.match_id
    WHERE 
    player_match_score.player_id=${playerId};`;
  const resultArray = await db.all(getMatchDetailsOfPlayerWithIdQuery);
  response.send(resultArray);
});

//API 6 get all players in specific match
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayersWithMatchIdQuery = `SELECT player_details.player_id AS playerId,player_details.player_name AS playerName FROM player_details INNER JOIN player_match_score ON player_details.player_id=player_match_score.player_id WHERE player_match_score.match_id=${matchId};`;
  const resultArray = await db.all(getPlayersWithMatchIdQuery);
  response.send(resultArray);
});
//API 7 get all score of players with specific player_id

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getScoresOfPlayerWithIdQuery = `SELECT player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(player_match_score.fours) AS totalFours,
    SUM(player_match_score.sixes) AS totalSixes
    FROM 
    player_details INNER JOIN player_match_score
    ON player_match_score.player_id=player_details.player_id
    WHERE 
    player_match_score.player_id=${playerId};`;
  const reqArray = await db.get(getScoresOfPlayerWithIdQuery);
  response.send(reqArray);
});
module.exports = app;
