const picked = document.getElementById("picked");
const month = document.getElementById("month");
const calendar = document.getElementById("calendar");
const tooltip = document.getElementById('tooltiptext');
var contentDiv = document.getElementById("cal-div");

const today = new Date();
const minDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
minDate.setDate(today.getDate() - 91);       
const maxDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
maxDate.setDate(today.getDate() - 1);
let selectedDate = null;
const DATE = new Date();
let currentMonth = DATE.getMonth();
let year = DATE.getFullYear();

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// https://github.com/NA-Shaan
picked.innerHTML = null;

function createCalendar() {
  month.innerHTML = `${MONTHS[currentMonth]}, ${year}`;

  const dayOne = new Date(year, currentMonth).getDay();
  const monthDays = 32 - new Date(year, currentMonth, 32).getDate();

  date = 1;
  for (let i = 0; i < 6; i++) {
    let row = document.createElement("tr");
    for (let j = 0; j < 7; j++) {
      let column = document.createElement("td");
      if (date > monthDays) break;
      else if (i === 0 && j < dayOne) {
        let columnText = document.createTextNode("");
        column.appendChild(columnText);
        row.appendChild(column);
      } else {
        let columnText = document.createTextNode(date);
        column.appendChild(columnText);

        const currentDate = new Date(year, currentMonth, date);
        if (currentDate < minDate || currentDate > maxDate) {
          column.classList.add("notinRange");
        }

        if (
          date === DATE.getDate() &&
          currentMonth === DATE.getMonth() &&
          year === DATE.getFullYear()
        ) {
          column.classList.add("today");
        }

        column.onclick = () => {
          picked.value = `${year}-${(currentMonth + 1).toString().padStart(2, "0")}-${(column.textContent).toString().padStart(2, "0")}`;

          if (!mobileView()) {
            const Selected = document.querySelector(".selected");
            if (Selected) {
              Selected.classList.remove("selected");
            }
            column.classList.add("selected");
          }
        };

        row.appendChild(column);

        date++;
      }
      if (column.textContent == "") {
        column.classList.add("emptycell");
      }
    }
    calendar.appendChild(row);
  }
}

createCalendar();

function nextMonth() {
  currentMonth = currentMonth + 1;
  calendar.classList.add("scroll-left");
  calendar.innerHTML = "";

  if (currentMonth > 11) {
    year = year + 1;
    currentMonth = 0;
  }
  createCalendar();

  setTimeout(function () {
    calendar.classList.remove("scroll-left");
  }, 500);
  return currentMonth;
}

function prevMonth() {
  currentMonth = currentMonth - 1;
  calendar.classList.add("scroll-right");
  calendar.innerHTML = "";

  if (currentMonth < 0) {
    year = year - 1;
    currentMonth = 11;
  }
  createCalendar();
  setTimeout(function () {
    calendar.classList.remove("scroll-right");
  }, 500);
  return currentMonth;
}

function toggleHiddenDiv() {
  if (contentDiv.style.height === "" || contentDiv.style.height === "0px") {
    contentDiv.style.height = contentDiv.scrollHeight + "px";
  }
}

function showElem(totalFLight, totalDestinations, Specialresult, deparr) {
  contentDiv.style.height = "0px";
  if (!deparr) {
    let HTMLtotalflight = document.getElementById("total-flightsdep");
    HTMLtotalflight.innerHTML = totalFLight;
    let HTMLtotaldests = document.getElementById("totaldest");
    HTMLtotaldests.innerHTML = totalDestinations;
    let HTMLspecial = document.getElementById("depspecial");
    HTMLspecial.innerHTML = Specialresult;
  } else {
    let HTMLtotalflight = document.getElementById("total-flightsarr");
    HTMLtotalflight.innerHTML = totalFLight;
    let HTMLtotalorgs = document.getElementById("totalorg");
    HTMLtotalorgs.innerHTML = totalDestinations;
    let HTMLspecial = document.getElementById("arrspecial");
    HTMLspecial.innerHTML = Specialresult;
  }
}

