var ctx = document.getElementById('sir-chart').getContext('2d');
var sirChart = new Chart(ctx, {
    type: 'line',
    data: data = {
        labels: [],
        datasets: [{
            label: 'Susceptible',
            backgroundColor: '#d4db0a',
            borderWidth: 0,
            yAxisID: 'regular',
            showLine: false,
            data: []
        }, {
            label: 'Infectious',
            backgroundColor: '#b80c09',
            borderWidth: 0,
            yAxisID: 'regular',
            data: []
        }, {
            label: 'Recovered',
            backgroundColor: '#09b734',
            borderWidth: 0,
            yAxisID: 'reverse',
            data: []
        }]
    },
    options: {
        animation: {
            easing: 'linear'
        },
        tooltips: {
            mode: 'index',
            intersect: false,
        },
        hover: {
            mode: 'nearest',
            intersect: true
        },
        elements: {
            point: {
                radius: 0
            }
        },
        scales: {
            yAxes: [{
                id: 'regular',
                type: 'linear',
                position: 'left',
                gridLines: {
                    display: false
                }
            },{
                id: 'reverse',
                type: 'linear',
                position: 'right',
                ticks: {
                    display: false,
                    reverse: true,
                    min: 0
                },
                gridLines: {
                    display: false
                }
            }],
            xAxes: [{
                gridLines: {
                    display: false
                }
            }]
        }
    },
    plugins: [{
        beforeDraw: function(chartInstance, easing) {
        var ctx = chartInstance.chart.ctx;
        ctx.fillStyle = '#d4db0a';

        var chartArea = chartInstance.chartArea;
        ctx.fillRect(chartArea.left, chartArea.top, chartArea.right - chartArea.left, chartArea.bottom - chartArea.top);
    }
    }]
});

var ctx = document.getElementById('city-chart').getContext('2d');
var cityChart = new Chart(ctx, {
    type: 'scatter',
    data: {
        datasets: [{
            data: [],
            pointBackgroundColor: []
        }]
    },
    options: {
        animation: {
            easing: 'linear'
        },
        tooltips: {
            enabled: false
        },
        legend: {
            display: false
        },
        scales: {
            yAxes: [{
                ticks: {
                    display: false
                },
                gridLines: {
                    display: false
                }
            },{
                id: 'right',
                position: 'right',
                ticks: {
                    display: false
                },
                gridLines: {
                    display: false
                }
            }],
            xAxes: [{
                ticks: {
                    display: false
                },
                gridLines: {
                    display: false
                }
            },{
                id: 'top',
                position: 'top',
                ticks: {
                    display: false
                },
                gridLines: {
                    display: false
                }
            }]
        }
    }
});

var population = [];
var recoverAfter;
var timeInterval;
var citySize;
var dailyMovement;
var infectionRadius;
var infectionProbability;
var initialCases;
var day = 1;
var timer;

document.getElementById("start").addEventListener("click", function(){
    this.disabled = true;
    sirChart.data.labels = [];
    sirChart.data.datasets[0].data = [];
    sirChart.data.datasets[1].data = [];
    sirChart.data.datasets[2].data = [];
    cityChart.data.datasets[0].data = [];
    cityChart.data.datasets[0].pointBackgroundColor = [];
    population = [];
    day = 1;
    
    recoverAfter = parseInt(document.getElementById("recover-after").value, 10);
    timeInterval = parseInt(document.getElementById("time-interval").value, 10);
    citySize = parseInt(document.getElementById("city-size").value, 10);
    dailyMovement = parseInt(document.getElementById("daily-movement").value, 10);
    infectionRadius = parseInt(document.getElementById("infection-radius").value, 10);
    infectionProbability = parseInt(document.getElementById("infection-probability").value, 10);
    initialCases = parseInt(document.getElementById("initial-cases").value, 10);

    cityChart.options.scales.xAxes[0].ticks.max = citySize;
    cityChart.options.scales.yAxes[0].ticks.max = citySize;

    cityChart.options.animation.duration = timeInterval;
    sirChart.options.animation.duration = timeInterval;

    for (var i = 0; i < parseInt(document.getElementById("population").value, 10); ++i) {
        if (i < initialCases) {
            population.push({"compartment": 1, "infectedDays": 0, "x": Math.floor(Math.random() * citySize), "y": Math.floor(Math.random() * citySize)});
            cityChart.data.datasets[0].data.push({"x": population[i].x, "y": population[i].y});
            cityChart.data.datasets[0].pointBackgroundColor.push('#b80c09');
        } else {
            population.push({"compartment": 0, "x": Math.floor(Math.random() * citySize), "y": Math.floor(Math.random() * citySize)});
            cityChart.data.datasets[0].data.push({"x": population[i].x, "y": population[i].y});
            cityChart.data.datasets[0].pointBackgroundColor.push('#d4db0a');
        }
        
        
    }

    for (var i = 0; i < initialCases; ++i) {
        population[i].compartment = 1;
    }

    cityChart.update();

    sirChart.options.scales.yAxes[1].ticks.max = population.length;

    sirChart.data.labels.push(0);
    sirChart.data.datasets[0].data.push(population.length - initialCases);
    sirChart.data.datasets[1].data.push(initialCases);
    sirChart.data.datasets[2].data.push(0);
    sirChart.update();

    document.getElementById("susceptible-count").innerHTML = population.length - initialCases;
    document.getElementById("infectious-count").innerHTML = initialCases;
    timer = setInterval(progress, timeInterval);
})

