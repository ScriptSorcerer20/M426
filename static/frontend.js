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
                price: parseFloat(data.price.replace(/[^\d.-]/g, '')),
                quantity: 1
            });
            showToast(`${data.title} wurde dem Warenkorb hinzugefügt.`);
        } else {
            showToast(`${data.title} ist bereits im Warenkorb.`);
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
        const dayTitle = document.querySelectorAll(".menu-day .day-title")[dayIndex];
        if (dayTitle && products.length > 0) {
            const firstProductDate = products[0].date;
            const dayLabel = ["Mo", "Di", "Mi", "Do", "Fr"][dayIndex];
            dayTitle.textContent = `${dayLabel} – ${firstProductDate}`;
        }

        if (!dishContainer) continue;
        products.forEach(product => {
            const dishElement = document.createElement("div");
            dishElement.className = "dish";
            const imageMap = {
                "Grillgemüse mit Quinoa": "/static/images/quinoa.png",
                "Rindergeschnetzeltes mit Rösti": "/static/images/rösti.png",
                "Kichererbsen-Curry mit Reis": "/static/images/kichererbsen.png",
                "Spaghetti mit Linsenbolognese": "/static/images/spaghetti.png",
                "Lachsfilet mit Zitronen-Dill-Sauce": "/static/images/lachs.png",
                "Süßkartoffel-Burger": "/static/images/burger.png",
                "Gemüselasagne": "/static/images/lasagne.png",
                "Falafel Wrap": "/static/images/wrap.png",
                "Hähnchen-Teriyaki mit Gemüse": "/static/images/teriyaki.png",
                "Ziegenkäse-Salat mit Honig": "/static/images/salat.png",
                "Pommes Frites": "/static/images/fries.png"
            };
            window.basketItems = window.basketItems.map(item => ({
                ...item,
                image: imageMap[item.title] || item.image
            }));
            localStorage.setItem("basketItems", JSON.stringify(window.basketItems));
            const image = imageMap[product.product_name] || "/static/images/quinoa.png";
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

async function updatePage() {
    const json_route = indexToRoute[currentPageIndex];
    const response = await fetch(json_route);
    if (!response.ok) return;
    const data = await response.json();
    const dates = data.week.map(dayObj => {
        const dayKey = Object.keys(dayObj)[0];
        return dayObj[dayKey][0]?.date;
    }).filter(Boolean);
    const dateLabel = document.querySelector('.date-label');
    dateLabel.textContent = `${dates[0]} – ${dates[dates.length - 1]}`;
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

function showToast(message = "Zum Warenkorb hinzugefügt") {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.remove("hidden");
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
        toast.classList.add("hidden");
    }, 2000);
}

document.addEventListener('DOMContentLoaded', () => {
    const userMenu = document.querySelector('.user-menu');
    const btn = userMenu.querySelector('.user-menu__btn');
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        userMenu.classList.toggle('open');
    });
    document.addEventListener('click', () => {
        userMenu.classList.remove('open');
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') userMenu.classList.remove('open');
    });
});