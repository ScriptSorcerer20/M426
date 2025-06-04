let json_route = "http://127.0.0.1:5000/products/0"

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

async function title_list(url){
    let response = await fetch(url)
    if (response.ok) {
        let element_index = 0

        let selected_titles = document.querySelectorAll(".dish-title")
        let json = await response.json();
        for (day_object of json.week) {

            let day_key = Object.keys(day_object)[0]
            products = day_object[day_key]
            let counter = 0

            for (product of products) {



                if (counter <= products.length) {
                    console.log(element_index)
                    let current_title = selected_titles[element_index]
                    current_title.innerHTML = product.product_name
                    element_index++
                    counter++
                }
                console.log(counter + "?" + products.length)
                if (counter === products.length) {
                    console.log("all products printed")
                    element_index += products.length
                }
            }
        }
    }
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