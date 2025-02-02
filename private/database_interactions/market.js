import db from "./db.js"

/**
 * Insert the given market in the database.
 * @param {object} marketName The name of the market that is to be inserted. 
 * @returns The result of the oparation. If no market was added, returns undefined.
 */
async function insertMarket(marketName) {
    try {
        const result = await db.get("INSERT INTO market (name) VALUES (?) RETURNING *", [marketName]);
        return result;
    } catch (e) {
        console.error("ERROR while trying to insert the new market. Error: ", e);
    }
}

/**
 * Deletes the market that matches the id.
 * @param {*} marketId The id of the market that is to be deleted. 
 * @returns Returns true if the market is deleted. Otherwise returns false.
 */
async function deleteMarket(marketId) {
    try {
        const result = await db.run("DELETE FROM market WHERE id = ?", [marketId]);

        if (result.changes === 0) {
            return false;
        }

        return true;
    } catch (e) {
        console.error(`ERROR while trying to delete market with id = ${marketId}. Error: `, e);
        return false;
    }
}

/**
 * Gets and returns market that matches the given name.
 * @param {*} marketName The name of the market that is to be retreved.
 * @returns Returns the market if exists. Otherwise returns undefined.
 */
async function getMarket(marketName) {
    try {
        const result = await db.get("SELECT * FROM market WHERE name = ?", [marketName]);
        return result;
    } catch (e) {
        console.error(`ERROR while trying to select the market with name = ${marketName}. Error: `, e);
    }
}

export { insertMarket, deleteMarket, getMarket };