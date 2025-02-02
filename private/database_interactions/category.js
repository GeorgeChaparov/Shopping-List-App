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
async function getCategory(categoryName, marketId) {
    try {
        const result = await db.get("SELECT * FROM category WHERE name = ? AND marketId = ?", [categoryName, marketId]);
        return result;
    } catch (e) {
        console.error(`ERROR while trying to select the market with name = ${categoryName}. Error: `, e);
    }
}

export { insertCategory, deleteCategory, getCategory };