Module.register("MMM-MPKLodz", {
    defaults: {
        updateInterval: 60000,
        stopId: "572",
        fade: true,
        fadePoint: 0.25,
    },
    
    getTranslations: function () {
        return {
            en: "translations/en.json",
            pl: "translations/pl.json",
            uk: "translations/uk.json" 
        };
    },
    
    getStyles: function() {
        return ["MMM-MPKLodz.css", "font-awesome.css"];
    },

    start: function() {
        this.departures = [];
        this.scheduleUpdate();
    },

    scheduleUpdate: function() {
        this.sendSocketNotification("GET_DEPARTURES", this.config.stopId);
        setInterval(() => {
            this.sendSocketNotification("GET_DEPARTURES", this.config.stopId);
        }, this.config.updateInterval);
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === "DEPARTURES") {
            this.config.stopName = payload.stopName || this.config.stopName;
            this.config.tickerMessage = payload.tickerMessage || this.config.tickerMessage;
            this.departures = payload.departures || [];
            this.updateDom();
        } else {
            console.error("Unknown notification received:", notification);
        }
    },

    getDom: function() {
        let wrapper = document.createElement("div");

        if (this.departures.length === 0) {
            wrapper.appendChild(document.createTextNode(this.translate("LOADING_DEPARTURES")));
            return wrapper;
        } else {
            let stopName = document.createElement("div");
            stopName.className = "stop-name";
            stopName.appendChild(document.createTextNode(this.config.stopName));
            wrapper.appendChild(stopName);
        }

        let table = document.createElement("table");
        table.className = "small MMM-MPKLodz";

        let headerRow = document.createElement("tr");
        headerRow.appendChild(this.createHeaderCell(this.translate("LINE"), 2));
        headerRow.appendChild(this.createHeaderCell(this.translate("DIRECTION")));
        headerRow.appendChild(this.createHeaderCell(this.translate("DEPARTURE")));

        table.appendChild(headerRow);

        this.departures.forEach((departure, index) => {
            let row = document.createElement("tr");

            row.appendChild(this.createIconCell(departure.route));
            row.appendChild(this.createTextCell(departure.route, "route"));
            row.appendChild(this.createTextCell(departure.direction));
            row.appendChild(this.createTimeCell(departure.time, index, this.departures.length));

            this.applyFadeEffect(row, index, this.departures.length);

            table.appendChild(row);
        });

        wrapper.appendChild(table);

        if (this.config.tickerMessage) {
            let messageWrapper = document.createElement("div");
            messageWrapper.className = "message";

            let messageSpan = document.createElement("span");
            messageSpan.appendChild(document.createTextNode(this.config.tickerMessage));

            messageWrapper.appendChild(messageSpan);
            wrapper.appendChild(messageWrapper);
        }

        return wrapper;
    },

    createHeaderCell: function(text, colSpan = 1) {
        let cell = document.createElement("th");
        cell.colSpan = colSpan;
        cell.appendChild(document.createTextNode(text));
        return cell;
    },

    createIconCell: function(route) {
        let cell = document.createElement("td");
        cell.className = "icon";

        const busRoutes = [
            "Z2", "Z3", "Z7", "Z8", "Z13", "Z54", "50A", "50B", "51A", "51B", "52", "53A", "53B", "54A", "54B", "55A",
            "55B", "56", "57", "58A", "58B", "59", "60A", "60B", "60C", "60D", "61", "62", "63", "64A", "64B", "65A", "65B",
            "66", "68", "69A", "69B", "70", "71A", "71B", "72A", "72B", "73", "75A", "75B", "76", "77", "78", "80A", "80B",
            "81", "82A", "82B", "83", "84A", "84B", "85", "86", "87A", "87B", "88A", "88B", "88C", "88D", "89", "90A", "90B",
            "91A", "91B", "91C", "92A", "92B", "93", "94", "96", "97A", "97B", "99", "100", "101", "201", "202", "6.", "F1", "G1",
            "G2", "H", "W"
        ];

        const tramRoutes = [
            "0", "1", "2", "3", "5", "6", "8", "9", "10A", "10B", "11", "12", "14", "15", "16", "18", "41", "43", "45"
        ];

        const nightBusRoutes = [
            "N1A", "N1B", "N2", "N3A", "N3B", "N4A", "N4B", "N5A", "N5B", "N6", "N7A", "N7B", "N8", "N9"
        ];

        if (busRoutes.includes(route)) {
            cell.innerHTML = '<i class="fas fa-bus"></i>'; 
        } else if (tramRoutes.includes(route)) {
            cell.innerHTML = '<i class="fas fa-train-tram"></i>'; 
        } else if (nightBusRoutes.includes(route)) {
            cell.innerHTML = '<i class="fas fa-bus dark-icon"></i>'; 
        } else {
            cell.innerHTML = '<i class="fas fa-question"></i>'; 
        }

        return cell;
    },

    createTextCell: function(text, className = "") {
        let cell = document.createElement("td");
        if (className) {
            cell.className = className;
        }
        cell.appendChild(document.createTextNode(text));
        return cell;
    },

    createTimeCell: function(time, index, total) {
        let cell = document.createElement("td");
        cell.className = "time";
        cell.appendChild(document.createTextNode(time));
        this.applyFadeEffect(cell, index, total);

        return cell;
    },

    applyFadeEffect: function(element, index, total) {
        if (this.config.fade && this.config.fadePoint < 1) {
            let startingPoint = total * this.config.fadePoint;
            let steps = total - startingPoint;

            if (index >= startingPoint) {
                let currentStep = index - startingPoint;
                element.style.opacity = 1 - (1 / steps) * currentStep;
            }
        }
    }
});
