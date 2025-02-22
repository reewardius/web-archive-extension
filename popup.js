document.addEventListener("DOMContentLoaded", function () {
  const urlInput = document.getElementById("urlInput");
  const buttons = {
    archiveFull: document.getElementById("insertButton"),
    archiveSimple: document.getElementById("insertButton2"),
    otxSubdomain: document.getElementById("insertButton3"),
    otxDomain: document.getElementById("insertButton4"),
    urlScan: document.getElementById("insertButton5"),
    virusTotal: document.getElementById("insertButton6"),
  };

  // Добавляем кнопку импорта (создаем ее в JS, так как в HTML ее нет)
  const importButton = document.createElement("button");
  importButton.id = "importButton";
  importButton.innerText = "Import Hosts List";
  importButton.style = `
    padding: 6px;
    border: none;
    margin-bottom: 15px;
    background: #f2f2f2;
    border-radius: 10px;
    border-left: 6px solid #8097ff;
  `;
  document.body.appendChild(importButton);

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.id = "fileInput";
  fileInput.accept = ".txt";
  fileInput.style.display = "none";
  document.body.appendChild(fileInput);

  /** Загружаем сохраненный домен или текущий URL */
  function loadSavedDomain() {
    const savedDomain = localStorage.getItem("savedDomain");
    if (savedDomain) {
      urlInput.value = savedDomain;
    } else {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs[0]) urlInput.value = tabs[0].url;
      });
    }
  }

  /** Сохраняем домен в localStorage */
  function saveDomain(domain) {
    if (domain) localStorage.setItem("savedDomain", domain);
  }

  /** Очищаем URL и извлекаем домен */
  function extractDomain(url) {
    return url.trim().replace(/(^https?:\/\/)?(www\.)?/, "").match(/\b[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/)?.[0] || "";
  }

  /** Открытие ссылки в новой вкладке */
  function openTab(url) {
    if (url) chrome.tabs.create({ url });
  }

  /** Генерация URL и открытие */
  function handleInsert(useFullFilters, apiType) {
    const domain = extractDomain(urlInput.value);
    if (!domain) return;

    saveDomain(domain);

    const urls = {
      archive: `https://web.archive.org/cdx/search/cdx?url=*.${domain}&fl=original&collapse=urlkey${useFullFilters ? "&filter=!mimetype:..." : ""}`,
      otx: (page) => `https://otx.alienvault.com/api/v1/indicators/${useFullFilters ? `hostname/${domain}` : `domain/${domain}`}/url_list?limit=500&page=${page}`,
      urlscan: `https://urlscan.io/api/v1/search/?q=domain:${domain}&size=10000`,
      virustotal: `https://www.virustotal.com/vtapi/v2/domain/report?apikey=YOUR_API_KEY&domain=${domain}`,
    };

    if (apiType === "otx") {
      for (let page = 1; page <= 20; page++) openTab(urls.otx(page));
    } else {
      openTab(urls[apiType]);
    }
  }

  /** Импорт доменов из файла */
  function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
      const lines = e.target.result.split("\n").map(line => extractDomain(line)).filter(Boolean);
      const uniqueDomains = [...new Set(lines)]; // Убираем дубликаты

      uniqueDomains.slice(0, 50).forEach(domain => {
        const archiveURL = `https://web.archive.org/cdx/search/cdx?url=*.${domain}&fl=original&collapse=urlkey`;
        openTab(archiveURL);
      });

      if (uniqueDomains.length > 50) {
        alert("Открыто 50 вкладок. Остальные домены пропущены.");
      }
    };

    reader.readAsText(file);
  }

  /** Назначаем события кнопкам */
  buttons.archiveFull.addEventListener("click", () => handleInsert(true, "archive"));
  buttons.archiveSimple.addEventListener("click", () => handleInsert(false, "archive"));
  buttons.otxSubdomain.addEventListener("click", () => handleInsert(true, "otx"));
  buttons.otxDomain.addEventListener("click", () => handleInsert(false, "otx"));
  buttons.urlScan.addEventListener("click", () => handleInsert(false, "urlscan"));
  buttons.virusTotal.addEventListener("click", () => handleInsert(false, "virustotal"));

  // Импорт файлов
  importButton.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", handleFileImport);

  // Сохраняем домен при вводе вручную
  urlInput.addEventListener("input", () => saveDomain(urlInput.value.trim()));

  // Загружаем сохраненные данные
  loadSavedDomain();
});
