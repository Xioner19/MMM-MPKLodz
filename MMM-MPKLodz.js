Module.register("MMM-MPKLodz", {
  defaults: {
    stopId: "572",
    fade: true,
    fadePoint: 0.25,
    maxEntries: 10,
    redThreshold: 2,         
    showAmenities: true     
  },
  
  getTranslations: function () {
    return {
        de: "translations/de.json",
        en: "translations/en.json",
        pl: "translations/pl.json",
        uk: "translations/uk.json" 
    };
},
  start() {
    this.departures = [];
    this.stopName = "";
    this.tickerMessage = "";
    this.scheduleUpdate();
  },

  getStyles() {
    return ["MMM-MPKLodz.css", "font-awesome.css"];
  },

  scheduleUpdate() {
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.fetchDepartures();
    this.timer = setInterval(() => this.fetchDepartures(), 60000);
  }, 
  
  fetchDepartures() {
    this.sendSocketNotification("GET_DEPARTURES", this.config.stopId);
  },

  socketNotificationReceived(notification, payload) {
    if (notification === "DEPARTURES") {
      this.stopName = payload.stopName;
      this.tickerMessage = payload.tickerMessage;
      this.departures = payload.departures.slice(0, this.config.maxEntries);
      this.updateDom();
    } else if (notification === "DEPARTURES_ERROR") {
      this.stopName = "";
      this.departures = [];
      this.tickerMessage = `Error: ${payload}`;
      this.updateDom();
    }
  },

  getDom() {
    const wrapper = document.createElement("div");
    wrapper.className = "wrapper";

    const title = document.createElement("div");
    title.className = "stop-name";
    title.innerText = this.stopName || "—";
    wrapper.appendChild(title);

    const table = document.createElement("table");
    table.className = "MMM-MPKLodz";

    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    const iconAndLineHeader = document.createElement("th");
    iconAndLineHeader.colSpan = 2;
    iconAndLineHeader.innerText = this.translate("LINE");
    headerRow.appendChild(iconAndLineHeader);
    
    [
      this.translate("DESTINATION"),
      this.translate("DEPARTURE")
    ].forEach(label => {
      const th = document.createElement("th");
      th.innerText = label;
      headerRow.appendChild(th);
    });
    
    if (this.config.showAmenities) {
      const th = document.createElement("th");
      th.innerText = this.translate("AMENITIES");
      headerRow.appendChild(th);
    }
    
    

    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    this.departures.forEach((dep, index) => {
      const row = document.createElement("tr");

      row.appendChild(this.createIconCell(dep.route, dep.type));

      const routeCell = document.createElement("td");
      routeCell.className = "route";
      routeCell.innerText = dep.route;
      row.appendChild(routeCell);

      const dirCell = document.createElement("td");
      dirCell.innerText = dep.direction;
      row.appendChild(dirCell);

      const timeCell = document.createElement("td");
      timeCell.className = "time";
      timeCell.innerHTML = this.formatTime(dep.time, dep.minutes);
      row.appendChild(timeCell);

      if (this.config.showAmenities) {
        const featCell = document.createElement("td");
        featCell.className = "vehicle-notes";
        featCell.innerHTML = this.getFeatureIcons(dep.features || "");
        row.appendChild(featCell);
      }      

      this.applyFadeEffect(row, index, this.departures.length);
      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    wrapper.appendChild(table);

    if (this.tickerMessage) {
      const messageWrapper = document.createElement("div");
      messageWrapper.className = "message";
      const messageSpan = document.createElement("span");
      messageSpan.innerText = this.tickerMessage;
      messageWrapper.appendChild(messageSpan);
      wrapper.appendChild(messageWrapper);
    }

    return wrapper;
  },

  createIconCell(route, type) {
    const cell = document.createElement("td");
    cell.className = "icon";
  
    if (type === "bus") {
      cell.innerHTML = '<i class="fas fa-bus"></i>';
    } else if (type === "tram") {
      cell.innerHTML = '<i class="fas fa-train-tram"></i>';
    } else {
      cell.innerHTML = '<i class="fas fa-question"></i>';
    }
  
    return cell;
  },

  formatTime(time, minutes) {
    if (minutes <= this.config.redThreshold) {
      return `<span class='red_font blink'>${time}</span>`;
    } else {
      return `<span>${time}</span>`;
    }
  },

  getFeatureIcons(features) {
    const icons = {
      "B": "fa-ticket",
      "K": "fa-snowflake",
      "N": "fa-wheelchair",  
      "Z": "fa-credit-card",
      "R": "fa-bicycle"
    };
    return features.split("")
      .map(f => icons[f] ? `<i class="fas ${icons[f]}"></i>` : "")
      .join(" ");
  },

  applyFadeEffect(element, index, total) {
    if (this.config.fade && this.config.fadePoint < 1) {
      const start = total * this.config.fadePoint;
      const steps = total - start;
      if (index >= start) {
        const step = index - start;
        element.style.opacity = 1 - (1 / steps) * step;
      }
    }
  }
});