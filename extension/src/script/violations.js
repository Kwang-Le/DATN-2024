const dbName = "MyTestDatabase";  // Replace with your database name
const objectStoreCookieData = "cookies_matches";  // Replace with your object store name
const objectStoreTabData = "targeted_tab";

//page navigation
document.getElementById('dashboard-page').addEventListener('click', () => {
    chrome.tabs.create({
        active: true,
        url: '../html/dashboard.html'
    }, null);
})

document.getElementById('setting-page').addEventListener('click', () => {
    chrome.tabs.create({
        active: true,
        url: '../html/setting.html'
    }, null);
})

//execute code in tab
const executeScript = (tabId, func) => new Promise(resolve => {
    chrome.scripting.executeScript({ target: { tabId }, func }, resolve)
})

function setData(violations) {
    const tableBody = document.getElementById('cookies-table-body');
    violations.forEach(violation => {
        let tableRow = `<tr>
                      <td class="violation-description">${violation.name}</td>
                      <td class="cookie-category" style="color: ${violation.result ? 'red' : 'green'};">${violation.result}</td>
                      </tr>`
        tableBody.insertAdjacentHTML('beforeend', tableRow)
    });

}

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
                console.log("Retrieved cookie data:", allData);
                resolve(allData)
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

async function getTabDataFromIndexDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName);
        // let data = [];


        request.onsuccess = async (event) => {
            const db = event.target.result;
            const transaction = await db.transaction(objectStoreTabData, "readonly");
            const objectStore = transaction.objectStore(objectStoreTabData);

            const allDataRequest = await objectStore.getAll();
            allDataRequest.onsuccess = async (event) => {
                const allData = await event.target.result;
                console.log("Retrieved tab data:", allData);
                resolve(allData)
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

async function checkViolation(cookieData, tabData) {
    let violationAnalyticsCookie = checkAnalyticsCookie(cookieData)
    let violationAdvertisingCookie = checkAdvertisingCookie(cookieData)
    let violationCookieNotification = checkCookieNotification()
    let violationUsingCmp = checkUsingCmp()
    let violationUsingCookieWhenDenied = checkUsingCookieWhenDenied()
    let violationPolicy = checkPolicy()
    let violationHavingPolicy = await checkHavingPrivacyPolicy(tabData)
    return [violationAnalyticsCookie, violationAdvertisingCookie, violationCookieNotification, violationUsingCmp, violationUsingCookieWhenDenied, violationPolicy, violationHavingPolicy]
}

function checkAnalyticsCookie(data) {
    let result = false
    data.forEach(element => {
        if (element[2] == "Analytics") {
            result = true
        }
    });
    return { name: 'The website is using analytics cookie', result: result }
}

function checkAdvertisingCookie(data) {
    let result = false
    data.forEach(element => {
        if (element[2] == "Marketing") {
            result = true
        }
    });
    return { name: 'The website is using advertising cookie', result: result }
}

function checkCookieNotification() {
    let result = false
    return { name: 'The website is not notifying user about the use of cookies', result: result }
}

function checkUsingCmp() {
    let result = false

    return { name: 'The website is not using CMP to manage Cookie', result: result }
}

function checkUsingCookieWhenDenied() {
    let result = false
    return { name: 'The website is still using cookies even when rejected', result: result }
}

function checkPolicy() {
    let result = false
    return { name: 'The website Policy is independant from the cookie policy', result: result }
}

async function checkHavingPrivacyPolicy(tabData) {
    let result = false

    console.log("checking violations");
    const [{ result: selection }] = await executeScript(tabData.id, () => {
        return document.documentElement.innerText.toLowerCase().includes('policy');
    })
    result = !selection
    return { name: "The website don't have a privacy policy", result: result }
}

async function main() {
    const cookieData = await getDataFromIndexDB();
    const tabData = await getTabDataFromIndexDB();
    console.log(cookieData)
    const violations = await checkViolation(cookieData, tabData[0])
    setData(violations)
}

main()