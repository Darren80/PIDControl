import Chart from 'chart.js/auto';
import PID from './PID.js';
import Car from './car.js';


// Create a new instance of the PID controller and the Car
let speedController; 
const car = new Car();

// The PID controller will be tuned differently depending on the number of passengers in the car
// The more passengers, the more aggressive the PID controller will be.
// Gain Scheduling is used to achieve this. (Gain Schedule)
if (car.numPassengers <= 4) {
    speedController = new PID(0.8, 0.0005, 1.2);
} else if (car.numPassengers > 4) {
    speedController = new PID(1, 0.0005, 1.2);
}

// Watchdog variables
let lastUpdate = new Date().getTime(); 
let watchdogTimeout = 5000; 
// In real world the watchdog would be a separate thread that monitors the PID output.
function watchDog() {
    setInterval(() => {
        let now = new Date().getTime();
        if (now - lastUpdate > watchdogTimeout) {
            console.error("PID has stopped outputting values");
            alert("PID has stopped outputting values");
            // Take necessary action here... (Turn off cruise control system, alert user, etc.)
        }
    }, 1000); // Check every second
}


let dampData = [];
let damp = 0.00;

// Maximum acceleration and deceleration allowed for the car.
let maxAccelerationMphPerSec = 2.5 * 2.23694; // 2.5 m/s^2 converted to mph/s
let maxDecelerationMphPerSec = 3.5 * 2.23694; // 2.5 m/s^2 converted to mph/s

function RunCar() {
    setInterval(() => {
        lastUpdate = new Date().getTime(); // Update the lastUpdate time each loop
        
        // Run the PID controller with the current state of the system
        speedController.currentVal = car.velocity;
        let pidOutput = speedController.run();

        console.log("PID Output: " + pidOutput);

        // Calculate the acceleration
        let acceleration = (speedController.processVariable - speedController.previousProcessVariable) / speedController.deltaTime;

        // Does the acceleration exceed the manually set limit?
        let exceedance = 0;
        // Accelerative motion
        if (acceleration > maxAccelerationMphPerSec) {
            exceedance = Math.abs(acceleration) - maxAccelerationMphPerSec;

            // Decelerative motion
        } else if (acceleration < -maxDecelerationMphPerSec) {
            exceedance = Math.abs(acceleration) - maxDecelerationMphPerSec;
        }

        console.log(acceleration, "<- Acceleration")
        console.log(exceedance, "<- Exceedance");
        if (exceedance > 0 && damp < 0.999) {
            // Adjust the dampening factor based on how much the acceleration exceeds the limit
            damp += exceedance * 0.01; if (damp >= 1) { damp = 0.999; }
            console.log("ON")
        } else if (exceedance <= 0 && damp > 0) {
            // If the acceleration is below the limit, gradually reduce the dampening factor
            damp -= 0.001;
            console.log("OFF")
        }

        pidOutput = pidOutput * (1 - damp);

        console.log("Damp: ", damp);
        console.log("Adjusted PID Output: ", pidOutput);



        // Update the car's speed using the PID controller output
        car.update(pidOutput);

        // Update the chart data
        dampData.push(damp);
        if (dampData.length > 100) dampData.shift();
    }, 50);
}

watchDog();
init();
RunCar();

function setSetpoint(controller, setpoint) {
    controller.setpoint = setpoint;
    document.getElementById("setpoint").innerHTML = setpoint;
    // When textbox "setpoint-input" is changed, update the setpoint
    document.getElementById("setpoint-input").addEventListener("change", () => {
        controller.setpoint = document.getElementById("setpoint-input").value;
        document.getElementById("setpoint").innerHTML = controller.setpoint;
    });
}

let chart;
let chart2;
function init() {
    // Default values on load
    setSetpoint(speedController, 60);

    // Create the chart
    const ctx = document.getElementById('data').getContext('2d');
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array(100).fill(''), // Placeholder labels
            datasets: [

                {
                    label: 'P',
                    data: speedController.proportionalErrorData,
                    borderColor: 'red',
                    fill: false,
                },
                {
                    label: 'I',
                    data: speedController.integralErrorData,
                    borderColor: 'green',
                    fill: false,
                },
                {
                    label: 'D',
                    data: speedController.derivativeErrorData,
                    borderColor: 'blue',
                    fill: false,
                },
                {
                    label: 'PV',
                    data: speedController.processVariableData,
                    borderColor: 'orange',
                    fill: false,
                },
            ]
        },
        options: {
            animation: false,
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Time (Milliseconds)'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Value'
                    },
                    // min: -10, // Minimum y value
                    // max: 40, // Maximum y value
                }
            }
        }
    });

    const ctx2 = document.getElementById('data2').getContext('2d');
    chart2 = new Chart(ctx2, {
        type: 'line',
        data: {
            labels: Array(100).fill(''), // Placeholder labels
            datasets: [

                {
                    label: 'Aceleration',
                    data: speedController.accelerationData,
                    borderColor: 'darkgreen',
                    fill: false,
                },
                {
                    label: 'Damping',
                    data: dampData,
                    borderColor: 'violet',
                    fill: false,
                },

            ]
        },
        options: {
            animation: false,
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Time (Milliseconds)'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Value'
                    },
                    // min: -10, // Minimum y value
                    // max: 40, // Maximum y value
                }
            }
        }
    });

    setInterval(() => {
        chart.update();
        chart2.update();
    }, 100);
}