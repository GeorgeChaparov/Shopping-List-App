import { Market } from "./database_interactions/market.js";
import { Category } from "./database_interactions/category.js";
import { Item } from "./database_interactions/item.js";

async function socketEvents(socket, app, io) {
    //Adds an item to the database.
    socket.on("adding item", async (item) => {
        // Getting the market and the category of the item.
        const itemDetails = await getSectionsByName(item, true);
        if (itemDetails.category === undefined || itemDetails.market === undefined) {
            return;
        }

        // Checking if the item exists.
        item.categoryId = itemDetails.category.id;
        item.marketId = itemDetails.market.id;
        const exists = await Item.exists(item);
        if (exists) {
            socket.emit("Unpermitted action", "NOT PERMITTED! Trying to add an item with props that are the same as other item!");
            return;
        }

        // Inserting the item.
        const result = await Item.insert(item);
        if (result === undefined) {
            return;
        }

        // Rendering the category and the market if they are not rendered already. Rendering the item.
        item.id = result.lastID;
        itemDetails.renderMarket = !itemDetails.hadMarket;
        itemDetails.renderCategory = !itemDetails.hadCategory;
        const renderedElements = await renderItemDetails(itemDetails);
        renderedElements.item = await renderView("item", item);

        // Calculate the prices.
        const prices = await updatePrice();

        io.emit("add item", [{renderedElements, isBought: false, marketElementId: itemDetails.market.id, categoryElementId: itemDetails.category.id}], prices);

        console.log(`FUNCTION: socketEvents() - EVENT: adding item -- Item with id = ${item.id} added.`);
    });

    // Updates isBought to true. 
    socket.on("buying item", async (itemId) => {
        // Getting the item from the database.
        const item = await Item.getById(itemId);
        if (item === undefined) {
            socket.emit("Unpermitted action", "NOT PERMITTED! Trying to buy an item that does not exist!");
            return;
        }

        // Checking if someone is updating this item.
        if (item.isBeingEdited == true) {
            socket.emit("Unpermitted action", "NOT PERMITTED! Trying to buy an item while another user is updating it!");
            return;
        }

        // Getting the category and the market of the item.
        const itemDetails = await getSectionsById(item);
        if (itemDetails.category === undefined || itemDetails.market === undefined) {
            return;
        }

        // Updeting the item bought status to show that the item is bought.
        item.isBought = true;
        const isSuccessful = await Item.update(item);
        if (!isSuccessful) {
            socket.emit("Unpermitted action", "NOT PERMITTED! Trying to update an item that does not exist!");
            return;
        }

        // Rendering the item 
        item.market = itemDetails.market.name;
        item.category = itemDetails.category.name;
        const itemElement = await renderView("item", item);
        
        // Calculate the prices.
        const prices = await updatePrice();

        io.emit("buy item", itemElement, item.id, prices)

        console.log(`FUNCTION: socketEvents() - EVENT: buying item -- Item with id = ${item.id} bought.`);
    });

    // Updates isBought to false. 
    socket.on("returning item", async (itemId) => {
        // Getting the item from the database.
        const item = await Item.getById(itemId);
        if (item === undefined) {
            socket.emit("Unpermitted action", "NOT PERMITTED! Trying to return an item that does not exist!");
            return;
        }

        // Getting the category and the market of the item.
        const itemDetails = await getSectionsById(item);
        if (itemDetails.category === undefined || itemDetails.market === undefined) {
            return;
        }

        // Checking if the category and the market are used meaning are there any unbought items in them. If there are, they are rendered and we should not render them again.
        const isMarketInUse = await Market.isUsed(itemDetails.market.id);
        const isCategoryInUse = await Category.isUsed(itemDetails.category.id);

        // Updeting the item bought status to show that the item is not bought.
        item.isBought = false;
        const isSuccessful = await Item.update(item)
        if (!isSuccessful) {
            socket.emit("Unpermitted action", "NOT PERMITTED! Trying to update an item that does not exist!");
            return;
        }

        // Rendering the category and the market if they are not rendered already. Rendering the item.
        itemDetails.renderMarket = !isMarketInUse;
        itemDetails.renderCategory = !isCategoryInUse;
        item.market = itemDetails.market.name;
        item.category = itemDetails.category.name;
        const renderedElements = await renderItemDetails(itemDetails);
        renderedElements.item = await renderView("item", item);
        
        // Calculate the prices.
        const prices = await updatePrice();
        io.emit("return item", {renderedElements, isBought:  item.isBought, marketElementId: itemDetails.market.id, categoryElementId: itemDetails.category.id}, itemId, prices);

        console.log(`FUNCTION: socketEvents() - EVENT: returning item -- Item with id = ${item.id} returned.`);
    });

    // Deletes the item from the database. 
    socket.on("deleting item", async (itemId) => {
        // Getting the item from the database.
        const item = await Item.getById(itemId);
        if (item === undefined) {
            socket.emit("Unpermitted action", "NOT PERMITTED! Trying to delete an item that does not exist!");
            return;
        }

        // Checking fi someone is editing the item.
        if (item.isBeingEdited == true) {
            socket.emit("Unpermitted action", "NOT PERMITTED! Trying to delete an item that is being edited by another user!");
            return;
        }

        // Getting the category and the market of the item.
        const itemDetails = await getSectionsById(item);
        if (itemDetails.category === undefined || itemDetails.market === undefined) {
            return;
        }

        // Delete the item.
        const isSuccessful = await Item.delete(itemId);
        if (!isSuccessful) {
            socket.emit("Unpermitted action", "NOT PERMITTED! Trying to delete an item that does not exist!");
            return;
        }

        // Deliting the category and market of the old item if they are empty.
        await deleteSectionsIfEmpty(itemDetails.market.id, itemDetails.category.id);

        
        // Calculate the prices.
        const prices = await updatePrice();
        io.emit("delete item", itemId, prices);

        console.log(`FUNCTION: socketEvents() - EVENT: deleting item -- Item with id = ${itemId} deleted.`); 
    });

    // Updates the props of the item.
    socket.on("updating item", async (item) => {
        // Getting the item from the database.
        const foundItem = await Item.getById(item.id);
        if (foundItem === undefined) {
            socket.emit("Unpermitted action", "NOT PERMITTED! Trying to update an item that does not exist!");
            return;
        }

        // Getting the category and the market of the item.
        const itemDetails = await getSectionsByName(item, true);
        if (itemDetails.category === undefined || itemDetails.market === undefined) {
            return;
        }

        // Checking if the item exists.
        item.categoryId = itemDetails.category.id;
        item.marketId = itemDetails.market.id;
        const exists = await Item.exists(item);

        // If it does that means that there is another item that have the same name quantity and unit as well as being in the same category and market.
        if (exists) {
            socket.emit("Unpermitted action", "NOT PERMITTED! Trying to update an item with props that are the same as other item!");

            // Update the editing status to show that the item is not edited anymore.
            foundItem.isBeingEdited = false;
            const isSuccessful = await Item.update(foundItem);
            if (!isSuccessful) {
                socket.emit("Unpermitted action", "NOT PERMITTED! Trying to update an item that does not exist!");
                return;
            }
            return;
        }

        // Update the item.
        const isSuccessful = await Item.update(item);
        if (!isSuccessful) {
            socket.emit("Unpermitted action", "NOT PERMITTED! Trying to update an item that does not exist!");
            return;
        }

        // Getting the category and market of the old item do that we can delete them if thay are empty.
        const oldItemDetalis = await getSectionsById(foundItem);

        // Deliting the category and market of the old item if they are empty.
        await deleteSectionsIfEmpty(oldItemDetalis.market.id, oldItemDetalis.category.id);

        // Checking if the category and the market are used meaning are there any unbought items in them. If there are, they are rendered and we should not render them again.
        const isMarketInUse = await Market.isUsed(itemDetails.market.id, item.id);
        const isCategoryInUse = await Category.isUsed(itemDetails.category.id, item.id);

        // Rendering the category and the market if they are not rendered already. Rendering the item.
        itemDetails.renderMarket = !isMarketInUse;
        itemDetails.renderCategory = !isCategoryInUse;
        const renderedElements = await renderItemDetails(itemDetails);
        renderedElements.item = await renderView("item", item);
        
        // Calculate the prices.
        const prices = await updatePrice();

        io.emit("update item", {renderedElements, isBought:  item.isBought, marketElementId: itemDetails.market.id, categoryElementId: itemDetails.category.id}, item.id, prices)
        console.log(`FUNCTION: socketEvents() - EVENT: updating item -- Item with id = ${item.id} updated.`);
    });


    socket.on("editing item", async (itemId) => {
        // Getting the item from the database.
        const item = await Item.getById(itemId);
        if (item === undefined) {
            socket.emit("Unpermitted action", "NOT PERMITTED! Trying to update an item that does not exist!");
            return;
        }

        // Checking fi someone is editing the item.
        if (item.isBeingEdited == true) {
            socket.emit("Unpermitted action", "NOT PERMITTED! Trying to update an item while another user is updating it!");
            return;
        }

        // Update the editing status to show that the item is being edited.
        item.isBeingEdited = true;
        const isSuccessful = await Item.update(item);
        if (!isSuccessful) {
            socket.emit("Unpermitted action", "NOT PERMITTED! Trying to update an item that does not exist!");
            return;
        }

        // Getting the category and the market of the item.
        const itemDetails = await getSectionsById(item);
        if (itemDetails.category === undefined || itemDetails.market === undefined) {
            return;
        }

        item.market = itemDetails.market.name;
        item.category = itemDetails.category.name;

        socket.emit("edit item", item);
        console.log(`FUNCTION: socketEvents() - EVENT: editing item -- Item with id = ${itemId} is being edited.`);
    });

    socket.on("editing interrupted item", async (itemId) => {
        // Getting the item from the database.
        const item = await Item.getById(itemId);
        if (item === undefined) {
            socket.emit("Unpermitted action", "NOT PERMITTED! Trying to update an item that does not exist!");
            return;
        }

        // Checking fi someone is editing the item.
        if (item.isBeingEdited == false) {
            socket.emit("Unpermitted action", "NOT PERMITTED! Trying to inpterrupt the updating without starting to update in first place!");
            return;
        }

        // Update the editing status to show that the item is not edited anymore.
        item.isBeingEdited = false;
        const isSuccessful = await Item.update(item);
        if (!isSuccessful) {
            socket.emit("Unpermitted action", "NOT PERMITTED! Trying to update an item that does not exist!");
            return;
        }

        console.log(`FUNCTION: socketEvents() - EVENT: editing interrupted item -- Editing of item with id = ${itemId} interrupted.`);
    });

    // Deletes all bought items.
    socket.on("clearing bought list", async () => {
        // Getting all bought items.
        const boughtItems = await Item.getAllBoughtItems();

        for (let i = 0; i < boughtItems.length; i++) {
            const item = boughtItems[i];

            // Getting the category and the market of the item.
            const itemDetails = await getSectionsByName(item);
            if (itemDetails.category === undefined || itemDetails.market === undefined) {
                return;
            }

            // Delete the item.
            const isSuccessful = await Item.delete(item.id);
            if (!isSuccessful) {
                socket.emit("Unpermitted action", "NOT PERMITTED! Trying to delete an item that does not exist!");
                return;
            }
      
            // Deliting the category and market of the old item if they are empty.
            await deleteSectionsIfEmpty(itemDetails.market.id, itemDetails.category.id);
        }

        io.emit("clear bought list");
        console.log("FUNCTION: socketEvents() - EVENT: clearing bought list -- All bought items removed.");
    });
    
    if (!socket.recovered) {
        socket.emit("reconnect");

        // Getting all items.
        const items = await Item.getAll();

        // Array that contains an object for each renderedElement and a bool showing if the item is bought or not. 
        const itemElements = [];

        // Map in which are saved all markets and there catrgories that have been created.
        const createdCombinations = new Map();

        for (const item of items) { 
            const renderedElements = {};   

            // If the item is bought, render it and continue because items that are bought do not have visual representation of there category and market.
            if (item.isBought) {
                renderedElements.item = await renderView("item", item);
                itemElements.push({renderedElements, isBought: item.isBought});
                continue;
            }

            // Getting the category and the market of the item.
            const itemDetails = await getSectionsByName(item);
            if (itemDetails.category === undefined || itemDetails.market === undefined) {
                return;
            }

            // Check if the market is rendered already.
            if (!createdCombinations.has(itemDetails.market.id)) {
                createdCombinations.set(itemDetails.market.id, []);
                renderedElements.market = await renderView("market", itemDetails.market);
            }

            // Check if the category is rendered already.
            const market = createdCombinations.get(itemDetails.market.id)
            if (!market.includes(itemDetails.category.id)) {
                market.push(itemDetails.category.id);
                renderedElements.category = await renderView("category", itemDetails.category);
            }
            
            // Render the item.
            item.market = itemDetails.market.name;
            renderedElements.item = await renderView("item", item);

            itemElements.push({renderedElements, isBought: item.isBought, marketElementId: itemDetails.market.id, categoryElementId: itemDetails.category.id});
        }
        
        // Calculate the prices.
        const prices = await updatePrice(items);
		socket.emit("add item", itemElements, prices);
	}

    /**
     * Returns the category and the market that the item is in using the categoryName and the marketName.
     * @param {object} item The item of which we want to find the category and the market.
     * @param {boolean} [createIfNotExists] Optional - if its true and the category or the market are not found, thay will be created.
     * @returns {Promise<object>} An object containing hadMarket and had category that are showing if they were found or if they are created by this method. Category and market contain the found or created category and market.
     */
    async function getSectionsByName(item, createIfNotExists = false) {
        const marketName = item.market;
        const categoryName = item.category;
        const result = {};

        let market = await Market.getByName(marketName);

        if (market === undefined) {
            if (createIfNotExists) {
                market = await Market.insert(marketName);
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

        let category = await Category.getByName(categoryName, market.id);
        if (category === undefined) {
            if (createIfNotExists) {
                category = await Category.insert(categoryName, market.id);
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

    /**
     * Deletes the specified category and market if there are no items in them.
     * @param {number | string} marketId The id of the market tht we want to check. 
     * @param {number | string} categoryId The id of the category tht we want to check. 
     */
    async function deleteSectionsIfEmpty(marketId, categoryId) {
        const shouldDeleteCategory = await Category.isEmpty(categoryId);

        if (shouldDeleteCategory) {
            const isCategoryDeleted = await Category.delete(categoryId);
            if (!isCategoryDeleted) {
                return;
            }

            const shouldDeleteMarket = await Market.isEmpty(marketId);
            if (shouldDeleteMarket) {
                const isMarketDeleted = await Market.delete(marketId);
                if (!isMarketDeleted) {
                    return;
                }
            }
        }
    }

    /**
     * Returns the category and the market that the item is in using the categoryId.
     * @param {object} item The item of which we want to find the category and the market.
     * @returns {Promise<object>} An object contaning the category and the market of the item.
     */
    async function getSectionsById(item) {
        const result = {};

        let category = await Category.getById(item.categoryId);
        if (category === undefined) {
            return result;
        }

        let market = await Market.getById(category.marketId);
        if (market === undefined) {
            return result;
        }

        result.market = market;
        result.category = category;

        return result;
    }


    /**
     * Renders the given category and market
     * @param {object} itemDetails Must contain props named renderMarket and renderCategory that show if they should be rendered as well as props market and category that contain the info that should be render for each of them. 
     * @returns {Promise<object>} An object that contains the rendered market and category.
     */
    async function renderItemDetails(itemDetails) {
        const renderedElements = {};
    
        if (itemDetails.renderMarket) {
            renderedElements.market = await renderView("market", itemDetails.market);
        }
    
        if (itemDetails.renderCategory) {
            renderedElements.category = await renderView("category", itemDetails.category);
        }

        return renderedElements;
    }

    /**
     * Selects all items form the database and calculates the prices for each isBought value and the total price.
     * @returns {Promise<object>} Returns the an object containing the price of the bought items, the price of the unbought items and the total price.
     */
    async function updatePrice(items) {
        let boughtPrice = 0;
        let unboughtPrice = 0;
        let totalPrice = 0; 

        if (items === undefined) {
            items = await Item.getAll();  
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
     * Used to render segments.
     * @param {string} name The name ot the view that is to be renedered.
     * @param {object} content The content that is to be rendered.
     * @returns {Promise<string>} Returns rendered content.
     */
    async function renderView(name, content) {  
        if ( content.market) {
            content.market = content.market[0].toUpperCase(); 
        }
        
        return new Promise((resolve, reject) => {
            app.render(name, {...content}, (err, html) => {
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