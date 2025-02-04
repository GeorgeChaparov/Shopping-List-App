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

    const productPrice = document.getElementById("price");

    const dropdownMenusCheckbox = document.querySelectorAll("#create-edit-menu input[id$='checkbox']");
    /** * @type {Array<Element>}*/
    const dropdownMenusLabel = [];
    /** * @type {Array<NodeListOf<Element>>}*/
    const dropdownMenusValues = [];

    dropdownMenusCheckbox.forEach(checkbox => {
        const checkboxId = checkbox.id;
        const checkboxType = checkbox.id.split("-")[0];

        dropdownMenusLabel.push(document.querySelector(`#create-edit-menu #${checkboxId} + label`));
        dropdownMenusValues.push(document.querySelectorAll(`#create-edit-menu input[name='${checkboxType}']`));

        checkbox.addEventListener("change", (e) => {
            const target = e.target;

            if (target.checked) {
                dropdownMenusCheckbox.forEach(checkbox => {
                    if (checkbox !== target) {
                        checkbox.checked = false;
                    }
                });
            }
        });
    });

    dropdownMenusInteraction();

    menuBackground.addEventListener("click", (e) => {
        if (e.target === menuBackground) {
            addItemCheckbox.checked = false;

            if (productId.value !== "") {
                socket.emit("editing interrupted item", productId.value);
            }

            resetAllElements();
        }
    });

    menu.addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        const item = {};
        for (const [key, value] of formData.entries()) {
            if (value === "" || value === "none") {

                // Market and category can be empty. The id is not set by the user.
                if (key != "market" && key != "category" && key != "id") {
                    alert("There cannot be empty values");
                    return;
                }
            }

            item[key] = value;
        }

        addItemCheckbox.checked = false;
        resetAllElements();
        
        item.isBought = false;
        item.isBeingEdited = false;
        if (item.id === "") {
            socket.emit("adding item", item);
        }
        else {
            socket.emit("updating item", item);
        }
    })

    menu.addEventListener("click", (e) => {
        if (e.target === menu) {
            dropdownMenusCheckbox.forEach(checkbox => {
                checkbox.checked = false;
            });
        }      
    });

    
    function resetAllElements() {
        resetElement(productId, {value: ""});
        resetElement(productName, {value: ""});
        resetElement(productQuantity, {value: ""});
        resetElement(productPrice, {value: ""});
        dropdownMenusCheckbox.forEach(checkbox => {
            resetElement(checkbox, {checked: false});
        });
        dropdownMenusLabel.forEach(label => {
            resetElement(label, {innerHTML: label.dataset.defaultValue});
            label.removeAttribute("style");
        });
        dropdownMenusValues.forEach(values => {
            resetElement(values[0], {checked: true});
        });
    }

    function dropdownMenusInteraction() {
        dropdownMenusValues.forEach((values, index) => {
            values.forEach(value => {
                value.addEventListener("click", (e) => {
                    const target = e.target;
                    if (target.checked) {             
                        dropdownMenusLabel[index].innerHTML = target.value;
                        dropdownMenusLabel[index].style.color = "black";
                    }
    
                    dropdownMenusCheckbox.forEach(checkbox => {
                        if (checkbox.id.includes(value.name)) {
                            checkbox.checked = false;
                        }
                    });
                });
            });
        });
    }

    itemForEdit = (item) => {
        const radioProps = [item.unit, item.category, item.market];

        addItemCheckbox.checked = true;
        productId.value = item.id;

        productName.value = item.name;

        productQuantity.value = item.quantity;

        dropdownMenusValues.forEach((values, index) => {
            values.forEach(value => {
                if (value.value === radioProps[index]) {
                    value.checked = true;
                    dropdownMenusLabel[index].innerHTML = radioProps[index];
                    dropdownMenusLabel[index].style.color = "black";
                }
            });
        });

        productPrice.value = item.price;
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