function loadDoc(arrival) {
  var xhr = new XMLHttpRequest();
  if (xhr.readyState !== XMLHttpRequest.UNSENT) {
    xhr.abort();
    loadDoc();
  } else {
    xhr.open(
      "GET",
      "flight.php?date=" +
        picked.textContent +
        "&lang=en&cargo=false&arrival=" + arrival,
      true
    );
    xhr.setRequestHeader("Content-type", "application/json");
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          var response = JSON.parse(xhr.responseText);
          if (response.length > 0) {
            if (response[0].date != picked.textContent) {
              var flightData = response[1];
            } else {
              var flightData = response[0];
            }
            let HTMLpickedDate = document.getElementById("picked-date");
            HTMLpickedDate.innerHTML = picked.textContent;
            var totalFLight = flightData.list.length;
            if (!arrival) {
              var totalDestinations = getTotalUniqueDestinations(flightData.list, "destination");
              var Specialresult = SpecialCases(flightData.list, false);
              histogramData(flightData.list, false);
              TOPten(flightData.list, "destination", false);
              showElem(totalFLight, totalDestinations, Specialresult, false);
            } else {
              var totalDestinations = getTotalUniqueDestinations(flightData.list, "origin");
              var Specialresult = SpecialCases(flightData.list, true);
              histogramData(flightData.list, true);
              TOPten(flightData.list, "origin", true);
              showElem(totalFLight, totalDestinations, Specialresult, true);
            }
          } else {
            console.log("No data available in the response.");
          }
        } else {
          console.log("Request failed with status:", xhr.status);
        }
      }
    };
    xhr.send();
  }
}

function getTotalUniqueDestinations(DestOrgData, destorg) {
  let DOsSet = new Set();

  DestOrgData.forEach(obj => {
    let destsORorgs = obj[destorg];
    DOsSet.add(destsORorgs[0]);
  });
  let uniqueDestinationsCount = DOsSet.size;

  return uniqueDestinationsCount;
}

function SpecialCases(JSONData, destorg) {
  let counters = {};

  JSONData.forEach(obj => {
    const status = obj.status;
    if (!destorg) {
      if (!status.startsWith("Dep")) {
        incrementCounter(counters, status);
      }
    } else {
      if (!status.startsWith("At gate")) {
        incrementCounter(counters, status);
      }
    }
  });
  let special = "";
  for (let key in counters) {
    special += key + ": " + counters[key] + ", ";
  }
  special = special.slice(0, -2);
  return special;
}

function incrementCounter(counters, status) {
  if (counters.hasOwnProperty(status)) {
    counters[status] += 1;
  } else {
    counters[status] = 1;
  }
}

function histogramData(JSONData, destorg) {
  let prevnext = prevnextDate();
  let prevDate = prevnext[0];
  let nextDate = prevnext[1];
  let counters = {};
  JSONData.forEach(obj => {
    const status = obj.status;
    if (!destorg) {
      if (status.startsWith("Dep") && !status.endsWith(nextDate)) {
        const hour = obj.status.split(" ")[1].split(":")[0];
        incrementCounter(counters, hour);
      }
      else if (status.endsWith(nextDate)) {
        incrementCounter(counters, "next");
      }
    } else {
      if (status.startsWith("At gate") && (!status.endsWith(prevDate) && !status.endsWith(nextDate))) {
        const hour = obj.status.split(" ")[2].split(":")[0];
        incrementCounter(counters, hour);
      }
      else if (status.endsWith(prevDate)) {
        incrementCounter(counters, "prev");
      }
      else if (status.endsWith(nextDate)) {
        incrementCounter(counters, "next");
      }
    }
  });

  var result = [];
  if ("prev" in counters) {
    result.push(["prev", counters["prev"]]);
  } else {
    if (destorg) {
      result.push(["prev", 0]);
    }
  }
  for (var i = 0; i < 24; i++) {
    var key = i.toString().padStart(2, "0");
    if (key in counters) {
      result.push([key, counters[key]]);
    } else {
      result.push([key, 0]);
    }
  }
  if ("next" in counters) {
    result.push(["next", counters["next"]]);
  } else {
    result.push(["next", 0]);
  }

  let HTMLtable = "";
    if (!destorg) {
      HTMLtable = document.getElementById("histogramdep");
    } else {
      HTMLtable = document.getElementById("histogramarr");
    }
    let out = "";
    result.forEach(elem => {
      out += `
        <table>
          <tr>
            <td class="right">${elem[0]}</td>
            <td class="bar"><div class="bar-inner"></div></td>
            <td class="cell-padding">${elem[1] > 0 ? elem[1] : ""}</td>        
          </tr>
        </table>
      `
    });
    HTMLtable.innerHTML = out;
    const bars = document.querySelectorAll('.bar-inner');
    let multiplier = 0;
    if (mobileView()) {
      multiplier = 7;
    } else {
      multiplier = 12;
    }
    bars.forEach(bar => {
    const barWidth = bar.parentNode.nextElementSibling.textContent * multiplier;
    bar.style.width = '0';
    setTimeout(() => {
      bar.style.width = `${barWidth}px`;
    }, 200);
});
}

