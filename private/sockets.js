import { insertMarket, deleteMarket, getMarket } from "./database_interactions/market.js";
import { insertCategory, deleteCategory, getCategory } from "./database_interactions/category.js";
import { insertItem, deleteItem, deleteAllBoughtItems, checkForItem, getItemById, getItems, updateItem } from "./database_interactions/item.js";

async function socketEvents(socket, app, io) {
    //Adds an item to the database.
    socket.on("adding item", async (item) => {
        const renderedElements = {};
        const marketElementId = item.market.toLowerCase().replaceAll(" ", "-");
        const categoryElementId = item.category.toLowerCase().replaceAll(" ", "-");

        let market = await getMarket(item.market);
        if (market === undefined) {
            market = await insertMarket(item.market);
            renderedElements.market = await renderMarketView({id: marketElementId, name: market.name});
        }

        let category = await getCategory(item.category, market.id);
        if (category === undefined) {
            category = await insertCategory(item.category, market.id);
            renderedElements.category = await renderCategoryView({id: categoryElementId, name: category.name});
        } 
    
        const exists = await checkForItem(item, category.id, market.id);
        if (exists) {
            console.log("NOT PERMITTED! Trying to add an item with props that are the same as other item!"); 
            return;
        }

        const result = await insertItem(item);
        if (result === undefined) {
            return;
        }

        item.id = result.lastID;
        renderedElements.item = await renderItemView(item);

        const prices = await updatePrice();

        io.emit("add item", [{renderedElements, isBought: false, marketElementId, categoryElementId}], prices);

        console.log(`FUNCTION: socketEvents() - EVENT: adding item -- Item with id = ${item.id} added.`);
    });

    // Updates isBought to true. 
    socket.on("buying item", async (item) => {
        const itemBought = await updateItemProps(item, "buy item");

        if (itemBought) {
            console.log(`FUNCTION: socketEvents() - EVENT: buying item -- Item with id = ${item.id} bought.`);
        }
    });

    // Updates isBought to false. 
    socket.on("returning item", async (item) => {
        const itemReturned = await updateItemProps(item, "return item");

        if (itemReturned) {
            console.log(`FUNCTION: socketEvents() - EVENT: returning item -- Item with id = ${item.id} returned.`);
        }
    });

    // Deletes the item from the database. 
    socket.on("deleting item", async (itemId) => {
        const isSuccessful = await deleteItem(itemId);
        if (!isSuccessful) {
            console.log("NOT PERMITTED! Trying to delete an item that does not exist!"); 
            return;
        }

        const prices = await updatePrice();
        io.emit("delete item", itemId, prices);

        console.log(`FUNCTION: socketEvents() - EVENT: deleting item -- Item with id = ${itemId} deleted.`); 
    });

    // Updates the props of the item.
    socket.on("updating item", async (item) => {
        const exists = await checkForItem(item);
        if (exists) {
            console.log("NOT PERMITTED! Trying to update an item with props that are the same as other item!"); 
            return;
        }
        
        const result = await getItemById(item.id);
        if (result === undefined) {
            console.log("NOT PERMITTED! Trying to update an item that does not exist!"); 
            return;
        }

        const itemUpdated = await updateItemProps(item, "update item");
        if (itemUpdated) {
            console.log(`FUNCTION: socketEvents() - EVENT: updating item -- Item with id = ${item.id} updated.`);
        }
    });

    // Deletes all bought items.
    socket.on("clearing bought list", async () => {
       
        const isSuccessful = await deleteAllBoughtItems();

        if (!isSuccessful) {
            console.log("The bought list is empty!");
            return;
        }

        io.emit("clear bought list");
        console.log("FUNCTION: socketEvents() - EVENT: clearing bought list -- All bought items removed.");
    });
    
    if (!socket.recovered) {
        socket.emit("reconnect");

        const prices = await updatePrice();
        const items = await getItems();
        const itemElements = [];

        for (const item of items) {       
            const marketId = item.market.toLowerCase().replace(" ", "-");
            const categoryId = item.category.toLowerCase().replace(" ", "-");
            const renderedElements = await RenderElement(item, marketId, categoryId);

            itemElements.push({renderedElements, isBought: item.isBought, marketId, categoryId});
        }
        
		socket.emit("add item", itemElements, prices);
	}
    
    async function RenderElement(item, marketId, categoryId) {
        let renderedElements = {};

        const market = markets.get(item.market);
        if (!market) {
            const marketName = item.market;

            markets.set(marketName, []);
            renderedElements.market = await renderMarketView({id: marketId, name: marketName});
        }
        
        const categoryExist = market.includes(item.category);
        if (!categoryExist) {
            const categoryName = item.category;

            market.push(categoryName);
            renderedElements.category = await renderCategoryView({id: categoryId, name: categoryName});
        }

        renderedElements.item = await renderItemView(item);

        return renderedElements;
    }

    /**
     * Updates the given item in the database and then dispaches the event with the given name.
     * @param {object} item The item to be updated.  
     * @param {string} callbackEventName The name of the event to be dispatch to every client. 
     */
    async function updateItemProps(item, callbackEventName) {
        const isSuccessful = await updateItem(item);
        if (!isSuccessful) {
            console.log("NOT PERMITTED! Trying to update an item that does not exist!"); 
            return false;
        }

        const itemElement = await renderItemView(item);
        const prices = await updatePrice();
        io.emit(callbackEventName, itemElement, item.id, prices);
        return true;
    };

    /**
     * Selects all items form the database and calculates the prices for each isBought value and the total price.
     * @returns {object} Returns the an object containing the price of the bought items, the price of the unbought items and the total price.
     */
    async function updatePrice() {
        let boughtPrice = 0;
        let unboughtPrice = 0;
        let totalPrice = 0; 

        const boughtItems = [];
        const unboughtItems = [];   

        const items = await getItems();     

        for (const item of items) {
            let inKilogramsOrLiters = item.quantity;
            if (item.unit === "g" || item.unit === "ml") {
                inKilogramsOrLiters = item.quantity / 1000;
            }   

            if (item.isBought) {
                boughtItems.push(item);
                boughtPrice += inKilogramsOrLiters * item.price;
            } else {
                unboughtItems.push(item);
                unboughtPrice += inKilogramsOrLiters * item.price;
            }
        }   

        totalPrice = boughtPrice + unboughtPrice;
        return { boughtPrice, unboughtPrice, totalPrice };
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