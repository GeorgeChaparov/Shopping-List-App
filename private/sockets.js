import { insertItem, deleteItem, deleteAllBoughtItems, checkForItem, getItemById, getItems, updateItem } from "./db.js";

async function socketEvents(socket, app, io) {
    //Adds an item to the database.
    socket.on("adding item", async (item) => {
        const exists = await checkForItem(item);
        if (exists) {
            console.log("NOT PERMITTED! Trying to add an item with props that are the same as other item!"); 
            return;
        }

        const result = await insertItem(item);
        if (result === undefined) {
            return;
        }

        item.productId = result.lastID;
        const itemElement = await renderItemView(item);
        const prices = await updatePrice();

        io.emit("add item", [{itemElement, isBought: false}], prices);

        console.log(`FUNCTION: socketEvents() - EVENT: adding item -- Item with id = ${item.productId} added.`);
    });

    // Updates isBought to true. 
    socket.on("buying item", async (item) => {
        const itemBought = await updateItemProps(item, "buy item");

        if (itemBought) {
            console.log(`FUNCTION: socketEvents() - EVENT: buying item -- Item with id = ${item.productId} bought.`);
        }
    });

    // Updates isBought to false. 
    socket.on("returning item", async (item) => {
        const itemReturned = await updateItemProps(item, "return item");

        if (itemReturned) {
            console.log(`FUNCTION: socketEvents() - EVENT: returning item -- Item with id = ${item.productId} returned.`);
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
        
        const result = await getItemById(item.productId);
        if (result === undefined) {
            console.log("NOT PERMITTED! Trying to update an item that does not exist!"); 
            return;
        }

        const itemUpdated = await updateItemProps(item, "update item");
        if (itemUpdated) {
            console.log(`FUNCTION: socketEvents() - EVENT: updating item -- Item with id = ${item.productId} updated.`);
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
            const itemElement = await renderItemView({ productId: item.id, isBought: item.isBought, market: item.market, productName: item.content, quantity: item.quantity, unit: item.unit, price: item.price});
            itemElements.push({itemElement, isBought: item.isBought});
        }

		socket.emit("add item", itemElements, prices);
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
        io.emit(callbackEventName, itemElement, item.productId, prices);
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