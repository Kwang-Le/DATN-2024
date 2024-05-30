const cookieBannerDetectionToggle = document.getElementById('flexSwitchCookieBannerDetection')
const autoDetectToggle = document.getElementById('flexSwitchAutoDetect')


//page navigation
document.getElementById('violation-page').addEventListener('click', () => {
    chrome.tabs.create({
        active: true,
        url: '../html/violations.html'
    }, null);
})

document.getElementById('dashboard-page').addEventListener('click', () => {
    chrome.tabs.create({
        active: true,
        url: '../html/dashboard.html'
    }, null);
})

// initialize toggle buttons
chrome.storage.sync.get('toggleCookieBannerDetection', function (data) {
    let value = data.toggleCookieBannerDetection
    if (value) {
        cookieBannerDetectionToggle.checked = true
    } else {
        cookieBannerDetectionToggle.checked = false
    }
});

chrome.storage.sync.get('toggleAutoDetect', function (data) {
    let value = data.toggleAutoDetect
    if (value) {
        autoDetectToggle.checked = true
    } else {
        autoDetectToggle.checked = false
    }
});

// event listener
cookieBannerDetectionToggle.addEventListener("click", () => {
    if (cookieBannerDetectionToggle.checked) {
        chrome.storage.sync.set({ toggleCookieBannerDetection: true })
        chrome.storage.sync.get('toggleCookieBannerDetection', function (data) {
            let value = data.toggleCookieBannerDetection
            console.log(value)
        });
    } else {
        chrome.storage.sync.set({ toggleCookieBannerDetection: false })
    }
})

autoDetectToggle.addEventListener("click", () => {
    if (autoDetectToggle.checked) {
        chrome.storage.sync.set({ "toggleAutoDetect": true })
        chrome.storage.sync.get('toggleAutoDetect', function (data) {
            let value = data.toggleAutoDetect
            console.log(value)
        });
    } else {
        chrome.storage.sync.set({ "toggleAutoDetect": false })
    }
})