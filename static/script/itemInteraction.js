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
            addItem(element.itemElement, !element.isBought);
        });
        
        updatePrices(prices);
    });

    socket.on("buy item", (element, elementId, prices) => {
        removeItem(elementId);
        addItem(element, false);
        updatePrices(prices);
    });

    socket.on("return item", (element, elementId, prices) => {
        removeItem(elementId);
        addItem(element, true);
        updatePrices(prices);
    });

    socket.on("delete item", (elementId, prices) => {
        removeItem(elementId);
        updatePrices(prices);
    });

    socket.on("update item", (element, elementId, prices) => {
        removeItem(elementId);
        addItem(element, true);
        updatePrices(prices);
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
                const item = getItemProps(parent, true);
                actions[1](item, false, true);
            }
        }

        hidingFunction(parent);
    });

    /**
     * 
     * @param {HTMLElement} element 
     * @param {boolean} isItemToBuy 
     */
    function addItem(element, isItemToBuy) {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = element;
        const newElement = tempDiv.firstChild;
        const hammer = new Hammer(newElement);
        hammerInstances.set(newElement, hammer);

        if (isItemToBuy) {
            unboughtList.appendChild(newElement);

            hammer.on('press', (e) => {
                itemInteraction.elementHolded = true; 
                hammer.get('pan').set({ enable: true });
            });
            hammer.on('pressup', buyItem);

            hammer.on('panleft', showEditButton);
            hammer.on('panright', showDeleteButton);
            hammer.get('pan').set({enable: false});
        }
        else {
            boughtList.appendChild(newElement);
            hammer.on('pressup', returnItem);
        }
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

        const item = getItemProps(element, true);

        socket.emit("buying item", item);
        isHolding = false;
    };

    function returnItem(e) {
        const element = e.target;
        const item = getItemProps(element, false);

        socket.emit("returning item", item);
    };

    /**
     * Returns an object with all of the relevent props of the element.
     * @param {HTMLElement} itemElement The element from which the props are taken.
     * @param {boolean} isBought
     * @param {boolean} isBeingEdit 
     * @returns {object} 
     */
    function getItemProps(itemElement, isBought, isBeingEdit = false) {
        const level = isBought === true ? 1 : 0;

        const itemMarket = itemElement.children[level].children[0].children[0].innerHTML;
        const itemTitle = itemElement.children[level].children[0].children[1].innerHTML;
        const itemQuantityAndUnit = itemElement.children[level].children[0].children[2].innerHTML.split(" ");
        const itemQuantity = itemQuantityAndUnit[0];
        const itemUnit = itemQuantityAndUnit[1];
        const itemPrice = itemElement.children[level].children[1].innerHTML;

        const item = {
            market: itemMarket,
            productName: itemTitle,
            quantity: itemQuantity,
            unit: itemUnit,
            price: itemPrice,
            isBought: isBought,
            isBeingEdit: isBeingEdit,
            productId: itemElement.id
        }

        return item;
    };
});

/**
 * Removes an element from the DOM.
 * @param {string} itemId The id of the element.
 */
function removeItem(itemId) {
    const element = document.getElementById(itemId);
    const hammer = hammerInstances.get(element);
    hammerInstances.delete(element);
    hammer.off('press');
    hammer.off('pressup');
    hammer.off('swipeleft');
    hammer.off('swiperight');
    hammer.destroy();
    element.remove();
};