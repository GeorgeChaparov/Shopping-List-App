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
async function getMarketByName(marketName) {
    try {
        const result = await db.get("SELECT * FROM market WHERE name = ?", [marketName]);
        return result;
    } catch (e) {
        console.error(`ERROR while trying to select the market with name = ${marketName}. Error: `, e);
    }
}


/**
 * Gets and returns market that matches the given id.
 * @param {*} marketId The id of the market that is to be retreved.
 * @returns Returns the market. Otherwise returns undefined.
 */
async function getMarketById(marketId) {
    try {
        const result = await db.get("SELECT * FROM market WHERE id = ?", [marketId]);
        return result;
    } catch (e) {
        console.error(`ERROR while trying to select the market with id = ${marketId}. Error: `, e);
    }
}


/**
 * Checks if there are any categories that are in the market with the given id.
 * @param {object} marketId The id of the market. 
 * @returns {boolean} Returns true if there are categories in the market. Otherwise returns false.
 */
async function isMarketUsed(marketId, itemId) {
    let excludeItemQuery = "";

    //itemId is not user defined!
    if (itemId) {
        excludeItemQuery = `AND i.id != ${itemId}`;
    }

    try {
        const result = await db.get(`SELECT * FROM item AS i INNER JOIN category AS C ON i.categoryId = c.id WHERE c.marketId = ? AND i.isBought = ? ${excludeItemQuery}`, [marketId, false]);
    
        if (result === undefined) {
            return false;
        }
     
        return true;
    } catch (e) {
        console.error(`ERROR while checking if market with id = ${marketId} is in use. Error: `, e); 
    }
}

/**
 * Checks if there are any categories that are in the market with the given id.
 * @param {object} marketId The id of the market. 
 * @returns {boolean} Returns true if there are categories that are in the market. Otherwise returns false.
 */
async function isMarketEmpty(marketId) {
    try {
        const result = await db.get("SELECT * FROM category WHERE Marketid = ? ", [marketId]);
    
        if (result === undefined) {
            return true;
        }
     
        return false;
    } catch (e) {
        console.error(`ERROR while checking if category with id = ${categoryId} is empty. Error: `, e); 
    }
}

export { insertMarket, deleteMarket, getMarketByName, getMarketById, isMarketUsed, isMarketEmpty };