function prevnextDate() {
  let parts = picked.textContent.split("-");
  let curryear = parts[0];
  let currmonth = parts[1];
  let currday = parseInt(parts[2]);
  let prev = currday - 1;
  let next = currday + 1;
  let prevDate = "(" + prev.toString().padStart(2, "0") + "/" + currmonth + "/" + curryear + ")";
  let nextDate = "(" + next.toString().padStart(2, "0") + "/" + currmonth + "/" + curryear + ")";
  return [prevDate, nextDate];
}

function TOPten(JSONData, destorg, arrival) {
  let counters = {};
  JSONData.forEach(obj => {
    const destsORorgs = obj[destorg][0];
    incrementCounter(counters, destsORorgs);
  });
  const entries = Object.entries(counters);
  entries.sort((a, b) => b[1] - a[1]);
  const topTen = entries.slice(0, 10);

  fetch('iata.json')
  .then(response => response.json())
  .then(data => {
    const result = topTen.map(([iataCode, count]) => {
      const matchingObject = binarySearch(data, iataCode);
      const final = matchingObject.name + ", " + matchingObject.municipality;
      return [iataCode, count, final];
    });
    let tablebody = "";
    if (!arrival) {
      tablebody = document.getElementById("toptendatadep");
    } else {
      tablebody = document.getElementById("toptendataarr");
    }
    let out = "";
    result.forEach(elem => {
      out += `
        <tr>
          <td class="left">${elem[0]}</td>
          <td class="left">${elem[2]}</td>
          <td>${elem[1]}</td>        
        </tr>
      `
    });
    tablebody.innerHTML = out;
  })
  .catch(error => {
    console.error(error);
  });
}

function binarySearch(jsonData, target) {
  let start = 0;
  let end = jsonData.length - 1;
  let result = null;
  while (start <= end) {
    const mid = Math.floor((start + end) / 2);
    const midIataCode = jsonData[mid].iata_code;
    if (midIataCode === target) {
      result = jsonData[mid];
      end = mid - 1;
    } else if (midIataCode < target) {
      start = mid + 1;
    } else {
      end = mid - 1;
    }
  }
  return result;
}

function start() {
  loadDoc(false);
  loadDoc(true);
}

const mainSection = document.querySelector('.main-section');
const container = document.querySelector('.container');
const searchBtn = document.getElementById('search-but');
let pickedtap = false;

picked.addEventListener('click', () => {
  toggleHiddenDiv();
  mainSection.classList.remove('visible');
  tooltip.innerHTML = `Please select any date between ${formattedMinDate} and ${formattedMaxDate}`;
  if (mobileView()) {
    tooltip.style.top = '-100%';
    pickedtap = true;
    showtooltip();
  }
});

