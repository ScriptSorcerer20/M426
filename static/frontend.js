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

async function title_list(json){
    let response = await fetch(json)
    console.log(await response.json())
}

title_list(json_route).then(r => console.log("successful"))
/*
document.querySelectorAll(".dish-title").forEach(title => {
    title.
})

 */

