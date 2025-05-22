const NodeHelper = require("node_helper");
const axios = require("axios");
const xml2js = require("xml2js");

module.exports = NodeHelper.create({
  start: function() {
    this.started = true;
    console.log('[\x1b[36mMPKLodz\x1b[0m] by Xioner19 >> Node helper loaded.');
  },

  socketNotificationReceived: function(notification, payload) {
    if (notification === "GET_DEPARTURES") {
      console.log("[\x1b[36mMPKLodz\x1b[0m]: Information fetched " + payload);
      this.getDepartures(payload);
    }
  },

  /**
   * Fetch departures for a given stop ID using API.
   * @param {string} stopId
   */
  getDepartures: async function(stopId) {
    const url = `http://rozklady.lodz.pl/Home/GetTimetableReal?busStopNum=${stopId}`;
    try {
      const response = await axios.get(url, { timeout: 5000 });
      const xml = response.data;

      const result = await xml2js.parseStringPromise(xml, {
        explicitArray: false,
        mergeAttrs: true
      });

      const schedules = result.Schedules || {};
      const stop = schedules.Stop || {};
      const stopName = stop.name || "";
      const tickerMessage = stop.ds || "";

      // Determine day type: 1–5 = weekday (11), 6 = Saturday (12), 0 = Sunday (13)
      const dayTypeMap = { 1: "11", 2: "11", 3: "11", 4: "11", 5: "11", 6: "12", 0: "13" };
      const today = new Date().getDay();
      const wantedType = dayTypeMap[today];

      let day = schedules.Stop.Day;
      if (Array.isArray(day)) {
        day = day.find(d => d.type === wantedType) || day[0];
      }

      const departures = [];
      if (day && day.R) {
        const routes = Array.isArray(day.R) ? day.R : [day.R];
        routes.forEach(r => {
          const route = r.nr ? r.nr.trim() : "";
          const direction = r.dir || "";
          const stops = Array.isArray(r.S) ? r.S : [r.S];
          const features = (r.vuw || "").trim();
          const type = (r.vt === "T" ? "tram" : "bus");
        
          stops.forEach(s => {
            const th = s.th || "";
            const tm = s.tm || "";
            const minutes = th === "" ? parseInt(tm) : ((parseInt(th) * 60) + parseInt(tm));
        
            departures.push({
              route,
              direction,
              time: s.t || "",
              features,
              minutes,
              type
            });
          });
        });
      }

      this.sendSocketNotification("DEPARTURES", {
        stopName,
        tickerMessage,
        departures
      });
    } catch (error) {
      console.error("[\x1b[36mMPKLodz\x1b[0m]: Error fetching departures:", error);
      this.sendSocketNotification("DEPARTURES_ERROR", error.message);
    }
  }
});