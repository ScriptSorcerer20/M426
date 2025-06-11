window.basketItems = JSON.parse(localStorage.getItem("basketItems") || "[]");
let json_route = "http://127.0.0.1:5000/products/0"
let currentPageIndex = 0;
const indexToRoute = {
    0: "http://127.0.0.1:5000/products/0",
    1: "http://127.0.0.1:5000/products/1",
    2: "http://127.0.0.1:5000/products/2"
};

const nextPageMap = {2: 0, 0: 1, 1: 0};
const prevPageMap = {2: 0, 0: 2, 1: 0};

function openOverlay(data) {
    document.getElementById('overlayImage').src = data.image;
    document.getElementById('overlayTitle').textContent = data.title;
    document.getElementById('overlayDescription').textContent = data.description;
    document.getElementById('overlayNutrition').textContent = data.nutrition;
    document.getElementById('overlayAllergies').textContent = data.allergies;
    document.getElementById('overlayPrice').textContent = data.price;
    document.getElementById('dishOverlay').classList.remove('hidden');
    const addToCartBtn = document.querySelector(".add-to-cart");
    addToCartBtn.onclick = () => {
        const existing = window.basketItems.find(item => item.title === data.title);
        if (!existing) {
            window.basketItems.push({
                title: data.title,
                image: data.image,
                price: parseFloat(data.price.replace(/[^\d.-]/g, '')), // "6.90 CHF" to 6.90
                quantity: 1
            });
            alert(`${data.title} wurde dem Warenkorb hinzugefügt.`);
        } else {
            alert(`${data.title} ist bereits im Warenkorb.`);
        }
        localStorage.setItem("basketItems", JSON.stringify(window.basketItems)); // <-- Important!
        closeOverlay();
    };
}

function closeOverlay() {
    document.getElementById('dishOverlay').classList.add('hidden');
}

document.querySelectorAll('.dish').forEach(dish => {
    dish.addEventListener('click', () => {
        const sampleData = {
            image: dish.querySelector('img').src,
            title: dish.querySelector('.dish-title').textContent || 'Titel',
            description: 'Eine leckere Mischung aus frischem Gemüse, Reis und Dressing.',
            nutrition: '450 kcal, 20g Eiweiß',
            allergies: 'enthält Soja, Sesam',
            price: '6,90 €',
            wait: 'ca. 10 Minuten'
        };
        openOverlay(sampleData);
    });
});

document.addEventListener('keydown', (e) => {
    if (e.key === "Escape") {
        closeOverlay();
    }
});

async function title_list(url) {
    let response = await fetch(url);
    if (!response.ok) return;
    const data = await response.json();
    const allDishElements = document.querySelectorAll(".dishes");
    allDishElements.forEach(dishContainer => dishContainer.innerHTML = "");
    let dayIndex = 0;
    for (const dayObject of data.week) {
        const dayKey = Object.keys(dayObject)[0];
        const products = dayObject[dayKey];
        const dishContainer = allDishElements[dayIndex];
        if (!dishContainer) continue;
        products.forEach(product => {
            const dishElement = document.createElement("div");
            dishElement.className = "dish";
            const imageMap = {
                "Buddha Bowl": "/static/images/Buddha%20Bowl%20mit%20frischen%20Zutaten.png",
                "Chili con Carne": "/static/images/Chili%20mit%20Reis%20und%20Käse.png",
                "Gegrilltes Huehnchen": "/static/images/Gegrilltes%20Hühnchen%20mit%20Kartoffelstampf.png",
                "Rindfleisch mit Gemuese": "/static/images/Rindfleisch%20mit%20Gemüse%20in%20Sauce.png",
                "Pommes Frites": "/static/images/Buddha%20Bowl%20mit%20frischen%20Zutaten.png",
                "gay stress": "/static/images/Buddha%20Bowl%20mit%20frischen%20Zutaten.png",
                "straight fart": "/static/images/Chili%20mit%20Reis%20und%20Käse.png"
            };
            const image = imageMap[product.product_name] || "/static/images/Buddha%20Bowl%20mit%20frischen%20Zutaten.png";
            dishElement.innerHTML = `
                <img src="${image}" alt="${product.product_name}">
                <div class="dish-title">${product.product_name}</div>
            `;
            dishElement.addEventListener("click", () => {
                openOverlay({
                    image,
                    title: product.product_name,
                    description: product.product_description,
                    nutrition: `${product.kilocalories} kcal, ${(product.kilojoules).toFixed(0)} kJ`,
                    allergies: `Enthält: ${formatAllergies(product.allergy[0])}`,
                    price: `${product.product_price.toFixed(2)} CHF`,
                });
            });

            dishContainer.appendChild(dishElement);
        });

        dayIndex++;
    }
}

function formatAllergies(allergyObj) {
    return Object.entries(allergyObj)
        .filter(([_, hasAllergy]) => hasAllergy)
        .map(([allergy]) => allergy)
        .join(", ") || "keine";
}

title_list(json_route).then(r => console.log("successful"))

function updatePage() {
    const json_route = indexToRoute[currentPageIndex];
    console.log("Fetching page:", currentPageIndex, json_route);
    title_list(json_route);
    document.querySelector('.pagination-next-button').disabled = currentPageIndex === 1;
    document.querySelector('.pagination-back-button').disabled = currentPageIndex === 2;
}

document.querySelector('.pagination-next-button').addEventListener('click', () => {
    if (currentPageIndex === 0) {
        currentPageIndex = 1;
        updatePage();
    }
});

document.querySelector('.pagination-back-button').addEventListener('click', () => {
    if (currentPageIndex === 0) {
        currentPageIndex = 2;
        updatePage();
    }
});

document.querySelector('.pagination-next-button').addEventListener('click', () => {
    if (currentPageIndex === 2) {
        currentPageIndex = 0;
        updatePage();
    }
});

document.querySelector('.pagination-back-button').addEventListener('click', () => {
    if (currentPageIndex === 1) {
        currentPageIndex = 0;
        updatePage();
    }
});

window.basketItems = window.basketItems || [];
document.querySelector(".add-to-cart").onclick = () => {
    const existing = window.basketItems.find(item => item.title === data.title);
    if (!existing) {
        window.basketItems.push({
            title: data.title,
            image: data.image,
            price: parseFloat(data.price) * 100
        });
        alert(`${data.title} wurde dem Warenkorb hinzugefügt.`);
    } else {
        alert(`${data.title} ist bereits im Warenkorb.`);
    }
    closeOverlay();
};
