/**
 * This function opens the create manu and sets all inputs to the values of the item that will be edited.
 * @type {Function}
 * @param {object} item The item that is being edited.
 */
let itemForEdit;

document.addEventListener("DOMContentLoaded", (e) => {
    const menuBackground = document.getElementById("create-edit-menu-background");
    const menu = document.getElementById("create-edit-menu");
    const addItemCheckbox = document.getElementById("add-item-checkbox");

    const productId = document.getElementById("product-id");

    const productName = document.getElementById("product-name");

    const productQuantity = document.getElementById("quantity");

    // Units Interaction.
    const unitCheckbox = document.getElementById("unit-checkbox");
    const unitLabel = document.querySelector("#unit-checkbox + label");
    const units = document.querySelectorAll("input[name='unit']");

    const productPrice = document.getElementById("price");

    // Market Interaction.
    const marketCheckbox = document.getElementById("market-checkbox");
    const marketLabel = document.querySelector("#market-checkbox + label");
    const markets = document.querySelectorAll("input[name='market']");

    unitsInteraction();
    unitCheckbox.addEventListener("change", (e) => {
        if (e.target.checked) {
            marketCheckbox.checked = false;
        }
    });

    marketsInteraction();
    marketCheckbox.addEventListener("change", (e) => {
        if (e.target.checked) {
            unitCheckbox.checked = false;
        }
    });
    menuBackground.addEventListener("click", (e) => {
        if (e.target === menuBackground) {
            addItemCheckbox.checked = false;

            resetAllElements();
        }
    });

    menu.addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        const item = {}
        for (const [key, value] of formData.entries()) {
            if ((value === "" && (key != "market" && key != "productId")) || value === "none") {
                alert("There cannot be empty values");
                return;
            }

            item[key] = value;
        }

        addItemCheckbox.checked = false;
        resetAllElements();
        
        item.isBought = false;
        item.isBeingEdit = false;
        if (item.productId === "") {
            socket.emit("adding item", item);
        }
        else {
            socket.emit("updating item", item);
        }
    })

    menu.addEventListener("click", (e) => {
        if (e.target === menu) {
            unitCheckbox.checked = false;
            marketCheckbox.checked = false;
        }      
    });

    
    function resetAllElements() {
        resetElement(productId, {value: ""});
        resetElement(productName, {value: ""});
        resetElement(productQuantity, {value: ""});
        resetElement(unitCheckbox, {checked: false});
        resetElement(unitLabel, {innerHTML: "Unit"});
        resetElement(units[0], {checked: true});
        resetElement(productPrice, {value: ""});
        resetElement(marketCheckbox, {checked: false});
        resetElement(marketLabel, {innerHTML: "Shop"});
        marketLabel.removeAttribute("style");
        resetElement(markets[0], {checked: true});
    }

    function unitsInteraction() {
        units.forEach(unit => {
            unit.addEventListener("click", (e) => {
                const checkbox = e.target;
                if (checkbox.checked) {             
                    unitLabel.innerHTML = checkbox.value;
                }

                unitCheckbox.checked = false;
            });
        });
    }

    function marketsInteraction() {
        markets.forEach(market => {
            market.addEventListener("click", (e) => {
                const checkbox = e.target;
                if (checkbox.checked) {             
                    marketLabel.innerHTML = firstCharToUpper(checkbox.value);
                    marketLabel.style.color = "black";
                }

                marketCheckbox.checked = false;
            });
        });
    }

    itemForEdit = (item) => {
        addItemCheckbox.checked = true;
        productId.value = item.productId;

        productName.value = item.productName;

        productQuantity.value = item.quantity;

        units.forEach(unit => {
            if (unit.value === item.unit) {
                unit.checked = true;
                unitLabel.innerHTML = item.unit;
            }
        });

        productPrice.value = item.price;

        markets.forEach(market => {
            if (market.value === item.market) {
                market.checked = true;
                marketLabel.innerHTML = firstCharToUpper(item.market);
                marketLabel.style.color = "black";
            }
        });
    }
})

/**
 * 
 * @param {HTMLElement} eleToReset 
 * @param {*} params 
 */
function resetElement(eleToReset, params) {
    for (const key in params) {
        if (Object.prototype.hasOwnProperty.call(params, key)) {
            const value = params[key];
            eleToReset[key] = value;
        }
    }
}