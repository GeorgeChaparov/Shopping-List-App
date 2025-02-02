import db from "./db.js"

/**
 * Insert the given item in the database.
 * @param {object} item The item that is to be inserted. 
 * @returns The result of the oparation. If no item was added, returns undefined.
 */
async function insertItem(item, categoryId) {
    try {           
        const result = await db.run("INSERT INTO item (isBought, name, quantity, unit, price, categoryId) VALUES (?, ?, ?, ?, ?, ?)", [item.isBought, item.name, item.quantity, item.unit, item.price, categoryId]);
        return result;
    } catch (e) {
        console.error("ERROR while trying to insert the new item. Error: ", e);
    }
}

/**
 * Deletes the item that matches the id.
 * @param {*} itemId The id of the item that is to be deleted. 
 * @returns Returns true if the item is deleted. Otherwise returns false.
 */
async function deleteItem(itemId) {
    try {
        const result = await db.run("DELETE FROM item WHERE id = ?", [itemId]);

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
        const result = await db.run("DELETE FROM item WHERE isBought = ?", [true]);

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
        const result = await db.get("SELECT * FROM item WHERE id = ?", [itemId]);
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
        const result = await db.all("SELECT i.id, i.name, i.isBought, i.quantity, i.unit, i.price, c.name AS category, m.name AS market FROM item AS i INNER JOIN category AS c ON i.categoryId = c.id INNER JOIN market AS m ON c.marketId = m.id");
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
        const result = await db.run("UPDATE item SET isBought = ?, market = ?, name = ?, quantity = ?, unit = ?, price = ?, isBeingEdit = ?, category = ? where id = ?", [item.isBought, item.market, item.name, item.quantity, item.unit, item.price, item.isBeingEdit, item.category, item.id]);
        
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
 * @returns {boolean} Returns if the item is found or not.
 */
async function checkForItem(item, categoryId, marketId) {
    try {
        const result = await db.get("SELECT * FROM item AS i INNER JOIN category AS c ON i.categoryId = c.id INNER JOIN market AS m ON c.marketId = m.id WHERE i.name = ? AND i.quantity = ? AND i.unit = ? AND i.price = ? AND i.categoryId = ? AND c.marketId = ? ", [item.name, item.quantity, item.unit, item.price, categoryId, marketId]);
    
        if (result === undefined) {
            return false;
        }
     
        return true;
    } catch (e) {
        console.error(`ERROR while checking if item with the same props exist. Error: `, e); 
    }
}

export { insertItem, deleteItem, deleteAllBoughtItems, checkForItem, getItemById, getItems, updateItem };