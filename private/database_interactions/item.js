import { BaseModel } from "./BaseModel.js";
import db from "./db.js"

export class Item extends BaseModel {
    static tableName = "Item";

    /**
     * Insert the given item in the database.
     * @param {object} item The item that is to be inserted. 
     * @returns {Promise<object>} The added item of the oparation. If no item was added, returns undefined.
     */
    static async insert(item) {
        try {          
            const isBeingEdited = false; // By default no item is edited in the moment of its creation. 
            const result = await db.run("INSERT INTO item (isBought, name, quantity, unit, price, categoryId, isBeingEdited) VALUES (?, ?, ?, ?, ?, ?, ?)", [item.isBought, item.name, item.quantity, item.unit, item.price, item.categoryId, isBeingEdited]);
                if (result.changes === 0) {
                    return undefined;
                }
            
            return result;
        } catch (e) {
            console.error("ERROR while trying to insert the new item. Error: ", e);
        }
    }

    /**
     * Returns all item that are bought.
     * @returns {Promise<Array<object>>} Returns array of the found items. If no item is found, returns empty array.
     */
    static async getAllBoughtItems() {
        try {
            const isBought = true // We want all items that are bought.
            const result = await db.all("SELECT i.id, i.name, i.isBought, i.quantity, i.unit, i.price, c.name AS category, m.name AS market FROM item AS i LEFT JOIN category AS c ON i.categoryId = c.id LEFT JOIN market AS m ON c.marketId = m.id WHERE isBought = ?", [isBought]);
            return result;
        } catch (e) {
            console.error(`ERROR while trying to remove every item with isBought = ${isBought}. Error: `, e);
        }
    }

    /**
     * Gets and returns all items in the database.
     * @returns {Promise<Array<object>>} Returns all items.
     */
    static async getAll() {
        try {
            const result = await db.all("SELECT i.id, i.name, i.isBought, i.quantity, i.unit, i.price, c.name AS category, m.name AS market FROM item AS i LEFT JOIN category AS c ON i.categoryId = c.id LEFT JOIN market AS m ON c.marketId = m.id");
            return result;
        } catch (e) {
            console.error("ERROR updating prices. Error: ", e);
        }
    }

    /**
     * Updates the given item in the database.
     * @param {object} item The item that is to be updated.
     * @returns {Promise<boolean>} Returns true if the operation is successful.
     */
    static async update(item) {
        try {
            const result = await db.run("UPDATE item SET isBought = ?, name = ?, quantity = ?, unit = ?, price = ?, isBeingEdited = ?, categoryId = ? where id = ?", [item.isBought, item.name, item.quantity, item.unit, item.price, item.isBeingEdited, item.categoryId, item.id]);

            if (result.changes === 0) {
                return false;
            }

            return true
        } catch (e) {
            console.error(`ERROR while trying to update item with id = ${item.id}. Error: `, e);
        }
    }

    /**
     * Tryis to select the given it from the database.
     * @param {object} item The item to be checked for. 
     * @returns {Promise<boolean>} Returns true if the item is found. Otherwise returns false.
     */
    static async exists(item) {
        try {
            const result = await db.get("SELECT * FROM item AS i INNER JOIN category AS c ON i.categoryId = c.id INNER JOIN market AS m ON c.marketId = m.id WHERE i.name = ? AND i.quantity = ? AND i.unit = ? AND i.price = ? AND i.categoryId = ? AND c.marketId = ? ", [item.name, item.quantity, item.unit, item.price, item.categoryId, item.marketId]);
        
            if (result === undefined) {
                return false;
            }
        
            return true;
        } catch (e) {
            console.error(`ERROR while checking if item with the same props exist. Error: `, e); 
        }
    }
}