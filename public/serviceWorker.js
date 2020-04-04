<link rel="manifest" href="/manifest.json"></link>

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/serviceWorker.js")
      .then(reg => {
        console.log("We found your service worker file!", reg);
      });
    });
  }
  
  let transactions = [];
  let myChart;
  
  // FETCH AND SAVE DB
  fetch("/api/transaction")
    .then(response => response.json())
    .then(data => {
      transactions = data;
      populateTotal();
      populateTable();
      populateChart();
    });
  
    // POPULATE TOTAL AMOUNT
  function populateTotal() {
    const total = transactions.reduce((total, t) => {
      return total + parseInt(t.value);
    }, 0);
  
    const totalEl = document.querySelector("#total");
    totalEl.textContent = total;
  }
  
  function populateTable() {
    const tbody = document.querySelector("#tbody");
    tbody.innerHTML = "";
  
    transactions.forEach(transaction => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${transaction.name}</td>
        <td>${transaction.value}</td>
      `;
  
      tbody.appendChild(tr);
    });
  }
  
  // REVERSE COPIED ARRAY; LABELS AND MAPS DATA TO CHART
  function populateChart() {
    const reversed = transactions.slice().reverse();
    let sum = 0;
  
    const labels = reversed.map(t => {
      const date = new Date(t.date);
      return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
    });
  
    const data = reversed.map(t => {
      sum += parseInt(t.value);
      return sum;
    });
  
    if (myChart) {
      myChart.destroy();
    }
  
    const ctx = document.getElementById("my-chart").getContext("2d");
  
    myChart = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Total Over Time",
            fill: true,
            backgroundColor: "#6666ff",
            data
          }
        ]
      }
    });
  }
  
  // ADD FORM WITH VALIDATION
  function sendTransaction(isAdding) {
    const nameEl = document.querySelector("#t-name");
    const amountEl = document.querySelector("#t-amount");
    const errorEl = document.querySelector(".error");
  
    if (nameEl.value === "" || amountEl.value === "") {
      errorEl.textContent = "Missing Information";
      return;
    } else {
      errorEl.textContent = "";
    }
  
    // NEW TRANSACTION
    const transaction = {
      name: nameEl.value,
      value: amountEl.value,
      date: new Date().toISOString()
    };
  
    if (!isAdding) {
      transaction.value *= -1;
    }
  
    transactions.unshift(transaction);
  
    // re-run logic to populate ui with new record
    populateChart();
    populateTable();
    populateTotal();
  
    // also send to server
    fetch("/api/transaction", {
      method: "POST",
      body: JSON.stringify(transaction),
      headers: {
        Accept: "application/json, text/plain, */*",
        "Content-Type": "application/json"
      }
    })
      .then(response => response.json())
      .then(data => {
        if (data.errors) {
          errorEl.textContent = "Missing Information";
        } else {
          // clear form
          nameEl.value = "";
          amountEl.value = "";
        }
      })
      .catch(err => {
        // fetch failed, so save in indexed db
        saveRecord(transaction);
  
        // clear form
        nameEl.value = "";
        amountEl.value = "";
      });
  }
  
  document.querySelector("#add-btn").addEventListener("click", function(event) {
    event.preventDefault();
    sendTransaction(true);
  });
  
  document.querySelector("#sub-btn").addEventListener("click", function(event) {
    event.preventDefault();
    sendTransaction(false);
  });