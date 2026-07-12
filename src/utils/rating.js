const User = require("../models/User");


function calculateElo(playerRating, opponentRating, result) {
const K = 20;
;

    const expected =
        1 /(1 +Math.pow(10,(opponentRating - playerRating)/400));

let score = 0;
    if (result === "win") score = 1;
    else if (result === "draw") score = 0.5;
    else score = 0;
    const newRating = Math.round(
        playerRating + K * (score - expected)
    );
    return newRating;
}
async function updateRatings(
    whiteUserId,
    blackUserId,
    winner,
    mode
) {

    const white = await User.findById(whiteUserId);
    const black = await User.findById(blackUserId);

    if (!white || !black) {
        console.log("Players not found");
        return;
    }

    const ratingField = `${mode}Rating`;

    const whiteOld = white[ratingField];
    const blackOld = black[ratingField];
    const gamesField = `${mode}Games`;
    const winsField = `${mode}Wins`;
    const lossesField = `${mode}Losses`;
    const drawsField = `${mode}Draws`;

    if (winner === "white") {

        white[ratingField] =
            calculateElo(whiteOld, blackOld, "win");

        black[ratingField] =
            calculateElo(blackOld, whiteOld, "lose");

        white.wins++;
        black.losses++;
        white.gamesPlayed++;
black.gamesPlayed++;

white[gamesField]++;
black[gamesField]++;

white[winsField]++;
black[lossesField]++;

    }

    else if (winner === "black") {

        black[ratingField] =
            calculateElo(blackOld, whiteOld, "win");

        white[ratingField] =
            calculateElo(whiteOld, blackOld, "lose");

        black.wins++;
        white.losses++;
        white.gamesPlayed++;
        black.gamesPlayed++;

        white[gamesField]++;
        black[gamesField]++;

        black[winsField]++;
        white[lossesField]++;

    }

    else {

        white[ratingField] =
            calculateElo(whiteOld, blackOld, "draw");

        black[ratingField] =
            calculateElo(blackOld, whiteOld, "draw");

        white.draws++;
        black.draws++;
        white.gamesPlayed++;
        black.gamesPlayed++;

        white[gamesField]++;
        black[gamesField]++;

        white[drawsField]++;
        black[drawsField]++;

    }
    // Update Peak Rating

if (white[ratingField] > white[`${mode}Peak`]) {
    white[`${mode}Peak`] = white[ratingField];
}

if (black[ratingField] > black[`${mode}Peak`]) {
    black[`${mode}Peak`] = black[ratingField];
}
if (!white[`${mode}History`]) white[`${mode}History`] = [];
if (!black[`${mode}History`]) black[`${mode}History`] = [];

white[`${mode}History`].push(white[ratingField]);
black[`${mode}History`].push(black[ratingField]);

    await white.save();
    await black.save();

    console.log("Ratings Updated");
    console.log(
        white.username,
        whiteOld,
        "->",
        white[ratingField]
    );

    console.log(
        black.username,
        blackOld,
        "->",
        black[ratingField]
    );

}
module.exports = {
    calculateElo,
    updateRatings
};
