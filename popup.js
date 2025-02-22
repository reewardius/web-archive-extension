document.addEventListener("DOMContentLoaded", function () {
  const urlInput = document.getElementById("urlInput");
  const insertButton = document.getElementById("insertButton");
  const insertButton2 = document.getElementById("insertButton2");
  const insertButton3 = document.getElementById("insertButton3");
  const insertButton4 = document.getElementById("insertButton4");
  const insertButton5 = document.getElementById("insertButton5"); // URLScan button
  const insertButton6 = document.getElementById("insertButton6"); // VirusTotal button

  // Загружаем сохраненный домен, если он есть
  if (localStorage.getItem("savedDomain")) {
    urlInput.value = localStorage.getItem("savedDomain");
  } else {
    // Если сохраненного домена нет, берем текущий URL активной вкладки
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const currentTab = tabs[0];
      if (currentTab) {
        urlInput.value = currentTab.url;
      }
    });
  }

  // Сохраняем домен при вводе вручную
  urlInput.addEventListener("input", function () {
    localStorage.setItem("savedDomain", urlInput.value.trim());
  });

  function handleInsert(useFullFilters, apiType) {
    let urlToInsert = urlInput.value.trim();

    // Убираем "www." из URL
    urlToInsert = urlToInsert.replace(/(^https?:\/\/)?(www\.)?/, "");

    if (urlToInsert) {
      const match = urlToInsert.match(/\b[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/);
      if (match) {
        const subdomain = match[0];

        // Сохраняем введенный домен в локальное хранилище
        localStorage.setItem("savedDomain", subdomain);

        if (apiType === "otx") {
          const endpoint = useFullFilters
            ? `hostname/${subdomain}/url_list`
            : `domain/${subdomain}/url_list`;
          for (let page = 1; page <= 20; page++) {
            const newURL = `https://otx.alienvault.com/api/v1/indicators/${endpoint}?limit=500&page=${page}`;
            chrome.tabs.create({ url: newURL });
          }
        } else if (apiType === "archive") {
          let newURL = `https://web.archive.org/cdx/search/cdx?url=*.${subdomain}&fl=original&collapse=urlkey`;
          if (useFullFilters) {
            newURL += `&filter=!mimetype:warc/revisit|text/css|image/jpeg|image/jpg|image/png|image/svg.xml|image/gif|image/tiff|image/webp|image/bmp|image/vnd|image/x-icon|font/ttf|font/woff|font/woff2|font/x-woff2|font/x-woff|font/otf|audio/mpeg|audio/wav|audio/webm|audio/aac|audio/ogg|audio/wav|audio/webm|video/mp4|video/mpeg|video/webm|video/ogg|video/mp2t|video/webm|video/x-msvideo|video/x-flv|application/font-woff|application/font-woff2|application/x-font-woff|application/x-font-woff2|application/vnd.ms-fontobject|application/font-sfnt|application/vnd.android.package-archive|binary/octet-stream|application/octet-stream|application/pdf|application/x-font-ttf|application/x-font-otf|video/webm|video/3gpp|application/font-ttf|audio/mp3|audio/x-wav|image/pjpeg|audio/basic|application/font-otf`;
          }
          chrome.tabs.create({ url: newURL });
        } else if (apiType === "urlscan") {
          const newURL = `https://urlscan.io/api/v1/search/?q=domain:${subdomain}&size=10000`;
          chrome.tabs.create({ url: newURL });
        } else if (apiType === "virustotal") {
          const apiKey =
            "93e0745ee0d7113aba3e73847ff4de98c247b52531ee65c6aa672087bb350601";
          const newURL = `https://www.virustotal.com/vtapi/v2/domain/report?apikey=${apiKey}&domain=${subdomain}`;
          chrome.tabs.create({ url: newURL });
        }
      }
    }
  }

  // Event listeners for Archive URLs
  insertButton.addEventListener("click", () => handleInsert(true, "archive"));
  insertButton2.addEventListener("click", () => handleInsert(false, "archive"));

  // Event listeners for OTX URLs
  insertButton3.addEventListener("click", () => handleInsert(true, "otx"));
  insertButton4.addEventListener("click", () => handleInsert(false, "otx"));

  // Event listener for URLScan
  insertButton5.addEventListener("click", () => handleInsert(false, "urlscan"));

  // Event listener for VirusTotal
  insertButton6.addEventListener("click", () => handleInsert(false, "virustotal"));
});