document.getElementById("stop").addEventListener("click", function(){
    document.getElementById("start").disabled = false;
    clearInterval(timer);
});

function progress(){
    var toInfect = [];
    var toRecover = [];
    population.forEach(function(person, index){
        if (person.compartment == 0) {
            // Filters the rest of the population, return an array of 
            // arrays containing the index and distance of each infected
            // person
            var otherPeople = population.reduce(function(filtered, otherPerson, otherIndex){
                if (otherPerson.compartment == 1 && index != otherIndex){
                    filtered.push([otherIndex, Math.hypot(Math.abs(person.x - otherPerson.x), Math.abs(person.y - otherPerson.y))]);
                }
                return filtered;
            }, []);

            otherPeople.sort(function(a, b){return a[1] - b[1]});
            if (otherPeople[0][1] <= infectionRadius) {
                if (Math.floor(Math.random() * 100) < infectionProbability) {
                    toInfect.push(index);
                }
            }
        } else if (person.compartment == 1) {
            if (person.infectedDays >= recoverAfter) {
                toRecover.push(index);
            } else {
                population[index].infectedDays += 1;
            }
        }

        do {
            var newX = person.x + (Math.floor(Math.random() * (dailyMovement * 2 + 1))) - dailyMovement
            var newY = person.y + (Math.floor(Math.random() * (dailyMovement * 2 + 1))) - dailyMovement
        } while (newX < 0 || newX >= citySize || newY < 0 || newY >= citySize)
        population[index].x = newX;
        population[index].y = newY;
        cityChart.data.datasets[0].data[index] = {"x": newX, "y": newY};
        if (toInfect.includes(index)) {                 
            cityChart.data.datasets[0].pointBackgroundColor[index] = '#b80c09';
        } else if (toRecover.includes(index)) {
            cityChart.data.datasets[0].pointBackgroundColor[index] = '#09b734';
        }
    });
    cityChart.update();

    for (var i = 0; i < toInfect.length; i++) {
        population[toInfect[i]].compartment = 1;
        population[toInfect[i]].infectedDays = 0;
    }
    for (var i = 0; i < toRecover.length; i++) {
        population[toRecover[i]].compartment = 2;
    }
    sirChart.data.labels.push(day);
    day += 1;
    var count = {0: 0, 1: 0, 2: 0};
    population.forEach(function(person){
        count[person["compartment"]] = (count[person["compartment"]]) + 1
    });
    sirChart.data.datasets[0].data.push(count[0]);
    sirChart.data.datasets[1].data.push(count[1]);
    sirChart.data.datasets[2].data.push(count[2]);
    sirChart.update();

    document.getElementById("susceptible-count").innerHTML = count[0];
    document.getElementById("infectious-count").innerHTML = count[1];
    document.getElementById("recovered-count").innerHTML = count[2];

    if (count[1] == 0) {
        document.getElementById("start").disabled = false;
        clearInterval(timer);
    }
}