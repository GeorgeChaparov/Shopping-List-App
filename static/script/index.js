const socket = io();

let updatePrices;
document.addEventListener("DOMContentLoaded", () => {
    const boughtPrice = document.getElementById("bought-price");
    const unboughtPrice = document.getElementById("unbought-price");
    const totalPrice = document.getElementById("total-price");

    const boughtList = document.getElementById("bought-list");
    const unboughtList = document.getElementById("unbought-list");

    const bin = document.getElementById("delete-bought-item");

    socket.on("reconnect", () => {
        boughtList.innerHTML = "";
        unboughtList.innerHTML = "";
    });

    socket.on("clear bought list", () => {
        for (let i = boughtList.children.length - 1; i >= 0; i--) {
            const element = boughtList.children[i];
            removeItem(element.id);
        }
        updatePrices({unboughtPrice: unboughtPrice.innerHTML, boughtPrice: 0, totalPrice: unboughtPrice.innerHTML});
    });
    
    bin.addEventListener("click", (e) => {
        if (boughtList.innerHTML !== "" && window.confirm("Do you really want to delete ALLL items men or women?")) {
            socket.emit("clearing bought list");
        }
    });

    updatePrices = (prices) => {
        unboughtPrice.innerHTML = prices.unboughtPrice;
        boughtPrice.innerHTML = prices.boughtPrice;
        totalPrice.innerHTML = prices.totalPrice;
    };
});