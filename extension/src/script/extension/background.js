const message = document.getElementById('message');
const scanWebsiteBtn = document.getElementsByClassName('scan-website')[0];
const scanCMPBtn = document.getElementsByClassName('scan-cmp')[0];
const settingBtn = document.getElementsByClassName('setting-btn')[0];
let autoDetect = false

//page navigation
settingBtn.addEventListener('click', () => {
  chrome.tabs.create({
    active: true,
    url: '../../html/setting.html'
  }, null);
})

// auto scan website
chrome.storage.sync.get('toggleAutoDetect', function (data) {
  let value = data.toggleAutoDetect
  if (value) {
    scanWebsiteBtn.hidden = true
    scanCMPBtn.hidden = true
    handleScanWebsite()
    // chrome.tabs.onActivated.addListener(function (activeInfo) {
    //   handleScanWebsite()
    // });
  } else {
    scanWebsiteBtn.hidden = false
    scanCMPBtn.hidden = false
  }
})

// realtime detect cookie banner
chrome.storage.sync.get('toggleCookieBannerDetection', function (data) {
  let value = data.toggleCookieBannerDetection
  if (value) {
    // create a session
    // loadModel().then(() => console.log('load model successful'))
    const myOnnxSession = new onnx.InferenceSession();
    // load the ONNX model file
    myOnnxSession.loadModel('../../script/util/model_epoch_64.onnx').then(() => {
      console.log("Model loaded successfully");
      // captureAndProcessScreen();
    });
  }
})

function captureAndProcessScreen() {
  chrome.desktopCapture.chooseDesktopMedia(["screen", "window", "tab"], (streamId) => {
    // Check if the stream ID is valid
    if (!streamId) {
      console.log("User cancelled the screen sharing prompt.");
      return;
    }

    // Capture the selected content as a video stream
    navigator.mediaDevices.getUserMedia({
      video: {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: streamId,
          maxWidth: 1920,
          maxHeight: 1080
        }
      }
    }).then(stream => {
      const videoElement = document.createElement('video');
      videoElement.srcObject = stream;
      videoElement.play();

      // Listen for the video to be ready
      videoElement.onloadedmetadata = () => {
        const canvas = document.createElement('canvas');
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        const ctx = canvas.getContext('2d');

        // Draw the video frame to the canvas
        ctx.drawImage(videoL, 0, 0, canvas.width, canvas.height);

        // Convert the canvas to a tensor (assuming using Tensor method suitable for your model input)
        const imageTensor = preprocessCanvas(canvas);

        // Run the model
        myOnnxSession.run({ input: imageTensor }).then(output => {
          const outputTensor = output.values().next().value;
          console.log(`Model output tensor: ${outputTensor.data}`);
        }).catch(e => console.error("Failed to run model", e));

        // Optionally, stop the stream after processing
        stream.getTracks().forEach(track => track.stop());
      };
    }).catch(e => console.error("Failed to get user media", e));
  });
}

function preprocessCanvas(canvas) {
  // Preprocess the canvas data to fit your model input requirements
  // This is an example and may need to be adjusted
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return new onnx.Tensor(new Float32Array(imageData.data), 'float32', [1, 3, canvas.height, canvas.width]);
}


const detailPage = document.getElementById('view-detail-btn')


detailPage.addEventListener('click', () => {
  chrome.tabs.create({
    active: true,
    url: '../../html/dashboard.html'
  }, null);
})

scanWebsiteBtn.addEventListener('click', handleScanWebsite)
scanCMPBtn.addEventListener('click', handleScanCmp)

async function loadModel() {
  const model = await ort.InferenceSession.create("../../script/util/model_epoch_64.onnx");
};

async function handleScanWebsite(event) {
  clearMessage();
  let [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
  await initializeIndexedDB();
  await storeTabDataIntoIndexedDB(tab);
  if (tab?.url) {
    try {
      let url = new URL(tab.url);
      console.log(url)
      let message = await getDomainCookies(url.hostname);
      setMessage(message);
    } catch {
      // ignore
    }
  }
}

async function handleScanCmp(event) {
  clearMessage();
  let [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
  if (tab?.url) {
    try {
      let url = new URL(tab.url);
      console.log(url)
      await sendDataToBackend("http://127.0.0.1:5000/cmp", url)
    } catch {
      // ignore
    }
  }
}

function stringToUrl(input) {
  // Start with treating the provided value as a URL
  try {
    return new URL(input);
  } catch {
    // ignore
  }
  // If that fails, try assuming the provided input is an HTTP host
  try {
    return new URL('http://' + input);
  } catch {
    // ignore
  }
  // If that fails ¯\_(ツ)_/¯
  return null;
}


async function getDomainCookies(domain) {
  let cookiesFound = 0;
  try {
    // console.log(getHost(domain))
    const cookies = await chrome.cookies.getAll({ domain });
    console.log(cookies)
    if (cookies.length === 0) {
      return 'No cookies found';
    }
    cookiesFound = cookies.length
    await sendDataToBackend("http://127.0.0.1:5000/", cookies)
  } catch (error) {
    return `Unexpected error: ${error.message}`;
  }

  return `Found ${cookiesFound} cookie(s).`;
}

function getHost(url) {
  return (url.match(/:\/\/(.[^:/]+)/)[1]).replace("www", "")
}

function deleteCookie(cookie) {

  const protocol = cookie.secure ? 'https:' : 'http:';

  const cookieUrl = `${protocol}//${cookie.domain}${cookie.path}`;

  return chrome.cookies.remove({
    url: cookieUrl,
    name: cookie.name,
    storeId: cookie.storeId
  });
}

function setMessage(str) {
  message.textContent = str;
  message.hidden = false;
  detailPage.hidden = false;
}

function clearMessage() {
  message.hidden = true;
  detailPage.hidden = true;
  message.textContent = '';
}

async function sendDataToBackend(url, data) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json' // Set the content type to JSON (adjust if needed)
    },
    body: JSON.stringify(data) // Convert data to JSON string
  });

  if (!response.ok) {
    throw new Error(`Error sending data: ${response.statusText}`);
  }

  // Handle the successful response (e.g., parse the response data)
  const responseData = await response.json();
  await storeDataIntoIndexedDB(responseData.data)
  console.log(responseData);
}

