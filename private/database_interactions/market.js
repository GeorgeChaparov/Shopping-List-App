import { BaseModel } from "./BaseModel.js";
import db from "./db.js"

export class Market extends BaseModel {
    static tableName = "Market";

    /**
     * Insert the given market in the database.
     * @param {string} marketName The name of the market that is to be inserted. 
     * @returns {Promise<object>} The result of the operation. If no market was added, returns undefined.
     */
    static async insert(marketName) {
        try {
            const result = await db.get("INSERT INTO market (name) VALUES (?) RETURNING *", [marketName]);
            return result;
        } catch (e) {
            console.error("ERROR while trying to insert the new market. Error: ", e);
        }
    }

    
    /**
     * Gets and returns the market that matches the given name.
     * @param {string} name The name of the market that is to be retrieved.
     * @returns {Promise<object>} Returns the market if exists. Otherwise returns undefined.
     */
    static async getByName(name) {
        try {
            const result = await db.get("SELECT * FROM market WHERE name = ?", [name]);
            return result;
        } catch (e) {
            console.error(`ERROR while trying to select the market with name = ${name}. Error: `, e);
        }
    }

    /**
     * Checks if there are any categories that are in the market with the given id excluding the item that have the given itemId.
     * @param {number | string} marketId The id of the market. 
     * @param {number | string} [itemId] Optional - The id of the item that is to be excluded in the search. 
     * @returns {Promise<boolean>} Returns true if there are categories in the market. Otherwise returns false.
     */
    static async isUsed(marketId, itemId) {
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
     * @param {number | string} marketId The id of the market. 
     * @returns {Promise<boolean>} Returns true if there are categories that are in the market. Otherwise returns false.
     */
    static async isEmpty(marketId) {
        try {
            const result = await db.get("SELECT * FROM category WHERE marketId = ? ", [marketId]);
        
            if (result === undefined) {
                return true;
            }
        
            return false;
        } catch (e) {
            console.error(`ERROR while checking if market with id = ${marketId} is empty. Error: `, e); 
        }
    }
}