import { insertMarket, deleteMarket, getMarketByName, getMarketById, isMarketUsed, isMarketEmpty } from "./database_interactions/market.js";
import { insertCategory, deleteCategory, getCategoryByName, getCategoryById, getCategoriesByMarket, isCategoryUsed, isCategoryEmpty } from "./database_interactions/category.js";
import { insertItem, deleteItem, deleteAllBoughtItems, checkForItem, getAllBoughtItems, getItemById, getItems, getItemsByCategoryId, updateItem } from "./database_interactions/item.js";

async function socketEvents(socket, app, io) {
    //Adds an item to the database.
    socket.on("adding item", async (item) => {
        const renderedElements = {};

        const itemDetails = await getMarketAndCategoryByName(item.market, item.category, true);
        if (!itemDetails.hadMarket) {
            renderedElements.market = await renderMarketView(itemDetails.market);
        }

        if (!itemDetails.hadCategory) {
            renderedElements.category = await renderCategoryView(itemDetails.category);
        }

        const exists = await checkForItem(item, itemDetails.category.id, itemDetails.market.id);
        if (exists) {
            socket.emit("Unpermitted action", "NOT PERMITTED! Trying to add an item with props that are the same as other item!");
            return;
        }

        const result = await insertItem(item, itemDetails.category.id);
        if (result === undefined) {
            return;
        }

        item.id = result.lastID;
        item.market = itemDetails.market.name;
        renderedElements.item = await renderItemView(item);

        const prices = await updatePrice();

        io.emit("add item", [{renderedElements, isBought: false, marketElementId: itemDetails.market.id, categoryElementId: itemDetails.category.id}], prices);

        console.log(`FUNCTION: socketEvents() - EVENT: adding item -- Item with id = ${item.id} added.`);
    });

    // Updates isBought to true. 
    socket.on("buying item", async (itemId) => {
        const item = await getItemById(itemId);
        if (item === undefined) {
            socket.emit("Unpermitted action", "NOT PERMITTED! Trying to buy an item that does not exist!");
            return;
        }

        const itemDetails = await getMarketAndCategoryById(item.categoryId);
        if (itemDetails.category === undefined || itemDetails.market === undefined) {
            return;
        }

        item.isBought = true;

        const isSuccessful = await updateItem(item);
        if (!isSuccessful) {
            socket.emit("Unpermitted action", "NOT PERMITTED! Trying to update an item that does not exist!");
            return;
        }

        item.market = itemDetails.market.name;
        item.category = itemDetails.category.name;

        const itemElement = await renderItemView(item);
        const prices = await updatePrice();

        io.emit("buy item", itemElement, item.id, prices)

        console.log(`FUNCTION: socketEvents() - EVENT: buying item -- Item with id = ${item.id} bought.`);
    });

    // Updates isBought to false. 
    socket.on("returning item", async (itemId) => {
        const renderedElements = {};

        const item = await getItemById(itemId);
        if (item === undefined) {
            socket.emit("Unpermitted action", "NOT PERMITTED! Trying to return an item that does not exist!");
            return;
        }

        const itemDetails = await getMarketAndCategoryById(item.categoryId, true);
        
        const isCategoryInUse = await isCategoryUsed(itemDetails.category.id);
        if (!isCategoryInUse) {
            renderedElements.category = await renderCategoryView(itemDetails.category);
        }
        
        const isMarketInUse = await isMarketUsed(itemDetails.market.id);
        if (!isMarketInUse) {
            renderedElements.market = await renderMarketView(itemDetails.market);
        }

        item.isBought = false;
        const isSuccessful = await updateItem(item)
        if (!isSuccessful) {
            socket.emit("Unpermitted action", "NOT PERMITTED! Trying to update an item that does not exist!");
            return;
        }
        
        item.market = itemDetails.market.name;
        item.category = itemDetails.category.name;
        renderedElements.item = await renderItemView(item);

        const prices = await updatePrice();
        io.emit("return item", {renderedElements, isBought:  item.isBought, marketElementId: itemDetails.market.id, categoryElementId: itemDetails.category.id}, itemId, prices);

        console.log(`FUNCTION: socketEvents() - EVENT: returning item -- Item with id = ${item.id} returned.`);
    });

    // Deletes the item from the database. 
    socket.on("deleting item", async (itemId) => {
        const item = await getItemById(itemId);
        if (item === undefined) {
            socket.emit("Unpermitted action", "NOT PERMITTED! Trying to delete an item that does not exist!");
            return;
        }

        const itemDetails = await getMarketAndCategoryById(item.categoryId);

        const isSuccessful = await deleteItem(itemId);
        if (!isSuccessful) {
            socket.emit("Unpermitted action", "NOT PERMITTED! Trying to delete an item that does not exist!");
            return;
        }

        const shouldDeleteCategory = await isCategoryEmpty(itemDetails.category.id);

        if (shouldDeleteCategory) {
            const isCategoryDeleted = await deleteCategory(itemDetails.category.id);

            if (!isCategoryDeleted) {
                return;
            }

            const shouldDeleteMarket = await isMarketEmpty(itemDetails.market.id);

            if (shouldDeleteMarket) {
                const isMarketDeleted = await deleteMarket(itemDetails.market.id);

                if (!isMarketDeleted) {
                    return;
                }
            }
        }

        const prices = await updatePrice();
        io.emit("delete item", itemId, prices);

        console.log(`FUNCTION: socketEvents() - EVENT: deleting item -- Item with id = ${itemId} deleted.`); 
    });

    // Updates the props of the item.
    socket.on("updating item", async (item) => {
        const result = await getItemById(item.id);
        if (result === undefined) {
            socket.emit("Unpermitted action", "NOT PERMITTED! Trying to update an item that does not exist!");
            return;
        }
        const itemDetails = await getMarketAndCategoryByName(item.market, item.category, true);

        const exists = await checkForItem(item, itemDetails.category.id, itemDetails.market.id);
        if (exists) {
            socket.emit("Unpermitted action", "NOT PERMITTED! Trying to update an item with props that are the same as other item!");

            result.isBeingEdited = false;
            const isSuccessful = await updateItem(result);
            if (!isSuccessful) {
                socket.emit("Unpermitted action", "NOT PERMITTED! Trying to update an item that does not exist!");
                return;
            }
            return;
        }

        
        item.categoryId = itemDetails.category.id;
        const isSuccessful = await updateItem(item);
        if (!isSuccessful) {
            socket.emit("Unpermitted action", "NOT PERMITTED! Trying to update an item that does not exist!");
            return;
        }

        const oldItemDetalis = await getMarketAndCategoryById(result.categoryId);

        const shouldDeleteCategory = await isCategoryEmpty(oldItemDetalis.category.id);

        if (shouldDeleteCategory) {
            const isCategoryDeleted = await deleteCategory(oldItemDetalis.category.id);

            if (!isCategoryDeleted) {
                return;
            }

            const shouldDeleteMarket = await isMarketEmpty(oldItemDetalis.market.id);

            if (shouldDeleteMarket) {
                const isMarketDeleted = await deleteMarket(oldItemDetalis.market.id);

                if (!isMarketDeleted) {
                    return;
                }
            }
        }

        const renderedElements = {}

        const isMarketInUse = await isMarketUsed(itemDetails.market.id, item.id);
        const isCategoryInUse = await isCategoryUsed(itemDetails.category.id, item.id);
        if (!isMarketInUse) {
            renderedElements.market = await renderMarketView(itemDetails.market);
        }
        
        if (!isCategoryInUse) {
            renderedElements.category = await renderCategoryView(itemDetails.category);
        }

        renderedElements.item = await renderItemView(item);
        const prices = await updatePrice();

        io.emit("update item", {renderedElements, isBought:  item.isBought, marketElementId: itemDetails.market.id, categoryElementId: itemDetails.category.id}, item.id, prices)
        console.log(`FUNCTION: socketEvents() - EVENT: updating item -- Item with id = ${item.id} updated.`);
    });

    socket.on("editing item", async (itemId) => {
        const item = await getItemById(itemId);
        if (item === undefined) {
            socket.emit("Unpermitted action", "NOT PERMITTED! Trying to update an item that does not exist!");
            return;
        }

        if (item.isBeingEdited == true) {
            socket.emit("Unpermitted action", "NOT PERMITTED! Trying to update an item while another user is updating it!");
            return;
        }

        item.isBeingEdited = true;
        const isSuccessful = await updateItem(item);
        if (!isSuccessful) {
            socket.emit("Unpermitted action", "NOT PERMITTED! Trying to update an item that does not exist!");
            return;
        }

        const itemDetails = await getMarketAndCategoryById(item.categoryId);

        item.market = itemDetails.market.name;
        item.category = itemDetails.category.name;

        socket.emit("edit item", item);
        console.log(`FUNCTION: socketEvents() - EVENT: editing item -- Item with id = ${itemId} is being edited.`);
    });

    socket.on("editing interrupted item", async (itemId) => {
        const item = await getItemById(itemId);
        if (item === undefined) {
            socket.emit("Unpermitted action", "NOT PERMITTED! Trying to update an item that does not exist!");
            return;
        }

        if (item.isBeingEdited == false) {
            socket.emit("Unpermitted action", "NOT PERMITTED! Trying to inpterrupt the updating without starting to update in first place!");
            return;
        }

        item.isBeingEdited = false;
        const isSuccessful = await updateItem(item);
        if (!isSuccessful) {
            socket.emit("Unpermitted action", "NOT PERMITTED! Trying to update an item that does not exist!");
            return;
        }

        console.log(`FUNCTION: socketEvents() - EVENT: editing interrupted item -- Editing of item with id = ${itemId} interrupted.`);
    });

    // Deletes all bought items.
    socket.on("clearing bought list", async () => {
        const boughtItems = await getAllBoughtItems();

        for (let i = 0; i < boughtItems.length; i++) {
            const item = boughtItems[i];
            const itemDetails = await getMarketAndCategoryByName(item.market, item.category);

            const isSuccessful = await deleteItem(item.id);
            if (!isSuccessful) {
                socket.emit("Unpermitted action", "NOT PERMITTED! Trying to delete an item that does not exist!");
                return;
            }

            const shouldDeleteCategory = await isCategoryEmpty(itemDetails.category.id);

            if (shouldDeleteCategory) {
                const isCategoryDeleted = await deleteCategory(itemDetails.category.id);

                if (!isCategoryDeleted) {
                    return;
                }

                const shouldDeleteMarket = await isMarketEmpty(itemDetails.market.id);

                if (shouldDeleteMarket) {
                    const isMarketDeleted = await deleteMarket(itemDetails.market.id);

                    if (!isMarketDeleted) {
                        return;
                    }
                }
            }
        }

        io.emit("clear bought list");
        console.log("FUNCTION: socketEvents() - EVENT: clearing bought list -- All bought items removed.");
    });
    
    if (!socket.recovered) {
        socket.emit("reconnect");
        const items = await getItems();

        const prices = await updatePrice(items);
        const itemElements = [];

        const createdCombinations = new Map();
        for (const item of items) { 
            const renderedElements = {};   

            if (item.isBought) {
                renderedElements.item = await renderItemView(item);
                itemElements.push({renderedElements, isBought: item.isBought});
                continue;
            }

            const itemDetails = await getMarketAndCategoryByName(item.market, item.category);
            if (!itemDetails.category || !itemDetails.market) {
                return;
            }

            if (!createdCombinations.has(itemDetails.market.id)) {
                createdCombinations.set(itemDetails.market.id, []);
                renderedElements.market = await renderMarketView(itemDetails.market);
            }
            const market = createdCombinations.get(itemDetails.market.id)
            
            if (!market.includes(itemDetails.category.id)) {
                market.push(itemDetails.category.id);
                renderedElements.category = await renderCategoryView(itemDetails.category);
            }
            
            item.market = itemDetails.market.name;
            renderedElements.item = await renderItemView(item);

            itemElements.push({renderedElements, isBought: item.isBought, marketElementId: itemDetails.market.id, categoryElementId: itemDetails.category.id});
        }
        
		socket.emit("add item", itemElements, prices);
	}

    async function getMarketAndCategoryByName(marketName, categoryName, createIfNotExists = false) {
        const result = {};

        let market = await getMarketByName(marketName);

        if (market === undefined) {
            if (createIfNotExists) {
                market = await insertMarket(marketName);
                result.hadMarket = false;
            }
            else {
                return result;
            }
        }
        else {
            if (createIfNotExists) {
                result.hadMarket = true;
            }
        }

        let category = await getCategoryByName(categoryName, market.id);
        if (category === undefined) {
            if (createIfNotExists) {
                category = await insertCategory(categoryName, market.id);
                result.hadCategory = false;
            }
            else {
                return result;
            }
        } 
        else {
            if (createIfNotExists) {
                result.hadCategory = true;
            }
        }

        result.market = market;
        result.category = category;

        return result;
    }

    async function getMarketAndCategoryById(categoryId) {
        const result = {};

        let category = await getCategoryById(categoryId);
        if (category === undefined) {
            return result;
        }

        let market = await getMarketById(category.marketId);
        if (market === undefined) {
            return result;
        }

        result.market = market;
        result.category = category;

        return result;
    }

    /**
     * Selects all items form the database and calculates the prices for each isBought value and the total price.
     * @returns {object} Returns the an object containing the price of the bought items, the price of the unbought items and the total price.
     */
    async function updatePrice(items) {
        let boughtPrice = 0;
        let unboughtPrice = 0;
        let totalPrice = 0; 

        if (items === undefined) {
            items = await getItems();  
        }

        for (const item of items) {
            let inKilogramsOrLiters = item.quantity;
            if (item.unit === "g" || item.unit === "ml") {
                inKilogramsOrLiters = item.quantity / 1000;
            }   

            if (item.isBought) {
                boughtPrice += inKilogramsOrLiters * item.price;
            } else {
                unboughtPrice += inKilogramsOrLiters * item.price;
            }
        }   

        totalPrice = boughtPrice + unboughtPrice;
        return { boughtPrice: boughtPrice.toFixed(2), unboughtPrice: unboughtPrice.toFixed(2), totalPrice: totalPrice.toFixed(2) };
    };  

    /**
     * Used to render markets.
     * @param {object} market 
     * @returns Returns rendered market.
     */
    async function renderMarketView(market) {   
        return new Promise((resolve, reject) => {
            app.render('market', {...market}, (err, html) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(html);
                }
            });
        });
    };

    /**
     * Used to render categories.
     * @param {object} category 
     * @returns Returns rendered category.
     */
    async function renderCategoryView(category) {   
        return new Promise((resolve, reject) => {
            app.render('category', {...category}, (err, html) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(html);
                }
            });
        });
    };

    /**
     * Used to render items.
     * @param {object} item 
     * @returns Returns rendered item.
     */
    async function renderItemView(item) {  
        item.market = item.market[0].toUpperCase(); 
        return new Promise((resolve, reject) => {
            app.render('item', {...item}, (err, html) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(html);
                }
            });
        });
    };
}
export default socketEvents;