const formattedMinDate = `${minDate.getFullYear()}-${(minDate.getMonth() + 1).toString().padStart(2, "0")}-${(minDate.getDate()).toString().padStart(2, "0")}`;
const formattedMaxDate = `${maxDate.getFullYear()}-${(maxDate.getMonth() + 1).toString().padStart(2, "0")}-${(maxDate.getDate()).toString().padStart(2, "0")}`;

let tooltipactive = false;
let warningactive = false;

function showtooltip(tap) {
  if (tooltipactive) {
    hidetooltip();
  } else if (warningactive) {
    hidewarning();
  }
  tooltip.style.transform = 'translateX(15px)';
  tooltip.style.visibility = 'visible';
  tooltip.style.opacity = '1';
  tooltipactive = true;
  if (!pickedtap) {
    shakecal();
  }
  pickedtap = false;
}

function hidetooltip() {
  tooltip.style.transform = 'translateX(5px)';
  tooltip.style.visibility = 'hidden';
  tooltip.style.opacity = '0';
  tooltipactive = false;
}

function showwarning() {
  if (!warningactive) {
    if (tooltipactive) {
      hidetooltip();
    }
    warning.classList.add('showAlert', 'show');
    shakecal();
    warningactive = true;
  } else {
    shakecal();
  }
}

function hidewarning() {
  setTimeout(function() {
    warning.classList.add('hide');
    setTimeout(function() {
      warning.classList.remove('showAlert', 'show', 'hide');
    }, 1000);
  }, 1000);
  warningactive = false;
}

function shakecal() {
  contentDiv.classList.add('shake');
  contentDiv.offsetHeight;
  setTimeout(function() {
    contentDiv.classList.remove('shake');
  }, 500);
}

if (!mobileView()) {
  picked.addEventListener('mouseenter', () => {
    tooltip.innerHTML = `Please select any date between ${formattedMinDate} and ${formattedMaxDate}`;
    tooltip.style.transform = 'translateX(15px)';
    tooltip.style.visibility = 'visible';
    tooltip.style.opacity = '1';
  });
  
  picked.addEventListener('mouseleave', () => {
    tooltip.innerHTML = `Please select any date between ${formattedMinDate} and ${formattedMaxDate}`;
    tooltip.style.transform = 'translateX(5px)';
    tooltip.style.visibility = 'hidden';
    tooltip.style.opacity = '0';
  });
}

const warning = document.getElementById('warning');
warning.innerHTML = "Selected date is out of range";
searchBtn.addEventListener('click', () => {
    let pattern = /^(19|20)\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
    picked.innerHTML = picked.value;
    if (picked.textContent == null || picked.textContent == "") {
      if (mobileView()) {
        tooltip.style.top = '-100%';
      }
      tooltip.innerHTML = `Please select any date between ${formattedMinDate} and ${formattedMaxDate}`;
      showtooltip();
    } else if (!pattern.test(picked.textContent)) {
        tooltip.innerHTML = "Please write the date in the 'YYYY-MM-DD' format with valid month and day";
        if (mobileView()) {
          tooltip.style.top = '-140%';
        }
        showtooltip();
    } else {
      let selecyear = parseInt(picked.textContent.slice(0, 4));
      let selecmonth = (parseInt(picked.textContent.slice(5, 7)) - 1);
      let selecday = parseInt(picked.textContent.slice(8, 10));
      selectedDate = new Date(selecyear, selecmonth, selecday);
      if (selectedDate >= minDate && selectedDate <= maxDate) {
        if (tooltipactive) {
          hidetooltip();
        } else if (warningactive) {
          hidewarning();
        }
        start();
        setTimeout(function () {
          mainSection.classList.add('visible');
          picked.value = "";
          picked.innerHTML = picked.value;
        }, 500);
      } else {
        showwarning();
      }
    }
});

const prevBtn = document.getElementById('prev-month');
prevBtn.addEventListener('click', () => {
  prevMonth();
});

const nextBtn = document.getElementById('next-month');
nextBtn.addEventListener('click', () => {
  nextMonth()
});

function mobileView() {
  if (window.matchMedia('(min-width: 350px)' && '(max-width: 500px)').matches) {
    return true;
  } else {
    return false;
  }
}
