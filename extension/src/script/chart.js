// require(['path/to/chartjs/dist/chart.umd.js'], function(Chart){
//     const myChart = new Chart(ctx, {...});
// });
// const chart = new Chart(ctx, {
//     type: 'line',
//     data: data,
//     options: {
//         onClick: (e) => {
//             const canvasPosition = getRelativePosition(e, chart);

//             // Substitute the appropriate scale IDs
//             const dataX = chart.scales.x.getValueForPixel(canvasPosition.x);
//             const dataY = chart.scales.y.getValueForPixel(canvasPosition.y);
//         }
//     }
// });
(async function () {
  // const data = [
  //   { type: "Functional", count: 0 },
  //   { type: "Analytic", count: 2 },
  //   { type: "Marketing", count: 2 },
  //   { type: "Unknown", count: 0 },
  // ];

  let cookieData = await getDataFromIndexDB()
  const data = await getAndProcessData(cookieData)
  // getAndProcessData().then((value)=> console.log(value))
  chart = new Chart(
    document.getElementById('acquisitions'),
    {
      type: 'bar',
      data: {
        labels: data.map(row => row.type),
        datasets: [
          {
            label: 'Cookies type',
            data: data.map(row => row.count)
          }
        ]
      },
      options: {
        responsive: true
      }
    }
  );
})();

async function getAndProcessData(data) {
  const output = [
    { type: "Functional", count: 0 },
    { type: "Analytics", count: 0 },
    { type: "Marketing", count: 0 },
    { type: "Unknown", count: 0 },
  ];
  data.forEach(element => {
    if (element[2] == "Functional") {
      output[0].count += 1
    } else if (element[2] == "Analytics") {
      output[1].count += 1
    } else if (element[2] == "Marketing") {
      output[2].count += 1
    } else {
      output[3].count += 1
    }
  });
  console.log(output)
  return output
}