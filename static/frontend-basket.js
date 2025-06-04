const basketItems = [
    {
        title: "Buddha Bowl",
        image: "/static/images/Buddha%20Bowl%20mit%20frischen%20Zutaten.png"
    },
    {
        title: "Chili con Carne",
        image: "/static/images/Chili%20mit%20Reis%20und%20Käse.png"
    },
    {
        title: "Gegrilltes Hühnchen",
        image: "/static/images/Gegrilltes%20Hühnchen%20mit%20Kartoffelstampf.png"
    },
    {
        title: "Rindfleisch mit Gemüse",
        image: "/static/images/Rindfleisch%20mit%20Gemüse%20in%20Sauce.png"
    }
];

function renderBasket(items) {
    const basketWrapper = document.querySelector(".basket-wrapper");
    basketWrapper.innerHTML = "";
    items.forEach(item => {
        const dish = document.createElement("div");
        dish.className = "dish-in-basket";
        dish.innerHTML = `
            <img src="${item.image}" alt="${item.title}">
            <div class="dish-basket-title">${item.title}</div>
            <label>
                <select name="quantity" class="quantity">
                    ${[...Array(9)].map((_, i) => `<option>${i + 1}</option>`).join("")}
                </select>
            </label>
            <button class="remove-button">Remove</button>
        `;
        dish.querySelector(".remove-button").addEventListener("click", () => {
            const index = basketItems.findIndex(d => d.title === item.title);
            if (index !== -1) {
                basketItems.splice(index, 1);
                renderBasket(basketItems);
            }
        });
        basketWrapper.appendChild(dish);
    });
}

renderBasket(basketItems);