async function initializeIndexedDB() {
  let db;
  const request = indexedDB.open("MyTestDatabase", 1);
  request.onerror = (event) => {
    console.error("Why didn't you allow my web app to use IndexedDB?!");
  };

  request.onsuccess = async (event) => {
    console.log("database initialized")
  };

  // This event is only implemented in recent browsers
  request.onupgradeneeded = (event) => {
    // Save the IDBDatabase interface
    const db = event.target.result;
    // Create an objectStore for this database
    db.createObjectStore("cookies_matches", { autoIncrement: true });
    db.createObjectStore("targeted_tab", { autoIncrement: true });
  };
}

async function storeDataIntoIndexedDB(data) {
  let db;
  const request = indexedDB.open("MyTestDatabase", 1);
  request.onerror = (event) => {
    console.error("Why didn't you allow my web app to use IndexedDB?!");
  };

  request.onsuccess = async (event) => {
    db = event.target.result;

    // Store values in the cookie matches object store.
    const customerObjectStore = db
      .transaction("cookies_matches", "readwrite")
      .objectStore("cookies_matches");

    //clear database
    customerObjectStore.clear();

    data.forEach((cookie) => {
      customerObjectStore.add(cookie);
    });
  };
}

async function storeTabDataIntoIndexedDB(tab) {
  let db;
  const request = indexedDB.open("MyTestDatabase", 1);
  request.onerror = (event) => {
    console.error("Why didn't you allow my web app to use IndexedDB?!");
  };

  request.onsuccess = async (event) => {
    db = event.target.result;

    // Store values in the cookie matches object store.
    const targetTabObjectStore = db
      .transaction("targeted_tab", "readwrite")
      .objectStore("targeted_tab");

    //clear database
    targetTabObjectStore.clear();

    targetTabObjectStore.add(tab);
  };
}

function getObjectStore(store_name, mode) {
  var tx = db.transaction(store_name, mode);
  return tx.objectStore(store_name);
}

function clearObjectStore() {
  var store = getObjectStore(DB_STORE_NAME, 'readwrite');
  var req = store.clear();
  req.onsuccess = function (evt) {
    displayActionSuccess("Store cleared");
    displayPubList(store);
  };
  req.onerror = function (evt) {
    console.error("clearObjectStore:", evt.target.errorCode);
    displayActionFailure(this.error);
  };
}

async function checkViolation(tab) {
  console.log("checking violations");
  await chrome.scripting.executeScript({
    files: ["./checkViolationScript.js"],
    target: { tabId: tab.id },
  })
}

async function getDomainCookieInterval(domain, interval) {
  let cookiesFound = 0;
  const cookieIntervalData = []
  try {
    // console.log(getHost(domain))
    let currentCookies = []
    setInterval(async () => {
      currentCookies = await chrome.cookies.getAll({ domain });
      for (let i = 0; i < currentCookies.length; i++) {
        let isExisted = false
        let variableData = {
          "value": currentCookies[i].value,
          "expiry": currentCookies[i].expiry,
          "session": currentCookies[i].session,
          "http_only": currentCookies[i].http_only,
          "host_only": currentCookies[i].host_only,
          "secure": currentCookies[i].secure,
          "same_site": currentCookies[i].same_site
        }
        cookieIntervalData.forEach((value, index) => {
          if (currentCookies[i]['name'] == value['name']) {
            isExisted = true
            value['variable_data'].append(variableData)
          }
        })
        if (isExisted == false) {
          newCookieData = {
            "cookie_id": {
              "visit_id": 1,
              "name": currentCookies[i].name,
              "domain": currentCookies[i].domain,
              "path": currentCookies[i].path,
              "first_party_domain": "http://" + domain,
              "variable_data": [
                variableData
              ]
            }
          }
        }
      }
    }, interval)
    console.log(currentCookies)
    if (currentCookies.length === 0) {
      return 'No cookies found';
    }
    cookiesFound = cookies.length
    // await sendDataToBackend("http://127.0.0.1:5000/", cookies)
  } catch (error) {
    return `Unexpected error: ${error.message}`;
  }

  return `Found ${cookiesFound} cookie(s).`;
}