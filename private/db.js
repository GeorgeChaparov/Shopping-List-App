import sqlite3 from "sqlite3";
import { open } from "sqlite";

const db = await open({
	filename: "ShoppingList.db",
	driver: sqlite3.Database,
});-

await db.exec(`
    CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        isBought INTEGER NOT NULL DEFAULT 0,
        content TEXT NOT NULL,
    	market TEXT NOT NULL,
    	quantity INTEGER NOT NULL CHECK (quantity > -1),
    	unit TEXT NOT NULL,
    	price INTEGER DEFAULT 0,
        isBeingEdit INTEGER DEFAULT 0
    );
`);

/**
 * Insert the given item in the database.
 * @param {object} item The item that is to be inserted. 
 * @returns The result of the oparation. If no item was added, returns undefined.
 */
async function insertItem(item) {
    try {           
        const result = await db.run("INSERT INTO items (isBought, market, content, quantity, unit, price) VALUES (?, ?, ?, ?, ?, ?)", [item.isBought, item.market, item.productName, item.quantity, item.unit, item.price]);
        return result;
    } catch (e) {
        console.error("ERROR while trying to insert the new item. Error: ", e);
    }
}

/**
 * Deletes the item that m,atches the id.
 * @param {*} itemId The id of the item that is to be deleted. 
 * @returns Returns true if the item is deleted. Otherwise returns false.
 */
async function deleteItem(itemId) {
    try {
        const result = await db.run("DELETE FROM items WHERE id = ?", [itemId]);

        if (result.changes === 0) {
            return false;
        }

        return true;
    } catch (e) {
        console.error(`ERROR while trying to delete item with id = ${itemId}. Error: `, e);
        return false;
    }
}

/**
 * Deletes all item that are bought.
 * @returns Returns true if any item is deleted. Otherwise returns false.
 */
async function deleteAllBoughtItems() {
    try {
        const result = await db.run("DELETE FROM items WHERE isBought = ?", [true]);

        if (result.changes === 0) {
            return false;
        }

        return true
    } catch (e) {
        console.error(`ERROR while trying to remove every item with isBought = true. Error: `, e);
    }
}

/**
 * Gets and returns item that matches the given id.
 * @param {*} itemId The id of the item that is to be retreved.
 * @returns Returns the item if it exist. Otherwise returns undefined.
 */
async function getItemById(itemId) {
    try {
        const result = await db.get("SELECT * FROM items WHERE id = ?", [itemId]);
        return result;
    } catch (e) {
        console.error(`ERROR while trying to select the item with id = ${itemId}. Error: `, e);
    }
}

/**
 * Gets and returns all items in the database.
 * @returns Returns all items.
 */
async function getItems() {
    try {
        const result = await db.all("SELECT id, content, isBought, market, quantity, unit, price FROM items");

        return result;
    } catch (e) {
        console.error("ERROR updating prices. Error: ", e);
    }
}

/**
 * Updates the given item in the database.
 * @param {object} item 
 * @returns Returns true if the operation is successful.
 */
async function updateItem(item) {
    try {
        const result = await db.run("UPDATE items SET isBought = ?, market = ?, content = ?, quantity = ?, unit = ?, price = ?, isBeingEdit = ? where id = ?", [item.isBought, item.market, item.productName, item.quantity, item.unit, item.price, item.isBeingEdit, item.productId]);
        
        if (result.changes === 0) {
            return false;
        }

        return true
    } catch (e) {
        console.error(`ERROR while trying to update item with id = ${item.productId}. Error: `, e);
    }
}

/**
 * Tryis to select the given item from the database.
 * @param {object} item The item to be checked for. 
 * @returns {boolean} Returns if the item is found or not.
 */
async function checkForItem(item) {
    try {
        const result = await db.get("SELECT * FROM items WHERE market = ? AND content = ? AND quantity = ? AND unit = ? AND price = ?", [item.market, item.productName, item.quantity, item.unit, item.price]);
    
        if (result === undefined) {
            return false;
        }
     
        return true;

    } catch (e) {
        console.error(`ERROR while checking if item with the same props exist. Error: `, e); 
    }
}

export { insertItem, deleteItem, deleteAllBoughtItems, checkForItem, getItemById, getItems, updateItem }