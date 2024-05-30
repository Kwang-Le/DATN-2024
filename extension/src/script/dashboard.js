const dbName = "MyTestDatabase";  // Replace with your database name
const objectStoreCookieData = "cookies_matches";  // Replace with your object store name

//page navigation
document.getElementById('violation-page').addEventListener('click', () => {
    chrome.tabs.create({
        active: true,
        url: '../html/violations.html'
    }, null);
})

document.getElementById('setting-page').addEventListener('click', () => {
    chrome.tabs.create({
        active: true,
        url: '../html/setting.html'
    }, null);
})

async function getDataFromIndexDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName);
        // let data = [];


        request.onsuccess = async (event) => {
            const db = event.target.result;
            const transaction = await db.transaction(objectStoreCookieData, "readonly");
            const objectStore = transaction.objectStore(objectStoreCookieData);

            const allDataRequest = await objectStore.getAll();
            allDataRequest.onsuccess = async (event) => {
                const allData = await event.target.result;
                // data = await event.target.result;
                console.log("Retrieved data:", allData);
                // if (callback) {
                //     callback(allData)
                // }
                resolve(allData)
                // data = await [...allData]
                // allData.forEach((element)=> data.push(element))
                // // Process the retrieved data as needed
            };
            allDataRequest.onerror = (event) => {
                console.error("Error retrieving data:", event.target.error);
            };

        };

        request.onerror = (event) => {
            console.error("Error opening database:", event.target.error);
        }
    })

}


function setData(data) {
    console.log(data)
    const tableBody = document.getElementById('cookies-table-body');
    data.forEach(element => {
        let categoryColor;
        switch (element[2]) {
            case 'Functional':
                categoryColor = 'blue'
                break;
            case 'Analytics':
                categoryColor = 'orange'
                break;
            case 'Marketing':
                categoryColor = 'red'
                break;

        }
        let tableRow = `<tr>
                      <td class="cookie-domain">${element[1]}</td>
                      <td class="cookie-name">${element[3]}</td>
                      <td class="cookie-expiration">${element[6]}</td>
                      <td class="cookie-category" style="color: ${categoryColor};">${element[2]}</td>
                      <td class="cookie-description">${element[5]}</td>
                      </tr>`
        tableBody.insertAdjacentHTML('beforeend', tableRow)
    });

}



async function main() {
    let cookieData = await getDataFromIndexDB();
    console.log(cookieData)
    setData(cookieData)
}

main();