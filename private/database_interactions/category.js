import { BaseModel } from "./BaseModel.js";
import db from "./db.js"

export class Category extends BaseModel {
    static tableName = "Category";

    /**
     * Insert the given category in the database.
     * @param {string} name The name of the category that is to be inserted.
     * @param {number | string} marketId The id of the market that is linked to this category.
     * @returns {Promise<object>} The result of the oparation. If no category was added, returns undefined.
     */
    static async insert(name, marketId) {
        try {
            const result = await db.get("INSERT INTO category (name, marketId) VALUES (?, ?) RETURNING *", [name, marketId]);
            return result;
        } catch (e) {
            console.error("ERROR while trying to insert the new category. Error: ", e);
        }
    }

    /**
     * Gets and returns category that matches the given name.
     * @param {string} name The name of the category that is to be retreved.
     * @param {number | string} marketId The id of the market that is linked to this category.
     * @returns {Promise<object>} Returns the category. Otherwise returns undefined.
     */
    static async getByName(name, marketId) {
        try {
            const result = await db.get("SELECT * FROM category WHERE name = ? AND marketId = ?", [name, marketId]);
            return result;
        } catch (e) {
            console.error(`ERROR while trying to select the category with name = ${name}. Error: `, e);
        }
    }

    /**
     * Checks if there are any unbought item that are in the category with the given id excluding the item that have the given itemId.
     * @param {number | string} categoryId The id of the category. 
     * @param {number | string} [itemId] Optional - The id of the item that is to be excluded in the search. 
     * @returns {Promise<boolean>} Returns true if there are item that are in the category. Otherwise returns false.
     */
    static async isUsed(categoryId, itemId) {
        let excludeItemQuery = "";

        //itemId is not user defined!
        if (itemId) {
            excludeItemQuery = `AND id != ${itemId}`;
        }
        try {
            const result = await db.get(`SELECT * FROM item WHERE categoryId = ? AND isBought = ? ${excludeItemQuery}`, [categoryId, false]);
        
            if (result === undefined) {
                return false;
            }
        
            return true;
        } catch (e) {
            console.error(`ERROR while checking if category with id = ${categoryId} is in use. Error: `, e); 
        }
    }

    /**
     * Checks if there are any item that are in the category with the given id.
     * @param {number | string} id The id of the category. 
     * @returns {Promise<boolean>} Returns true if there are item that are in the category. Otherwise returns false.
     */
    static async isEmpty(id) {
        try {
            const result = await db.get("SELECT * FROM item WHERE categoryId = ? ", [id]);
        
            if (result === undefined) {
                return true;
            }
        
            return false;
        } catch (e) {
            console.error(`ERROR while checking if category with id = ${id} is empty. Error: `, e); 
        }
    }
}