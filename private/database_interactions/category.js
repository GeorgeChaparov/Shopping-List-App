import db from "./db.js"

/**
 * Insert the given category in the database.
 * @param {*} categoryName The name of the category that is to be inserted.
 * @param {*} marketId The id of the market that is linked to this category.
 * @returns The result of the oparation. If no category was added, returns undefined.
 */
async function insertCategory(categoryName, marketId) {
    try {
        const result = await db.get("INSERT INTO category (name, marketId) VALUES (?, ?) RETURNING *", [categoryName, marketId]);
        return result;
    } catch (e) {
        console.error("ERROR while trying to insert the new category. Error: ", e);
    }
}

/**
 * Deletes the category that matches the id.
 * @param {*} categoryId The id of the category that is to be deleted. 
 * @returns Returns true if the category is deleted. Otherwise returns false.
 */
async function deleteCategory(categoryId) {
    try {
        const result = await db.run("DELETE FROM category WHERE id = ?", [categoryId]);

        if (result.changes === 0) {
            return false;
        }

        return true;
    } catch (e) {
        console.error(`ERROR while trying to delete category with id = ${categoryId}. Error: `, e);
        return false;
    }
}

/**
 * Gets and returns category that matches the given name.
 * @param {*} categoryName The name of the category that is to be retreved.
 * @param {*} marketId The id of the market that is linked to this category.
 * @returns Returns the category. Otherwise returns undefined.
 */
async function getCategoryByName(categoryName, marketId) {
    try {
        const result = await db.get("SELECT * FROM category WHERE name = ? AND marketId = ?", [categoryName, marketId]);
        return result;
    } catch (e) {
        console.error(`ERROR while trying to select the category with name = ${categoryName}. Error: `, e);
    }
}

/**
 * Gets and returns all categories that match the given market id.
 * @param {*} marketId The id of the market that is linked to the categories.
 * @returns Returns the categories. Otherwise returns empty array.
 */
async function getCategoriesByMarket(marketId) {
    try {
        const result = await db.all("SELECT * FROM category WHERE marketId = ?", [marketId]);
        return result;
    } catch (e) {
        console.error(`ERROR while trying to select the category with marketId = ${marketId}. Error: `, e);
    }
}

/**
 * Gets and returns category that matches the given id.
 * @param {*} categoryId The id of the category that is to be retreved.
 * @returns Returns the category. Otherwise returns undefined.
 */
async function getCategoryById(categoryId) {
    try {
        const result = await db.get("SELECT * FROM category WHERE id = ?", [categoryId]);
        return result;
    } catch (e) {
        console.error(`ERROR while trying to select the category with id = ${categoryId}. Error: `, e);
    }
}

/**
 * Checks if there are any unbought item that are in the category with the given id.
 * @param {object} categoryId The id of the category. 
 * @returns {boolean} Returns true if there are item that are in the category. Otherwise returns false.
 */
async function isCategoryUsed(categoryId, itemId) {
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
 * @param {object} categoryId The id of the category. 
 * @returns {boolean} Returns true if there are item that are in the category. Otherwise returns false.
 */
async function isCategoryEmpty(categoryId) {
    try {
        const result = await db.get("SELECT * FROM item WHERE categoryId = ? ", [categoryId]);
    
        if (result === undefined) {
            return true;
        }
     
        return false;
    } catch (e) {
        console.error(`ERROR while checking if category with id = ${categoryId} is empty. Error: `, e); 
    }
}

export { insertCategory, deleteCategory, getCategoryByName, getCategoryById, getCategoriesByMarket, isCategoryUsed, isCategoryEmpty };