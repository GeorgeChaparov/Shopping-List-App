/**
 * This object is used to handle the interaction with the items.
 */
const itemInteraction = {
    elementHolded: false,
    swipedLeft: false,
    swipedRight: false,
    get canEdit(){
        return this.elementHolded && this.swipedLeft;
    },
    get canDelete(){
        return this.elementHolded && this.swipedRight;
    },
    reset(){
        this.elementHolded = false;
        this.swipedLeft = false;
        this.swipedRight = false;
    }
}

const hammerInstances = new Map();

document.addEventListener("DOMContentLoaded", (e) => {
    const unboughtList = document.getElementById("unbought-list");
    const boughtList = document.getElementById("bought-list");

    socket.on("add item", (elements, prices) => {
        elements.forEach(element => {
            addElement(element.renderedElements, !element.isBought, element.marketElementId, element.categoryElementId);
        });
        
        updatePrices(prices);
    });

    socket.on("buy item", (element, elementId, prices) => {
        removeItem(elementId);
        addElement({item: element}, false);
        updatePrices(prices);
    });

    socket.on("return item", (element, elementId, prices) => {
        removeItem(elementId);
        addElement(element.renderedElements, !element.isBought, element.marketElementId, element.categoryElementId);
        updatePrices(prices);
    });

    socket.on("delete item", (elementId, prices) => {
        removeItem(elementId);
        updatePrices(prices);
    });

    socket.on("update item", (element, elementId, prices) => {
        removeItem(elementId);
        addElement(element.renderedElements, !element.isBought, element.marketElementId, element.categoryElementId);
        updatePrices(prices);
    });

    socket.on("edit item", (item) => {
        itemForEdit(item);
    });

    socket.on("Unpermitted action", (message) => {
        alert(message)
    });

    document.addEventListener('pointerup', (e) => {
        if (!itemInteraction.canDelete && !itemInteraction.canEdit) {
            return;
        }

        const elementUnderPointer = document.elementFromPoint(e.clientX, e.clientY);
        const unboughtItems = document.getElementsByClassName("unbought-item");

        /** @type {HTMLElement}*/
        let parent;

        let actions = [];

        /** @type {Function}*/
        let hidingFunction;

        if (itemInteraction.swipedLeft) {
            actions[0] = "edit"; actions[1] = itemForEdit; hidingFunction = hideEditButton;
        }
        else if (itemInteraction.swipedRight) {
            actions[0] = "delete"; actions[1] = "deleting"; hidingFunction = hideDeleteButton;
        }

        for (const item of unboughtItems) {
            if (item.style.animationName === `show-${actions[0]}-body`) {
                parent = item;
                break;
            }
        }

        if (elementUnderPointer.classList.contains(`${actions[0]}-button`)) {
            if (actions[1] === "deleting") {

                if (window.confirm("Do you really want to delete this item men or women?")) {
                    socket.emit(`${actions[1]} item`, parent.id);
                }
            }
            else {
                socket.emit("editing item", parent.id);
            }
        }

        hidingFunction(parent);
    });

    /**
     * 
     * @param {HTMLElement} elements 
     * @param {boolean} placeInToBuy 
     */
    function addElement(renderedElements, placeInToBuy, marketId, categoryId) {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = renderedElements.item;
        const newItem = tempDiv.firstChild;
        const hammer = new Hammer(newItem);
        hammerInstances.set(newItem, hammer);

        if (!placeInToBuy) {
            boughtList.appendChild(newItem);
            hammer.on('pressup', returnItem);

            return;
        }

        if (renderedElements.market !== undefined) {
            tempDiv.innerHTML = renderedElements.market;
            const newMarket = tempDiv.firstChild;

            unboughtList.appendChild(newMarket);
        }

        if (renderedElements.category !== undefined) {
            tempDiv.innerHTML = renderedElements.category;
            const newCategory = tempDiv.firstChild;

            const marketContainer = document.querySelector(`#market-container-${marketId}`);
            marketContainer.appendChild(newCategory);
        }

        const categoryContainer = document.querySelector(`#category-container-${categoryId}`);
        categoryContainer.appendChild(newItem);

        hammer.on('press', (e) => {
            itemInteraction.elementHolded = true; 
            hammer.get('pan').set({ enable: true });
        });
        hammer.on('pressup', buyItem);

        hammer.on('panleft', showEditButton);
        hammer.on('panright', showDeleteButton);
        hammer.get('pan').set({enable: false});
    };

    function showDeleteButton(e) {
        let element = e.target;

        if (!element.classList.contains("item")) {
            if (element.parentElement.classList.contains("item")) {
                element = element.parentElement;
            }
            else {
                return;
            }
        }

        if (itemInteraction.elementHolded && !itemInteraction.swipedLeft) {
            itemInteraction.swipedRight = true;
            setItemAnimation(element, "show-delete");
            return;
        }
        else if (itemInteraction.swipedLeft) {
            hammerInstances.get(element).get('pan').set({enable: false});  
        }
    };

    function showEditButton(e) {
        let element = e.target;

        if (!element.classList.contains("item")) {
            if (element.parentElement.classList.contains("item")) {
                element = element.parentElement;
            }
            else {
                return;
            }
        }

        if (itemInteraction.elementHolded && !itemInteraction.swipedRight) {
            itemInteraction.swipedLeft = true;
            setItemAnimation(element, "show-edit");
        }
        else if (itemInteraction.swipedRight) {
            hammerInstances.get(element).get('pan').set({enable: false});
        }
    };

    /**
     * 
     * @param {HTMLElement} element 
     */
    function hideDeleteButton(element) {
        setItemAnimation(element, "hide-delete");
        hammerInstances.get(element).get('pan').set({enable: false});
        itemInteraction.reset();
    };

    /**
     * 
     * @param {HTMLElement} element 
     */
    function hideEditButton(element) {
        setItemAnimation(element, "hide-edit");
        hammerInstances.get(element).get('pan').set({enable: false});
        itemInteraction.reset();
    };


    /**
     * Sets the animation of item and the button that correspond to the animationType.
     * @param {HTMLElement} item 
     * @param {string} animationType 
     */
    function setItemAnimation(item, animationType) {
        const button = animationType.includes("edit") ? item.children[0] : item.children[item.children.length - 1];

        item.style.animation = `${animationType}-body 0.2s forwards`;
        button.style.animation = `${animationType}-button 0.2s forwards`;
    };

    function buyItem(e) {
        let element = e.target;

        if (!element.classList.contains("item")) {
            if (element.parentElement.classList.contains("item")) {
                element = element.parentElement;
            }
            else {
                return;
            }
        }

        socket.emit("buying item", element.id);
        isHolding = false;
    };

    function returnItem(e) {
        const element = e.target;
        socket.emit("returning item", element.id);
    };
});

