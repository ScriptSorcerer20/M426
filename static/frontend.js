let json_route = "http://127.0.0.1:5000/products/0"
let currentPageIndex = 0;
const indexToRoute = {
    0: "http://127.0.0.1:5000/products/0",
    1: "http://127.0.0.1:5000/products/1",
    2: "http://127.0.0.1:5000/products/2"
};

const nextPageMap = { 2: 0, 0: 1, 1: 0 };
const prevPageMap = { 2: 0, 0: 2, 1: 0 };

function openOverlay(data) {
    document.getElementById('overlayImage').src = data.image;
    document.getElementById('overlayTitle').textContent = data.title;
    document.getElementById('overlayDescription').textContent = data.description;
    document.getElementById('overlayNutrition').textContent = data.nutrition;
    document.getElementById('overlayAllergies').textContent = data.allergies;
    document.getElementById('overlayPrice').textContent = data.price;
    document.getElementById('overlayWait').textContent = data.wait;
    document.getElementById('dishOverlay').classList.remove('hidden');
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

async function title_list(json) {
    let response = await fetch(json)
    console.log(await response.json())
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