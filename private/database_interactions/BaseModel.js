import db from "./db.js"

export class BaseModel {
    static tableName = "";
  
    /**
     * Gets and returns the row that matches the given id.
     * @param {number | string} id The id of the row that is to be retrieved.
     * @returns {Promise<object>} Returns the first found row. Otherwise returns undefined.
     */
    static async getById(id) {
        try {
            const result = await db.get(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]);
            return result;
        } catch (e) {
            console.error(`ERROR while trying to select the ${this.tableName} with id = ${id}. Error: `, e);
        }
    }
  
    /**
     * Deletes the row that matches the id.
     * @param {number | string} id The id of the row that is to be deleted. 
     * @returns {Promise<boolean>} Returns true if the row is deleted. Otherwise returns false.
     */
    static async delete(id) {
        try {
            const result = await db.run(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);

            if (result.changes === 0) {
                return false;
            }

            return true;
        } catch (e) {
            console.error(`ERROR while trying to delete ${this.tableName} with id = ${id}. Error: `, e);
            return false;
        }
    }
}