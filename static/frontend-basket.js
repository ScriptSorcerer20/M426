window.basketItems = JSON.parse(localStorage.getItem("basketItems") || "[]");
window.basketItems = JSON.parse(localStorage.getItem("basketItems") || "[]");
localStorage.setItem("basketItems", JSON.stringify(window.basketItems));
let item_total = 0;

function renderBasket(items = window.basketItems) {
    const basketWrapper = document.querySelector(".basket-wrapper");
    const totalDisplay = document.getElementById("total");
    basketWrapper.innerHTML = "";
    items.forEach(item => {
        const dish = document.createElement("div");
        dish.className = "dish-in-basket";
        dish.innerHTML = `
            <img src="${item.image}" alt="${item.title}">
            <div class="dish-basket-title">${item.title}</div>
            <div class="quantity-controls">
                <button class="quantity-decrease">−</button>
                <select name="quantity" class="quantity">
                    ${[...Array(9)].map((_, i) => `<option>${i + 1}</option>`).join("")}
                </select>
                <button class="quantity-increase">+</button>
            </div>
            <button class="remove-button">Remove</button>
        `;
        const quantitySelect = dish.querySelector(".quantity");
        const decreaseBtn = dish.querySelector(".quantity-decrease");
        const increaseBtn = dish.querySelector(".quantity-increase");
        quantitySelect.addEventListener("change", () => {
            item.quantity = parseInt(quantitySelect.value);
            localStorage.setItem("basketItems", JSON.stringify(window.basketItems));
            calculateTotal();
        });
        decreaseBtn.addEventListener("click", () => {
            let current = parseInt(quantitySelect.value);
            if (current > 1) {
                quantitySelect.value = current - 1;
                calculateTotal();
            }
        });
        increaseBtn.addEventListener("click", () => {
            let current = parseInt(quantitySelect.value);
            if (current < 9) {
                quantitySelect.value = current + 1;
                calculateTotal();
            }
        });
        dish.querySelector(".remove-button").addEventListener("click", () => {
            const index = window.basketItems.findIndex(d => d.title === item.title);
            if (index !== -1) {
                window.basketItems.splice(index, 1);
                localStorage.setItem("basketItems", JSON.stringify(window.basketItems));
                renderBasket();
            }
        });
        basketWrapper.appendChild(dish);
    });

    calculateTotal();

    function calculateTotal() {
        let total = 0;
        const dishes = basketWrapper.querySelectorAll(".dish-in-basket");
        dishes.forEach((dish, i) => {
            const quantity = parseInt(dish.querySelector(".quantity").value);
            total += window.basketItems[i].price * quantity;
        });
        totalDisplay.textContent = `Total: ${(total).toFixed(2)} CHF`;
        item_total = total
    }
}



function open_payment_overlay(total) {

    console.log(total)
    document.getElementById('overlayTitle').innerText = total;
    document.getElementById('dishOverlay').classList.remove('hidden');
}

function closeOverlay() {
    document.getElementById('dishOverlay').classList.add('hidden');
}

document.querySelector(".bestellung").onclick = () => {
    open_payment_overlay(item_total)
}

localStorage.setItem("basketItems", JSON.stringify(window.basketItems));
renderBasket();