/**
 * 
 * @param {HTMLElement} item 
 */
function findMarketContainer(item) {
    let parent = item.parentElement;

    while (!parent.classList.contains("market-container")) {
        parent = parent.parentElement;
    }

    return parent;
}

/**
 * 
 * @param {HTMLElement} item 
 */
function findCategoryContainer(item) {
    let parent = item.parentElement;

    while (!parent.classList.contains("category-container")) {
        parent = parent.parentElement;
    }

    return parent;
}

/**
 * Removes an item from the DOM.
 * @param {string} itemId The id of the element.
 */
function removeItem(itemId) {
    const element = document.getElementById(itemId);
    const hammer = hammerInstances.get(element);
    hammerInstances.delete(element);

    if (element.classList.contains("unbought-item")) {
        const marketContainerElement = findMarketContainer(element);
        const categoryContainerElement = findCategoryContainer(element);

        hammer.off('press');
        hammer.off('pressup');
        hammer.off('swipeleft');
        hammer.off('swiperight');
        hammer.off('pan');
        hammer.destroy();
        element.remove();

        if (categoryContainerElement.childElementCount === 0) {
            categoryContainerElement.parentElement.remove();
        }
    
        if (marketContainerElement.childElementCount === 0) {
            marketContainerElement.parentElement.remove();
        }
    }
    else {
        hammer.off('pressup');
        hammer.destroy();
        element.remove();
    }
};